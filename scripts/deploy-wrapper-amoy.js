// scripts/deploy-wrapper-amoy.js
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Starting TLC Wrapper deployment to Polygon Amoy Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account MATIC balance:", ethers.utils.formatEther(balance));
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.log("❌ Insufficient MATIC for deployment. Get test MATIC from:");
    console.log("   🔗 https://faucet.polygon.technology/");
    throw new Error("Insufficient MATIC for deployment");
  }
  
  // ✅ USE YOUR EXISTING TLC CONTRACT ADDRESS
  const EXISTING_TLC_ADDRESS = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  
  console.log("📋 Using EXISTING TLC Contract:", EXISTING_TLC_ADDRESS);
  
  // Deploy ONLY the wrapper
  const WRAPPER_NAME = "Wrapped Taloc";
  const WRAPPER_SYMBOL = "wTLC";
  const FEE_RECIPIENT = ethers.constants.AddressZero; // Burn fees
  
  console.log("📋 Wrapper Configuration:");
  console.log("  Name:", WRAPPER_NAME);
  console.log("  Symbol:", WRAPPER_SYMBOL);
  console.log("  Fee Recipient:", FEE_RECIPIENT);
  console.log("  TLC Contract:", EXISTING_TLC_ADDRESS);
  
  const TLCErc20Wrapper = await ethers.getContractFactory("TLCErc20Wrapper");
  
  console.log("⏳ Deploying wrapper proxy contract...");
  const wrapper = await upgrades.deployProxy(
    TLCErc20Wrapper,
    [
      EXISTING_TLC_ADDRESS, // ✅ Your existing TLC contract
      WRAPPER_NAME,
      WRAPPER_SYMBOL,
      FEE_RECIPIENT
    ],
    { 
      initializer: "initialize",
      gasPrice: ethers.utils.parseUnits("30", "gwei")
    }
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await wrapper.deployed();
  
  console.log("✅ TLC Wrapper deployed to:", wrapper.address);
  
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(wrapper.address);
  console.log("📦 Implementation address:", implementationAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "polygon-amoy",
    timestamp: new Date().toISOString(),
    talocErc1155Address: EXISTING_TLC_ADDRESS, // ✅ Your existing TLC
    wrapperAddress: wrapper.address,
    implementationAddress: implementationAddress,
    deployer: deployer.address,
    transactionHash: wrapper.deployTransaction.hash,
    configuration: {
      name: WRAPPER_NAME,
      symbol: WRAPPER_SYMBOL,
      feeRecipient: FEE_RECIPIENT
    }
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, "deployment-wrapper-amoy.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📁 Deployment info saved to:", deploymentFile);
  console.log("🎉 AMOY DEPLOYMENT COMPLETE!");
  
  return {
    taloc: EXISTING_TLC_ADDRESS,
    wrapper: wrapper.address
  };
}

main()
  .then((addresses) => {
    console.log("\n📋 Next steps:");
    console.log("1. Verify wrapper contract on Amoy:");
    console.log("   npx hardhat verify --network polygonAmoy " + addresses.wrapper + ' "' + EXISTING_TLC_ADDRESS + '" "Wrapped Taloc" "wTLC" "0x0000000000000000000000000000000000000000"');
    console.log("2. Test wrapping with your existing TLC tokens");
    console.log("3. Deploy to Polygon Mainnet when ready");
    console.log("\n🔗 Amoy Explorer: https://amoy.polygonscan.com");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });