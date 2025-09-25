const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting TalocToken deployment to testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Check if balance is sufficient
  if (balance.lt(ethers.utils.parseEther("0.05"))) {
    throw new Error("Insufficient ETH for deployment. Get testnet ETH from faucet.");
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
      timeout: 600000 // 10 minute timeout
    }
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await taloc.deployed();
  
  console.log("✅ TalocToken deployed to:", taloc.address);
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(taloc.address);
  console.log("📦 Implementation address:", implementationAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    proxyAddress: taloc.address,
    implementationAddress: implementationAddress,
    deployer: deployer.address,
    transactionHash: taloc.deployTransaction.hash
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `deployment-${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📁 Deployment info saved to:", deploymentFile);
  console.log("🎉 Deployment completed successfully!");
  
  return taloc.address;
}

main()
  .then((address) => {
    console.log("\n📋 Next steps:");
    console.log("1. Wait for 5-10 confirmations");
    console.log("2. Verify contract: npx hardhat verify --network " + network.name + " " + address);
    console.log("3. Test contract functions on testnet");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });