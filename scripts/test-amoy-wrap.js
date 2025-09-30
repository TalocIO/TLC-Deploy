// scripts/test-amoy-wrap.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing TLC Wrapping on Amoy...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account MATIC balance:", ethers.utils.formatEther(balance));
  
  // Your deployed contracts
  const TALOC_ADDRESS = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const WRAPPER_ADDRESS = "0xbC04d531D761460ECDa0d08b54a34DFf90e45238";
  
  console.log("📋 Contract Addresses:");
  console.log("  TLC:", TALOC_ADDRESS);
  console.log("  Wrapper:", WRAPPER_ADDRESS);
  
  try {
    // Get contract instances
    const TalocToken = await ethers.getContractFactory("TalocToken");
    const TLCErc20Wrapper = await ethers.getContractFactory("TLCErc20Wrapper");
    
    const taloc = TalocToken.attach(TALOC_ADDRESS);
    const wrapper = TLCErc20Wrapper.attach(WRAPPER_ADDRESS);
    
    console.log("✅ Contracts loaded successfully");
    
    // Check initial state
    console.log("\n🔍 Checking initial state...");
    const initialTLC = await taloc.balanceOf(deployer.address, 0);
    const initialWTLC = await wrapper.balanceOf(deployer.address);
    
    console.log("  Your TLC Balance:", ethers.utils.formatEther(initialTLC));
    console.log("  Your wTLC Balance:", ethers.utils.formatEther(initialWTLC));
    
    if (initialTLC.eq(0)) {
      console.log("❌ No TLC balance to wrap");
      return;
    }
    
    // Test wrapping a small amount
    const wrapAmount = ethers.utils.parseEther("10"); // Smaller amount for testing
    console.log(`\n🔄 Attempting to wrap ${ethers.utils.formatEther(wrapAmount)} TLC...`);
    
    if (initialTLC.lt(wrapAmount)) {
      console.log("❌ Insufficient TLC balance for wrap test");
      return;
    }
    
    // Step 1: Check if already approved
    console.log("  1. Checking wrapper approval...");
    const isApproved = await taloc.isApprovedForAll(deployer.address, wrapper.address);
    
    if (!isApproved) {
      console.log("  2. Setting approval for wrapper...");
      const approveTx = await taloc.setApprovalForAll(wrapper.address, true);
      console.log("  ⏳ Waiting for approval confirmation...");
      await approveTx.wait();
      console.log("  ✅ Approval set successfully");
    } else {
      console.log("  ✅ Wrapper already approved");
    }
    
    // Step 2: Wrap TLC
    console.log("  3. Wrapping TLC...");
    const wrapTx = await wrapper.wrap(wrapAmount);
    console.log("  ⏳ Waiting for wrap transaction...");
    const receipt = await wrapTx.wait();
    console.log("  ✅ Wrap transaction confirmed!");
    console.log("  Transaction Hash:", receipt.transactionHash);
    console.log("  Gas Used:", receipt.gasUsed.toString());
    
    // Check final balances
    console.log("\n📋 Final Balances:");
    const finalTLC = await taloc.balanceOf(deployer.address, 0);
    const finalWTLC = await wrapper.balanceOf(deployer.address);
    console.log("  TLC Balance:", ethers.utils.formatEther(finalTLC));
    console.log("  wTLC Balance:", ethers.utils.formatEther(finalWTLC));
    
    // Check wrapper stats
    console.log("\n📊 Wrapper Statistics:");
    const stats = await wrapper.getWrapperStats();
    console.log("  Total wTLC Supply:", ethers.utils.formatEther(stats.wrappedSupply));
    console.log("  TLC Backing:", ethers.utils.formatEther(stats.tlcBacking));
    console.log("  Backing Ratio:", ethers.utils.formatUnits(stats.currentRatio, 18));
    console.log("  Total Burned:", ethers.utils.formatEther(stats.totalBurnedAmount));
    
    // Verify the wrap worked
    const tlcChange = initialTLC.sub(finalTLC);
    const wtlcGained = finalWTLC.sub(initialWTLC);
    
    console.log("\n✅ Wrap Test Results:");
    console.log(`  TLC Used: ${ethers.utils.formatEther(tlcChange)}`);
    console.log(`  wTLC Received: ${ethers.utils.formatEther(wtlcGained)}`);
    
    if (stats.currentRatio.eq(ethers.utils.parseEther("1"))) {
      console.log("  ✅ Backing ratio maintained at 1:1");
    } else {
      console.log("  ⚠️  Backing ratio:", ethers.utils.formatUnits(stats.currentRatio, 18));
    }
    
    console.log("\n🎉 Wrap test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed with error:");
    console.error("  Error message:", error.message);
    
    if (error.transaction) {
      console.error("  Transaction:", error.transaction);
    }
    
    if (error.receipt) {
      console.error("  Receipt:", error.receipt);
    }
  }
  
  console.log("\n🔗 Explorer Links:");
  console.log("  Wrapper: https://amoy.polygonscan.com/address/" + WRAPPER_ADDRESS);
  console.log("  TLC: https://amoy.polygonscan.com/address/" + TALOC_ADDRESS);
}

main()
  .then(() => {
    console.log("\n✨ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });