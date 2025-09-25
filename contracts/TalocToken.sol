// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

contract TalocToken is 
    Initializable, 
    ERC1155Upgradeable, 
    OwnableUpgradeable, 
    ERC1155SupplyUpgradeable, 
    UUPSUpgradeable 
{
    // Token constants
    uint256 public constant FUNGIBLE_TOKEN_ID = 0;
    uint256 public constant NFT_START_ID = 1;
    uint256 public constant NFT_END_ID = 5;
    uint256 public constant SEMI_FUNGIBLE_TOKEN_ID = 6;
    
    // Token metadata
    string public name;
    string public symbol;
    
    // Token values
    uint256 public constant TOTAL_FUNGIBLE_SUPPLY = 250_000_000 * 10**18;
    uint256 public constant NFT_VALUE = 500_000 * 10**18;
    uint256 public constant SEMI_FUNGIBLE_TOTAL_VALUE = 1_000_000 * 10**18;
    uint256 public constant SEMI_FUNGIBLE_SHARES = 4;
    
    // Burning mechanism state variables
    uint256 public totalBurned;
    mapping(uint256 => uint256) public totalBurnedPerToken;
    uint256 public burnFeePercentage;
    uint256 public autoBurnPercentage;
    
    // Token URIs
    mapping(uint256 => string) private _tokenURIs;
    
    // Events
    event TokensBurned(address indexed account, uint256 tokenId, uint256 amount);
    event TokensBurnedBatch(address indexed account, uint256[] tokenIds, uint256[] amounts);
    event BurnFeeUpdated(uint256 newFeePercentage);
    event AutoBurnUpdated(uint256 newPercentage);
    event TokenURIUpdated(uint256 tokenId, string tokenURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _symbol, string memory _uri) 
        public 
        initializer 
    {
        __ERC1155_init(_uri);
        __Ownable_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();
        
        name = _name;
        symbol = _symbol;
        
        // Initialize burning parameters
        burnFeePercentage = 100; // 1% default burn fee
        autoBurnPercentage = 50; // 0.5% default auto-burn
        
        // Initial minting
        _mintInitialTokens();
    }

    function _mintInitialTokens() private {
        // Mint fungible tokens (250 million)
        _mint(owner(), FUNGIBLE_TOKEN_ID, TOTAL_FUNGIBLE_SUPPLY, "");
        
        // Mint 5 NFTs (each valued at 500,000 TLC)
        for (uint256 i = NFT_START_ID; i <= NFT_END_ID; i++) {
            _mint(owner(), i, 1, "");
        }
        
        // Mint semi-fungible token (1 million TLC divided into 4 shares)
        _mint(owner(), SEMI_FUNGIBLE_TOKEN_ID, SEMI_FUNGIBLE_SHARES, "");
    }

    // ==================== TOKEN METADATA MANAGEMENT ====================

    function uri(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        return _tokenURIs[tokenId];
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) 
        external 
        onlyOwner 
    {
        _tokenURIs[tokenId] = _tokenURI;
        emit TokenURIUpdated(tokenId, _tokenURI);
        emit URI(_tokenURI, tokenId);
    }

    // ==================== TOKEN VALUE FUNCTIONS ====================

    function getTokenValue(uint256 tokenId) 
        external 
        pure 
        returns (uint256) 
    {
        if (tokenId == FUNGIBLE_TOKEN_ID) {
            return 1 * 10**18; // 1 TLC per token
        } else if (tokenId >= NFT_START_ID && tokenId <= NFT_END_ID) {
            return NFT_VALUE;
        } else if (tokenId == SEMI_FUNGIBLE_TOKEN_ID) {
            return SEMI_FUNGIBLE_TOTAL_VALUE / SEMI_FUNGIBLE_SHARES;
        }
        revert("Invalid token ID");
    }

    function getTotalValue(uint256 tokenId, uint256 amount) 
        external 
        pure 
        returns (uint256) 
    {
        if (tokenId == FUNGIBLE_TOKEN_ID) {
            return amount; // 1:1 value for fungible tokens
        } else if (tokenId >= NFT_START_ID && tokenId <= NFT_END_ID) {
            require(amount == 1, "NFTs cannot be fractionalized");
            return NFT_VALUE;
        } else if (tokenId == SEMI_FUNGIBLE_TOKEN_ID) {
            return (SEMI_FUNGIBLE_TOTAL_VALUE * amount) / SEMI_FUNGIBLE_SHARES;
        }
        revert("Invalid token ID");
    }

    // ==================== BURNING MECHANISMS ====================

    /**
     * @dev Basic burn function - anyone can burn their own tokens
     */
    function burn(uint256 tokenId, uint256 amount) external {
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        _burn(msg.sender, tokenId, amount);
        
        totalBurned += amount;
        totalBurnedPerToken[tokenId] += amount;
        
        emit TokensBurned(msg.sender, tokenId, amount);
    }

    /**
     * @dev Batch burn multiple token types
     */
    function burnBatch(uint256[] memory tokenIds, uint256[] memory amounts) external {
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(balanceOf(msg.sender, tokenIds[i]) >= amounts[i], "Insufficient balance");
            totalBurned += amounts[i];
            totalBurnedPerToken[tokenIds[i]] += amounts[i];
        }
        
        _burnBatch(msg.sender, tokenIds, amounts);
        emit TokensBurnedBatch(msg.sender, tokenIds, amounts);
    }

    /**
     * @dev Burn with optional fee (fee goes to dead address)
     */
    function burnWithFee(uint256 tokenId, uint256 amount) external {
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        
        uint256 burnFee = (amount * burnFeePercentage) / 10000;
        uint256 netBurnAmount = amount - burnFee;
        
        _burn(msg.sender, tokenId, netBurnAmount);
        totalBurned += netBurnAmount;
        totalBurnedPerToken[tokenId] += netBurnAmount;
        
        if (burnFee > 0) {
            _burn(msg.sender, tokenId, burnFee);
            totalBurned += burnFee;
            totalBurnedPerToken[tokenId] += burnFee;
        }
        
        emit TokensBurned(msg.sender, tokenId, amount);
    }

    /**
     * @dev Auto-burn on transfers (deflationary mechanism)
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        // Apply auto-burn on transfers (except minting and burning)
        if (from != address(0) && to != address(0) && autoBurnPercentage > 0) {
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 burnAmount = (amounts[i] * autoBurnPercentage) / 10000;
                if (burnAmount > 0) {
                    _burn(from, ids[i], burnAmount);
                    totalBurned += burnAmount;
                    totalBurnedPerToken[ids[i]] += burnAmount;
                    emit TokensBurned(from, ids[i], burnAmount);
                }
            }
        }
    }

    /**
     * @dev Admin functions to configure burning
     */
    function setBurnFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 500, "Fee too high"); // Max 5%
        burnFeePercentage = _feePercentage;
        emit BurnFeeUpdated(_feePercentage);
    }

    function setAutoBurnPercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 200, "Auto-burn too high"); // Max 2%
        autoBurnPercentage = _percentage;
        emit AutoBurnUpdated(_percentage);
    }

    /**
     * @dev View function to get circulating supply
     */
    function circulatingSupply(uint256 tokenId) public view returns (uint256) {
        return totalSupply(tokenId) - totalBurnedPerToken[tokenId];
    }

    // ==================== BATCH OPERATIONS ====================

    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external {
        require(
            recipients.length == tokenIds.length && 
            tokenIds.length == amounts.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            safeTransferFrom(
                msg.sender,
                recipients[i],
                tokenIds[i],
                amounts[i],
                ""
            );
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    function getTokenType(uint256 tokenId) 
        external 
        pure 
        returns (string memory) 
    {
        if (tokenId == FUNGIBLE_TOKEN_ID) {
            return "FUNGIBLE";
        } else if (tokenId >= NFT_START_ID && tokenId <= NFT_END_ID) {
            return "NFT";
        } else if (tokenId == SEMI_FUNGIBLE_TOKEN_ID) {
            return "SEMI_FUNGIBLE";
        }
        revert("Invalid token ID");
    }

    function getTokenDetails(uint256 tokenId) 
    external 
    view 
    returns (
        string memory tokenType,
        uint256 totalSupplyValue,
        uint256 circulatingSupplyValue,
        uint256 burnedSupplyValue,
        uint256 individualValue,
        string memory tokenURIValue
    ) 
{
    // Set the values based on token type
    if (tokenId == FUNGIBLE_TOKEN_ID) {
        tokenType = "FUNGIBLE";
        individualValue = 1 * 10**18;
    } else if (tokenId >= NFT_START_ID && tokenId <= NFT_END_ID) {
        tokenType = "NFT";
        individualValue = NFT_VALUE;
    } else if (tokenId == SEMI_FUNGIBLE_TOKEN_ID) {
        tokenType = "SEMI_FUNGIBLE";
        individualValue = SEMI_FUNGIBLE_TOTAL_VALUE / SEMI_FUNGIBLE_SHARES;
    } else {
        revert("Invalid token ID");
    }
    
    // Assign the remaining return values
    totalSupplyValue = totalSupply(tokenId);
    circulatingSupplyValue = circulatingSupply(tokenId);
    burnedSupplyValue = totalBurnedPerToken[tokenId];
    tokenURIValue = uri(tokenId);
}


    // ==================== EMERGENCY FUNCTIONS ====================

    function emergencyWithdraw(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            // For ERC20 tokens - you'd need to import IERC20
            // IERC20(tokenAddress).transfer(owner(), IERC20(tokenAddress).balanceOf(address(this)));
            revert("ERC20 withdrawal not implemented");
        }
    }

    // ==================== REQUIRED OVERRIDES ====================

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // The following functions are overrides required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}