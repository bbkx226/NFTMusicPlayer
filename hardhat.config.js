require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4"
      }
    ]
  },
  paths: {
    artifacts: "./contracts/artifacts",
    sources: "./contracts/contracts",
    cache: "./contracts/cache",
    tests: "./test"
  }
};
