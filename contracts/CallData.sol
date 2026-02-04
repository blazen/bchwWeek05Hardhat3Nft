// SPDX-License-Identifier: MIT
// wtf.academy
pragma solidity ^0.8.21;

contract Foo {
    // 选择器冲突的例子
    // 去掉两个函数的注释后，合约不会通过编译，因为两个函数有着相同的选择器
    bytes4 public selector1 = bytes4(keccak256("burn(uint256)"));                           // 0x42966c68
    bytes4 public selector2 = bytes4(keccak256("collate_propagate_storage(bytes16)"));      // 0x42966c68
    // function burn(uint256) external {}
    // function collate_propagate_storage(bytes16) external {}

    // CALLDATA 在线编码：
    // 代理函数 CALLDATA 生成地址：https://abi.hashex.org/
    // 选择函数，输入函数名称：upgrade
    // 选择参数 address，输入 V2 合约地址：0xe3813237b96266DCC85d6BaC74CA0A18d09C6701
    // 会自动生成编码，拷贝直接输入到 CALLDATA 中。
    bytes4 public getVersion = bytes4(keccak256("getVersion(uint256)"));                    // 0xb88da759
    bytes public getVersionCallData = abi.encodeWithSignature("getVersion(uint256)", 99);   // 0xb88da7590000000000000000000000000000000000000000000000000000000000000063

}