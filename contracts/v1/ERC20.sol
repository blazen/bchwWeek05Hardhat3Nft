// SPDX-License-Identifier: MIT
// WTF Solidity by 0xAA

pragma solidity ^0.8.21;

import "./IERC20.sol";

// 要先有 ERC 代币，再有 uniswap 交易代币的合约。IERC20 不用手写，ERC20 也不用手写，可以直接继承。
// 代币 DBZ,ETH
// 代币 DBZ，铸币账号 A
// uniswap DBZ,ETH
// 账号 B 现在要使用 ETH 交换 DBZ，汇率为 1:1
contract ERC20 is IERC20 {

    mapping(address => uint256) public override balanceOf;

    mapping(address => mapping(address => uint256)) public override allowance;

    uint256 public override totalSupply;   // 代币总供给

    string public name;   // 名称
    string public symbol;  // 符号
    
    uint8 public decimals = 6; // 小数位数，模拟 USDC 6位小数。

    // @dev 在合约部署的时候实现合约名称和符号
    constructor(string memory name_, string memory symbol_){
        name = name_;
        symbol = symbol_;
    }

    // @dev 实现`transfer`函数，代币转账逻辑
    function transfer(address recipient, uint amount) public override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    // @dev 实现 `approve` 函数, 代币授权逻辑
    function approve(address spender, uint amount) public override returns (bool) {
        allowance[msg.sender][spender] = amount;    // 记录授权额度，不会从授权账户转账。
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // @dev 实现`transferFrom`函数，代币授权转账逻辑
    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) public override returns (bool) {
        allowance[sender][msg.sender] -= amount;    // 授权余额-
        balanceOf[sender] -= amount;        // 授权账户余额-
        balanceOf[recipient] += amount;     // 接收账户余额+
        emit Transfer(sender, recipient, amount);
        return true;
    }

    // @dev 铸造代币，从 `0` 地址转账给 调用者地址
    function mint(uint amount) external {
        balanceOf[msg.sender] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    // @dev 销毁代币，从 调用者地址 转账给  `0` 地址
    function burn(uint amount) external {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

}
