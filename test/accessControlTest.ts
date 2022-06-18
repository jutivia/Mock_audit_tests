import { expect } from "chai";
import { network, ethers } from "hardhat";
import { utils } from "ethers";
import { Minion, MinionHacker } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let minion: Minion;
let user1: SignerWithAddress;
let user2: SignerWithAddress;


describe("Testing the Minion Contract", function () {
  this.beforeEach(async function () {
    const [owner, addr1] = await ethers.getSigners();
    user1 = owner;
    user2 = addr1;
    const a = await ethers.getContractFactory("Minion");
    minion = await a.deploy();
    await minion.deployed();
  });
  it("Can call pwn function with minion hacker contract", async function () {
    await network.provider.send("evm_setNextBlockTimestamp", [1655589000]);
    await network.provider.send("evm_mine");
    const overrides = { value: ethers.utils.parseEther("2.0")  }
    const b = await ethers.getContractFactory("MinionHacker");
    const minionHacker = await b.deploy(minion.address, overrides);
    await minionHacker.deployed();
    expect(await minion.verify(minionHacker.address)).to.equal(
      true
    )
  });
  it("Cannot call pwn function with an EOA", async function () {
     await expect (minion.connect(user1).pwn()).to.revertedWith("Well we are not allowing EOAs, sorry");
  });

   it("Cannot retrieve funds from Minion Contract if msg.sender is not owner", async function () {
     await expect (minion.connect(user2).retrieve()).to.revertedWith("Are you the owner?");
  });

  it("Cannot retrieve funds from Minion Contract if the contract balance is 0 and msg.sender is owner", async function () {
     await expect (minion.connect(user1).retrieve()).to.revertedWith("No balance, you greedy hooman");
  });

  it("Can retrieve funds from Minion Contract if the contract balance greater than 0 and msg.sender is owner", async function () {
    const balance1 = await ethers.getDefaultProvider().getBalance(user1.address)
    const beforeContractBalance = await ethers.getDefaultProvider().getBalance(minion.address)
    const overrides = { value: ethers.utils.parseEther("2.0")  }
    const b = await ethers.getContractFactory("MinionHacker");
    const  minionHacker = await b.deploy(minion.address, overrides);
    await minionHacker.deployed();
    const contractBalance = await ethers.getDefaultProvider().getBalance(minion.address)
    await minion.retrieve();
    const balance = await ethers.getDefaultProvider().getBalance(user1.address)
    expect(Number(balance.toString())).to.greaterThan(
      Number(balance1)
    )
  });
});
