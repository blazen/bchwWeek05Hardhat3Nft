import { expect } from "chai";
import { network } from "hardhat";
// 必须使用 type
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
// 这个类型没有！且 ethers.getSigners() 返回的是 HardhatEthersSigner 类型。
// import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/src/internal/signers";
import type {MetaNFT, MetaNFTAuctionV1, USDC} from "../types/ethers-contracts/index.js";
// import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers, networkHelpers } = await network.connect();

// // Helper function to get time helpers
// async function getTime() {
//     const connection = await network.connect();
//     return (connection as any).networkHelpers.time;
// }

interface DeployAuctionFixture {
    auctionV1:MetaNFTAuctionV1;
    nft:MetaNFT;
    token:USDC;
    owner:HardhatEthersSigner;
    addr1:HardhatEthersSigner;
    addr2:HardhatEthersSigner;
    addr3:HardhatEthersSigner;
    addr4:HardhatEthersSigner;
}

// 定义 Fixture 函数。fast than beforeEach.
async function deployCounterFixture():Promise<DeployAuctionFixture> {
    // owner    部署合约
    // 账户1      拍卖 TOKEN		    拍卖者
    // 账户2      使用 USDC 竞拍	    流标
    // 账户3      使用 ETH 竞拍		中标
    // 账户4      使用 ETH OR USDC 竞拍，但低于最高出价者
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const zeroAddress = ethers.ZeroAddress; // 零地址（示例）

    const nft = await ethers.deployContract("MetaNFT", ["MNFT", "MNFT"]);
    // 给用户1铸造一个 NFT
    await nft.mint(addr1.address, 1n);

    const token = await ethers.deployContract("USDC", ["USDC", "USDC"]);
    // 给用户2铸造一些 Token，如何切换到用户2呢？铸造函数只能是调用者。 TODO
    // await token.mint(1000n);
    // await token.transfer(addr2.address, 1000n);

    const auctionV1 = await ethers.deployContract("MetaNFTAuctionV1");
    // 切换到账户1，将 NFT 1 授权给拍卖合约地址
    // await nft.connect(addr1).approve(auctionV1.getAddress(), 1n);

    console.log("zeroAddress：", zeroAddress);
    console.log("auctionV1 addr：", await auctionV1.getAddress());
    console.log("nft addr：", await nft.getAddress());
    console.log("token addr：", await token.getAddress());
    // 每个测试地址，默认 10000 ETH
    console.log("addr1 addr：", await addr1.getAddress(), ", balance:", await ethers.provider.getBalance(addr1));
    console.log("addr2 addr：", await addr2.getAddress());
    console.log("addr3 addr：", await addr3.getAddress());
    console.log("addr4 addr：", await addr4.getAddress());

    // 奇怪，每次部署时，合约地址应该是变化的啊，为什么不变呢？ TODO
    // auctionV1 addr： 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
    // nft addr： 0x5FbDB2315678afecb367f032d93F642f64180aa3
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

// 测试套件
describe("MetaNFTAuctionV1", function () {
    // 第二层：子套件（按功能分组）

    // 验证部署后的初始状态
    // 1.三个合约部署使用账号1 - 废弃！不关心这个。
    // 2.账号1 有一个 NFT 1
    // 3.拍卖合约地址拥有账号1 NFT 1 的授权
    // 4.账号2 有 1000 个 USDC
    // 5.拍卖合约初始 auctionId=0
    // 6.拍卖合约 version=MetaNFTAuctionV1
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

        // 6.拍卖合约 version=MetaNFTAuctionV1
        it("Should return MetaNFTAuctionV1 when calling the getVersion() function", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 返回的是 bigint，会自动处理。
            // expect(await auctionV1.getVersionNumber()).to.eq(1n);
            // expect(await auctionV1.getVersionNumber()).to.eq(1);

            // 因为函数不是 view，pure。改变了状态变量，所以返回的是 ContractTransactionResponse 交易对象。而不是简单的值。
            // const version = await auctionV1.getVersion(99n);
            // console.log("返回值：", version); // 若打印出 ContractTransactionResponse，必是合约缺少 view
            // // expect(version.data).to.eq("MetaNFTAuctionV1");
            // expect(await auctionV1.version()).to.eq("MetaNFTAuctionV1:99");

            const version = await auctionV1.getVersion();
            // console.log("返回值：", version);
            expect(version).to.eq("MetaNFTAuctionV1");
        });

    });

    // 创建拍卖
    // 1.非管理员创建失败
    // 2.nft 0地址，创建拍卖失败
    // 3.拍卖时间小于 120秒，创建拍卖失败
    // 4.token 0地址，创建拍卖失败
    // 5.创建拍卖后，拍卖id为1
    describe("Start", function () {
        // it("Should auctionId is 1 when calling the start function", async function () {
        //     const { auctionProxy } = await networkHelpers.loadFixture(deployCounterFixture);
        //     // 无法通过代理合约调用啊！报错！
        //     // 也无法使用 delegatecall 调用啊！没有这个方法啊！
        //     const version = await auctionProxy.getVersion(99);
        //     // 代理模式没有返回值。
        //     await expect(version).to.eq("MetaNFTAuctionV1");
        // });

        // 1.非管理员创建失败
        it("Should allow the owner to start and revert for non-owners", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
            await expect(auctionV1.connect(addr3).start(addr1, 1, nft, 1000, 500, token)).to.be.revertedWith(
                "not admin",
            );
        });

        // 2.nft 0地址，创建拍卖失败
        it("Should revert when nft is zero address", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // 0地址
            const zeroAddress = "0x0000000000000000000000000000000000000000";
            // Impersonate the non-owner account
            await networkHelpers.impersonateAccount(zeroAddress);
            // Fund the non-owner account with some ETH to pay for gas
            // await networkHelpers.setBalance(zeroAddress, ethers.parseEther("1.0"));
            const zeroSigner = await ethers.getSigner(zeroAddress);

            // await expect(auctionV1.start(addr1, 1, await zeroSigner.getAddress(), 1000, 500, token)).to.be.revertedWith(
            //     "invalid nft",
            // );
            await expect(auctionV1.start(addr1, 1, "0x0000000000000000000000000000000000000000", 1000, 500, token)).to.be.revertedWith(
                "invalid nft",
            );
        });

        // 3.拍卖时间小于 120秒，创建拍卖失败
        it("Should revert where duration < 120", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
            await expect(auctionV1.start(addr1, 1, nft, 1000, 110, token)).to.be.revertedWith(
                "duration is greater than 120 second",
            );
        });

        // 4.token 0地址，创建拍卖失败
        it("Should revert when token is zero address", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);
            await expect(auctionV1.start(addr1, 1, nft, 1000, 120, "0x0000000000000000000000000000000000000000")).to.be.revertedWith(
                "invalid payment token",
            );
        });

        // 5.创建拍卖后，发生事件 StartBid，事件参数拍卖id为1
        it("Should auctionV1 is 1 and emit StartBid when start success", async function () {
            const { auctionV1, nft, token, owner, addr1, addr2, addr3 } = await networkHelpers.loadFixture(deployCounterFixture);

            // await auctionV1.start(addr1, 1, nft, 1000, 120, token)
            // const id = await auctionV1.auctionId();
            // console.log("auctionId:", id);
            // expect(id).to.eq(1);

            await expect(auctionV1.start(addr1, 1, nft, 1000, 120, token)).to.emit(auctionV1, "StartBid").withArgs(1n);
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
        let auctionV1:MetaNFTAuctionV1;
        let nft:MetaNFT;
        let token:USDC;
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
            await token.connect(addr2).mint(1000000000);
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
            await token.connect(addr2).mint(1000000000);
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
            await token.connect(addr2).mint(1000n);
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
        let auctionV1:MetaNFTAuctionV1;
        let nft:MetaNFT;
        let token:USDC;
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
            // await 在里面执行错误，在外面才成功。
            const bidAmount = ethers.parseEther("0");
            // await auctionV1.connect(addr3).bid(0, {value: bidAmount});
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
        let auctionV1:MetaNFTAuctionV1;
        let nft:MetaNFT;
        let token:USDC;
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
            await token.connect(addr2).mint(2000000000);
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
            const auction = await auctionV1.connect(addr1).auctions(0);
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
            const auction = await auctionV1.connect(addr2).auctions(0);
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

    // 拍卖失败取款，到期没有任何人竞拍，什么都不用做。要做的也只有拍卖者收回 NFT 1 给拍卖合约的授权。
    // 1.账户1收回 NFT 1 给拍卖合约的授权。
    describe("withdrawFail", function () {
        let auctionV1:MetaNFTAuctionV1;
        let nft:MetaNFT;
        let token:USDC;
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
            await nft.connect(addr1).approve("0x0000000000000000000000000000000000000000", 1);
            const nft1Owner = await nft.getApproved(1);
            // console.log("nft1Owner:", nft1Owner);
            expect(nft1Owner).to.be.eq("0x0000000000000000000000000000000000000000");
        });
    });

});
