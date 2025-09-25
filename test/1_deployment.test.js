const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("1. TalocToken Deployment", function () {
  let taloc;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
  });

  it("1.1 Should deploy successfully", async function () {
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();
    
    expect(taloc.address).to.not.equal(ethers.constants.AddressZero);
    console.log("✅ Contract deployed at:", taloc.address);
  });

  it("1.2 Should have correct initial supplies", async function () {
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc Token", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();

    // Use BigNumber comparisons
    const fungibleBalance = await taloc.balanceOf(owner.address, 0);
    expect(fungibleBalance).to.equal(ethers.utils.parseEther("250000000"));
    
    for (let i = 1; i <= 5; i++) {
      const nftBalance = await taloc.balanceOf(owner.address, i);
      expect(nftBalance).to.equal(1);
    }
    
    const semiFungibleBalance = await taloc.balanceOf(owner.address, 6);
    expect(semiFungibleBalance).to.equal(4);
  });

  it("1.3 Should have correct metadata", async function () {
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc Token", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();

    expect(await taloc.name()).to.equal("Taloc Token");
    expect(await taloc.symbol()).to.equal("TLC");
  });
});