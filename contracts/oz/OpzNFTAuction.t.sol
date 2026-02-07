// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {OpzNFTAuction} from "./OpzNFTAuction.sol";
import {Test} from "forge-std/Test.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.
// npx hardhat test contracts/oz/CounterTest.ts
contract OpzNFTAuctionTest is Test {
    address private proxyAdmin = address(0xBEEF);
    OpzNFTAuction auction;

    // is called before each test execution
//    function setUp() public {
//        auction = new OpzNFTAuctionV1();
//    }
    function setUp() public {
        OpzNFTAuction impl = new OpzNFTAuction();
        bytes memory initData = abi.encodeCall(OpzNFTAuction.initialize, ());
        // 透明代理
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(address(impl), proxyAdmin, initData);
        auction = OpzNFTAuction(address(proxy));
    }

    // 测试版本
    function test_getVersion() public view {
//        require(auction.version() == "MetaNFTAuctionV1", "version should be v1");
//        require(keccak256(auction.version()) == keccak256("MetaNFTAuctionV1"), "version should be v1");
        assertEq(auction.getVersion(), "1.0.0");
    }

    // 测试合约升级
    function test_update() public view {
        // TODO
    }

}
