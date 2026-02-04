// SPDX-License-Identifier: MIT
// by 0xAA
pragma solidity ^0.8.21;

import "./v1/ERC20.sol";

/**
 * @title NFT
 * @dev NFT
 * @notice NFT
 */
contract USDC is ERC20 {
    // 构造函数
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_){
    }

}