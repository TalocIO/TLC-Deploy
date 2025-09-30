// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract TLCErc20Wrapper is 
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC1155Holder
{
    // Constants
    uint256 public constant FUNGIBLE_TOKEN_ID = 0;
    uint256 public constant DECIMALS = 18;
    
    // TLC ERC-1155 contract
    IERC1155 public talocToken;
    
    // Burning mechanism state variables (mirroring TLC)
    uint256 public totalBurned;
    uint256 public burnFeePercentage;
    uint256 public autoBurnPercentage;
    
    // Fee recipient (for burn fees)
    address public feeRecipient;
    
    // Events
    event Wrapped(address indexed user, uint256 amount);
    event Unwrapped(address indexed user, uint256 amount);
    event Burned(address indexed user, uint256 amount);
    event BurnFeeUpdated(uint256 newFeePercentage);
    event AutoBurnUpdated(uint256 newPercentage);
    event FeeRecipientUpdated(address newRecipient);
    
    // Transparency events
    event BackingRatio(uint256 wrappedSupply, uint256 backingTokens, uint256 ratio);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _talocToken,
        string memory _name,
        string memory _symbol,
        address _feeRecipient
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        talocToken = IERC1155(_talocToken);
        feeRecipient = _feeRecipient;
        
        // Initialize burning parameters (same as TLC)
        burnFeePercentage = 100; // 1% default burn fee
        autoBurnPercentage = 50; // 0.5% default auto-burn
    }

    // ==================== WRAPPING/UNWRAPPING ====================

    /**
     * @dev Wrap TLC ERC-1155 tokens into ERC-20 wTLC
     */
    function wrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        
        // Check user has enough TLC tokens
        uint256 userBalance = talocToken.balanceOf(msg.sender, FUNGIBLE_TOKEN_ID);
        require(userBalance >= amount, "Insufficient TLC balance");
        
        // Transfer TLC from user to wrapper
        talocToken.safeTransferFrom(msg.sender, address(this), FUNGIBLE_TOKEN_ID, amount, "");
        
        // Apply auto-burn if enabled (mirroring TLC behavior)
        uint256 netAmount = amount;
        if (autoBurnPercentage > 0) {
            uint256 autoBurnAmount = (amount * autoBurnPercentage) / 10000;
            if (autoBurnAmount > 0) {
                netAmount = amount - autoBurnAmount;
                totalBurned += autoBurnAmount;
                emit Burned(msg.sender, autoBurnAmount);
            }
        }
        
        // Mint wTLC to user
        _mint(msg.sender, netAmount);
        
        emit Wrapped(msg.sender, netAmount);
        emit BackingRatio(totalSupply(), backingTokens(), backingRatio());
    }

    /**
     * @dev Unwrap wTLC back to TLC ERC-1155 tokens
     */
    function unwrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient wTLC balance");
        
        // Apply burn fee if enabled (mirroring TLC behavior)
        uint256 netAmount = amount;
        if (burnFeePercentage > 0) {
            uint256 burnFee = (amount * burnFeePercentage) / 10000;
            if (burnFee > 0) {
                netAmount = amount - burnFee;
                
                // Burn the fee portion
                _burn(msg.sender, burnFee);
                totalBurned += burnFee;
                
                // Transfer fee to recipient (could be dead address for actual burning)
                if (feeRecipient != address(0)) {
                    _mint(feeRecipient, burnFee);
                }
                
                emit Burned(msg.sender, burnFee);
            }
        }
        
        // Burn user's wTLC
        _burn(msg.sender, netAmount);
        
        // Transfer TLC back to user
        talocToken.safeTransferFrom(address(this), msg.sender, FUNGIBLE_TOKEN_ID, netAmount, "");
        
        emit Unwrapped(msg.sender, netAmount);
        emit BackingRatio(totalSupply(), backingTokens(), backingRatio());
    }

    // ==================== BURNING MECHANISMS (MIRRORING TLC) ====================

    /**
     * @dev Burn wTLC tokens (with optional fee)
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 netBurnAmount = amount;
        if (burnFeePercentage > 0) {
            uint256 burnFee = (amount * burnFeePercentage) / 10000;
            if (burnFee > 0) {
                netBurnAmount = amount - burnFee;
                
                // Transfer fee to recipient
                if (feeRecipient != address(0)) {
                    _transfer(msg.sender, feeRecipient, burnFee);
                }
            }
        }
        
        _burn(msg.sender, netBurnAmount);
        totalBurned += netBurnAmount;
        
        emit Burned(msg.sender, netBurnAmount);
        emit BackingRatio(totalSupply(), backingTokens(), backingRatio());
    }

    /**
     * @dev Auto-burn on transfers (deflationary mechanism - mirrors TLC)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Apply auto-burn on transfers (except minting and burning)
        if (from != address(0) && to != address(0) && autoBurnPercentage > 0) {
            uint256 burnAmount = (amount * autoBurnPercentage) / 10000;
            if (burnAmount > 0) {
                // Burn from the transfer amount
                _burn(from, burnAmount);
                totalBurned += burnAmount;
                
                emit Burned(from, burnAmount);
            }
        }
    }

    // ==================== TRANSPARENCY FEATURES ====================

    /**
     * @dev Get the amount of TLC tokens backing the wTLC supply
     */
    function backingTokens() public view returns (uint256) {
        return talocToken.balanceOf(address(this), FUNGIBLE_TOKEN_ID);
    }

    /**
     * @dev Calculate the backing ratio (should always be >= 1.0)
     */
    function backingRatio() public view returns (uint256) {
        uint256 wrappedSupply = totalSupply();
        uint256 backing = backingTokens();
        
        if (wrappedSupply == 0) return 1e18;
        return (backing * 1e18) / wrappedSupply;
    }

    /**
     * @dev Get circulating supply (total supply minus burned)
     */
    function circulatingSupply() public view returns (uint256) {
        return totalSupply() - totalBurned;
    }

    /**
     * @dev Get wrapper statistics for transparency
     */
    function getWrapperStats() external view returns (
        uint256 wrappedSupply,
        uint256 tlcBacking,
        uint256 currentRatio,
        uint256 totalBurnedAmount,
        uint256 circulatingSupplyAmount
    ) {
        wrappedSupply = totalSupply();
        tlcBacking = backingTokens();
        currentRatio = backingRatio();
        totalBurnedAmount = totalBurned;
        circulatingSupplyAmount = circulatingSupply();
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Update burning parameters (mirroring TLC admin functions)
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

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    /**
     * @dev Emergency recovery function for accidental transfers
     */
    function recoverERC1155(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(tokenAddress != address(talocToken) || tokenId != FUNGIBLE_TOKEN_ID, 
                "Cannot recover TLC backing tokens");
        
        IERC1155(tokenAddress).safeTransferFrom(
            address(this),
            owner(),
            tokenId,
            amount,
            ""
        );
    }

    // ==================== OVERRIDES ====================

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // Fixed supportsInterface - simplified
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}