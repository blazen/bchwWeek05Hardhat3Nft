import { expect } from "chai";
import { network } from "hardhat";
// 必须使用 type
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import OpzNFTAuctionModule from "../ignition/modules/OpzNFTAuction.js";
import OpzNFTAuctionUpgradeModule from "../ignition/modules/OpzNFTAuctionUpgrade.js";

// 核心：导入 TypeChain 生成的强类型（替换为你的合约名）
// import type { CounterUpable } from "../typechain-types/contracts/CounterUpable";
// import { CounterUpable__factory } from "../typechain-types/factories/contracts/CounterUpable";
import type {
    OpzNFTAuction,
    CounterUpable__factory,
    OpzNFTAuctionV1,
    MetaNFTAuctionV1, MetaNFT, USDC, OpzToken, OpzNFT
} from "../types/ethers-contracts/index.js";

const { ethers, networkHelpers, ignition } = await network.connect();

interface DeployAuctionFixture {
    auctionV1:OpzNFTAuction;
    nft:OpzNFT;
    token:OpzToken;
    owner:HardhatEthersSigner;
    addr1:HardhatEthersSigner;
    addr2:HardhatEthersSigner;
    addr3:HardhatEthersSigner;
    addr4:HardhatEthersSigner;
}

// 定义 Fixture 函数 by TransparentUpgradeableProxy。fast than beforeEach.
async function deployCounterFixture():Promise<DeployAuctionFixture> {
    // owner    部署合约
    // 账户1      拍卖 TOKEN		    拍卖者
    // 账户2      使用 USDC 竞拍	    流标
    // 账户3      使用 ETH 竞拍		中标
    // 账户4      使用 ETH OR USDC 竞拍，但低于最高出价者
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const zeroAddress = ethers.ZeroAddress; // 零地址（示例）

    // 部署NFT
    const nft = await ethers.deployContract("OpzNFT", []);
    // 给用户1铸造一个 NFT
    await nft.mint(addr1.address, 1n);

    // 部署TOKEN
    const token = await ethers.deployContract("OpzToken", []);
    // 给用户2铸造一些 Token，如何切换到用户2呢？铸造函数只能是调用者。 TODO
    // await token.mint(1000n);
    // await token.transfer(addr2.address, 1000n);

    // const auctionV1 = await ethers.deployContract("MetaNFTAuctionV1");
    // 切换到账户1，将 NFT 1 授权给拍卖合约地址
    // await nft.connect(addr1).approve(auctionV1.getAddress(), 1n);

    // 部署AUCTION
    const deployment  = await ignition.deploy(OpzNFTAuctionModule);
    const proxy = deployment.auction;

    // 将代理地址转换为合约
    const proxyAddress = await deployment.auction.getAddress();
    const auctionV1: OpzNFTAuction = await ethers.getContractAt(
        "OpzNFTAuction", // 合约名称
        proxyAddress, // Ignition 部署的代理地址
        owner // 可选：默认调用者
    ) as OpzNFTAuction;

    console.log("zeroAddress：", zeroAddress);
    console.log("auctionV1 owner addr：", await auctionV1.owner());
    console.log("auctionV1 addr：", await auctionV1.getAddress());
    console.log("nft addr：", await nft.getAddress());
    console.log("token addr：", await token.getAddress());
    // 每个测试地址，默认 10000 ETH
    console.log("owner addr：", await owner.getAddress());
    console.log("addr1 addr：", await addr1.getAddress(), ", balance:", await ethers.provider.getBalance(addr1));
    console.log("addr2 addr：", await addr2.getAddress());
    console.log("addr3 addr：", await addr3.getAddress());
    console.log("addr4 addr：", await addr4.getAddress());

    // 奇怪，每次部署时，合约地址应该是变化的啊，为什么不变呢？ TODO
    // zeroAddress： 0x0000000000000000000000000000000000000000
    // auctionV1 owner addr： 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    // auctionV1 addr： 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
    // nft addr： 0x5FbDB2315678afecb367f032d93F642f64180aa3
    // owner addr： 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    // token addr： 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
    // addr1 addr： 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 , balance: 10000000000000000000000n
    // addr2 addr： 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    // addr3 addr： 0x90F79bf6EB2c4f870365E785982E1f101E93b906

    return { auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 };

    // const auctionV2 = await ethers.deployContract("MetaNFTAuctionV2");
    //
    // // 代理，使用逻辑合约V1部署
    // const auctionProxy = await ethers.deployContract("MetaNFTAuctionProxy", [await auctionV1.getAddress()]);
    //
    // return { auctionProxy, auctionV1, auctionV2, nft, token, owner, addr1, addr2, addr3, addr4 };
}

