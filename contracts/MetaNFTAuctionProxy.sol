// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./v1/ERC721.sol";
//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
//import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./v1/String.sol";

/**
 * @title NFT拍卖合约
 * @dev 使用状态机模式的单个NFT拍卖合约
 * @notice 本合约管理单个拍卖的完整生命周期，状态流转如下：准备中(Preparing) -> 拍卖中(Active) -> 成功(Success)/失败(Failed) -> 已关闭(Closed)/已退款(Refunded)
 */
//contract MetaNFTAuction is Initializable {
contract MetaNFTAuctionProxy {
//    using Strings for uint256; // 使用Strings库，

    /// @dev 逻辑合约地址
    address public implementation;
    string public version;

    /// @dev 拍卖合约管理员
    address admin;

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

    /// UUPS PROXY
    event CallSuccess(bytes data);
    event CallFail(bytes data);
    event receivedCalled(address indexed Sender, uint Value);
    event fallbackCalled(address indexed Sender, uint Value, bytes Data);

    /// @dev 构造函数，初始化admin和逻辑合约地址
    constructor(address _implementation){
        admin = msg.sender;
        implementation = _implementation;
    }

    receive() external payable {
        emit receivedCalled(msg.sender, msg.value);
    }

    /// @dev fallback函数，将调用委托给逻辑合约
    fallback() external payable {
        emit fallbackCalled(msg.sender, msg.value, msg.data);
//        _delegate1();
        _delegate2();
    }

    function _delegate1() internal {
        (bool success, bytes memory data) = implementation.delegatecall(msg.data);
        if(success){
            emit CallSuccess(data);
        } else {
            emit CallFail(data);
        }
    }

    /**
     * @dev 将调用委托给逻辑合约运行
     */
    function _delegate2() internal {
        // 内联汇编（inline assembly）
        // calldatacopy(t, f, s)：将calldata（输入数据）从位置f开始复制s字节到mem（内存）的位置t。
        // delegatecall(g, a, in, insize, out, outsize)：调用地址a的合约，输入为mem[in..(in+insize)) ，输出为mem[out..(out+outsize))， 提供gwei的以太坊gas。这个操作码在错误时返回0，在成功时返回1。
        // returndatacopy(t, f, s)：将returndata（输出数据）从位置f开始复制s字节到mem（内存）的位置t。
        // switch：基础版if/else，不同的情况case返回不同值。可以有一个默认的default情况。
        // return(p, s)：终止函数执行, 返回数据mem[p..(p+s))。
        // revert(p, s)：终止函数执行, 回滚状态，返回数据mem[p..(p+s))。
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // 读取位置为0的storage，也就是implementation地址。
            let _implementation := sload(0)

            calldatacopy(0, 0, calldatasize())

            // 利用delegatecall调用implementation合约
            // delegatecall操作码的参数分别为：gas, 目标合约地址，input mem起始位置，input mem长度，output area mem起始位置，output area mem长度
            // output area起始位置和长度位置，所以设为0
            // delegatecall成功返回1，失败返回0
            let result := delegatecall(gas(), _implementation, 0, calldatasize(), 0, 0)

            // 将起始位置为0，长度为returndatasize()的returndata复制到mem位置0
            returndatacopy(0, 0, returndatasize())

            switch result
            // 如果delegate call失败，revert
            case 0 {
                revert(0, returndatasize())
            }
            // 如果delegate call成功，返回mem起始位置为0，长度为returndatasize()的数据（格式为bytes）
            default {
                return(0, returndatasize())
            }
        }
    }

    function inc(uint256 a, uint256 b) external pure returns(uint){
        return a+b;
    }

}
