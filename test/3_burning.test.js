const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("3. TalocToken Burning Mechanisms", function () {
  let taloc;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();
    
    // DISABLE auto-burn for testing
    await taloc.setAutoBurnPercentage(0);
    
    // Give user1 some tokens to burn (no auto-burn now)
    await taloc.safeTransferFrom(
      owner.address,
      user1.address,
      0,
      ethers.utils.parseEther("10000"),
      "0x"
    );
  });

  it("3.1 Should burn tokens successfully", async function () {
    const burnAmount = ethers.utils.parseEther("1000");
    
    await taloc.connect(user1).burn(0, burnAmount);
    
    const totalBurned = await taloc.totalBurned();
    const userBalance = await taloc.balanceOf(user1.address, 0);
    
    expect(totalBurned).to.equal(burnAmount);
    expect(userBalance).to.equal(ethers.utils.parseEther("9000"));
  });

  it("3.2 Should test auto-burn separately", async function () {
    // Re-enable auto-burn for this specific test
    await taloc.setAutoBurnPercentage(50); // 0.5%
    
    const transferAmount = ethers.utils.parseEther("1000");
    const expectedBurn = transferAmount.mul(5).div(1000); // 0.5% of 1000 = 5
    
    await taloc.connect(user1).safeTransferFrom(
      user1.address,
      owner.address,
      0,
      transferAmount,
      "0x"
    );
    
    const totalBurned = await taloc.totalBurned();
    expect(totalBurned).to.equal(expectedBurn);
  });
});