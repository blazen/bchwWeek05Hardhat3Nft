import { expect } from "chai";
import { network } from "hardhat";
// 必须使用 type
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import CounterUpableModule from "../ignition/modules/CounterUpable.js";
import CounterUpableUpgradeModule from "../ignition/modules/CounterUpableUpgrade.js";

// 核心：导入 TypeChain 生成的强类型（替换为你的合约名）
// import type { CounterUpable } from "../typechain-types/contracts/CounterUpable";
// import { CounterUpable__factory } from "../typechain-types/factories/contracts/CounterUpable";
import type {CounterUpable, CounterUpable__factory, CounterUpableV2} from "../types/ethers-contracts/index.js";

const { ethers, networkHelpers, ignition } = await network.connect();

// npx hardhat test test/CounterUpableProxyTest.ts
// 测试套件
describe("MetaNFTAuctionProxy", function () {

    describe("Proxy interaction", function () {
        it("Should be usable via proxy", async function () {
            const [owner, addr1] = await ethers.getSigners();
            // const { counter } = await ignition.deploy(CounterUpableModule);
            // const version = await counter.read.version({ account: addr1.address });
            const deployment  = await ignition.deploy(CounterUpableModule);
            const counterProxy = deployment.counter;

            // const version = await counterProxy.read.version({ account: addr1.address });
            // const version = await counterProxy.version({ account: addr1.address });
            // console.log("version:", version);

            const version1 = await counterProxy.getVersion({ account: addr1.address });
            console.log("version1:", version1);

            // TypeError: Cannot read properties of undefined (reading 'version')
            // const versionCall = await counterProxy.callStatic.version({ from: addr1.address });
            // console.log("versionCall:", versionCall);
            // expect(versionCall).to.eq("1.0.0");

            const proxyAddress = await deployment.counter.getAddress();
            const counterProxyType: CounterUpable = await ethers.getContractAt(
                "CounterUpable", // 合约名称
                proxyAddress, // Ignition 部署的代理地址
                owner // 可选：默认调用者
            ) as CounterUpable;
            const version3 = await counterProxyType.getVersion();
            console.log("version3:", version3);

        });
    });

    // TIPS: 合约升级时，状态变量保持不变。
    describe("Upgrading", function () {
        it("Should have upgraded the proxy to CounterUpableV2", async function () {
            const [owner, addr1] = await ethers.getSigners();
            const deployment  = await ignition.deploy(CounterUpableUpgradeModule);
            const proxyAddress = await deployment.counter.getAddress();
            const counterProxyType = await ethers.getContractAt(
                "CounterUpableV2", // 合约名称
                proxyAddress, // Ignition 部署的代理地址
                owner // 可选：默认调用者
            ) as CounterUpableV2;
            const version = await counterProxyType.getVersion();
            console.log("upgrade version:", version);
            const val = await counterProxyType.getValue();
            console.log("upgrade val:", val);
            const name = await counterProxyType.name();
            console.log("upgrade new name:", name);
        });
    });

});
