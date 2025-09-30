// scripts/add-initial-liquidity.js
const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Preparing initial liquidity...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  // Your contracts
  const TALOC_ADDRESS = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const WRAPPER_ADDRESS = "0x0e2d757d7344CE493f9D30b3E7f2ad8017F6dd2b";
  
  const taloc = await ethers.getContractAt("TalocToken", TALOC_ADDRESS);
  const wrapper = await ethers.getContractAt("TLCErc20Wrapper", WRAPPER_ADDRESS);
  
  // Check balances
  const tlcBalance = await taloc.balanceOf(deployer.address, 0);
  const polBalance = await deployer.getBalance();
  
  console.log("📊 Current Balances:");
  console.log("  TLC:", ethers.utils.formatEther(tlcBalance));
  console.log("  POL:", ethers.utils.formatEther(polBalance));
  
  // Wrap some TLC for liquidity
  const wrapAmount = ethers.utils.parseEther("1000"); // Start with 1000 TLC
  console.log(`\n🔄 Wrapping ${ethers.utils.formatEther(wrapAmount)} TLC...`);
  
  if (tlcBalance.gte(wrapAmount)) {
    // Approve wrapper
    const approveTx = await taloc.setApprovalForAll(wrapper.address, true);
    await approveTx.wait();
    console.log("✅ Wrapper approved");
    
    // Wrap TLC
    const wrapTx = await wrapper.wrap(wrapAmount);
    await wrapTx.wait();
    console.log("✅ TLC wrapped to wTLC");
    
    // Check new balances
    const newWTLC = await wrapper.balanceOf(deployer.address);
    console.log("💰 New wTLC Balance:", ethers.utils.formatEther(newWTLC));
  } else {
    console.log("❌ Insufficient TLC balance for wrapping");
  }
  
  console.log("\n🎉 Ready for Uniswap liquidity provision!");
}

main().catch(console.error);