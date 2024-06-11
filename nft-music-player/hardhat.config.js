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
    artifacts: "./src/contracts/artifacts",
    sources: "./src/contracts/contracts",
    cache: "./src/contracts/cache",
    tests: "./src/test"
  }
};
