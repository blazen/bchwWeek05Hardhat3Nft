// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Address} from "../.deps/npm/@openzeppelin/contracts/utils/Address.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED
 * VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

/**
 * If you are reading data feeds on L2 networks, you must
 * check the latest answer from the L2 Sequencer Uptime
 * Feed to ensure that the data is accurate in the event
 * of an L2 sequencer outage. See the
 * https://docs.chain.link/data-feeds/l2-sequencer-feeds
 * page for details.
 */
contract DataConsumerV3 {

    mapping(address => address) public _feedMap;

    constructor() {
        // USDC/USD
        _feedMap[address(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)] = address(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
        // ETH/USD
        _feedMap[address(0)] = address(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

    /**
    * Returns the latest answer.
    * Network: Sepolia
    * @return The answer on the BTC / USD feed uses 8 decimal places, so an answer of 3030914000000 indicates a BTC / USD price of 30309.14.
    */
    function getChainlinkDataFeedLatestAnswer1(uint256 feedType) public view returns (uint256) {
        AggregatorV3Interface dataFeed;
        if (feedType == 1) {
            // USDC/USD, 6 decimal, 1USDC = 99971000 = 0.99971
            dataFeed = AggregatorV3Interface(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E);
        } else  if (feedType == 2) {
            // BTC/USD, 8 decimal, 1BTC = 7660250200000 = 76602.5$
            dataFeed = AggregatorV3Interface(0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43);
        } else {
            // ETH/USD 1ETH = 228912670662
            dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        }

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

    /**
    * Returns the latest answer.
    * Network: Sepolia
    * @return The answer on the BTC / USD feed uses 8 decimal places, so an answer of 3030914000000 indicates a BTC / USD price of 30309.14.
    */
    function getChainlinkDataFeedLatestAnswer2(address faddr) public view returns (uint256) {
        AggregatorV3Interface dataFeed = AggregatorV3Interface(faddr);
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

    function getChainlinkDataFeedLatestAnswer3(address caddr) public view returns (uint256) {
        address faddr = _feedMap[caddr];
        require(faddr != address(0), "invalid erc20 token address");
        AggregatorV3Interface dataFeed = AggregatorV3Interface(faddr);
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

   /**
     * @dev 8位小数的usd
     */
    function _toUsd(uint256 amount, uint256 amountDecimals, uint256 price) internal pure returns (uint256) {
        // amount is in smallest units; convert to USD using price decimals.
        uint256 scale = 10 ** amountDecimals;
        uint256 usd = (amount * price) / scale;
        return usd;
    }

    /**
     * @dev 1ETH 单位美元价格
     */
    function ethPrice() external view returns (uint256) {
        // amount is in smallest units; convert to USD using price decimals.
        uint256 price = getChainlinkDataFeedLatestAnswer1(999);
        return _toUsd(1000000000000000000, 18, price);
    } 

    /**
     * @dev 1USDC 单位美元价格
     */
    function usdcPrice() external view returns (uint256) {
        // amount is in smallest units; convert to USD using price decimals.
        uint256 price = getChainlinkDataFeedLatestAnswer1(1);
        uint8 tokenDecimals = IERC20Metadata(address(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)).decimals();
        return _toUsd(1000000, tokenDecimals, price);
    } 

}
