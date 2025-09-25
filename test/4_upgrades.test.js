const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("4. TalocToken Upgrades", function () {
  let taloc;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();
  });

  it("4.1 Should upgrade successfully", async function () {
    const TalocTokenV2 = await ethers.getContractFactory("TalocToken");
    
    const upgradedTaloc = await upgrades.upgradeProxy(taloc.address, TalocTokenV2);
    await upgradedTaloc.deployed();
    
    expect(upgradedTaloc.address).to.equal(taloc.address);
  });

  it("4.2 Should maintain state after upgrade", async function () {
    await taloc.burn(0, ethers.utils.parseEther("1000"));
    
    const TalocTokenV2 = await ethers.getContractFactory("TalocToken");
    const upgradedTaloc = await upgrades.upgradeProxy(taloc.address, TalocTokenV2);
    
    const totalBurned = await upgradedTaloc.totalBurned();
    expect(totalBurned).to.equal(ethers.utils.parseEther("1000"));
  });

  it("4.3 Should maintain balances after upgrade", async function () {
    const initialBalance = await taloc.balanceOf(owner.address, 0);
    
    const TalocTokenV2 = await ethers.getContractFactory("TalocToken");
    const upgradedTaloc = await upgrades.upgradeProxy(taloc.address, TalocTokenV2);
    
    const finalBalance = await upgradedTaloc.balanceOf(owner.address, 0);
    expect(finalBalance).to.equal(initialBalance);
  });
});