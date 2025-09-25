// scripts/test-mainnet.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Taloc on Polygon Mainnet...");
  
  const talocAddress = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  
  console.log("✅ Name:", await taloc.name());
  console.log("✅ Symbol:", await taloc.symbol());
  
  const [owner] = await ethers.getSigners();
  const balance = await taloc.balanceOf(owner.address, 0);
  console.log("✅ TLC Balance:", ethers.utils.formatEther(balance));
  
  console.log("🎉 Mainnet contract is LIVE and working!");
}

main().catch(console.error);