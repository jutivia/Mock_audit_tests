import { expect } from "chai";
import { network, ethers } from "hardhat";
import { utils } from "ethers";
import { MockToken, MockStakingRewards, MockLpToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let mockStakingRewards: MockStakingRewards;
let mockToken: MockToken;
let mockLpToken : MockLpToken;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;


describe("Testing the Mock Stacking Rewards Contract", function () {
  this.beforeEach(async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    user1 = owner;
    user2 = addr1;
    user3 = addr2;

    const b = await ethers.getContractFactory("MockToken");
    mockToken = await b.deploy('1000000000000000000000000');
    await mockToken.deployed();

    const c = await ethers.getContractFactory("MockLpToken");
    mockLpToken = await c.deploy('1000000000000000000000000');
    await mockLpToken.deployed();

    const a = await ethers.getContractFactory("MockStakingRewards");
    mockStakingRewards = await a.deploy(mockToken.address, mockLpToken.address, 1);
    await mockStakingRewards.deployed();
    await mockStakingRewards.setMaxFundAmount('100000000000000000000000')
  });
  it("Can fund the mock stacking rewards contract by rewarder", async function () {
    await mockToken.approve(mockStakingRewards.address, '100000000000000000000000')
    await mockStakingRewards.fund('100000000000000000000', '10000000000000000000')
    const balance = await mockToken.balanceOf(mockStakingRewards.address)
     expect(Number(balance.toString())).to.equal(
      Number('100000000000000000000')
    )
  });
   it("Can allow a user to make deposits and withdrawal. The withdrawal should yield an harvest", async function () {
       // funding the contract by the rewarder with mockToken tokens
    await mockToken.approve(mockStakingRewards.address, '100000000000000000000000')
    await mockStakingRewards.fund('100000000000000000000', '10000000000000000000')
    await mockLpToken.transfer(user2.address, '100000000000000000000000')

    // approving mockStakingRewards to take out mockLpToken tokens from the user's wallet
     await mockLpToken.connect(user2).approve(mockStakingRewards.address, '100000000000000000000000')
     //making a deposit with all the user's mockLpToken tokens
    await mockStakingRewards.connect(user2).deposit('100000000000000000000000')

    // checking the user's mockLpToken balance after the deposit
    const balanceAfterTransfer = await mockLpToken.balanceOf(user2.address)
    expect(Number(balanceAfterTransfer.toString())).to.equal(
      Number('0')
    )
    // withdrawing all the user's funds
    await mockStakingRewards.connect(user2).withdraw('100000000000000000000000')
    // checking the user's mockLpToken balance after the withdrawal
    const balanceAfterWithdrawal = await mockLpToken.balanceOf(user2.address)
    expect(Number(balanceAfterWithdrawal.toString())).to.equal(
      Number('100000000000000000000000')
    )
    // checking the user's mockToken balance after the withdrawal  
    const rewardBalanceAfterWithdrawal = await mockToken.balanceOf(user2.address)
     expect(Number(rewardBalanceAfterWithdrawal.toString())).to.greaterThan(
      Number('0')
    )
  });

  it("should allow users make an harvest to their desired wallets", async function () {
       // funding the contract by the rewarder with mockToken tokens
    await mockToken.approve(mockStakingRewards.address, '100000000000000000000000')
    await mockStakingRewards.fund('100000000000000000000', '10000000000000000000')
    await mockLpToken.transfer(user2.address, '100000000000000000000000')

    // approving mockStakingRewards to take out mockLpToken tokens from the user's wallet
     await mockLpToken.connect(user2).approve(mockStakingRewards.address, '100000000000000000000000')
     //making a deposit with all the user's mockLpToken tokens
    await mockStakingRewards.connect(user2).deposit('100000000000000000000000')

    // checking the user's mockLpToken balance after the deposit
    const balanceAfterTransfer = await mockLpToken.balanceOf(user2.address)
    expect(Number(balanceAfterTransfer.toString())).to.equal(
      Number('0')
    )
    // harvsting all the user's profits
    await mockStakingRewards.connect(user2).harvest(user3.address)

    // checking the user's mockToken balance after the harvest  
    const rewardBalanceAfterHarvest = await mockToken.balanceOf(user3.address)
    expect(Number(rewardBalanceAfterHarvest.toString())).to.greaterThan(
      Number('0')
    )

    });

    it("cannot fund more than maxFundAmount set", async function () {
    await expect( mockStakingRewards.fund('10000000000000000000000000', '10000000000000000000')).to.revertedWith('amount exceeds max allowable')
    });

     it("cannot set _rewardPerBlock greater than fund amount", async function () {
    await expect( mockStakingRewards.fund('10000000000000000000', '100000000000000000000000')).to.revertedWith('reward must be less than amount')
    });

    it("cannot set setMaxFundAmount higher than  15 * 10**24;", async function () {
    await expect( mockStakingRewards.setMaxFundAmount('100000000000000000000000000')).to.revertedWith('new max exceeds limit')
    });

    it("cannot allow users withdraw more than their current balance", async function () {
     await mockToken.approve(mockStakingRewards.address, '100000000000000000000000')
    await mockStakingRewards.fund('100000000000000000000', '10000000000000000000')
    await mockLpToken.transfer(user2.address, '100000000000000000000000')

    // approving mockStakingRewards to take out mockLpToken tokens from the user's wallet
     await mockLpToken.connect(user2).approve(mockStakingRewards.address, '100000000000000000000000')
     //making a deposit with all the user's mockLpToken tokens
    await mockStakingRewards.connect(user2).deposit('100000000000000000000000')

    // checking the user's mockLpToken balance after the deposit
    const balanceAfterTransfer = await mockLpToken.balanceOf(user2.address)
    expect(Number(balanceAfterTransfer.toString())).to.equal(
      Number('0')
    )
    // withdrawing more the user's funds
    await expect(mockStakingRewards.connect(user2).withdraw('10000000000000000000000000')).to.revertedWith("withdraw: can't withdraw more than deposit")

    });
    
    it("cannot allow not rewarder call the functions `sweep()`, `setMaxFundAmount()`, `fund()`", async function () {
    await expect( mockStakingRewards.connect(user3).setMaxFundAmount('100000000000000000000000000')).to.revertedWith('Not Rewarder')
    await expect( mockStakingRewards.connect(user3).fund('100000000000000000000000000', '100000000000000000000000')).to.revertedWith('Not Rewarder')
    await expect( mockStakingRewards.connect(user3).sweep()).to.revertedWith('Not Rewarder')
    });

    it("allows rewarder sweep all unclaimed tokens after 90 days", async function () {
    await mockToken.approve(mockStakingRewards.address, '100000000000000000000000000')
    // funcimg the contract with all the mockTokens minted
    await mockStakingRewards.fund('100000000000000000000', '10000000000000000000')

    //checking rewarder mockToken balance after  funding contract 
    const balanceAfterFunding = await mockToken.balanceOf(user3.address)
    expect(Number(balanceAfterFunding.toString())).to.equal(
      Number('0')
    )
    //warping through time 90 days after
    await network.provider.send("evm_increaseTime", [7776000]);
    await network.provider.send("evm_mine");
    await mockStakingRewards.sweep()
     const balanceAfterSweeping = await mockToken.balanceOf(user1.address)
    expect(Number(balanceAfterSweeping.toString())).to.equal(
      Number('1000000000000000000000000')
    )
    });
})
