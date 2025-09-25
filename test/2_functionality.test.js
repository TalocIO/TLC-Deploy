const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("2. TalocToken Functionality", function () {
  let taloc;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();
  });

  it("2.1 Should transfer fungible tokens", async function () {
    const transferAmount = ethers.utils.parseEther("1000");
    
    await taloc.safeTransferFrom(
      owner.address, 
      user1.address, 
      0, 
      transferAmount, 
      "0x" // Add empty bytes data
    );
    
    const userBalance = await taloc.balanceOf(user1.address, 0);
    expect(userBalance).to.equal(transferAmount);
  });

  it("2.2 Should transfer NFTs", async function () {
    await taloc.safeTransferFrom(
      owner.address,
      user1.address,
      1,
      1,
      "0x" // Add empty bytes data
    );
    
    const userBalance = await taloc.balanceOf(user1.address, 1);
    expect(userBalance).to.equal(1);
  });

  it("2.3 Should return correct token values", async function () {
    const fungibleValue = await taloc.getTokenValue(0);
    const nftValue = await taloc.getTokenValue(1);
    const semiFungibleValue = await taloc.getTokenValue(6);
    
    expect(fungibleValue).to.equal(ethers.utils.parseEther("1"));
    expect(nftValue).to.equal(ethers.utils.parseEther("500000"));
    expect(semiFungibleValue).to.equal(ethers.utils.parseEther("250000"));
  });

  it("2.4 Should handle token details correctly", async function () {
    const details = await taloc.getTokenDetails(0);
    
    expect(details.tokenType).to.equal("FUNGIBLE");
    expect(details.totalSupplyValue).to.equal(ethers.utils.parseEther("250000000"));
    expect(details.individualValue).to.equal(ethers.utils.parseEther("1"));
  });
});