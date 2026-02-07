// SPDX-License-Identifier: MIT
// by 0xAA
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TOKEN
 * @dev TOKEN
 * @notice TOKEN
 */
contract OpzToken is ERC20,Ownable {
    // 构造函数
    constructor() ERC20("USDC", "USDC") Ownable(msg.sender) {
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDC通常使用6位小数
    }

    /**
     * @dev 铸造新的USDC代币
     * @param to 接收代币的地址
     * @param amount 铸造的代币数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 销毁USDC代币
     * @param from 销毁代币的地址
     * @param amount 销毁的代币数量
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

}