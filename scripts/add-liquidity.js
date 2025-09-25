// scripts/add-liquidity.js (for after deployment)
const { ethers } = require("hardhat");
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

async function main() {
  console.log("💧 Preparing to add liquidity to Uniswap...");
  
  const talocAddress = "YOUR_MAINNET_TALOC_ADDRESS"; // ← Update after deployment
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  
  const [deployer] = await ethers.getSigners();
  
  // Amounts for liquidity
  const tlcAmount = ethers.utils.parseEther("1000000"); // 1M TLC
  const ethAmount = ethers.utils.parseEther("10"); // 10 ETH
  
  console.log("💰 Adding liquidity:", ethers.utils.formatEther(tlcAmount), "TLC +", ethers.utils.formatEther(ethAmount), "ETH");
  
  // Approve Uniswap to spend TLC
  console.log("⏳ Approving Uniswap...");
  await taloc.setApprovalForAll(UNISWAP_V2_ROUTER, true);
  
  // Add liquidity
  console.log("⏳ Adding liquidity...");
  // You'll need Uniswap V2 Router ABI here
  // This is complex - we'll complete this after deployment
}

main().catch(console.error);