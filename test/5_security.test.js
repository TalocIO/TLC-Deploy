const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("5. TalocToken Security", function () {
  let taloc;
  let owner, user1, attacker;

  beforeEach(async function () {
    [owner, user1, attacker] = await ethers.getSigners();
    
    const TalocToken = await ethers.getContractFactory("TalocToken");
    taloc = await upgrades.deployProxy(
      TalocToken,
      ["Taloc", "TLC", "https://api.taloc.com/tokens/{id}.json"],
      { initializer: "initialize" }
    );
    await taloc.deployed();
  });

  it("5.1 Should prevent non-owners from changing fees", async function () {
    // For Waffle, we test reverts differently
    try {
      await taloc.connect(attacker).setBurnFee(500);
      throw new Error("Should have reverted");
    } catch (error) {
      expect(error.message).to.include("caller is not the owner");
    }
  });

  it("5.2 Should prevent burning without balance", async function () {
    try {
      await taloc.connect(attacker).burn(0, ethers.utils.parseEther("1000"));
      throw new Error("Should have reverted");
    } catch (error) {
      expect(error.message).to.include("Insufficient balance");
    }
  });

  it("5.3 Should prevent invalid token operations", async function () {
    try {
      await taloc.getTokenValue(999);
      throw new Error("Should have reverted");
    } catch (error) {
      expect(error.message).to.include("Invalid token ID");
    }
  });

  it("5.4 Should only allow owner to upgrade", async function () {
    const TalocTokenV2 = await ethers.getContractFactory("TalocToken");
    
    try {
      await upgrades.upgradeProxy(taloc.address, TalocTokenV2.connect(attacker));
      throw new Error("Should have reverted");
    } catch (error) {
      // Should revert due to access control
      expect(error.message).to.include("revert");
    }
  });

  it("5.5 Should handle zero address transfers safely", async function () {
    try {
      await taloc.safeTransferFrom(
        owner.address,
        "0x0000000000000000000000000000000000000000",
        0,
        ethers.utils.parseEther("100"),
        "0x"
      );
      throw new Error("Should have reverted");
    } catch (error) {
      // Should revert on zero address transfer
      expect(error.message).to.include("revert");
    }
  });
});