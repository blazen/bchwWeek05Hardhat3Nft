// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OpzNFTAuctionV2.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title NFT拍卖合约
 * @dev 使用状态机模式的单个NFT拍卖合约
 * @notice 本合约管理单个拍卖的完整生命周期，状态流转如下：准备中(Preparing) -> 拍卖中(Active) -> 成功(Success)/失败(Failed) -> 已关闭(Closed)/已退款(Refunded)
 * @notice 继承 Initializable 实现 initialize。构造函数中调用 _disableInitializers(); 确保逻辑合约只能通过代理调用。
 * @notice 继承 UUPSUpgradeable 实现 _authorizeUpgrade 添加 onlyOwner，仅支持管理员升级。以便在 @openzeppelin/contracts-upgradeable 支持 hardhat3 后部署升级。
 * @notice The @openzeppelin/hardhat-upgrades plugin (v3.9.1) is currently incompatible with Hardhat v3.0.6
 * @notice V1：重写版本函数，测试合约升级
 * @notice V2：重写汇率方法，改为 chainlink 实时查询 ETH\USDC 的汇率。
 * @notice V3：1.增加动态配置 chailink 汇率；2.创建拍卖时，验证 NFT 是否已经授权，并转移到拍卖合约中；3.在拍卖后，计算手续费。从拍卖者收益中减去。
 *             本次大概，是否可以使用新合约了，而没必要升级了呢？
 */
contract OpzNFTAuctionV3 is OpzNFTAuctionV2, ReentrancyGuardUpgradeable
{
    using Strings for uint256; // 使用Strings库，

    /// @dev key 代币合约地址,value FEED地址
    mapping(address => address) private chainlinkFeedMap;
    address private feeAddr;
    uint256 private feePercentage;

    // 自定义error
    error NotJoinAuction();

//    function initializeV3() external onlyOwner {
    function initializeV3() external virtual {
        // ETH/USD
        chainlinkFeedMap[address(0)] = address(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        // USDC/USD
        chainlinkFeedMap[address(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)] = address(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
        // 后续手动追加
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
    ) external override virtual onlyOwner {
        require(nft != address(0), "invalid nft");
        require(duration >= 120, "duration is greater than 120 second");
        require(paymentToken != address(0), "invalid payment token");

        // NFT 验证授权
        IERC721 _nft = IERC721(nft);
        require(_nft.ownerOf(nftId) == seller, "Not nft owner");
        require(_nft.isApprovedForAll(seller, address(this)) || _nft.getApproved(nftId) == address(this),
            "Not nft owner");

        // 代币是否配置了 feed
        require(chainlinkFeedMap[paymentToken] != address(0), "Token chainlink feed not config");

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
        // NFT 转账给拍卖合约
        _nft.transferFrom(seller, address(this), nftId);
        emit StartBid(auctionId);
    }

    /**
     * 三种角色取款，1.SELLER 提取中标的金额；2.BIDDER_WIN 竞标成功，且中标的，只能提取 NFT 拍品；3.BIDDER 竞标成功，且未中标的
     * @dev 卖家取款
     * @param auctionId_ 竞价的拍品
     */
    function withdraw(uint256 auctionId_) external override virtual nonReentrant returns (uint256) {
        uint256 bal;
        uint kind;
        Auction storage auction = auctions[auctionId_];
        // 结束才能提款
        uint256 endTime = auction.startingTime + auction.duration;
        require(block.timestamp >= endTime, string.concat("not ended left:", endTime.toString()));
        if(msg.sender == auction.seller) {
            // SELLER 提款
            require(!auction.sellerWithdrawed, "seller withdrawed");
            kind = 1;
            auction.sellerWithdrawed = true;
            bal = auction.highestBid;
            if(0 == bal){
                // 流标：合约转装 nft
                IERC721(address(auction.nft)).transferFrom(address(this), msg.sender, auction.nftId);
            } else {
                // 中标计算手续费
                uint256 fee = computeFee(bal);
                uint256 amount = bal - fee;

                // 中标：提取拍卖金额
                if(1 == auction.highestBidMethod){
                    payable(msg.sender).transfer(amount);
                    payable(feeAddr).transfer(fee);
                } else {
                    IERC20(address(auction.paymentToken)).transfer(msg.sender, amount);
                    IERC20(address(auction.paymentToken)).transfer(feeAddr, fee);
                }
            }

        } else if(msg.sender == auction.highestBidder) {
            // BIDDER_WIN 竞标成功，且中标的，只能提取 NFT 拍品
            require(!auction.highestWithdrawed, "nft withdrawed");
            kind = 2;
            auction.highestWithdrawed = true;
            // 拍卖合约转账 NFT
            IERC721(address(auction.nft)).safeTransferFrom(address(this), msg.sender, auction.nftId);

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
            // 发生事件：未参加此次拍卖
            revert NotJoinAuction();
        }
        emit Withdraw(msg.sender, bal, kind);
        return bal;
    }

    function getVersion() external pure override virtual returns(string memory) {
        return "1.0.3";
    }

    function setChainlinkFeedMap(address c, address feed) external virtual onlyOwner {
        require(c != address(0) || feed != address(0), "invalid address");
        chainlinkFeedMap[c] = feed;
    }

    function getChainlinkFeedMap(address c) external view virtual returns(address) {
        require(c != address(0), "invalid address");
        return chainlinkFeedMap[c];
    }

    function setFeeAddr(address _feeAddr) external virtual onlyOwner {
        require(_feeAddr != address(0), "invalid address");
        feeAddr = _feeAddr;
    }

    function getFeeAddr() external view virtual onlyOwner returns(address) {
        return feeAddr;
    }

    function setFeePercentage(uint256 _feePercentage) external virtual onlyOwner {
        require(_feePercentage >= 1 && _feePercentage <= 1000, "Fee percentage must be between 0.01% and 10%");
        feePercentage = _feePercentage;
    }

    function getFeePercentage() external view virtual onlyOwner returns(uint256) {
        return feePercentage;
    }

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
//            uint256 price = getPriceInDollarV2(bidMethod);
            uint256 price = getChainlinkDataFeedLatestAnswer(chainlinkFeedMap[address(0)]);
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
//            uint256 price = getPriceInDollarV2(bidMethod);
            uint256 price = getChainlinkDataFeedLatestAnswer(chainlinkFeedMap[address(auction.paymentToken)]);
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

    function getChainlinkDataFeedLatestAnswer(address feedAddress) public view override virtual returns (uint256) {
//        AggregatorV3Interface dataFeed = AggregatorV3Interface(feedAddress);
        if (feedAddress == address(0)) {
            // eth, 2289.12$, 1000$ = 0.5
            return uint256(2289126706621);
        } else {
            // usdc，0.99$, 1000$ = 1001
            return uint256(99971000);
        }
    }

    /**
     * compute auction fee
     */
    function computeFee(uint256 highestBid) internal view returns(uint256) {
        // 溢出，交易直接回滚，不会返回错误结果
        return (highestBid * feePercentage) / 10000;
    }

}
