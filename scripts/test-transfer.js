// scripts/test-transfer.js (small test amount)
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing small transfer first...");
  
  const talocAddress = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const ledgerAddress = "0x396352a4918458cc7955C8Ef2eCbDE3066197C26";
  
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  const [owner] = await ethers.getSigners();
  
  // Test with only 1000 TLC first
  const testAmount = ethers.utils.parseEther("1000");
  
  console.log("🔄 Sending test amount (1000 TLC)...");
  const tx = await taloc.safeTransferFrom(
    owner.address,
    ledgerAddress,
    0,
    testAmount,
    "0x"
  );
  
  await tx.wait();
  console.log("✅ Test transfer successful!");
  console.log("Tx hash:", tx.hash);
}

main().catch(console.error);