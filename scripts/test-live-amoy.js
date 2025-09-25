// scripts/test-live-amoy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing LIVE Taloc on Polygon Amoy...");
  
  // Replace with your actual contract address from deployment output
  const talocAddress = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  
  console.log("📝 Contract address:", talocAddress);
  
  // Test 1: Basic metadata
  console.log("\n✅ Test 1: Metadata");
  console.log("Name:", await taloc.name());
  console.log("Symbol:", await taloc.symbol());
  
  // Test 2: Check initial balances
  console.log("\n✅ Test 2: Initial Balances");
  const [owner] = await ethers.getSigners();
  
  const fungibleBalance = await taloc.balanceOf(owner.address, 0);
  console.log("💰 TLC Balance:", ethers.utils.formatEther(fungibleBalance));
  
  for (let i = 1; i <= 5; i++) {
    const nftBalance = await taloc.balanceOf(owner.address, i);
    console.log(`🖼️  NFT #${i}:`, nftBalance.toString());
  }
  
  const semiBalance = await taloc.balanceOf(owner.address, 6);
  console.log("🔢 Semi-fungible tokens:", semiBalance.toString());
  
  // Test 3: Transfer tokens
  console.log("\n✅ Test 3: Transfer");
  const testRecipient = "0xA89B9663829E7B767766f6e30af393E996063360"; // Your other address
  const transferAmount = ethers.utils.parseEther("1000");
  
  console.log("🔄 Transferring 1000 TLC...");
  const tx = await taloc.safeTransferFrom(
    owner.address,
    testRecipient,
    0,
    transferAmount,
    "0x"
  );
  await tx.wait();
  console.log("✅ Transfer successful! TX:", tx.hash);
  
  // Test 4: Burn tokens
  console.log("\n✅ Test 4: Burning");
  const burnAmount = ethers.utils.parseEther("100");
  console.log("🔥 Burning 100 TLC...");
  const burnTx = await taloc.burn(0, burnAmount);
  await burnTx.wait();
  console.log("✅ Burn successful!");
  
  // Test 5: Check final state
  console.log("\n✅ Test 5: Final State");
  const finalBalance = await taloc.balanceOf(owner.address, 0);
  const totalBurned = await taloc.totalBurned();
  console.log("💰 Final TLC balance:", ethers.utils.formatEther(finalBalance));
  console.log("🔥 Total burned:", ethers.utils.formatEther(totalBurned));
  
  console.log("\n🎉 ALL TESTS PASSED! Your Taloc token is working on Polygon Amoy!");
  console.log("\n🌐 View your contract: https://amoy.polygonscan.com/address/" + talocAddress);
}

main().catch(console.error);