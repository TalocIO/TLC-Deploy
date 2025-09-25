// scripts/upgrade.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  // Replace with your actual proxy contract address
  const existingProxyAddress = "0x...YourProxyAddressHere...";
  
  console.log("Upgrading TalocToken...");
  
  const TalocTokenV2 = await ethers.getContractFactory("TalocToken");
  
  try {
    const taloc = await upgrades.upgradeProxy(existingProxyAddress, TalocTokenV2);
    console.log("TalocToken upgraded successfully!");
    console.log("New implementation address:", await upgrades.erc1967.getImplementationAddress(taloc.address));
    console.log("Proxy address remains:", taloc.address);
  } catch (error) {
    console.error("Upgrade failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });