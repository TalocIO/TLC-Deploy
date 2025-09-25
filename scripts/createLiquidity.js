// scripts/createLiquidity.js
const { ethers } = require("hardhat");
const IUniswapV2Router02 = require("@uniswap/v2-periphery/build/IUniswapV2Router02.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = TalocToken.attach("0xYourTalocAddress");
  
  // Uniswap Router addresses (mainnet)
  const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, IUniswapV2Router02.abi, deployer);
  
  // Amounts for liquidity
  const tlcAmount = ethers.utils.parseEther("1000000"); // 1M TLC
  const ethAmount = ethers.utils.parseEther("10"); // 10 ETH
  
  // Approve Uniswap to spend TLC
  await taloc.setApprovalForAll(router.address, true);
  
  // Create liquidity pool
  const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
  await router.addLiquidityETH(
    taloc.address,           // token address
    tlcAmount,               // amountTokenDesired
    0,                       // amountTokenMin
    0,                       // amountETHMin
    deployer.address,        // to
    deadline,                // deadline
    { value: ethAmount }     // ETH to send
  );
  
  console.log("Liquidity pool created!");
}

main();