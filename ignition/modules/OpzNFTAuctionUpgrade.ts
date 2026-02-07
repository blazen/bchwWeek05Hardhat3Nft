import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// 引入代理部署脚本
import OpzNFTAuctionModule from "./OpzNFTAuction.js";

// npx hardhat ignition deploy ./ignition/modules/OpzNFTAuctionUpgrade.ts
const opzNFTAuctionUpgradeModule = buildModule(
    "OpzNFTAuctionUpgradeModule",
    (m) => {
        // 代理升级管理员，必须与部署时一致
        const proxyAdminOwner = m.getAccount(0);
        // 加载部署脚本
        const { proxyAdmin, proxy } = m.useModule(OpzNFTAuctionModule);
        // 部署新版本
        const auctionV1 = m.contract("OpzNFTAuctionV1");
        // 合约升级后，调用的函数。
        // const encodedFunctionCall = m.encodeFunctionCall(counterV2, "setName", [
        //     "hello v2",
        // ]);
        const encodedFunctionCall = "0x";
        // 使用管理员地址，调用 proxyAdmin 合约的 upgradeAndCall 函数更新代理合约中的逻辑合约地址。
        m.call(proxyAdmin, "upgradeAndCall", [proxy, auctionV1, encodedFunctionCall], {
            from: proxyAdminOwner,
        });

        const auction = m.contractAt("OpzNFTAuctionV1", proxy, {
            id: "OpzNFTAuctionV1AtProxy",
        });

        return { auction, proxyAdmin, proxy };
    },
);

// const counterUpableV2Module = buildModule("CounterUpableV2Module", (m) => {
//     const { proxyAdmin, proxy } = m.useModule(counterUpableUpgradeModule);
//
//     const counter = m.contractAt("CounterUpableV2", proxy);
//
//     return { counter, proxyAdmin, proxy };
// });

// Deployed Addresses
// OpzNFTAuctionProxyModule#OpzNFTAuction - 0x5FbDB2315678afecb367f032d93F642f64180aa3
// OpzNFTAuctionUpgradeModule#OpzNFTAuctionV1 - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// OpzNFTAuctionProxyModule#TransparentUpgradeableProxy - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
// OpzNFTAuctionProxyModule#ProxyAdmin - 0x75537828f2ce51be7289709686A69CbFDbB714F1
// OpzNFTAuctionModule#OpzNFTAuction - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
// OpzNFTAuctionUpgradeModule#OpzNFTAuctionV1AtProxy - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
export default opzNFTAuctionUpgradeModule;
