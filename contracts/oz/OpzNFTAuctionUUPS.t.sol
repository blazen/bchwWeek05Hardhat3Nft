// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./OpzNFTAuctionV1.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {OpzNFTAuction} from "./OpzNFTAuction.sol";
import {Test} from "forge-std/Test.sol";
import {TransparentUpgradeableProxy, ITransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
//import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// npx hardhat test contracts/oz/OpzNFTAuction.t.sol

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.
// npx hardhat test contracts/oz/CounterTest.ts
contract OpzNFTAuctionUUPSTest is Test {
    address public proxyAdminAddr = address(this);
    address public user = address(0x123);
    OpzNFTAuction auction;
    ERC1967Proxy proxy;

    // is called before each test execution
    function setUp() public {
        OpzNFTAuction impl = new OpzNFTAuction();
        bytes memory initData = abi.encodeCall(OpzNFTAuction.initialize, ());
        // UUPS
        proxy = new ERC1967Proxy(address(impl), initData);
        auction = OpzNFTAuction(address(proxy));
    }

    // 测试版本
    function test_getVersion() public view {
//        require(auction.version() == "MetaNFTAuctionV1", "version should be v1");
//        require(keccak256(auction.version()) == keccak256("MetaNFTAuctionV1"), "version should be v1");
        assertEq(auction.getVersion(), "1.0.0");
    }

    // 测试合约升级
    function test_update() public {
        OpzNFTAuctionV1 impl = new OpzNFTAuctionV1();
        bytes memory initData = abi.encodeCall(OpzNFTAuctionV1.initializeV1, ());

        vm.prank(user);
        vm.expectRevert("OwnableUnauthorizedAccount(0x0000000000000000000000000000000000000123)");
        auction.upgradeToAndCall(address(impl), initData);

        vm.prank(proxyAdminAddr);
        auction.upgradeToAndCall(address(impl), initData);
        assertEq(auction.getVersion(), "1.0.1");
    }

}
