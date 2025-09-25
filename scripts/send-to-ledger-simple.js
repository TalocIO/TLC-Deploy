// scripts/send-to-ledger-simple.js
const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Transferring TLC to Ledger...");
  
  // Your TLC contract address
  const talocAddress = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  
  // REPLACE THIS WITH YOUR ACTUAL LEDGER ADDRESS
  const ledgerAddress = "0x396352a4918458cc7955C8Ef2eCbDE3066197C26"; 
  
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  
  const [owner] = await ethers.getSigners();
  
  console.log("🔥 From (MetaMask):", owner.address);
  console.log("❄️  To (Ledger):", ledgerAddress);
  
  // Calculate 70% of total supply
  const totalSupply = await taloc.balanceOf(owner.address, 0);
  const seventyPercent = totalSupply.mul(70).div(100);
  
  console.log("📊 Transfer Details:");
  console.log("Total TLC:", ethers.utils.formatEther(totalSupply));
  console.log("70% to transfer:", ethers.utils.formatEther(seventyPercent));
  
  // Confirm large transfer
  console.log("\n⚠️  TRANSFERRING 70% OF TOTAL SUPPLY!");
  console.log("This is a large transfer. Proceed?");
  
  // Transfer the tokens
  console.log("🔄 Sending TLC to Ledger...");
  const tx = await taloc.safeTransferFrom(
    owner.address,
    ledgerAddress,
    0, // Token ID for fungible TLC
    seventyPercent,
    "0x" // Empty data
  );
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  
  console.log("✅ Transfer successful!");
  console.log("📜 Transaction hash:", tx.hash);
  console.log("🔍 View on Polygonscan: https://polygonscan.com/tx/" + tx.hash);
  
  // Verify new balances
  const newOwnerBalance = await taloc.balanceOf(owner.address, 0);
  const ledgerBalance = await taloc.balanceOf(ledgerAddress, 0);
  
  console.log("\n📊 Final Balances:");
  console.log("MetaMask TLC:", ethers.utils.formatEther(newOwnerBalance));
  console.log("Ledger TLC:", ethers.utils.formatEther(ledgerBalance));
  console.log("✅ 70% of TLC now secured in cold storage!");
}

main().catch(console.error);