// Use the client-side rendering mode
"use client";

import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import React, { createContext, useContext, useEffect, useState } from "react";

import NFTMusicPlayerAbi from "../abi/NFTMusicPlayer.json";
import NFTMusicPlayerAddress from "../abi/NFTMusicPlayer-address.json";
import logo from "../public/logo.png";
import "./globals.css";

// Extend the Window interface to include the ethereum object
declare global {
  interface Window {
    ethereum: import("ethers").providers.ExternalProvider;
  }
}

// Define the shape of the context
interface ContextProps {
  account: null | string; // Ethereum account address
  contract: ethers.Contract; // Ethereum contract instance
  handleWeb3Connection: () => Promise<void>; // Function to handle connection to the Ethereum network
  loading: boolean; // Loading state
}

// Create the context with a default value
const BlockchainContext = createContext<Partial<ContextProps>>({});

// Create a custom hook to use the context
export const useBlockchain = () => useContext(BlockchainContext);

// Create a dummy contract as a placeholder before the real contract is loaded
const dummyContract = new ethers.Contract(
  "0x0000000000000000000000000000000000000000", // This is the address of the Ethereum contract. In this case, it's a placeholder address (0x0) because the actual contract hasn't been loaded yet.
  new ethers.utils.Interface([]), // This creates a new Ethereum contract interface. It's currently empty because the actual contract hasn't been loaded yet.
  ethers.getDefaultProvider() // This gets the default Ethereum provider. It's used to interact with the Ethereum network.
);

// Define the root layout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Define state variables
  const [loading, setLoading] = useState(true); // Loading state
  const [account, setAccount] = useState<null | string>(null); // Ethereum account address
  const [contract, setContract] = useState(dummyContract); // Ethereum contract instance

  // Define a function to handle connection to the Ethereum network
  const handleWeb3Connection = async () => {
    if (window.ethereum.request) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }); // Request access to the user's Ethereum accounts
      setAccount(accounts[0]); // Set the first account as the current account
      const provider = new ethers.providers.Web3Provider(window.ethereum); // Create a new Ethereum provider
      const signer = provider.getSigner(); // Get the signer from the provider
      loadBlockchainContract(signer); // Load the contract
    }
  };

  // Define a function to load the contract
  const loadBlockchainContract = async (signer: ethers.providers.JsonRpcSigner) => {
    const contract = new ethers.Contract(NFTMusicPlayerAddress.address, NFTMusicPlayerAbi.abi, signer); // Create a new contract instance
    setContract(contract); // Set the contract
    setLoading(false); // Set the loading state to false
  };

  // Use the useEffect hook to handle connection to the Ethereum network when the component mounts
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      handleWeb3Connection();
    }
  });

  // Render the component
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <div className="text-center">
          <nav className="bg-secondary text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <Link className="flex items-center" href="/">
                <Image alt="Logo" height={40} src={logo} width={40} />
                <span className="ml-2">Music NFT player</span>
              </Link>
              <div className="flex items-center">
                <Link href="/">Home</Link>
                <Link href="/tokens">My Tokens</Link>
                <Link href="/resales">My Resales</Link>
                {account ? (
                  <a
                    className="mx-4"
                    href={`https://etherscan.io/address/${account}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {account.slice(0, 5) + "..." + account.slice(38, 42)}
                  </a>
                ) : (
                  <button className="bg-white text-black px-4 py-2 rounded" onClick={handleWeb3Connection}>
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </nav>
          <div>
            <BlockchainContext.Provider value={{ account, contract, handleWeb3Connection, loading }}>
              {loading ? (
                <div className="flex justify-center items-center h-screen">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                  <p className="mx-3 my-0">Awaiting Metamask Connection...</p>
                </div>
              ) : (
                children
              )}
            </BlockchainContext.Provider>
          </div>
        </div>
      </body>
    </html>
  );
}
