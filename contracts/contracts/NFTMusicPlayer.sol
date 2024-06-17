// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMusicPlayer is ERC721("DAppFi", "DAPP"), Ownable {
    string public nftBaseURI = "https://bcd-music-nfts.s3.ap-southeast-1.amazonaws.com/musics/";
    string public nftExtension = ".json";
    address public artistAddress;
    uint256 public royaltyFeePercentage;

    struct MarketItem {
        uint256 nftTokenId;
        address payable nftSeller;
        uint256 nftPrice;
    }
    MarketItem[] public marketItemList;

    event MarketItemPurchased(
        uint256 indexed nftTokenId,
        address indexed nftSeller,
        address nftBuyer,
        uint256 nftPrice
    );
    event MarketItemRelisted(
        uint256 indexed nftTokenId,
        address indexed nftSeller,
        uint256 nftPrice
    );

    /* In constructor we initalize royalty fee, artist address and prices of music nfts*/
    constructor(
        uint256 _royaltyFeePercentage,
        address _artistAddress,
        uint256[] memory _nftPrices
    ) payable {
        require(
            _nftPrices.length * _royaltyFeePercentage <= msg.value,
            "Contract deployer must pay royalty fee for each token listed on the marketplace"
        );
        royaltyFeePercentage = _royaltyFeePercentage;
        artistAddress = _artistAddress;
        for (uint8 i = 0; i < _nftPrices.length; i++) {
            require(_nftPrices[i] > 0, "NFT price must be greater than 0");
            _mint(address(this), i);
            marketItemList.push(MarketItem(i, payable(msg.sender), _nftPrices[i]));
        }
    }

    /* Updates the royalty fee of the contract */
    function setRoyaltyFeePercentage(uint256 _royaltyFeePercentage) external onlyOwner {
        royaltyFeePercentage = _royaltyFeePercentage;
    }

    /* Creates the sale of a music nft listed on the marketplace */
    /* Transfers ownership of the nft, as well as funds between parties */
    function purchaseNFT(uint256 _nftTokenId) external payable {
        uint256 nftPrice = marketItemList[_nftTokenId].nftPrice;
        address nftSeller = marketItemList[_nftTokenId].nftSeller;
        require(
            msg.value == nftPrice,
            "Please send the exact NFT price to complete the purchase"
        );
        marketItemList[_nftTokenId].nftSeller = payable(address(0));
        _transfer(address(this), msg.sender, _nftTokenId);
        payable(artistAddress).transfer(royaltyFeePercentage);
        payable(nftSeller).transfer(msg.value);
        emit MarketItemPurchased(_nftTokenId, nftSeller, msg.sender, nftPrice);
    }

    /* Allows someone to resell their music nft */
    function resellNFT(uint256 _nftTokenId, uint256 _nftPrice) external payable {
        require(msg.value == royaltyFeePercentage, "Must pay the royalty fee");
        require(_nftPrice > 0, "NFT price must be greater than zero");
        marketItemList[_nftTokenId].nftPrice = _nftPrice;
        marketItemList[_nftTokenId].nftSeller = payable(msg.sender);

        _transfer(msg.sender, address(this), _nftTokenId);
        emit MarketItemRelisted(_nftTokenId, msg.sender, _nftPrice);
    }

    /* Fetches all the tokens currently listed for sale */
    function fetchUnsoldNFTs() external view returns (MarketItem[] memory) {
        uint256 unsoldNFTCount = balanceOf(address(this));
        MarketItem[] memory unsoldNFTs = new MarketItem[](unsoldNFTCount);
        uint256 currentIndex;
        for (uint256 i = 0; i < marketItemList.length; i++) {
            if (marketItemList[i].nftSeller != address(0)) {
                unsoldNFTs[currentIndex] = marketItemList[i];
                currentIndex++;
            }
        }
        return (unsoldNFTs);
    }

    /* Fetches all the tokens owned by the user */
    function fetchUserNFTs() external view returns (MarketItem[] memory) {
        uint256 userNFTCount = balanceOf(msg.sender);
        MarketItem[] memory userNFTs = new MarketItem[](userNFTCount);
        uint256 currentIndex;
        for (uint256 i = 0; i < marketItemList.length; i++) {
            if (ownerOf(i) == msg.sender) {
                userNFTs[currentIndex] = marketItemList[i];
                currentIndex++;
            }
        }
        return (userNFTs);
    }

    /* Internal function that gets the baseURI initialized in the constructor */
    function _baseURI() internal view virtual override returns (string memory) {
        return nftBaseURI;
    }

    function getBaseURI() public view returns (string memory) {
        return _baseURI();
    }
}