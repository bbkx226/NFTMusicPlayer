"use client"; // Directive indicating that this is a client-side module in Next.js

import AWS from "aws-sdk";
import { ethers } from "ethers";
import Cookies from "js-cookie";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import NFTMusicPlayerAbi from "../abi/NFTMusicPlayer.json";
import NFTMusicPlayerAddress from "../abi/NFTMusicPlayer-address.json";
import Header from "../components/Header";
import "./globals.css";
// Extend the Window interface to include the ethereum object
declare global {
  interface Window {
    ethereum: import("ethers").providers.ExternalProvider;
  }
}

// Define the shape of the context
interface ContextProps {
  blockchainContract: ethers.Contract; // Ethereum contract instance
  handleWeb3Connection: () => Promise<void>; // Function to handle connection to the Ethereum network
  isLoading: boolean; // Loading state
  s3: AWS.S3;
  userAccount: null | string; // Ethereum account address
}

interface ExtendedExternalProvider extends ethers.providers.ExternalProvider {
  on?: (eventName: string, listener: (...args: unknown[]) => void) => void;
}

// NOTE:
// The createContext function creates a context object in React. This context object has two properties: "Provider" and "Consumer".
// The "Provider" component is used to wrap a part of your component tree, making the context value available to all components within that subtree.
/// The "Consumer" component allows components to consume the context value.
const BlockchainContext = createContext<Partial<ContextProps>>({}); // Create the context with a default value

// NOTE:
// useContext is a React Hook that allows you to read and subscribe to context from your component.
// You call useContext(SomeContext) to get the context value.
// React automatically re-renders components that use context when it changes.
export const useBlockchain = () => useContext(BlockchainContext); // Create a custom hook to use the context

// Create a dummy contract as a placeholder before the real contract is loaded
const dummyContract = new ethers.Contract(
  "0x0000000000000000000000000000000000000000", // This is the address of the Ethereum contract. In this case, it's a placeholder address (0x0) because the actual contract hasn't been loaded yet.
  new ethers.utils.Interface([]), // This creates a new Ethereum contract interface. It's currently empty because the actual contract hasn't been loaded yet.
  ethers.getDefaultProvider() // This gets the default Ethereum provider. It's used to interact with the Ethereum network.
);

AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID_ENV,
  region: "ap-southeast-1",
  secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY_ENV
});

const s3 = new AWS.S3();

// NOTE: In Next.js 14, a root layout is a UI component shared between multiple pages in an application. It allows you to define a common structure and appearance for a group of pages, reducing redundancy and promoting code reusability. The root layout is mandatory for every Next.js app and is often referred to as the “RootLayout.”
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Define state variables
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
  const [userAccount, setUserAccount] = useState<null | string>(null); // Ethereum account address
  const [blockchainContract, setBlockchainContract] = useState<ethers.Contract>(dummyContract); // Ethereum contract instance

  // Define a function to handle connection to the Ethereum network
  const handleWeb3Connection = async () => {
    if (window.ethereum.request) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }); // Request access to the user's Ethereum accounts
      setUserAccount(accounts[0]); // Set the first account as the current account
      // Set userAccount in cookies
      Cookies.set("userAccount", accounts[0], { expires: 7 }); // Expires in 7 days
      const provider = new ethers.providers.Web3Provider(window.ethereum); // Create a new Ethereum provider
      const signer = provider.getSigner(); // Get the signer from the provider
      loadBlockchainContract(signer); // Load the contract
    }
  };

  // Define a function to load the contract
  const loadBlockchainContract = async (signer: ethers.providers.JsonRpcSigner) => {
    const contract = new ethers.Contract(NFTMusicPlayerAddress.address, NFTMusicPlayerAbi.abi, signer); // Create a new contract instance
    setBlockchainContract(contract); // Set the contract
    setIsLoading(false); // Set the loading state to false
  };

  // Use the useEffect hook to handle connection to the Ethereum network when the component mounts
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      handleWeb3Connection();
    }
  });

  useEffect(() => {
    const ethereum = window.ethereum as ExtendedExternalProvider;
    if (ethereum && ethereum.on) {
      ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Render the component
  return (
    <html lang="en">
      <head>
        <link href="/favicon.ico" rel="icon" sizes="any" />
      </head>
      <body className="dark" suppressHydrationWarning={true}>
        <div className="text-center">
          <div>
            {/* NOTE: 
              The Provider component is used to provide the context value to its child components.
              It accepts a value prop that specifies the data you want to share.
              The value provided by the Provider is accessible to all components that consume the context. 
              */}
            <BlockchainContext.Provider
              value={{ blockchainContract, handleWeb3Connection, isLoading, s3, userAccount }}
            >
              <Toaster gutter={10} position="bottom-right" />
              <Header handleWeb3Connection={handleWeb3Connection} userAccount={userAccount} />
              {isLoading ? (
                <main className="flex flex-col justify-center items-center py-40">
                  <div className="cube">
                    <div className="face front"></div>
                    <div className="face back"></div>
                    <div className="face left"></div>
                    <div className="face right"></div>
                    <div className="face top"></div>
                    <div className="face bottom"></div>
                  </div>
                  <h2 className="text-3xl font-bold moving-text mt-20">
                    Awaiting Metamask Connection...
                    <br />
                    Please refresh the page after 3 seconds if the connection does not establish.
                  </h2>
                </main>
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
