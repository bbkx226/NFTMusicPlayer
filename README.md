# MusicBox Project

This is a Next.js blockchain project for MusicBox. Follow the steps below to run this project.

## Let's get started

1. Navigate to the root directory of the project.

2. Start the development server by running:

```bash
npm run dev
```

3. In a new terminal, start a local Ethereum network by running:

```bash
npx hardhat node
```

4. Deploy your contracts to the local Ethereum network by running:

```bash
npm run deploy
```

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
