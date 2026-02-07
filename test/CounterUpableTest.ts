// import { expect } from "chai";
// import { network } from "hardhat";
// // 必须使用 type
// import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
// import type {
//     CounterUpable,CounterUpable__factory
// } from "../types/ethers-contracts/index.js";
//
// const { ethers, networkHelpers } = await network.connect();
//
// interface DeployFixture {
//     counterProxy:CounterUpable;
//     owner:HardhatEthersSigner;
//     addr1:HardhatEthersSigner;
// }
//
// // 定义 Fixture 函数。fast than beforeEach.
// async function deployCounterFixture():Promise<DeployFixture> {
//     const [owner, addr1] = await ethers.getSigners();
//     const counterFactory = await ethers.getContractFactory("Box") as CounterUpable__factory;
//     // 无法安装 @openzeppelin/hardhat-upgrades
//     // 当前最新版本，仅支持 @nomicfoundation/hardhat-ethers@"^3.0.6，但是本地为 @nomicfoundation/hardhat-ethers@4.0.4
//     const counterProxy = await upgrades.deployProxy(
//         counterFactory, // 实现合约工厂
//         [10n], // initialize 的参数（数组形式）
//         {
//             initializer: "initialize", // 初始化方法名（必须指定）
//             kind: "transparent" // 显式指定代理类型为透明代理（默认也是transparent）
//         }
//     ) as CounterUpable;
//     await counterProxy.waitForDeployment(); // Hardhat 3+Ethers v6 必加
//     return { counterProxy, owner, addr1 };
// }
//
// // 测试套件
// describe("MetaNFTAuctionProxy", function () {
//     // 声明强类型变量
//     let counterProxy: CounterUpable;
//     let owner: HardhatEthersSigner;
//     let addr1: HardhatEthersSigner;
//
//     // 加载Fixture（仅部署1次，缓存复用）
//     before(async function () {
//         const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
//         ({ counterProxy, owner, addr1 } = fixtureData);
//     });
//
//     // 验证部署后的初始状态
//     // 1.查询版本，返回V1
//     // 2.合约升级，查询版本，返回V2
//     describe("Deployment", function () {
//
//
//     });
// });
