// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFT拍卖合约
 * @dev 使用状态机模式的单个NFT拍卖合约
 * @notice 本合约管理单个拍卖的完整生命周期，状态流转如下：准备中(Preparing) -> 拍卖中(Active) -> 成功(Success)/失败(Failed) -> 已关闭(Closed)/已退款(Refunded)
 * @notice 继承 Initializable 实现 initialize。构造函数中调用 _disableInitializers(); 确保逻辑合约只能通过代理调用。
 * @notice 继承 UUPSUpgradeable 实现 _authorizeUpgrade 添加 onlyOwner，仅支持管理员升级。以便在 @openzeppelin/contracts-upgradeable 支持 hardhat3 后部署升级。
 * @notice The @openzeppelin/hardhat-upgrades plugin (v3.9.1) is currently incompatible with Hardhat v3.0.6
 */
contract OpzNFTAuction is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    using Strings for uint256; // 使用Strings库，

    /// @dev 拍卖状态：定义拍卖所有可能的状态
    enum State {
        /// @dev 准备中：拍卖已创建但尚未开始
        Preparing,
       /// @dev 拍卖中：拍卖中
        Active,
        /// @dev 成功：拍卖成功（拍卖者可以提取金额，竞拍者可以提起NFT）
        Success,
        /// @dev 失败：截止时间已到但没有竞拍者
        Failed,
        /// @dev 已关闭：竞拍金额已提取（仅适用于成功的拍卖）
        Closed
    }

    /// @dev 拍卖信息：定义拍卖信息的结构体
    struct Auction {
        /// @dev 拍卖状态：true 结束，false 拍卖中
        bool end;
         /// @dev 中标者是否已提取 NFT
        bool highestWithdrawed;
        /// @dev 拍卖者是否已提款
        bool sellerWithdrawed;
        /// @dev 拍卖者
        address payable seller;
        /// @dev NFT 合约地址
        IERC721 nft;
        /// @dev NFT tokenId
        uint256 nftId;
        /// @dev 拍卖开始时间
        uint256 startingTime;
        /// @dev 竞拍初始价格美元
        uint256 startingPriceInDollar;
        /// @dev 拍卖事件
        uint256 duration;
        /// @dev token 地址，第二种支付方式
        IERC20 paymentToken;
        /// @dev 竞价最高者
        address highestBidder;
        /// @dev 最高竞价
        uint256 highestBid;
        /// @dev 最高竞价美元
        uint256 highestBidInDollar;
        /// @dev 最高竞价方式
        uint256 highestBidMethod;
    }

    /// @dev NFT出价记录
    mapping(uint256 => mapping(address => uint256)) public bids;
    /// @dev 支付方式
    mapping(uint256 => mapping(address => uint256)) public bidMethods; // 0第一次报价 1eth 2token
    /// @dev 拍卖id
    uint256 public auctionId;
    /// @dev 拍卖记录
    mapping(uint256 => Auction) public auctions;

    /// @dev 事件定义
    /// @notice 开始竞拍事件
    event StartBid(uint256 startingBid);
    /// @notice 竞拍事件
    event Bid(address indexed sender, uint256 amount, uint256 bidMethod);
    /// @notice 取款事件
    event Withdraw(address indexed bidder, uint256 amount, uint kind);
    /// @notice 竞拍结束事件
    event EndBid(uint256 indexed auctionId);

    /// TEST
    event BidERC20(uint256 eth, uint256 usdc);

    // 初始化
    constructor() {
        // 确保只能通过代理调用
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init(msg.sender); // Is this a must?
    }

    /**
     * @dev 管理员发起拍卖（管理员从其它方式收到拍品信息）
     * @param seller 卖家地址
     * @param nftId NFT id
     * @param nft NFT合约地址
     * @param startingPriceInDollar 初始价格美元
     * @param duration 拍卖持续时间，单位为天（范围：1-30天）
     * @param paymentToken token 地址，第二种支付方式
     */
    function start(
        address seller,
        uint256 nftId,
        address nft,
        uint256 startingPriceInDollar,
        uint256 duration,
        address paymentToken
    ) external virtual onlyOwner {
        require(nft != address(0), "invalid nft");
        require(duration >= 120, "duration is greater than 120 second");
        require(paymentToken != address(0), "invalid payment token");
        auctions[auctionId] = Auction({
            end: false,
            nft: IERC721(nft),
            nftId: nftId,
            seller: payable(seller),
            startingTime: block.timestamp,
            startingPriceInDollar: startingPriceInDollar * 10**8,
            duration: duration,
            paymentToken: IERC20(paymentToken),
            highestBid: 0,
            highestBidder: address(0),
            highestBidInDollar: 0,
            highestBidMethod: 0,
            highestWithdrawed: false,
            sellerWithdrawed: false
        });
        auctionId++;
        emit StartBid(auctionId);
    }

    /**
     * @dev 买家竞价
     * @param auctionId_ 竞价的拍品
     */
    function bid(uint256 auctionId_) external payable virtual {
        Auction storage auction = auctions[auctionId_];
        // 竞拍者授权合约的 token 额度
        uint256 allowance = auction.paymentToken.allowance(msg.sender, address(this));
        require(msg.value > 0 || allowance > 0, string.concat("invalid bid, eth:", msg.value.toString(), ", usdc:", allowance.toString()));
        emit BidERC20(msg.value, allowance);

        // 竞拍者只能选择一种支付方式：ETH 或者 token
        require((msg.value > 0) != (allowance > 0), "only one of ETH or token");
        require(auction.startingTime > 0, "not started");
        require(!auction.end, "ended");
        require(block.timestamp < auction.startingTime + auction.duration, "ended");
        // 未中标的竞拍者总出价，不包含自己 为最高出价时的金额。拍卖结束后，提取此金额。
        if (auction.highestBidder != address(0)) {
            bids[auctionId_][auction.highestBidder] += auction.highestBid;
        }
        uint256 bidMethod;
        uint256 bidPrice;       // USD价格
        // 判断支付方式
        if (msg.value > 0) {
            // ETH 支付方式
            // 首次竞拍时，初始化支付方式
            bidMethod = bidMethods[auctionId_][msg.sender];
            if (bidMethod == 0) {
                // 第一次报价 设置为eth
                bidMethod = 1;
                bidMethods[auctionId_][msg.sender] = bidMethod;
            } else {
                require(bidMethod == 1, "invalid method");
            }
            // 计算兑换当前美元价格，1ETH = ？$
            uint256 price = getPriceInDollar(bidMethod);
            bidPrice = _toUsd(msg.value, 18, price);
            auction.highestBid = msg.value;
        } else {
            // token 支付方式
            // 首次竞拍时，初始化支付方式
            require(allowance > 0, "invalid payment");
            bidMethod = bidMethods[auctionId_][msg.sender];
            if (bidMethod == 0) {
                bidMethod = 2;
                bidMethods[auctionId_][msg.sender] = bidMethod;
            } else {
                require(bidMethod == 2, "invalid method");
            }
            // 计算兑换当前美元价格，1ETH = ？$
            uint256 price = getPriceInDollar(bidMethod);
            uint8 tokenDecimals = IERC20Metadata(address(auction.paymentToken)).decimals();
            bidPrice = _toUsd(allowance, tokenDecimals, price);
            auction.highestBid = allowance;
            IERC20(address(auction.paymentToken)).transferFrom(msg.sender, address(this), allowance);
        }
        // require(auction.startingPriceInDollar < bidPrice, "invalid bid price");
        // require(auction.highestBidInDollar < bidPrice, "invalid bid price");
        require(auction.startingPriceInDollar < bidPrice, string.concat("invalid bid, must greater than start price, current price:", bidPrice.toString()));
        require(auction.highestBidInDollar < bidPrice, string.concat("invalid bid, must greater than highest price, current price:", bidPrice.toString()));
        auction.highestBidder = msg.sender;
        auction.highestBidInDollar = bidPrice;
        auction.highestBidMethod = bidMethod;
        emit Bid(msg.sender, msg.value, bidMethod);
    }

    /**
     * 三种角色取款，1.SELLER 提取中标的金额；2.BIDDER_WIN 竞标成功，且中标的，只能提取 NFT 拍品；3.BIDDER 竞标成功，且未中标的
     * @dev 卖家取款
     * @param auctionId_ 竞价的拍品
     */
    function withdraw(uint256 auctionId_) external virtual returns (uint256) {
        uint256 bal;
        uint kind;
        Auction storage auction = auctions[auctionId_];
        // 结束才能提款
        uint256 endTime = auction.startingTime + auction.duration;
        require(block.timestamp >= endTime, string.concat("not ended left:", endTime.toString()));
        if(msg.sender == auction.seller) {
            // SELLER 提取中标的金额
            require(!auction.sellerWithdrawed, "seller withdrawed");
            kind = 1;
            auction.sellerWithdrawed = true;
            bal = auction.highestBid;
            if(1 == auction.highestBidMethod){
                payable(msg.sender).transfer(bal);
            } else {
                IERC20(address(auction.paymentToken)).transfer(msg.sender, bal);
            }

        } else if(msg.sender == auction.highestBidder) {
            // BIDDER_WIN 竞标成功，且中标的，只能提取 NFT 拍品
            require(!auction.highestWithdrawed, "nft withdrawed");
            kind = 2;
            auction.highestWithdrawed = true;
            IERC721(address(auction.nft)).safeTransferFrom(auction.seller, msg.sender, auction.nftId);

        } else if(0 <= bids[auctionId_][msg.sender]) {
            // BIDDER 竞标成功，且未中标的
            require(0 < bids[auctionId_][msg.sender], "bidder withdrawed");
            kind = 3;
            // 竞标过才能提款
            bal = bids[auctionId_][msg.sender];
            bids[auctionId_][msg.sender] = 0;
            uint256 bidMethod = bidMethods[auctionId_][msg.sender];
            if (bidMethod == 1) {
                payable(msg.sender).transfer(bal);
            } else {
                IERC20(address(auction.paymentToken)).transfer(msg.sender, bal);
            }
        } else {
            // 抛出自定义 ERROR：未参加此次竞拍
            // TODO
        }
        emit Withdraw(msg.sender, bal, kind);
        return bal;
    }

    /**
     * @dev 结束拍卖
     */
    function endBidding(uint256 auctionId_) external virtual onlyOwner {
        Auction storage auction = auctions[auctionId_];
        require(!auction.end, "ended");
        auction.end = true;
        emit EndBid(auctionId_);
    }

    /**
     * @dev 使用 Chainlink 的 feedData 预言机，获取 ERC20 和以太坊到美元的价格。
     */
    // function getPriceInDollar(uint256 bidMethod) public view returns (uint256) {
    //     AggregatorV3Interface dataFeed;
    //     if (bidMethod == 1) {
    //         // eth
    //         dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    //     } else {
    //         // usdc
    //         dataFeed = AggregatorV3Interface(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
    //     }
    //     (
    //     /* uint80 roundId */
    //         ,
    //         int256 answer,
    //     /*uint256 startedAt*/
    //         ,
    //     /*uint256 updatedAt*/
    //         ,
    //     /*uint80 answeredInRound*/
    //     ) = dataFeed.latestRoundData();
    //     return uint256(answer);
    // }

    /**
     * @dev 使用 Chainlink 的 feedData 预言机，获取 ERC20 和以太坊到美元的价格。
     */
    function getPriceInDollar(uint256 bidMethod) public pure virtual returns (uint256) {
        if (bidMethod == 1) {
            // eth, 2289.12$, 1000$ = 0.5
            return uint256(228912670662);
        } else {
            // usdc，0.99$, 1000$ = 1001
            return uint256(99971000);
        }
    }

    /**
     * @dev 8位小数的usd
     * 2000000000,18,99971000
     */
    function _toUsd(uint256 amount, uint256 amountDecimals, uint256 price) internal pure virtual returns (uint256) {
        // amount is in smallest units; convert to USD using price decimals.
        uint256 scale = 10 ** amountDecimals;
        uint256 usd = (amount * price) / scale;
        return usd;
    }

    function getVersion() external pure virtual returns(string memory) {
        return "1.0.0";
    }

    // Authorizes an upgrade (only owner can call)
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

}
