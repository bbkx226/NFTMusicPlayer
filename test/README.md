# NFTMusicPlayer Contract Tests

## Purpose

This file contains unit tests for the NFTMusicPlayer smart contract. These tests are crucial for ensuring the contract functions correctly and securely. They help catch bugs, verify expected behavior, and provide confidence in the contract's functionality before deployment to a live blockchain network.

## Test Coverage

The test suite covers the following main areas:

1. **Contract Deployment**

   - Verifies correct setting of contract name, symbol, URI, royalty fee, and artist address
   - Checks proper minting and listing of initial music NFTs
   - Confirms correct ether balance after deployment

2. **Royalty Fee Updates**

   - Ensures only the contract owner can update the royalty fee

3. **Token Purchase**

   - Tests successful token purchases
   - Verifies handling of incorrect ether amounts during purchase attempts

4. **Token Resale**

   - Checks successful token reselling process
   - Verifies handling of invalid resale attempts (zero price or unpaid royalty fee)

5. **Getter Functions**
   - Tests fetching of unsold NFTs
   - Verifies retrieval of user-owned NFTs

## Running the Tests

To run these tests, use the following command in your terminal: `npx hardhat test`

> This command executes the JavaScript test suite using the Mocha testing framework, which is integrated with Hardhat for Ethereum smart contract testing.
