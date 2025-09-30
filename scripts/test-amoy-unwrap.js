// scripts/test-amoy-unwrap.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing TLC Unwrapping on Amoy...");
  
  const [deployer] = await ethers.getSigners();
  
  const WRAPPER_ADDRESS = "0xbC04d531D761460ECDa0d08b54a34DFf90e45238";
  const wrapper = await ethers.getContractAt("TLCErc20Wrapper", WRAPPER_ADDRESS);
  
  const wTLBalance = await wrapper.balanceOf(deployer.address);
  console.log("Current wTLC Balance:", ethers.utils.formatEther(wTLBalance));
  
  if (wTLBalance.gt(0)) {
    const unwrapAmount = ethers.utils.parseEther("10");
    console.log(`🔄 Unwrapping ${ethers.utils.formatEther(unwrapAmount)} wTLC...`);
    
    const tx = await wrapper.unwrap(unwrapAmount);
    await tx.wait();
    console.log("✅ Unwrap successful!");
  } else {
    console.log("⚠️  No wTLC to unwrap - run wrap test first");
  }
}

main().catch(console.error);