// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Counter} from "./Counter.sol";
import {Test} from "forge-std/Test.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

// npx hardhat test solidity contracts/Counter.t.sol
// npx hardhat test contracts/Counter.t.sol
contract CounterTest is Test {
  Counter counter;

  // is called before each test execution
  function setUp() public {
    counter = new Counter();
  }

  function test_InitialValue() public view {
    require(counter.x() == 0, "Initial value should be 0");
  }

  function testFuzz_Inc(uint8 x) public {
    for (uint8 i = 0; i < x; i++) {
      counter.inc();
    }
    require(counter.x() == x, "Value after calling inc x times should be x");
  }

  function test_IncEmitsIncrementEvent() public {
    vm.expectEmit();    // cheatcodes 将会发生事件
    emit Counter.Increment(1);  // 事件类型与参数必须与此相同

    counter.inc();    // 发生上诉事件
  }

  function test_IncByZero() public {
    vm.expectRevert();    // 将会回滚，因为参数为0
    counter.incBy(0);
  }
}
