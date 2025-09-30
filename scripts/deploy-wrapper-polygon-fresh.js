// scripts/deploy-wrapper-polygon-fresh.js
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting FRESH TLC Wrapper deployment to Polygon Mainnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account MATIC balance:", ethers.utils.formatEther(balance));
  
  if (balance.lt(ethers.utils.parseEther("2"))) {
    throw new Error("Insufficient MATIC for deployment. Need at least 2 MATIC.");
  }
  
  // ✅ YOUR EXISTING TLC CONTRACT ON POLYGON MAINNET
  const EXISTING_TLC_ADDRESS = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  
  // Configuration
  const WRAPPER_NAME = "Wrapped Taloc";
  const WRAPPER_SYMBOL = "wTLC";
  const FEE_RECIPIENT = ethers.constants.AddressZero;

  console.log("📋 Configuration:");
  console.log("  TLC ERC-1155:", EXISTING_TLC_ADDRESS);
  console.log("  Wrapper Name:", WRAPPER_NAME);
  console.log("  Wrapper Symbol:", WRAPPER_SYMBOL);
  console.log("  Fee Recipient:", FEE_RECIPIENT);

  console.log("⏳ Compiling contracts...");
  await hre.run("compile");
  
  const TLCErc20Wrapper = await ethers.getContractFactory("TLCErc20Wrapper");
  
  console.log("⏳ Deploying wrapper proxy contract...");
  
  try {
    const wrapper = await upgrades.deployProxy(
      TLCErc20Wrapper,
      [
        EXISTING_TLC_ADDRESS,
        WRAPPER_NAME,
        WRAPPER_SYMBOL,
        FEE_RECIPIENT
      ],
      { 
        initializer: "initialize",
        timeout: 120000, // 2 minutes timeout
        gasPrice: ethers.utils.parseUnits("50", "gwei") // Higher gas for mainnet
      }
    );

    console.log("⏳ Waiting for deployment confirmation...");
    await wrapper.deployed();
    
    console.log("✅ TLC Wrapper deployed to:", wrapper.address);
    
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(wrapper.address);
    console.log("📦 Implementation address:", implementationAddress);
    
    const adminAddress = await upgrades.erc1967.getAdminAddress(wrapper.address);
    console.log("🔐 Proxy Admin address:", adminAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "polygon-mainnet",
      timestamp: new Date().toISOString(),
      wrapperAddress: wrapper.address,
      implementationAddress: implementationAddress,
      proxyAdminAddress: adminAddress,
      talocErc1155Address: EXISTING_TLC_ADDRESS,
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
    
    const deploymentFile = path.join(deploymentsDir, "deployment-wrapper-polygon-mainnet.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("📁 Deployment info saved to:", deploymentFile);
    
    // Verify initial state
    console.log("\n🔍 Verifying initial state...");
    const backingRatio = await wrapper.backingRatio();
    const backingTokens = await wrapper.backingTokens();
    const totalSupply = await wrapper.totalSupply();
    
    console.log("📊 Initial wrapper stats:");
    console.log("  Backing Ratio:", ethers.utils.formatUnits(backingRatio, 18));
    console.log("  Backing TLC:", ethers.utils.formatEther(backingTokens));
    console.log("  Total wTLC Supply:", ethers.utils.formatEther(totalSupply));
    
    console.log("\n🎉 TLC WRAPPER MAINNET DEPLOYMENT COMPLETE!");
    
    return {
      wrapper: wrapper.address,
      implementation: implementationAddress
    };
    
  } catch (error) {
    console.error("❌ Deployment failed with error:");
    console.error("  Message:", error.message);
    
    if (error.reason) {
      console.error("  Reason:", error.reason);
    }
    
    throw error;
  }
}

main()
  .then((addresses) => {
    console.log("\n📋 Next steps:");
    console.log("1. Verify implementation contract:");
    console.log("   npx hardhat verify --network polygon " + addresses.implementation);
    console.log("2. Verify proxy contract:");
    console.log("   npx hardhat verify --network polygon " + addresses.wrapper);
    console.log("3. Update your dApp with the new wrapper address");
    console.log("4. Create liquidity pool on QuickSwap with wTLC");
    console.log("\n🔗 Explorer Links:");
    console.log("  Wrapper: https://polygonscan.com/address/" + addresses.wrapper);
    console.log("  Implementation: https://polygonscan.com/address/" + addresses.implementation);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
  