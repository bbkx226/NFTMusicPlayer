const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Convert a number to Wei
const toWei = num => ethers.utils.parseEther(num.toString());

AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID_ENV,
  secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY_ENV,
  region: "ap-southeast-1"
});

const s3 = new AWS.S3();

async function fetchPricesFromJsonFiles() {
  let prices = []; // Initialize prices array
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_ENV;

  try {
    const params = {
      Bucket: bucketName,
      Prefix: "database/"
    };

    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents.map(item => item.Key).filter(key => key.endsWith(".json"));
    console.log(`Found ${files.length} JSON files.`);

    for (const fileKey of files) {
      const fileParams = {
        Bucket: bucketName,
        Key: fileKey
      };
      const fileData = await s3.getObject(fileParams).promise();
      const fileContent = JSON.parse(fileData.Body.toString("utf-8"));
      if (fileContent.price) {
        prices.push(toWei(fileContent.price)); // Push the price into the prices array
      }
    }
  } catch (error) {
    console.error("Error fetching and processing JSON files from S3:", error);
  }

  return prices; // Return the array of prices
}

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

  const prices = await fetchPricesFromJsonFiles();

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
