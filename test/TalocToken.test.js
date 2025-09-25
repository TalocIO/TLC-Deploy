const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TalocToken", function () {
  let taloc;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      [
        "Taloc Token", 
        "TLC", 
        "https://api.taloc.com/tokens/{id}.json"
      ],
      { initializer: "initialize" }
    );
    await taloc.deployed();
  });

  it("Should deploy successfully", async function () {
    expect(taloc.address).to.not.equal(0);
  });

  it("Should have correct name and symbol", async function () {
    expect(await taloc.name()).to.equal("Taloc Token");
    expect(await taloc.symbol()).to.equal("TLC");
  });

  it("Should mint initial tokens", async function () {
    // Check fungible tokens
    const fungibleBalance = await taloc.balanceOf(owner.address, 0);
    expect(fungibleBalance).to.equal(ethers.utils.parseEther("250000000"));
    
    // Check NFTs
    for (let i = 1; i <= 5; i++) {
      const nftBalance = await taloc.balanceOf(owner.address, i);
      expect(nftBalance).to.equal(1);
    }
    
    // Check semi-fungible tokens
    const semiFungibleBalance = await taloc.balanceOf(owner.address, 6);
    expect(semiFungibleBalance).to.equal(4);
  });
});