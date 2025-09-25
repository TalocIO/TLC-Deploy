// scripts/polygon-amoy-deploy.js - UPDATED FOR POL
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Taloc deployment to Polygon Amoy...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account POL balance:", ethers.utils.formatEther(balance)); // ← CHANGED FROM MATIC TO POL
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error("Insufficient POL for deployment. Get testnet POL from Amoy faucet."); // ← CHANGED
  }
  
  const TalocToken = await ethers.getContractFactory("TalocToken");
  
  console.log("⏳ Deploying proxy contract...");
  const taloc = await upgrades.deployProxy(
    TalocToken,
    [
      "Taloc",
      "TLC", 
      "https://api.taloc.com/tokens/{id}.json"
    ],
    { 
      initializer: "initialize",
      timeout: 600000
    }
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await taloc.deployed();
  
  console.log("✅ Taloc deployed to:", taloc.address);
  
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(taloc.address);
  console.log("📦 Implementation address:", implementationAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "polygon-amoy",
    timestamp: new Date().toISOString(),
    proxyAddress: taloc.address,
    implementationAddress: implementationAddress,
    deployer: deployer.address,
    transactionHash: taloc.deployTransaction.hash
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, "deployment-polygon-amoy.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📁 Deployment info saved to:", deploymentFile);
  console.log("🎉 Deployment completed successfully!");
  
  return taloc.address;
}

main()
  .then((address) => {
    console.log("\n📋 Next steps:");
    console.log("1. Wait for confirmations");
    console.log("2. Verify contract: npx hardhat verify --network polygonAmoy " + address + ' "Taloc" "TLC" "https://api.taloc.com/tokens/{id}.json"');
    console.log("3. Test contract functions");
    console.log("4. Deploy to Polygon mainnet");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });