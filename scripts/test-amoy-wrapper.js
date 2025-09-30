// scripts/test-amoy-wrapper.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing TLC Wrapper on Amoy...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Your deployed contracts
  const TALOC_ADDRESS = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7"; // Your mainnet TLC
  const WRAPPER_ADDRESS = "0xbC04d531D761460ECDa0d08b54a34DFf90e45238"; // New wrapper
  
  // Get contract instances
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const TLCErc20Wrapper = await ethers.getContractFactory("TLCErc20Wrapper");
  
  const taloc = TalocToken.attach(TALOC_ADDRESS);
  const wrapper = TLCErc20Wrapper.attach(WRAPPER_ADDRESS);
  
  console.log("📋 Contract Addresses:");
  console.log("  TLC:", taloc.address);
  console.log("  Wrapper:", wrapper.address);
  
  // Check initial state
  console.log("\n🔍 Initial State Check:");
  const deployerTLC = await taloc.balanceOf(deployer.address, 0);
  const deployerWTLC = await wrapper.balanceOf(deployer.address);
  const wrapperStats = await wrapper.getWrapperStats();
  
  console.log("  Your TLC Balance:", ethers.utils.formatEther(deployerTLC));
  console.log("  Your wTLC Balance:", ethers.utils.formatEther(deployerWTLC));
  console.log("  Total wTLC Supply:", ethers.utils.formatEther(wrapperStats.wrappedSupply));
  console.log("  TLC Backing:", ethers.utils.formatEther(wrapperStats.tlcBacking));
  console.log("  Backing Ratio:", ethers.utils.formatUnits(wrapperStats.currentRatio, 18));
  
  console.log("\n🎉 Wrapper is ready for testing!");
  console.log("🔗 Explorer: https://amoy.polygonscan.com/address/" + WRAPPER_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });