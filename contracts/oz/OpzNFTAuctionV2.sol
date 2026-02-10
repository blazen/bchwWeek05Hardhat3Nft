// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OpzNFTAuctionV1.sol";

/**
 * @title NFT拍卖合约
 * @dev 使用状态机模式的单个NFT拍卖合约
 * @notice 本合约管理单个拍卖的完整生命周期，状态流转如下：准备中(Preparing) -> 拍卖中(Active) -> 成功(Success)/失败(Failed) -> 已关闭(Closed)/已退款(Refunded)
 * @notice 继承 Initializable 实现 initialize。构造函数中调用 _disableInitializers(); 确保逻辑合约只能通过代理调用。
 * @notice 继承 UUPSUpgradeable 实现 _authorizeUpgrade 添加 onlyOwner，仅支持管理员升级。以便在 @openzeppelin/contracts-upgradeable 支持 hardhat3 后部署升级。
 * @notice The @openzeppelin/hardhat-upgrades plugin (v3.9.1) is currently incompatible with Hardhat v3.0.6
 * @notice V1：重写版本函数，测试合约升级
 * @notice V2：重写汇率方法，改为 chainlink 实时查询 ETH\USDC 的汇率。
 */
contract OpzNFTAuctionV2 is OpzNFTAuctionV1
{
    using Strings for uint256; // 使用Strings库，

    /**
     * @dev 买家竞价
     * @param auctionId_ 竞价的拍品
     */
    function bid(uint256 auctionId_) external payable override virtual {
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
            uint256 price = getPriceInDollarV2(bidMethod);
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
            uint256 price = getPriceInDollarV2(bidMethod);
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
     * @dev 使用 Chainlink 的 feedData 预言机，获取 ERC20 和以太坊到美元的价格。
     * @notice feed 查询地址：https://docs.chain.link/data-feeds/price-feeds/addresses?networkType=testnet&testnetSearch=USDC&testnetPage=1
     * @notice 创建拍卖合约时，参数增加代币符号 tokenSymbol，再到 chainlink 查询 feed address，并记录到 mapping 中。需要chainlink提供合约查询函数。
     */
//    function getPriceInDollar(uint256 bidMethod) public pure override virtual returns (uint256) {
//        if (bidMethod == 1) {
//            // eth, 2289.12$, 1000$ = 0.5
//            return uint256(2289126706621);
//        } else {
//            // usdc，0.99$, 1000$ = 1001
//            return uint256(99971000);
//        }
//    }
//    function getPriceInDollar(uint256 bidMethod) public pure override virtual returns (uint256) {
//        return getPriceInDollarV2(bidMethod);
//    }
    function getPriceInDollarV2(uint256 bidMethod) public view virtual returns (uint256) {
         AggregatorV3Interface dataFeed;
         if (bidMethod == 1) {
             // eth
             dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
         } else {
             // USDC 代币地址：0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
             // USDC feed 地址：0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
             dataFeed = AggregatorV3Interface(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
         }
         (
         /* uint80 roundId */
             ,
             int256 answer,
         /*uint256 startedAt*/
             ,
         /*uint256 updatedAt*/
             ,
         /*uint80 answeredInRound*/
         ) = dataFeed.latestRoundData();
         return uint256(answer);
    }

    /**
     * Returns the latest answer.
     * Network: Sepolia
     * @return The answer on the BTC / USD feed uses 8 decimal places, so an answer of 3030914000000 indicates a BTC / USD price of 30309.14.
     */
    function getChainlinkDataFeedLatestAnswer(address feedAddress) public view virtual returns (uint256) {
        AggregatorV3Interface dataFeed = AggregatorV3Interface(feedAddress);
        // prettier-ignore
        (
        /* uint80 roundId */
            ,
            int256 answer,
        /*uint256 startedAt*/
            ,
        /*uint256 updatedAt*/
            ,
        /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return uint256(answer);
    }

    function getVersion() external pure override virtual returns(string memory) {
        return "1.0.2";
    }
}
