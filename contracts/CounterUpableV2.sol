// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// 可升级的 Counter
contract CounterUpableV2 is Initializable {
    uint256 private _value;
//    string public version;
    string public name;

    // 升级合约不能用构造函数，用 initialize 初始化
    function initialize(uint256 initialValue) public initializer {
        _value = initialValue;
//        version = "2.0.0";
    }

    // 普通方法：设置值
    function setValue(uint256 newValue) public {
        _value = newValue;
    }

    // 普通方法：获取值（view，测试委托调用）
    function getValue() public view returns (uint256) {
        return _value;
    }

    function getVersion() public pure returns (string memory) {
//        return version;
        return "2.0.0";
    }

    function setName(string memory _name) public {
        name = _name;
    }

}