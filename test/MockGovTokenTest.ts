/* eslint-disable node/no-missing-import */
import { expect } from "chai";
import { ethers } from "hardhat";
// import { Signer } from "ethers";
import { MockGovToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let govToken: MockGovToken;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;

describe("Testing the MockGovToken Contract", function () {
  this.beforeEach(async function () {
    const a = await ethers.getContractFactory("MockGovToken");
    govToken = await a.deploy();
    await govToken.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    user1 = owner;
    user2 = addr1;
    user3 = addr2
  });
  it("Should mint to the contract owner and delegate all tokens as vote to the user3", async function () {
    await govToken.connect(user1).delegate(user3.address)
    await govToken.connect(user1).mint(user1.address, "10000000000000000000");
    const currentVotes = await govToken.getCurrentVotes(user3.address)
    expect(Number(currentVotes.toString())).to.equal(
      Number("10000000000000000000")
    )
  });
   it("Should not mint to not contract owner", async function () {
    await expect(govToken.connect(user2).mint(user3.address, '10000000000000000000')).to.revertedWith("Ownable: caller is not the owner")
  });

   it("Should Burn from the contract owner, and remove 5 votes from the delegate(user3) votes", async function () {
    await govToken.connect(user1).delegate(user3.address)
    await govToken.connect(user1).mint(user1.address, '10000000000000000000');
    await govToken.connect(user1).burn(user1.address, '5000000000000000000');
    const currentVotes = await govToken.getCurrentVotes(user3.address)
    expect(Number(currentVotes.toString())).to.equal(
      Number("5000000000000000000")
    )
  });

   it("Should not Burn from not contract owner", async function () {
    await expect(govToken.connect(user2).burn(user3.address, '5000000000000000000')).to.revertedWith("Ownable: caller is not the owner")
   })
  

   it("Should not be able to get prior votes", async function () {
    await expect (govToken.getPriorVotes(user3.address, 100)).to.revertedWith("not yet determined");
  });

   it("Should get prior votes", async function () {
      await govToken.connect(user1).delegate(user3.address)
    await govToken.connect(user1).mint(user1.address, '10000000000000000000');
    await govToken.connect(user1).burn(user1.address, '3000000000000000000');
    const prevVote = await govToken.getPriorVotes(user3.address, 15)
    expect(Number(prevVote.toString())).to.equal(
      Number("10000000000000000000")
    )
  });
});
