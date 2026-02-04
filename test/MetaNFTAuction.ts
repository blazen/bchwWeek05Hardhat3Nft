import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

//定义 Fixture 函数
async function deployCounterFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const auction = await ethers.deployContract("MetaNFTAuction");
    return { auction, owner, addr1, addr2 };
}

describe("MetaNFTAuction", function () {
    it("Should return MetaNFTAuctionV1 when calling the getVersion() function", async function () {
        const { auction } = await networkHelpers.loadFixture(deployCounterFixture);
        const version = await auction.getVersion();
        await expect(version).to.eq("MetaNFTAuctionV1");
    });

    // it("Should emit the StartBid event when calling the start() function", async function () {
    //     // address seller,
    //     // uint256 nftId,
    //     // address nft,
    //     // uint256 startingPriceInDollar,
    //     // uint256 duration,
    //     // address paymentToken
    //     const { auction, owner, addr1, addr2 } = await networkHelpers.loadFixture(deployCounterFixture);
    //     await expect(auction.start(addr1, 1n, address(0), 100n, 3, address(0))).to.emit(auction, "StartBid").withArgs(1n);
    // });

});
