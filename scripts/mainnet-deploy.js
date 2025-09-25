// scripts/mainnet-deploy.js
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Taloc MAINNET deployment...");
  console.log("⚠️  WARNING: This will use REAL ETH and deploy to Ethereum Mainnet!");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Safety check - ensure sufficient ETH
  if (balance.lt(ethers.utils.parseEther("0.5"))) {
    throw new Error("Insufficient ETH for mainnet deployment. Need at least 0.5 ETH for gas.");
  }
  
  console.log("⏳ Deploying Taloc token...");
  const TalocToken = await ethers.getContractFactory("TalocToken");
  
  const taloc = await upgrades.deployProxy(
    TalocToken,
    [
      "Taloc",  // Name
      "TLC",    // Symbol
      "https://api.taloc.com/tokens/{id}.json"  // URI
    ],
    { 
      initializer: "initialize",
      timeout: 1200000, // 20 minute timeout
      gasPrice: ethers.utils.parseUnits("30", "gwei") // Reasonable gas price
    }
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await taloc.deployed();
  
  console.log("✅ Taloc deployed to:", taloc.address);
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(taloc.address);
  console.log("📦 Implementation address:", implementationAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "mainnet",
    timestamp: new Date().toISOString(),
    proxyAddress: taloc.address,
    implementationAddress: implementationAddress,
    deployer: deployer.address,
    transactionHash: taloc.deployTransaction.hash,
    tokenName: "Taloc",
    tokenSymbol: "TLC"
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, "deployment-mainnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📁 Deployment info saved to:", deploymentFile);
  console.log("🎉 MAINNET DEPLOYMENT COMPLETE!");
  
  return taloc.address;
}

main()
  .then((address) => {
    console.log("\n📋 Next steps:");
    console.log("1. Wait for 10+ confirmations");
    console.log("2. Verify contract: npx hardhat verify --network mainnet " + address + ' "Taloc" "TLC" "https://api.taloc.com/tokens/{id}.json"');
    console.log("3. Add liquidity to Uniswap");
    console.log("4. Update website/dApp with contract address");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });