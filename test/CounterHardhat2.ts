// const hre = require("hardhat");
// const { expect } = require("chai");
import { expect } from "chai";
import { network } from "hardhat";

import type {Counter} from "../types/ethers-contracts/index.js";

const { ethers } = await network.connect();

describe("Counter", function () {
  // const { ethers } = hre;
  let counter:Counter;
  let account1, account2;

  beforeEach(async () => {
    [account1, account2] = await ethers.getSigners();
    console.log([account1, account2], '===accounts===');

    const Counter = await ethers.getContractFactory("Counter");   //工厂模板
    counter = await Counter.deploy();  //部署合约
    counter.waitForDeployment();
    console.log("counter deployed to:", counter.target);
    expect(await counter.x()).to.equal("0");
  })

  it("Should emit the Increment event when calling the inc() function", async function () {
    await expect(counter.inc()).to.emit(counter, "Increment").withArgs(1n);
  });

});