// npx hardhat test test/OpzNFTAuctionTest.ts
// npx hardhat test test/OpzNFTAuctionTest.ts --coverage
// REPORT_GAS=true npx hardhat test test/OpzNFTAuctionTest.ts
// npx hardhat test test/OpzNFTAuctionTest.ts --gas-stats > gas-report.txt
// npx hardhat test test/OpzNFTAuctionTest.ts --gas-stats | Out-File -Encoding utf8 gas-report.txt -NoNewline
// npx hardhat test test/OpzNFTAuctionTest.ts --gas-stats | Out-File -Encoding utf8 gas-report.txt
// 测试套件
describe("OpzNFTAuctionProxy", function () {

    describe("Proxy interaction", function () {
        it("Should be usable via proxy", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
            const version3 = await auctionV1.getVersion();
            console.log("version3:", version3);
            expect(version3).to.eq("1.0.0");
        });

        // GAS
        it("Should compare gas costs", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 测试方法1
            // const tx1 = await auctionV1.getVersion();
            // const receipt1 = await tx1.wait();
            // const gas1 = receipt1.gasUsed;
            // console.log(`Method getVersion: ${gas1}`);

            // 创建拍卖
            const tx1 = await auctionV1.start(addr1, 1, nft, 1000, 500, token);
            const receipt1 = await tx1.wait();
            // @ts-ignore
            const gas1 = receipt1.gasUsed;
            console.log(`Method start: ${gas1}`);

        });
    });

    // 验证部署后的初始状态
    // 1.三个合约部署使用账号1 - 废弃！不关心这个。
    // 2.账号1 有一个 NFT 1
    // 3.拍卖合约地址拥有账号1 NFT 1 的授权
    // 4.账号2 有 1000 个 USDC
    // 5.拍卖合约初始 auctionId=0
    describe("Deployment", function () {
        // // 1.合约部署使用账号1
        // it("Should owner is same of auctionV1, nft, token", async function () {
        //     const { auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = await networkHelpers.loadFixture(deployCounterFixture);
        //     expect(await auctionV1.getAddress()).to.eq(owner.address);
        //     expect(await nft.getAddress()).to.eq(owner.address);
        //     expect(await token.getAddress()).to.eq(owner.address);
        // });

        // 2.账号1 有一个 NFT 1
        it("Should account2 have nft 1", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
            const  addr = await nft.ownerOf(1n);
            // console.log("nft 1 owner by addr:", addr);
            expect(addr).to.eq(addr1.address);
        });

        // // 3.拍卖合约地址拥有账号1 NFT 1 的授权
        // it("Should auction have approved nft 1 by addr1", async function () {
        //     const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
        //     const addr = await nft.getApproved(1n);
        //     console.log("nft 1 approved addr:", addr);
        //     expect(await auctionV1.getAddress()).to.eq(addr);
        // });
        //
        // // 4.账号2 有 1000 个 USDC
        // it("Should auction have approved nft 1 by addr1", async function () {
        //     const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
        //     const balance = await token.balanceOf(addr2);
        //     console.log("addr2 balance:", balance);
        //     expect(balance).to.eq(1000);
        // });

        // 5.拍卖合约初始 auctionId=0
        it("Should auction‘s auctionId is 0", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
            const  id = await auctionV1.auctionId();
            // console.log("auctionId:", id);
            expect(id).to.eq(0);
        });

    });

    // 创建拍卖
    // 1.非管理员创建失败
    // 2.nft 0地址，创建拍卖失败
    // 3.拍卖时间小于 120秒，创建拍卖失败
    // 4.token 0地址，创建拍卖失败
    // 5.创建拍卖后，拍卖id为1
    // 6.管理员手动结束拍卖
    // 7.结束后竞标失败
    describe("Start", function () {
        let auctionV1:OpzNFTAuction;
        let nft:OpzNFT;
        let token:OpzToken;
        let owner:HardhatEthersSigner;
        let addr1:HardhatEthersSigner;
        let addr2:HardhatEthersSigner;
        let addr3:HardhatEthersSigner;
        let addr4:HardhatEthersSigner;

        // 外层before：加载根Fixture，仅执行1次，赋值给外层变量（核心！替代原before的初始化）
        before(async function () {
            // // 加载根Fixture，获取缓存的基础数据
            const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
            // 解构赋值给外层变量，供所有子层级使用
            ({ auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = fixtureData);
            // const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
        });

        // 1.非管理员创建失败
        it("Should allow the owner to start and revert for non-owners", async function () {
            await expect(auctionV1.connect(addr1).start(addr1, 1, nft, 1000, 500, token)).to.be
                .revertedWithCustomError(auctionV1, "OwnableUnauthorizedAccount").withArgs(addr1.getAddress());
        });

        // 2.nft 0地址，创建拍卖失败
        it("Should revert when nft is zero address", async function () {
            // 0地址
            // const zeroAddress = "0x0000000000000000000000000000000000000000";
            // // Impersonate the non-owner account
            // await networkHelpers.impersonateAccount(zeroAddress);
            // // Fund the non-owner account with some ETH to pay for gas
            // // await networkHelpers.setBalance(zeroAddress, ethers.parseEther("1.0"));
            // const zeroSigner = await ethers.getSigner(zeroAddress);
            const zeroAddress = ethers.ZeroAddress; // 零地址（示例）

            // await expect(auctionV1.start(addr1, 1, await zeroSigner.getAddress(), 1000, 500, token)).to.be.revertedWith(
            //     "invalid nft",
            // );
            await expect(auctionV1.start(addr1, 1, zeroAddress, 1000, 500, token)).to.be.revertedWith(
                "invalid nft",
            );
        });

        // 3.拍卖时间小于 120秒，创建拍卖失败
        it("Should revert where duration < 120", async function () {
            await expect(auctionV1.start(addr1, 1, nft, 1000, 110, token)).to.be.revertedWith(
                "duration is greater than 120 second",
            );
        });

        // 4.token 0地址，创建拍卖失败
        it("Should revert when token is zero address", async function () {
            await expect(auctionV1.start(addr1, 1, nft, 1000, 120, "0x0000000000000000000000000000000000000000")).to.be.revertedWith(
                "invalid payment token",
            );
        });

        // 5.创建拍卖后，发生事件 StartBid，事件参数拍卖id为1
        it("Should auctionV1 is 1 and emit StartBid when start success", async function () {
            // await auctionV1.start(addr1, 1, nft, 1000, 120, token)
            // const id = await auctionV1.auctionId();
            // console.log("auctionId:", id);
            // expect(id).to.eq(1);

            await expect(auctionV1.start(addr1, 1, nft, 1000, 120, token)).to.emit(auctionV1, "StartBid").withArgs(1n);
        });

        // 6.管理员手动结束拍卖
        it("Should manually set auction is ended by owner", async function () {
            await expect(auctionV1.endBidding(0)).to.emit(auctionV1, "EndBid").withArgs(0n);
        });

        // 7.管理员手动结束后，竞标失败
        it("Should revert when bid an auction of ended", async function () {
            const bidAmount = ethers.parseEther("1");
            await expect(auctionV1.connect(addr3).bid(0, {value: bidAmount})).to.be.revertedWith(
                "ended",
            );
        });

    });

    // 账户2 TOKEN 竞标
    // 1.竞标额度为0（账户2没有授权 token 给拍卖合约），竞拍失败
    // 2.拍卖未开始，竞拍失败 - 目前管理员创建拍卖后，就是开始的。待优化增加初始开始时间。 TODO
    // 3.竞标价低于起步价，竞拍失败
    // 4.竞标价低于最高价，竞拍失败
    // 5.竞标成功，拍卖信息中最高出价者为自己
    // 6.拍卖结束，竞拍失败
    describe("bidToken", function () {
        let auctionV1:OpzNFTAuction;
        let nft:OpzNFT;
        let token:OpzToken;
        let owner:HardhatEthersSigner;
        let addr1:HardhatEthersSigner;
        let addr2:HardhatEthersSigner;
        let addr3:HardhatEthersSigner;
        let addr4:HardhatEthersSigner;

        // 外层before：加载根Fixture，仅执行1次，赋值给外层变量（核心！替代原before的初始化）
        before(async function () {
            // // 加载根Fixture，获取缓存的基础数据
            const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
            // 解构赋值给外层变量，供所有子层级使用
            ({ auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = fixtureData);
            // const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 创建拍卖
            await auctionV1.start(addr1, 1, nft, 1000, 500, token);
        });

        // 1.账户2没有授权 token 给拍卖合约，竞拍失败
        it("Should auctionV1 have approved by bidder", async function () {
            const amount = await token.allowance(addr2, auctionV1);
            expect(amount).to.eq(0);

            const auctionInfo = await auctionV1.auctions(0);
            expect(auctionInfo.nftId).to.eq(1);

            // await 在里面执行错误，在外面才成功。
            // expect(await auctionV1.connect(addr2).bid(0)).to.be.revertedWith("invalid bid, eth:0, usdc:0");
            await expect(auctionV1.connect(addr2).bid(0)).to.be.revertedWith(
                "invalid bid, eth:0, usdc:0",
            );
        });

        // 3.竞标价低于起步价，竞拍失败
        // 4.竞标价低于最高价，竞拍失败
        // usdc，0.99971000$, 1000$ = 1001 * 10^6 = 1000000000
        it("Should bid failed when price lower than starting price", async function () {
            // addr2 mint 1000
            await token.mint(addr2, 1000000000);
            const balance = await token.balanceOf(addr2);
            // console.log("addr2 balance:", balance);
            expect(balance).to.eq(1000000000);

            // addr2 approval 1000 token to auction
            await token.connect(addr2).approve(auctionV1, 1000000000);
            const allowanceAmount = await token.allowance(addr2, auctionV1);
            expect(allowanceAmount).to.eq(1000000000);

            // await 在里面执行错误，在外面才成功。
            // expect(await auctionV1.connect(addr2).bid(0)).to.be.revertedWith("invalid bid, eth:0, usdc:0");
            await expect(auctionV1.connect(addr2).bid(0)).to.be.revertedWith(
                "invalid bid, must greater than start price, current price:99971000000",
            );
        });

        // 5.竞标成功，拍卖信息中最高出价者为自己
        // usdc，0.99971000$, 1000$ = 1001 * 10^6 = 1001000000
        it("Should bid success", async function () {
            // addr2 mint 1000
            await token.mint(addr2, 1000000000);
            const balance = await token.balanceOf(addr2);
            // console.log("addr2 balance:", balance);
            expect(balance).to.eq(2000000000);

            // addr2 approval 1000 token to auction
            await token.connect(addr2).approve(auctionV1, 2000000000);
            const allowanceAmount = await token.allowance(addr2, auctionV1);
            expect(allowanceAmount).to.eq(2000000000);

            // await 在里面执行错误，在外面才成功。
            // expect(await auctionV1.connect(addr2).bid(0)).to.be.revertedWith("invalid bid, eth:0, usdc:0");
            await expect(auctionV1.connect(addr2).bid(0)).to.emit(auctionV1, "Bid").withArgs(addr2.getAddress(), 0, 2);
        });

        // 6.拍卖结束，竞拍失败
        it("Should bid failed when auction is end", async function () {
            // addr2 mint 1000
            await token.mint(addr2, 1000n);
            const balance = await token.balanceOf(addr2);
            // console.log("addr2 balance:", balance);
            expect(balance).to.eq(1000);

            // addr2 approval 1000 token to auction
            await token.connect(addr2).approve(auctionV1, 1000n);
            const allowanceAmount = await token.allowance(addr2, auctionV1);
            expect(allowanceAmount).to.eq(1000);

            // time jump to the end
            await networkHelpers.time.increase(505);

            // await 在里面执行错误，在外面才成功。
            // expect(await auctionV1.connect(addr2).bid(0)).to.be.revertedWith("invalid bid, eth:0, usdc:0");
            await expect(auctionV1.connect(addr2).bid(0)).to.be.revertedWith(
                "ended",
            );
        });
    });

    // 账户3 ETH 竞标
    // 1.竞标ETH为0，竞标失败
    // 2.拍卖未开始，竞拍失败 - 目前管理员创建拍卖后，就是开始的。待优化增加初始开始时间。 TODO
    // 3.竞标价低于起步价，竞拍失败
    // 4.竞标成功，拍卖信息中最高出价者为自己
    // 5.竞标价低于最高价，竞拍失败
    // 6.拍卖结束，竞拍失败
    describe("bidEth", function () {
        let auctionV1:OpzNFTAuction;
        let nft:OpzNFT;
        let token:OpzToken;
        let owner:HardhatEthersSigner;
        let addr1:HardhatEthersSigner;
        let addr2:HardhatEthersSigner;
        let addr3:HardhatEthersSigner;
        let addr4:HardhatEthersSigner;

        // 外层before：加载根Fixture，仅执行1次，赋值给外层变量（核心！替代原before的初始化）
        before(async function () {
            // // 加载根Fixture，获取缓存的基础数据
            const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
            // 解构赋值给外层变量，供所有子层级使用
            ({ auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = fixtureData);
            // const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 创建拍卖
            await auctionV1.start(addr1, 1, nft, 1000, 500, token);
        });

        // 1.竞标ETH为0，竞标失败
        it("Should bid eth>0", async function () {
            const bidAmount = ethers.parseEther("0");
            await expect(auctionV1.connect(addr3).bid(0, {value: bidAmount})).to.be.revertedWith(
                "invalid bid, eth:0, usdc:0",
            );
        });

        // 3.竞标价低于起步价，竞拍失败
        // eth，2289.12$, 1000$ = 0.5 * 10^18 = 500000000000000000
        it("Should bid failed when price lower than starting price", async function () {
            const bidAmount = ethers.parseEther("0.1");
            await expect(auctionV1.connect(addr3).bid(0, {value: bidAmount})).to.be.revertedWith(
                "invalid bid, must greater than start price, current price:22891267066",
            );
        });

        // 4.竞标成功，拍卖信息中最高出价者为自己
        it("Should bid success", async function () {
            const bidAmount = ethers.parseEther("2");
            await expect(auctionV1.connect(addr3).bid(0, {value: bidAmount}))
                .to.emit(auctionV1, "Bid").withArgs(addr3.getAddress(), bidAmount, 1);
        });

        // 5.竞标价低于最高价，竞拍失败
        it("Should bid failed when price lower than starting price", async function () {
            const bidAmount = ethers.parseEther("1");
            await expect(auctionV1.connect(addr4).bid(0, {value: bidAmount})).to.be.revertedWith(
                "invalid bid, must greater than highest price, current price:228912670662",
            );
        });

        // 6.拍卖结束，竞拍失败
        it("Should bid failed when auction is end", async function () {
            // time jump to the end
            await networkHelpers.time.increase(505);

            // await 在里面执行错误，在外面才成功。
            const bidAmount = ethers.parseEther("3");
            await expect(auctionV1.connect(addr3).bid(0, {value: bidAmount})).to.be.revertedWith(
                "ended",
            );
        });
    });

    // 拍卖成功取款
    // 授权无法被锁定，所以只有竞标者提取 NFT 成功，才能允许拍卖者取款。
    // 若是拍卖成功，但是NFT未被授权合约，管理员可以失效本次拍卖。这是个问题 TODO
    // 1.账户3：作为竞拍者，使用 ETH 竞拍成功，中标。提取 NFT 1。
    // 2.账户1：作为拍卖者，提取拍卖金额
    // 3.账户2：作为竞拍者，使用 USDC 竞拍成功，但是流标了。提取竞标的 USDC
    describe("withdrawSuccess", function () {
        let auctionV1:OpzNFTAuction;
        let nft:OpzNFT;
        let token:OpzToken;
        let owner:HardhatEthersSigner;
        let addr1:HardhatEthersSigner;
        let addr2:HardhatEthersSigner;
        let addr3:HardhatEthersSigner;
        let addr4:HardhatEthersSigner;
        // let auction:Auction;

        // 外层before：加载根Fixture，仅执行1次，赋值给外层变量（核心！替代原before的初始化）
        before(async function () {
            // // 加载根Fixture，获取缓存的基础数据
            const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
            // 解构赋值给外层变量，供所有子层级使用
            ({ auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = fixtureData);
            // const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 创建拍卖
            await auctionV1.start(addr1, 1, nft, 1000, 500, token);

            // addr1 授权拍卖合约 NFT 1
            await nft.connect(addr1).approve(auctionV1, 1);

            // addr2 授权合约 USDC, 1900+$
            await token.mint(addr2, 2000000000);
            await token.connect(addr2).approve(auctionV1, 2000000000);
            await auctionV1.connect(addr2).bid(0);

            // addr3 使用 ETH 竞标成功, 2200+$
            const bidAmount = ethers.parseEther("1");
            await auctionV1.connect(addr3).bid(0, {value: bidAmount})

            // 拍卖到期
            await networkHelpers.time.increase(505);

            // 拍卖信息
            // auction = await auctionV1.connect(addr1).auctions(0);
        });

        // 1.账户3：作为竞拍者，使用 ETH 竞拍成功，中标。提取 NFT 1
        it("Should addr3 get NFT 1 success", async function () {
            // 拍卖信息
            const auction = await auctionV1.auctions(0);
            console.log("highestBid:", auction.highestBid)
            // highestBid: 1000000000000000000n

            // NFT1 owner
            const ownerBeforeNFT1 = await nft.ownerOf(1);
            expect(ownerBeforeNFT1).to.eq(addr1);

            // 根据中标者的支付方式判断
            await expect(auctionV1.connect(addr3).withdraw(0)).to.emit(auctionV1, "Withdraw").withArgs(
                addr3, 0, 2
            );

            // NFT1 owner
            const ownerNFT1 = await nft.ownerOf(1);
            expect(ownerNFT1).to.eq(addr3);
        });

        // 2.账户1：作为拍卖者，提取拍卖金额
        it("Should addr1 get bid success, and not owner of NFT 1", async function () {
            const balanceBefore = await ethers.provider.getBalance(addr1);
            const balanceBeforeToken = await token.balanceOf(addr1);

            // 根据中标者的支付方式判断
            const auction = await auctionV1.auctions(0);
            await expect(auctionV1.connect(addr1).withdraw(0)).to.emit(auctionV1, "Withdraw").withArgs(
                addr1, auction.highestBid, 1
            );
            // addr1 账户金额增加
            if (1n == auction.highestBidMethod) {
                // ETH 转账成功
                const balance = await ethers.provider.getBalance(addr1);
                // GAS 费用
                // console.log("balanceBefore:", balanceBefore, ", balance:", balance,
                //     ", gas:", (balance-balanceBefore-auction.highestBid));
                // balanceBefore: 9999999972088562972392n , balance: 10000999912750442402451n , gas: -59338120569941n
                expect(balance).to.lessThan(balanceBefore + auction.highestBid);
            } else if (2n == auction.highestBidMethod) {
                // USDC 转账成功
                const balance = await token.balanceOf(addr1);
                // console.log("balanceBeforeToken:", balanceBeforeToken, ", balance:", balance,
                //     ", gas:", (balance-balanceBeforeToken-auction.highestBid));
                expect(balance).to.eq(balanceBeforeToken + auction.highestBid);
            }
        });

        // 3.账户2：作为竞拍者，使用 USDC 竞拍成功，但是流标了。提取竞标的 USDC
        it("Should addr2 get the amount of failed bidding success", async function () {
            const balanceBeforeToken = await token.balanceOf(addr2);
            const bal = await auctionV1.bids(0, addr2);     // 竞标总额

            // 提取
            const auction = await auctionV1.auctions(0);
            await expect(auctionV1.connect(addr2).withdraw(0)).to.emit(auctionV1, "Withdraw").withArgs(
                addr2, bal, 3
            );

            // USDC 转账成功
            const balance = await token.balanceOf(addr2);
            // console.log("balanceBeforeToken:", balanceBeforeToken, ", balance:", balance,
            //     ", gas:", (balance-balanceBeforeToken-bal));
            expect(balance).to.eq(balanceBeforeToken + bal);
        });

    });

    // TOKEN 竞标成功
    // 1.账户2 TOKEN 竞标成功
    // 2.账户3 ETH 竞标成功
    // 3.账户2 TOKEN 再次竞标成功
    //
    // 4.账户2：作为竞拍者，使用 TOKEN 竞拍成功，中标。提取 NFT 1。
    // 5.账户1：作为拍卖者，提取拍卖金额 TOKEN
    // 6.账户3：作为竞拍者，使用 ETH 竞拍成功，但是流标了。提取竞标的 ETH
    describe("bidSuccessByETHAndWithdraw", function () {
        let auctionV1:OpzNFTAuction;
        let nft:OpzNFT;
        let token:OpzToken;
        let owner:HardhatEthersSigner;
        let addr1:HardhatEthersSigner;
        let addr2:HardhatEthersSigner;
        let addr3:HardhatEthersSigner;
        let addr4:HardhatEthersSigner;

        // 外层before：加载根Fixture，仅执行1次，赋值给外层变量（核心！替代原before的初始化）
        before(async function () {
            // // 加载根Fixture，获取缓存的基础数据
            const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
            // 解构赋值给外层变量，供所有子层级使用
            ({ auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = fixtureData);
            // const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 创建拍卖
            await auctionV1.start(addr1, 1, nft, 1000, 500, token);

            // addr1 授权拍卖合约 NFT 1
            await nft.connect(addr1).approve(auctionV1, 1);

            // addr2 授权合约 USDC, 1900+$
            await token.mint(addr2, 2000000000);
            await token.connect(addr2).approve(auctionV1, 2000000000);
            await auctionV1.connect(addr2).bid(0);

            // addr3 使用 ETH 竞标成功, 2200+$
            const bidAmount = ethers.parseEther("1");
            await auctionV1.connect(addr3).bid(0, {value: bidAmount})

            // addr2 授权合约 USDC, 1900+$ * 2
            await token.mint(addr2, 4000000000);
            await token.connect(addr2).approve(auctionV1, 4000000000);
            await auctionV1.connect(addr2).bid(0);

            // 拍卖到期
            await networkHelpers.time.increase(505);
        });

        // 1.账户2：作为竞拍者，使用 TOKEN 竞拍成功，中标。提取 NFT 1
        it("Should addr2 get NFT 1 success", async function () {
            // 拍卖信息
            const auction = await auctionV1.auctions(0);
            // console.log("highestBid:", auction.highestBid)
            // highestBid: 4000000000n

            // NFT1 owner
            const ownerBeforeNFT1 = await nft.ownerOf(1);
            expect(ownerBeforeNFT1).to.eq(addr1);

            // 根据中标者的支付方式判断
            await expect(auctionV1.connect(addr2).withdraw(0)).to.emit(auctionV1, "Withdraw").withArgs(
                addr2, 0, 2
            );

            // NFT1 owner
            const ownerNFT1 = await nft.ownerOf(1);
            expect(ownerNFT1).to.eq(addr2);
        });

        // 2.账户1：作为拍卖者，提取拍卖金额
        it("Should addr1 get bid success, and not owner of NFT 1", async function () {
            const balanceBefore = await ethers.provider.getBalance(addr1);
            const balanceBeforeToken = await token.balanceOf(addr1);

            // 根据中标者的支付方式判断
            const auction = await auctionV1.auctions(0);
            await expect(auctionV1.connect(addr1).withdraw(0)).to.emit(auctionV1, "Withdraw").withArgs(
                addr1, auction.highestBid, 1
            );
            // addr1 账户金额增加
            if (1n == auction.highestBidMethod) {
                // ETH 转账成功
                const balance = await ethers.provider.getBalance(addr1);
                // GAS 费用
                // console.log("balanceBefore:", balanceBefore, ", balance:", balance,
                //     ", gas:", (balance-balanceBefore-auction.highestBid));
                // balanceBefore: 9999999972088562972392n , balance: 10000999912750442402451n , gas: -59338120569941n
                expect(balance).to.lessThan(balanceBefore + auction.highestBid);
            } else if (2n == auction.highestBidMethod) {
                // USDC 转账成功
                const balance = await token.balanceOf(addr1);
                // console.log("balanceBeforeToken:", balanceBeforeToken, ", balance:", balance,
                //     ", gas:", (balance-balanceBeforeToken-auction.highestBid));
                expect(balance).to.eq(balanceBeforeToken + auction.highestBid);
            }
        });

        // 3.账户3：作为竞拍者，使用 ETH 竞拍成功，但是流标了。提取竞标的 ETH
        it("Should addr3 get the amount of failed bidding success", async function () {
            const balanceBefore = await ethers.provider.getBalance(addr3);
            const bal = await auctionV1.bids(0, addr3);     // 竞标总额

            // 竞标者提取流标的金额
            const auction = await auctionV1.auctions(0);
            await expect(auctionV1.connect(addr3).withdraw(0)).to.emit(auctionV1, "Withdraw").withArgs(
                addr3, bal, 3
            );

            // ETH 转账成功
            const balance = await ethers.provider.getBalance(addr3);
            console.log("balanceBefore:", balanceBefore, ", balance:", balance,
                ", gas:", (balance-balanceBefore-bal));
            // balanceBefore: 9998999846560622468580n , balance: 9999999787498643402812n , gas: -59061979065768n
            // expect(balance).to.lessThan(balanceBefore + bal);
            const deltaWei = ethers.parseEther("7");
            const deltaGWei = ethers.parseUnits("70000", 9);
            // 2026-02-09
            // https://etherscan.io/gastracker
            // Gas: 0.051 Gwei
            expect(balance).to.be.closeTo(balanceBefore + bal, 70001000000000n);
        });

    });

    // 拍卖失败取款，到期没有任何人竞拍，什么都不用做。要做的也只有拍卖者收回 NFT 1 给拍卖合约的授权。
    // 1.账户1收回 NFT 1 给拍卖合约的授权。
    describe("withdrawFail", function () {
        let auctionV1:OpzNFTAuction;
        let nft:OpzNFT;
        let token:OpzToken;
        let owner:HardhatEthersSigner;
        let addr1:HardhatEthersSigner;
        let addr2:HardhatEthersSigner;
        let addr3:HardhatEthersSigner;
        let addr4:HardhatEthersSigner;

        // 外层before：加载根Fixture，仅执行1次，赋值给外层变量（核心！替代原before的初始化）
        before(async function () {
            // // 加载根Fixture，获取缓存的基础数据
            const fixtureData = await networkHelpers.loadFixture(deployCounterFixture);
            // 解构赋值给外层变量，供所有子层级使用
            ({ auctionV1, nft, token, owner, addr1, addr2, addr3, addr4 } = fixtureData);
            // const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 创建拍卖
            await auctionV1.start(addr1, 1, nft, 1000, 500, token);
            // 授权拍卖合约 NFT 1
            await nft.connect(addr1).approve(auctionV1, 1);
        });

        // 1.账户1收回 NFT 1 给拍卖合约的授权。
        it("Should revoke approve success", async function () {
            // 0地址
            // const zeroAddress = "0x0000000000000000000000000000000000000000";
            // // Impersonate the non-owner account
            // await networkHelpers.impersonateAccount(zeroAddress);
            // // Fund the non-owner account with some ETH to pay for gas
            // // await networkHelpers.setBalance(zeroAddress, ethers.parseEther("1.0"));
            // const zeroSigner = await ethers.getSigner(zeroAddress);

            // await 在里面执行错误，在外面才成功。
            // await nft.approve(zeroSigner.getAddress(), 1);
            const zeroAddress = ethers.ZeroAddress; // 零地址（示例）
            await nft.connect(addr1).approve(zeroAddress, 1);
            const nft1Owner = await nft.getApproved(1);
            // console.log("nft1Owner:", nft1Owner);
            expect(nft1Owner).to.be.eq("0x0000000000000000000000000000000000000000");
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
