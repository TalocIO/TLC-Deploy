const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking wallet balance...");
  
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();
  
  console.log("👤 Wallet address:", deployer.address);
  console.log("💰 POL balance:", ethers.utils.formatEther(balance));
  console.log("🔢 Raw balance:", balance.toString());
  
  // Check if we have enough for deployment
  const minRequired = ethers.utils.parseEther("0.1");
  if (balance.lt(minRequired)) {
    console.log("❌ Insufficient balance for deployment. Need at least 0.1 POL");
    console.log("💡 Get testnet POL from: https://faucet.polygon.technology/");
  } else {
    console.log("✅ Sufficient balance for deployment!");
  }
}

main().catch(console.error);