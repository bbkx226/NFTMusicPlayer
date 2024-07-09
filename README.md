# MusicBox Project

This is a Next.js blockchain project for MusicBox. Follow the steps below to run this project.

## Team Members

- Brandon Ban Kai Xian TP067094
- Ang Xu Tian TP066856
- They Kai Zhe TP062802
- Wong Qian Jie TP063258

## Table of Contents

- [Collaborating on GitHub](#collaborating-on-github)
- [Run the Project](#run-the-project)
- [Setting Up MetaMask for Hardhat](#setting-up-metamask-for-hardhat)
- [Testing](#testing)
- [Handling Errors](#handling-errors)
- [Formatting and Linting](#formatting-and-linting)

## Collaborating on GitHub

To collaborate on this project, you need to set up your local repository and connect it to the remote repository on GitHub. Follow these steps:

1. Initialize a new Git repository:

```bash
git init
```

2. Create a new branch for your work (replace `bbkx` with your preferred branch name):

```bash
git branch -M bbkx
```

3. Add the remote repository (replace the URL with the actual URL of the repository):

```bash
git remote add origin https://github.com/bbkx226/NFTMusicPlayer.git
```

4. Pull the latest changes from the main branch of the remote repository:

```bash
git pull origin main
```

5. Add your changes to the staging area:

```bash
git add .
```

6. Commit your changes (replace "Initial Commit" with your actual commit message):

```bash
git commit -m "Initial Commit"
```

7. Push your changes to your branch on the remote repository:

```bash
git push origin bbkx
```

Remember to replace `bbkx` with your actual branch name. Now, you're ready to collaborate on this project!

## Run the Project

> **NOTE:** Ensure you are connected to a stable WiFi network to prevent most of the bugs that can occur with MetaMask during the project setup and execution.

> **NOTE:** After launching the program for the first time, you may need to refresh the page to ensure everything loads correctly.

1. Install the necessary dependencies:

```bash
npm i
```

2. Navigate to the root directory of the project.

3. In a new terminal, start a local Ethereum network by running:

```bash
npx hardhat node
```

4. Deploy your contracts to the local Ethereum network by running:

```bash
npm run deploy
```

5. Start the development server by running:

```bash
npm run dev
```

## Setting Up MetaMask for Hardhat

MetaMask is a browser extension that allows you to interact with the Ethereum blockchain, including your local Hardhat network. Follow these steps to set it up:

1. Install MetaMask for your browser.

2. Make sure you've run the `npx hardhat node` command in your terminal to start your local Hardhat network.

3. Open MetaMask and click on the network selection dropdown (it will likely say "Ethereum Mainnet" by default).

4. Click on "Custom RPC" to add a new network.

5. Enter the following details:

   - Network Name: `Hardhat`
   - New RPC URL: `http://localhost:8545`
   - ChainID: `31337`
   - Symbol (optional): `ETH`

6. Click "Save". You should now be connected to your local Hardhat network.

Next, you'll need to import accounts from your Hardhat network into MetaMask. When you start your Hardhat node, it outputs a list of accounts and their private keys. You can import these into MetaMask to interact with your contracts.

1. In MetaMask, click on the circle icon in the top-right corner.

2. Click on "Import Account".

3. Paste the private key of the account you want to import into the "Private Key" field.

4. Click "Import".

Repeat the process for the three accounts you need (Account #0 and any two accounts from #1 to #19). Remember, never use these accounts on the mainnet, they are for development purposes only.

Now, you're ready to interact with your local Ethereum network using MetaMask!

## Testing

Test if everything works by running:

```bash
npx hardhat test
```

## Handling Errors

If you encounter errors like "nonce too high. Expected nonce to be 0 but got 5. Note that transactions can't be queued when automining.", follow these steps:

- Go to Metamask
- Click on the three dots at the top right corner
- Go to Settings > Advanced
- Clear the activity tab data

## Formatting and Linting

To format and lint your code, run:

```bash
npx eslint-interactive .
```

This will start an interactive session where you can choose which files to fix.
