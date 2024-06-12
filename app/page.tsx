"use client"; // Directive indicating that this is a client-side module in Next.js

import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useBlockchain } from "./layout";

// Define TypeScript interfaces for token and item data structures
interface IToken {
  nftPrice: ethers.BigNumber;
  nftTokenId: ethers.BigNumber;
}

interface IItem {
  audio: string;
  identicon: string;
  itemId: ethers.BigNumber;
  name: string;
  price: ethers.BigNumber;
}

// NOTE: In Next.js 14, the page.tsx file in the root folder represents the UI for the root URL (e.g., localhost:3000).
export default function Home() {
  const { blockchainContract } = useBlockchain(); // Destructure blockchainContract from useBlockchain hook

  const audioElement = useRef<HTMLAudioElement>(null); // Create a ref for the audio element
  const [isLoading, setIsLoading] = useState(true); // State for loading status
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // State for audio play status
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0); // State for the current audio index
  const [marketItems, setMarketItems] = useState<IItem[]>([]); // State for marketplace items

  // Function to load marketplace items
  const fetchMarketItems = async () => {
    const tokens: IToken[] = await (blockchainContract && blockchainContract.fetchUnsoldNFTs()); // Fetch unsold tokens from the blockchain
    const fetchedItems: IItem[] = await Promise.all(
      tokens.map(async (token: IToken) => {
        const uri =
          blockchainContract !== null && blockchainContract !== undefined
            ? await blockchainContract.tokenURI(token.nftTokenId) // Fetch token URI
            : null;
        const response = await fetch(uri + ".json"); // Fetch metadata JSON from the URI
        const metadata = await response.json(); // Parse the JSON response
        const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`; // Generate identicon based on metadata
        const item: IItem = {
          audio: metadata.audio,
          identicon,
          itemId: token.nftTokenId,
          name: metadata.name,
          price: token.nftPrice
        };
        return item;
      })
    );
    setMarketItems(fetchedItems);
    setIsLoading(false);
  };

  // Function to buy a marketplace item
  const purchaseItem = async (item: IItem) => {
    if (blockchainContract) {
      await (await blockchainContract.purchaseNFT(item.itemId, { value: item.price })).wait(); // Call purchaseNFT function on the blockchain and wait for the transaction to complete
      fetchMarketItems(); // Refresh market items after purchase
    }
  };

  // Function to skip to the next or previous song
  const changeSong = (isNext: boolean) => {
    if (isNext) {
      setCurrentAudioIndex(prevIndex => {
        let newIndex = prevIndex + 1;
        if (newIndex > marketItems.length - 1) {
          newIndex = 0; // Wrap around to the first item if at the end of the list
        }
        return newIndex;
      });
    } else {
      setCurrentAudioIndex(prevIndex => {
        let newIndex = prevIndex - 1;
        if (newIndex < 0) {
          newIndex = marketItems.length - 1; // Wrap around to the last item if at the beginning of the list
        }
        return newIndex;
      });
    }
  };

  // Effect to handle audio play/pause based on isAudioPlaying state
  useEffect(() => {
    if (audioElement.current) {
      if (isAudioPlaying) {
        audioElement.current.play(); // Play audio if isAudioPlaying is true
      } else if (isAudioPlaying !== null) {
        audioElement.current.pause(); // Pause audio if isAudioPlaying is false
      }
    }
  }, [isAudioPlaying]);

  // Effect to load marketplace items on component mount
  useEffect(() => {
    if (marketItems.length === 0) {
      fetchMarketItems(); // Fetch market items if the list is empty
    }
  });

  // Render loading message if still loading
  if (isLoading)
    return (
      <main className="p-4">
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="container mx-auto mt-5">
      {marketItems.length > 0 ? (
        <div className="row">
          <main className="mx-auto" role="main" style={{ maxWidth: "500px" }}>
            <div className="content mx-auto">
              <audio ref={audioElement} src={marketItems[currentAudioIndex].audio}></audio>
              <div className="card">
                <div className="card-header">
                  {currentAudioIndex + 1} of {marketItems.length}
                </div>
                <Image
                  alt=""
                  className="card-img-top"
                  height={120}
                  src={marketItems[currentAudioIndex].identicon}
                  width={120}
                />
                <div className="card-body text-secondary">
                  <h2 className="card-title">{marketItems[currentAudioIndex].name}</h2>
                  <div className="d-grid px-4">
                    <div aria-label="Basic example" className="btn-group" role="group">
                      <button className="btn btn-secondary" onClick={() => changeSong(false)}>
                        <svg
                          className="bi bi-skip-backward"
                          fill="currentColor"
                          height="32"
                          viewBox="0 0 16 16"
                          width="32"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M.5 3.5A.5.5 0 0 1 1 4v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v2.94l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L8.5 8.752v2.94c0 .653-.713.998-1.233.696L1 8.752V12a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm7 1.133L1.696 8 7.5 11.367V4.633zm7.5 0L9.196 8 15 11.367V4.633z" />
                        </svg>
                      </button>
                      <button className="btn btn-secondary" onClick={() => setIsAudioPlaying(!isAudioPlaying)}>
                        {isAudioPlaying ? (
                          <svg
                            className="bi bi-pause"
                            fill="currentColor"
                            height="32"
                            viewBox="0 0 16 16"
                            width="32"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z" />
                          </svg>
                        ) : (
                          <svg
                            className="bi bi-play"
                            fill="currentColor"
                            height="32"
                            viewBox="0 0 16 16"
                            width="32"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" />
                          </svg>
                        )}
                      </button>
                      <button className="btn btn-secondary" onClick={() => changeSong(true)}>
                        <svg
                          className="bi bi-skip-forward"
                          fill="currentColor"
                          height="32"
                          viewBox="0 0 16 16"
                          width="32"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.752l-6.267 3.636c-.52.302-1.233-.043-1.233-.696v-2.94l-6.267 3.636C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696L7.5 7.248v-2.94c0-.653.713-.998 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5zM1 4.633v6.734L6.804 8 1 4.633zm7.5 0v6.734L14.304 8 8.5 4.633z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="d-grid my-1">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => purchaseItem(marketItems[currentAudioIndex])}
                    >
                      {`Buy for ${ethers.utils.formatEther(marketItems[currentAudioIndex].price)} ETH`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <main className="p-4">
          <h2>No listed assets</h2>
        </main>
      )}
    </div>
  );
}
