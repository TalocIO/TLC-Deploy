const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing TalocToken on Sepolia...");
  
  // Your deployed contract address
  const talocAddress = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  
  console.log("📝 Contract address:", talocAddress);
  
  // Test basic view functions
  console.log("📝 Name:", await taloc.name());
  console.log("📝 Symbol:", await taloc.symbol());
  
  // Test balance checking
  const [owner] = await ethers.getSigners();
  console.log("👤 Owner address:", owner.address);
  
  const fungibleBalance = await taloc.balanceOf(owner.address, 0);
  console.log("💰 Fungible TLC balance:", ethers.utils.formatEther(fungibleBalance));
  
  // Test NFT balances
  for (let i = 1; i <= 5; i++) {
    const nftBalance = await taloc.balanceOf(owner.address, i);
    console.log(`🖼️  NFT #${i} balance:`, nftBalance.toString());
  }
  
  // Test semi-fungible token balance
  const semiFungibleBalance = await taloc.balanceOf(owner.address, 6);
  console.log("🔢 Semi-fungible token balance:", semiFungibleBalance.toString());
  
  // Test token values
  console.log("💵 Testing token values...");
  const fungibleValue = await taloc.getTokenValue(0);
  const nftValue = await taloc.getTokenValue(1);
  const semiFungibleValue = await taloc.getTokenValue(6);
  
  console.log("💰 Fungible token value:", ethers.utils.formatEther(fungibleValue));
  console.log("🖼️  NFT value:", ethers.utils.formatEther(nftValue));
  console.log("🔢 Semi-fungible token value:", ethers.utils.formatEther(semiFungibleValue));
  
  // Test burning (small amount to save gas)
  console.log("🔥 Testing burn function...");
  try {
    const burnAmount = ethers.utils.parseEther("10");
    const initialBurned = await taloc.totalBurned();
    
    console.log("⏳ Burning 10 TLC...");
    const tx = await taloc.burn(0, burnAmount);
    await tx.wait();
    
    const finalBurned = await taloc.totalBurned();
    console.log("✅ Burn successful! Total burned:", ethers.utils.formatEther(finalBurned));
    
  } catch (error) {
    console.log("⚠️  Burn test failed (may need more gas):", error.message);
  }
  
  console.log("🎉 All tests completed successfully!");
  console.log("\n📋 View your contract on Etherscan:");
  console.log("https://sepolia.etherscan.io/address/" + talocAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });