// scripts/polygon-mainnet-deploy.js
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Taloc deployment to Polygon Mainnet...");
  console.log("⚠️  WARNING: This will use REAL MATIC!");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account MATIC balance:", ethers.utils.formatEther(balance));
  
  if (balance.lt(ethers.utils.parseEther("2"))) {
    throw new Error("Insufficient MATIC for deployment. Need at least 2 MATIC.");
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
      timeout: 600000,
      gasPrice: ethers.utils.parseUnits("30", "gwei")
    }
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await taloc.deployed();
  
  console.log("✅ Taloc deployed to:", taloc.address);
  
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(taloc.address);
  console.log("📦 Implementation address:", implementationAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "polygon-mainnet",
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
  
  const deploymentFile = path.join(deploymentsDir, "deployment-polygon-mainnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📁 Deployment info saved to:", deploymentFile);
  console.log("🎉 POLYGON MAINNET DEPLOYMENT COMPLETE!");
  
  return taloc.address;
}

main()
  .then((address) => {
    console.log("\n📋 Next steps:");
    console.log("1. Wait for confirmations");
    console.log("2. Verify contract: npx hardhat verify --network polygon " + address + ' "Taloc" "TLC" "https://api.taloc.com/tokens/{id}.json"');
    console.log("3. Add liquidity to QuickSwap (Polygon's Uniswap)");
    console.log("4. Update website/dApp with contract address");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });