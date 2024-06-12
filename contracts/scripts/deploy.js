const fs = require("fs");
const path = require("path");

// Convert a number to Wei
const toWei = num => ethers.utils.parseEther(num.toString());

// Save contract details to a file
function saveContractToFile(contract, name) {
  const contractsDir = path.resolve(__dirname, "../../abi");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, `${name}-address.json`),
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(path.join(contractsDir, `${name}.json`), JSON.stringify(contractArtifact, null, 2));
}

async function main() {
  let royaltyFee = toWei(0.01);
  let prices = Array.from({ length: 8 }, (_, i) => toWei(i + 1));
  let deploymentFees = toWei(prices.length * 0.01);
  const [deployer, artist] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contracts here:
  const NFTMusicPlayerFactory = await ethers.getContractFactory("NFTMusicPlayer");
  const NFTMusicPlayer = await NFTMusicPlayerFactory.deploy(royaltyFee, artist.address, prices, {
    value: deploymentFees
  });

  console.log("Smart contract address:", NFTMusicPlayer.address);

  // Save the contract details to a file
  saveContractToFile(NFTMusicPlayer, "NFTMusicPlayer");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
