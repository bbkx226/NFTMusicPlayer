const { expect } = require("chai");

// Helper functions to convert between Ether and Wei
const toWei = amount => ethers.utils.parseEther(amount.toString());
const fromWei = amount => ethers.utils.formatEther(amount);

describe("NFTMusicPlayer", function () {
  let nftMarketplace;
  let contractDeployer, musicArtist, buyer1, buyer2, otherUsers;
  let royaltyFeePercentage = toWei(0.01); // 1 ether = 10^18 wei
  let baseURI = "https://bcd-music-nfts.s3.ap-southeast-1.amazonaws.com/musics/";
  let musicPrices = [toWei(1), toWei(2), toWei(3), toWei(4), toWei(5), toWei(6), toWei(7), toWei(8)];
  let contractDeploymentFees = toWei(musicPrices.length * 0.01);

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const nftMarketplaceFactory = await ethers.getContractFactory("NFTMusicPlayer");
    [contractDeployer, musicArtist, buyer1, buyer2, ...otherUsers] = await ethers.getSigners();

    // Deploy music NFT marketplace contract
    nftMarketplace = await nftMarketplaceFactory.deploy(royaltyFeePercentage, musicArtist.address, musicPrices, {
      value: contractDeploymentFees
    });
  });

  describe("Contract Deployment", function () {
    it("Should correctly set contract name, symbol, URI, royalty fee and artist", async function () {
      const contractName = "DAppFi";
      const contractSymbol = "DAPP";
      expect(await nftMarketplace.name()).to.equal(contractName);
      expect(await nftMarketplace.symbol()).to.equal(contractSymbol);
      expect(await nftMarketplace.nftBaseURI()).to.equal(baseURI);
      expect(await nftMarketplace.royaltyFeePercentage()).to.equal(royaltyFeePercentage);
      expect(await nftMarketplace.artistAddress()).to.equal(musicArtist.address);
    });

    it("Should mint and list all the music NFTs", async function () {
      expect(await nftMarketplace.balanceOf(nftMarketplace.address)).to.equal(8);
      // Get each item from the marketItems array then check fields to ensure they are correct
      await Promise.all(
        musicPrices.map(async (price, index) => {
          const item = await nftMarketplace.marketItemList(index);
          expect(item.nftTokenId).to.equal(index);
          expect(item.nftSeller).to.equal(contractDeployer.address);
          expect(item.nftPrice).to.equal(price);
        })
      );
    });

    it("Ether balance should equal deployment fees", async function () {
      expect(await ethers.provider.getBalance(nftMarketplace.address)).to.equal(contractDeploymentFees);
    });
  });

  describe("Updating royalty fee", function () {
    it("Only contract deployer should be able to update royalty fee", async function () {
      const newFee = toWei(0.02);
      await nftMarketplace.setRoyaltyFeePercentage(newFee);
      await expect(nftMarketplace.connect(buyer1).setRoyaltyFeePercentage(newFee)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await nftMarketplace.royaltyFeePercentage()).to.equal(newFee);
    });
  });

  describe("Token Purchase Tests", function () {
    // Test case for successful token purchase
    it("Should handle successful token purchase", async function () {
      const initialBalanceDeployer = await contractDeployer.getBalance();
      const initialBalanceArtist = await musicArtist.getBalance();
      // buyer1 purchases the token
      await expect(nftMarketplace.connect(buyer1).purchaseNFT(0, { value: musicPrices[0] }))
        .to.emit(nftMarketplace, "MarketItemPurchased")
        .withArgs(0, contractDeployer.address, buyer1.address, musicPrices[0]);
      const finalBalanceDeployer = await contractDeployer.getBalance();
      const finalBalanceArtist = await musicArtist.getBalance();
      // The seller of the token should now be the zero address
      expect((await nftMarketplace.marketItemList(0)).nftSeller).to.equal("0x0000000000000000000000000000000000000000");
      // The deployer should have received the payment for the token
      expect(+fromWei(finalBalanceDeployer)).to.equal(+fromWei(musicPrices[0]) + +fromWei(initialBalanceDeployer));
      // The artist should have received the royalty
      expect(+fromWei(finalBalanceArtist)).to.equal(+fromWei(royaltyFeePercentage) + +fromWei(initialBalanceArtist));
      // buyer1 should now own the token
      expect(await nftMarketplace.ownerOf(0)).to.equal(buyer1.address);
    });

    // Test case for unsuccessful token purchase due to incorrect ether amount
    it("Should handle unsuccessful token purchase due to incorrect ether amount", async function () {
      // The purchase should fail if the ether sent does not match the asking price
      await expect(nftMarketplace.connect(buyer1).purchaseNFT(0, { value: musicPrices[1] })).to.be.revertedWith(
        "Please send the exact NFT price to complete the purchase"
      );
    });
  });

  describe("Token Resale Tests", function () {
    beforeEach(async function () {
      // buyer1 purchases a token
      await nftMarketplace.connect(buyer1).purchaseNFT(0, { value: musicPrices[0] });
    });

    // Test case for successful token resale
    it("Should handle successful token resale", async function () {
      const resalePrice = toWei(2);
      const initialMarketBalance = await ethers.provider.getBalance(nftMarketplace.address);
      // buyer1 lists the token for resale
      await expect(nftMarketplace.connect(buyer1).resellNFT(0, resalePrice, { value: royaltyFeePercentage }))
        .to.emit(nftMarketplace, "MarketItemRelisted")
        .withArgs(0, buyer1.address, resalePrice);
      const finalMarketBalance = await ethers.provider.getBalance(nftMarketplace.address);
      // The marketplace balance should have increased by the royalty fee
      expect(+fromWei(finalMarketBalance)).to.equal(+fromWei(royaltyFeePercentage) + +fromWei(initialMarketBalance));
      // The marketplace should now own the token
      expect(await nftMarketplace.ownerOf(0)).to.equal(nftMarketplace.address);
      // The token should be correctly listed for resale
      const item = await nftMarketplace.marketItemList(0);
      expect(item.nftTokenId).to.equal(0);
      expect(item.nftSeller).to.equal(buyer1.address);
      expect(item.nftPrice).to.equal(resalePrice);
    });

    // Test case for unsuccessful token resale due to zero price or unpaid royalty fee
    it("Should handle unsuccessful token resale due to zero price or unpaid royalty fee", async function () {
      await expect(nftMarketplace.connect(buyer1).resellNFT(0, 0, { value: royaltyFeePercentage })).to.be.revertedWith(
        "NFT price must be greater than zero"
      );
      await expect(nftMarketplace.connect(buyer1).resellNFT(0, toWei(1), { value: 0 })).to.be.revertedWith(
        "Must pay the royalty fee"
      );
    });
  });

  describe("Getter Function Tests", function () {
    let purchasedTokens = [0, 1, 4];
    let ownedByUser1 = [0, 1];
    let ownedByUser2 = [4];
    beforeEach(async function () {
      // buyer1 purchases tokens 0 and 1
      await (await nftMarketplace.connect(buyer1).purchaseNFT(0, { value: musicPrices[0] })).wait();
      await (await nftMarketplace.connect(buyer1).purchaseNFT(1, { value: musicPrices[1] })).wait();
      // buyer2 purchases token 4
      await (await nftMarketplace.connect(buyer2).purchaseNFT(4, { value: musicPrices[4] })).wait();
    });

    // Test case for fetching unsold tokens
    it("fetchUnsoldNFTs should fetch all the marketplace tokens that are still for sale", async function () {
      const unsoldTokens = await nftMarketplace.fetchUnsoldNFTs();
      // The returned unsold tokens should not include the purchased tokens
      expect(unsoldTokens.every(i => !purchasedTokens.some(j => j === i.nftTokenId.toNumber()))).to.equal(true);
      // The number of unsold tokens should be correct
      expect(unsoldTokens.length === musicPrices.length - purchasedTokens.length).to.equal(true);
    });

    // Test case for fetching user-owned tokens
    it("fetchUserNFTs should fetch all tokens owned by a user", async function () {
      // Fetch tokens owned by buyer1
      let myTokens = await nftMarketplace.connect(buyer1).fetchUserNFTs();
      // The returned tokens should match the tokens owned by buyer1
      expect(myTokens.every(i => ownedByUser1.some(j => j === i.nftTokenId.toNumber()))).to.equal(true);
      expect(ownedByUser1.length === myTokens.length).to.equal(true);
      // Fetch tokens owned by buyer2
      myTokens = await nftMarketplace.connect(buyer2).fetchUserNFTs();
      // The returned tokens should match the tokens owned by buyer2
      expect(myTokens.every(i => ownedByUser2.some(j => j === i.nftTokenId.toNumber()))).to.equal(true);
      expect(ownedByUser2.length === myTokens.length).to.equal(true);
    });
  });
});
