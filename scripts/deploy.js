const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying TalocToken...");
  
  const TalocToken = await ethers.getContractFactory("TalocToken");
  
  const taloc = await upgrades.deployProxy(
    TalocToken,
    [
      "Taloc Token", 
      "TLC", 
      "https://api.taloc.com/tokens/{id}.json"
    ],
    { initializer: "initialize" }
  );

  await taloc.deployed();
  
  console.log("TalocToken deployed to:", taloc.address);
  console.log("Transaction hash:", taloc.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });