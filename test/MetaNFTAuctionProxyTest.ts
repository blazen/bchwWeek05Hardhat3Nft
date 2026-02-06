import { expect } from "chai";
import { network } from "hardhat";
// 必须使用 type
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
// 这个类型没有！且 ethers.getSigners() 返回的是 HardhatEthersSigner 类型。
// import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/src/internal/signers";
import type {
    MetaNFT,
    MetaNFTAuctionProxy,
    MetaNFTAuctionV1,
    MetaNFTAuctionV2,
    USDC
} from "../types/ethers-contracts/index.js";
// import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers, networkHelpers } = await network.connect();

interface DeployAuctionFixture {
    auctionProxy:MetaNFTAuctionProxy;
    auctionV1:MetaNFTAuctionV1;
    auctionV2:MetaNFTAuctionV2;
    owner:HardhatEthersSigner;
    addr1:HardhatEthersSigner;
    addr2:HardhatEthersSigner;
    addr3:HardhatEthersSigner;
    addr4:HardhatEthersSigner;
}

// 定义 Fixture 函数。fast than beforeEach.
async function deployCounterFixture():Promise<DeployAuctionFixture> {
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const auctionV1 = await ethers.deployContract("MetaNFTAuctionV1");
    const auctionV2 = await ethers.deployContract("MetaNFTAuctionV2");
    // 代理，使用逻辑合约V1部署
    const auctionProxy = await ethers.deployContract("MetaNFTAuctionProxy", [await auctionV1.getAddress()]);
    return { auctionProxy, auctionV1, auctionV2, owner, addr1, addr2, addr3, addr4 };
}

// 测试套件
describe("MetaNFTAuctionProxy", function () {
    // 验证部署后的初始状态
    // 1.查询版本，返回V1
    // 2.合约升级，查询版本，返回V2
    describe("Deployment", function () {
        // 1.查询版本，返回V1
        // 测试结果：如此 call 不会更新状态变量 version。虽然逻辑合约调用成功，但是代理合约中的 version 依然为默认值。
        it("Should return v1 when call getVersion", async function () {
            const { auctionProxy, auctionV1, auctionV2, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 逻辑合约为v1
            expect(auctionV1).to.eq(await auctionProxy.implementation());

            // const calldata = auctionV1.interface.encodeFunctionData("getVersion");
            const calldata = auctionV1.interface.encodeFunctionData("setVersion")
            console.log("calldata:", calldata);
            // calldata: 0x0e15932b

            const callResult = await ethers.provider.call({
                from: owner.address,
                to: await auctionProxy.getAddress(),
                data: calldata
            });
            console.log("callResult:", callResult);
            // callResult: 0x
            // const isSuccess = auctionV1.interface.decodeFunctionResult("getVersion", callResult);

            // 始终为默认值
            const version = await auctionProxy.version();
            console.log("version:", version);
        });

        // 通过 call 访问代理函数
        it("Should return 11 when call inc with 5,6", async function () {
            const { auctionProxy, auctionV1, auctionV2, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // const calldata = auctionV1.interface.encodeFunctionData("getVersion");
            const calldata = auctionProxy.interface.encodeFunctionData("inc", [5,6]);
            console.log("calldata:", calldata);
            // calldata: 0xe8a7201f00000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006
            const callResult = await ethers.provider.call({
                from: owner.address,
                to: await auctionProxy.getAddress(),
                data: calldata
            });
            console.log("callResult:", callResult);
            // callResult: 0x000000000000000000000000000000000000000000000000000000000000000b
            const result = auctionProxy.interface.decodeFunctionResult("inc", callResult);
            console.log("result:", result);
        });

        // 通过 call 访问代理的逻辑函数。要求函数必须有返回值，不会修改状态变量。
        it("Should call fallback", async function () {
            const { auctionProxy, auctionV1, auctionV2, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            const calldata = auctionV1.interface.encodeFunctionData("getVersion")
            console.log("calldata:", calldata);
            // calldata: 0x0d8e6e2c

            const callResult = await ethers.provider.call({
                from: owner.address,
                to: await auctionProxy.getAddress(),
                data: "0x0d8e6e2c"
            });
            console.log("callResult:", callResult);

            const result = auctionV1.interface.decodeFunctionResult("getVersion", callResult);
            console.log("result:", result);

            // await expect(ethers.provider.call({
            //     from: owner.address,
            //     to: await auctionProxy.getAddress(),
            //     data: "0x0e15932b"
            // })).to.emit(auctionProxy, "fallbackCalled").withArgs(owner, 0, "0x")
        });

    });
});
