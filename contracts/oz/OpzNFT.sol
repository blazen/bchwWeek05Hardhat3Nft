// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFT
 * @dev NFT
 * @notice NFT
 */
contract OpzNFT is ERC721,Ownable {
    constructor() ERC721("OpzNFT", "OPZ") Ownable(msg.sender){
    }

    function mint(address to, uint256 id) external onlyOwner {
        _safeMint(to, id);
    }

    function burn(uint256 id) external onlyOwner {
        require(msg.sender == ownerOf(id), "not owner");
        _burn(id);
    }

}