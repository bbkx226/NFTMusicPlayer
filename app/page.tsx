"use client"; // Directive indicating that this is a client-side module in Next.js

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GrChapterNext, GrChapterPrevious, GrPause, GrPlay } from "react-icons/gr";

import PlaybackBar from "../components/PlaybackBar";
import { useBlockchain } from "./layout";

// Define TypeScript interfaces for token and item data structures
interface IToken {
  nftPrice: ethers.BigNumber;
  nftTokenId: ethers.BigNumber;
}

export interface IItem {
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
    <div className="container mx-auto mt-10">
      {marketItems.length > 0 ? (
        <main className="flex justify-between gap-4" role="main">
          <div className="sidebar glass p-8 space-y-4">
            <div className="text-primary text-base font-bold">
              Up Next ({currentAudioIndex + 1} of {marketItems.length})
            </div>
            {marketItems.map((item, idx) => (
              <div className="text-left" key={idx}>
                <hr className="my-2" />
                {item.name}
              </div>
            ))}
          </div>
          <audio ref={audioElement} src={marketItems[currentAudioIndex].audio}></audio>
          <div className="card space-y-10 glass p-8 min-w-5xl max-w-5xl">
            <div className="card-body text-primary flex">
              <Image
                alt=""
                className="card-img-top"
                height={480}
                src={marketItems[currentAudioIndex].identicon}
                width={480}
              />
              <div className="container flex flex-col items-center justify-between">
                <div className="text-7xl font-bold">{marketItems[currentAudioIndex].name}</div>
                {/* TODO: change the slider here */}
                <Slider className="w-full top-0 left-0" defaultValue={[0]} max={100} min={0} step={1} />
                <div className="flex px-4 scale-150">
                  <Button onClick={() => changeSong(false)} variant="ghost">
                    <GrChapterPrevious />
                  </Button>
                  <Button onClick={() => setIsAudioPlaying(!isAudioPlaying)} variant="ghost">
                    {isAudioPlaying ? <GrPause /> : <GrPlay />}
                  </Button>
                  <Button onClick={() => changeSong(true)} variant="ghost">
                    <GrChapterNext />
                  </Button>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <div className="d-grid my-1">
                <Button onClick={() => purchaseItem(marketItems[currentAudioIndex])} variant="outline">
                  {`Buy for ${ethers.utils.formatEther(marketItems[currentAudioIndex].price)} ETH`}
                </Button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="p-4">
          <h2>No listed assets</h2>
        </main>
      )}
      <PlaybackBar
        audioElement={audioElement}
        changeSong={changeSong}
        currentAudioIndex={currentAudioIndex}
        isAudioPlaying={isAudioPlaying}
        marketItems={marketItems}
        setCurrentAudioIndex={setCurrentAudioIndex}
        setIsAudioPlaying={setIsAudioPlaying}
      />
    </div>
  );
}
