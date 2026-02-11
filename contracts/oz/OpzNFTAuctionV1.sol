// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OpzNFTAuction.sol";

/**
 * @title NFT拍卖合约V1
 * @dev 使用状态机模式的单个NFT拍卖合约
 * @notice 本合约管理单个拍卖的完整生命周期，状态流转如下：准备中(Preparing) -> 拍卖中(Active) -> 成功(Success)/失败(Failed) -> 已关闭(Closed)/已退款(Refunded)
 * @notice 继承 Initializable 实现 initialize。构造函数中调用 _disableInitializers(); 确保逻辑合约只能通过代理调用。
 * @notice 继承 UUPSUpgradeable 实现 _authorizeUpgrade 添加 onlyOwner，仅支持管理员升级。以便在 @openzeppelin/contracts-upgradeable 支持 hardhat3 后部署升级。
 * @notice The @openzeppelin/hardhat-upgrades plugin (v3.9.1) is currently incompatible with Hardhat v3.0.6
 * @notice V1：重写版本函数，测试合约升级
 */
contract OpzNFTAuctionV1 is OpzNFTAuction
{

    function initializeV1() external {
    }

    function getVersion() external pure override virtual returns(string memory) {
        return "1.0.1";
    }
}
