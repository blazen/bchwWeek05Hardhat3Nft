// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {CounterUpable} from "./CounterUpable.sol";
import {Test} from "forge-std/Test.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.
// npx hardhat test contracts/CounterTest.ts
contract CounterUpableTest is Test {
  CounterUpable counter;

  address private proxyAdmin = address(0xBEEF);

  // is called before each test execution
//  function setUp() public {
//    counter = new CounterUpable();
//  }
  function setUp() public {
    CounterUpable impl = new CounterUpable();
    bytes memory initData = abi.encodeCall(CounterUpable.initialize, (0));
    // 透明代理
    TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(address(impl), proxyAdmin, initData);
    counter = CounterUpable(address(proxy));
  }

  function test_InitialValue() public view {
    require(counter.getValue() == 0, "Initial value should be 0");
  }

}
