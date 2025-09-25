// scripts/check-balances.js
const { ethers } = require("hardhat");

async function main() {
  const talocAddress = "0x30a23bfab2fD8aD57C6B1D456C2fD878672762b7";
  const TalocToken = await ethers.getContractFactory("TalocToken");
  const taloc = await TalocToken.attach(talocAddress);
  
  const [hotWallet] = await ethers.getSigners();
  const ledgerAddress = "0x396352a4918458cc7955C8Ef2eCbDE3066197C26";
  
  const hotBalance = await taloc.balanceOf(hotWallet.address, 0);
  const ledgerBalance = await taloc.balanceOf(ledgerAddress, 0);
  
  console.log("🔥 Hot wallet:", ethers.utils.formatEther(hotBalance), "TLC");
  console.log("❄️  Ledger:", ethers.utils.formatEther(ledgerBalance), "TLC");
  console.log("💰 Total:", ethers.utils.formatEther(hotBalance.add(ledgerBalance)), "TLC");
}

main().catch(console.error);