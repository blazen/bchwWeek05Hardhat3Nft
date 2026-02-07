import { expect } from "chai";
import { network } from "hardhat";
// 必须使用 type
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import OpzNFTAuctionModule from "../ignition/modules/OpzNFTAuction.js";
import OpzNFTAuctionUpgradeModule from "../ignition/modules/OpzNFTAuctionUpgrade.js";

// 核心：导入 TypeChain 生成的强类型（替换为你的合约名）
// import type { CounterUpable } from "../typechain-types/contracts/CounterUpable";
// import { CounterUpable__factory } from "../typechain-types/factories/contracts/CounterUpable";
import type {OpzNFTAuction, CounterUpable__factory, OpzNFTAuctionV1} from "../types/ethers-contracts/index.js";

const { ethers, networkHelpers, ignition } = await network.connect();

// npx hardhat test test/OpzNFTAuctionTest.ts
// 测试套件
describe("MetaNFTAuctionProxy", function () {

    describe("Proxy interaction", function () {
        it("Should be usable via proxy", async function () {
            const [owner, addr1] = await ethers.getSigners();
            // const { counter } = await ignition.deploy(CounterUpableModule);
            // const version = await counter.read.version({ account: addr1.address });
            const deployment  = await ignition.deploy(OpzNFTAuctionModule);
            const proxy = deployment.auction;

            // read 会报错，提示不存在
            // const version = await counterProxy.read.version({ account: addr1.address });
            // const version = await counterProxy.version({ account: addr1.address });
            // console.log("version:", version);

            //
            const version1 = await proxy.getVersion({ account: addr1.address });
            console.log("version1:", version1);

            // TypeError: Cannot read properties of undefined (reading 'version')
            // const versionCall = await counterProxy.callStatic.version({ from: addr1.address });
            // console.log("versionCall:", versionCall);
            // expect(versionCall).to.eq("1.0.0");

            // 将代理地址转换为合约
            const proxyAddress = await deployment.auction.getAddress();
            const proxyType: OpzNFTAuction = await ethers.getContractAt(
                "OpzNFTAuction", // 合约名称
                proxyAddress, // Ignition 部署的代理地址
                owner // 可选：默认调用者
            ) as OpzNFTAuction;
            const version3 = await proxyType.getVersion();
            console.log("version3:", version3);
            expect(version3).to.eq("1.0.0");
        });
    });

    // TIPS: 合约升级时，状态变量保持不变。
    describe("Upgrading", function () {
        it("Should have upgraded the proxy to OpzNFTAuctionV1", async function () {
            const [owner, addr1] = await ethers.getSigners();
            const deployment  = await ignition.deploy(OpzNFTAuctionUpgradeModule);
            const proxyAddress = await deployment.auction.getAddress();
            const proxyType = await ethers.getContractAt(
                "OpzNFTAuctionV1", // 合约名称
                proxyAddress, // Ignition 部署的代理地址
                owner // 可选：默认调用者
            ) as OpzNFTAuctionV1;
            const version = await proxyType.getVersion();
            console.log("upgrade version:", version);
            expect(version).to.eq("1.0.1");
        });
    });

});
