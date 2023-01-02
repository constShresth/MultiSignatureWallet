const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet smart contract testing", () => {
  let msWallet;
  let accounts;
  let acc1;
  let acc2;
  const numConfirmationsRequired = 1;
  const msg = { value: 15 };
  const amt = 10;

  //before
  before(async () => {
    const contract = await ethers.getContractFactory("MultiSigWallet");
    accounts = await ethers.getSigners();
    acc1 = accounts[0].address;
    acc2 = accounts[1].address;
    msWallet = await contract.deploy([acc1, acc2], numConfirmationsRequired);
    await msWallet.deployed();
  });

  //#1
  it("Checks all the addresses and verifies the owner", async () => {
    expect((await msWallet.getOwners())[0]).to.be.equal(acc1);
    expect((await msWallet.getOwners())[1]).to.be.equal(acc2);
    for (let i = 0; i < 20; i++) {
      if (i === 0 || i === 1) {
        expect(await msWallet.isOwner(accounts[i].address)).to.be.true;
      } else {
        expect(await msWallet.isOwner(accounts[i].address)).to.be.false;
      }
    }
    expect(await msWallet.owners(0)).to.be.equal(acc1);
    expect(await msWallet.owners(1)).to.be.equal(acc2);
  });

  //#2
  it("Checks the number of confirmations required", async () => {
    expect(await msWallet.numConfirmationsRequired()).to.be.equal(
      numConfirmationsRequired
    );
  });

  //#3
  it("Checks the submit transaction function", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(0);
    await msWallet.submitTransaction(accounts[2].address, amt, 0xab);
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
  });

  //#4
  it("Checks the confirm transaction function", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test

    await msWallet.confirmTransaction(0);
    expect((await msWallet.getTransaction(0))[4]).to.be.equal(1);
    const msWallet1 = msWallet.connect(accounts[1]);
    await msWallet1.confirmTransaction(0);
    expect((await msWallet.getTransaction(0))[4]).to.be.equal(2);
  });

  //#5
  it("Checks the notConfirmed modifier in confirmeTransaction function", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test.

    expect(msWallet.confirmTransaction(0)).to.be.reverted;
    //since transaction at index 0 has already been confirmed by this address in #4th test.
  });

  //#6
  it("Checks the revoke transaction function", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test

    expect((await msWallet.getTransaction(0))[4]).to.be.equal(2);
    //since transaction has already been confirmed twice #4th test

    await msWallet.revokeConfirmation(0);
    expect((await msWallet.getTransaction(0))[4]).to.be.equal(1);
  });

  //#7
  it("Checks the deposit function", async () => {
    //changed the receive function with the deposit as I was unable to 
    //call the function from here.
    expect(await msWallet.getBalance()).to.be.equal(0);
    await msWallet.deposit(msg);
    expect(await msWallet.getBalance()).to.be.equal(msg.value);
  });

  //#8
  it("Checks the execute transaction function", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test

    expect((await msWallet.getTransaction(0))[4]).to.be.equal(1);
    //since transaction has already been confirmed twice in #4th test & revoked once in #6th test

    expect(await msWallet.getBalance()).to.be.equal(msg.value);
    await msWallet.executeTransaction(0);
    expect((await msWallet.getTransaction(0))[3]).to.be.true;
    expect(await msWallet.getBalance()).to.be.equal(msg.value - amt);
  });

  //#9
  it("Checks the onlyOwner modifier in all four functions", async () => {
    const msWallet2 = msWallet.connect(accounts[2]);
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test.

    expect(msWallet2.submitTransaction(accounts[5].address, amt, 0xab)).to.be
      .reverted;
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    expect(msWallet2.confirmTransaction(0)).to.be.reverted;
    expect(msWallet2.revokeConfirmation(0)).to.be.reverted;
    expect(msWallet2.executeTransaction(0)).to.be.reverted;
  });

  //#10
  it("Checks the txExist modifier in all three functions", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test.

    expect(msWallet.confirmTransaction(1)).to.be.reverted;
    expect(msWallet.revokeConfirmation(1)).to.be.reverted;
    expect(msWallet.executeTransaction(1)).to.be.reverted;
  });

  //#11
  it("Checks the notExecuted modifier in all three functions", async () => {
    expect(await msWallet.getTransactionCount()).to.be.equal(1);
    //since one transaction has already been submitted in #3rd test.

    expect(msWallet.confirmTransaction(0)).to.be.reverted;
    expect(msWallet.revokeConfirmation(0)).to.be.reverted;
    expect(msWallet.executeTransaction(0)).to.be.reverted;
    //since transaction at index 0 has already been executed in #8th test.
  });

  //notConfirmed modifier test is at #4th.
  //Gas report is in gasReport.txt
  
});
