"use client"; // Directive indicating that this is a client-side module in Next.js

import { Playlist } from "@/components/component/playlist";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdOutlinePause,
  MdOutlinePlayArrow,
  MdOutlineRepeatOne,
  MdOutlineShuffle,
  MdOutlineSkipNext,
  MdOutlineSkipPrevious
} from "react-icons/md";

import { useBlockchain } from "./layout";

import Logo from "/public/logo.png";

// Define TypeScript interfaces for token and item data structures
interface IToken {
  nftPrice: ethers.BigNumber;
  nftTokenId: ethers.BigNumber;
}

export interface IItem {
  artist: string;
  audio: string;
  duration: number;
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
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const [tracks, setTracks] = useState<IItem[]>([]); // State for tracks

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
          artist: metadata.artist,
          audio: metadata.audio,
          duration: metadata.duration,
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

  // Function to load dummy tracks
  const fetchTracks = async () => {
    const tracks = await fetch("/tracks.json").then(response => response.json());
    setTracks(tracks);
    setIsLoading(false);
  };

  // Effect to load marketplace items on component mount
  useEffect(() => {
    // if (marketItems.length === 0) {
    //   fetchMarketItems(); // Fetch market items if the list is empty
    // }
    if (tracks.length === 0) {
      fetchTracks(); // Fetch tracks if the list is empty (dummy tracks)
    }
  });

  // Function to skip to the next or previous song
  const changeSong = useCallback(
    (isNext: boolean) => {
      if (isNext) {
        setCurrentAudioIndex(prevIndex => {
          let newIndex = prevIndex + 1;
          // if (newIndex > marketItems.length - 1) {
          if (newIndex > tracks.length - 1) {
            newIndex = 0; // Wrap around to the first item if at the end of the list
          }
          return newIndex;
        });
      } else {
        setCurrentAudioIndex(prevIndex => {
          let newIndex = prevIndex - 1;
          if (newIndex < 0) {
            // newIndex = marketItems.length - 1; // Wrap around to the last item if at the beginning of the list
            newIndex = tracks.length - 1; // Wrap around to the last item if at the beginning of the list
          }
          return newIndex;
        });
      }
    },
    // [marketItems.length]
    [tracks.length]
  ); // Add an empty array as the second argument

  useEffect(() => {
    const currentAudio = audioElement.current; // Capture audioElement.current in a local variable

    const updateProgress = () => {
      if (currentAudio) {
        const currentTime = audioElement.current.currentTime;
        const duration = audioElement.current.duration;
        setElapsedTime(currentTime);
        setTotalTime(duration);
        const progress = (currentTime / duration) * 100;
        setPlaybackPosition(progress);
      }
    };

    if (currentAudio) {
      currentAudio.addEventListener("timeupdate", updateProgress);
      currentAudio.addEventListener("ended", () => changeSong(true));
    }

    return () => {
      if (currentAudio) {
        currentAudio.removeEventListener("timeupdate", updateProgress);
        currentAudio.removeEventListener("ended", () => changeSong(true));
      }
    };
  }, [audioElement, changeSong]);

  useEffect(() => {
    if (audioElement.current) {
      if (isAudioPlaying) {
        audioElement.current.play();
      } else {
        audioElement.current.pause();
      }
    }
  }, [isAudioPlaying, audioElement, currentAudioIndex]);

  const handleSliderChange = (value: number[]) => {
    if (audioElement.current) {
      const newTime = (value[0] / 100) * audioElement.current.duration;
      audioElement.current.currentTime = newTime;
      setPlaybackPosition(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Render loading message if still loading
  if (isLoading)
    return (
      <main className="p-4">
        <h2>Loading...</h2>
      </main>
    );

  // Display a message if there are no items in the market
  // if (marketItems.length === 0) {
  //   return (
  //     <main className="p-4">
  //       <h2>No listed assets</h2>
  //     </main>
  //   );
  // }
  if (tracks.length === 0) {
    return (
      <main className="p-4">
        <h2>No listed assets</h2>
      </main>
    );
  }

  return (
    <div className="container mx-auto mt-5">
      {/* <audio ref={audioElement} src={marketItems[currentAudioIndex].audio}></audio> */}
      <audio ref={audioElement} src={tracks[currentAudioIndex]?.audio}></audio>
      <main className="grid grid-cols-7" role="main">
        <div className="col-span-2">
          <Playlist
            currentAudioIndex={currentAudioIndex}
            setCurrentAudioIndex={setCurrentAudioIndex}
            // marketItems={marketItems}
            tracks={tracks}
          />
        </div>

        <div className="card col-span-3 space-y-10 p-8 text-primary">
          <div className="flex items-center justify-center">
            <Image
              alt=""
              className="card-img-top"
              height={300}
              // src={marketItems[currentAudioIndex].identicon}
              src={Logo}
              width={300}
            />
          </div>
          <div className="container flex flex-col items-center justify-between">
            <div>
              {/* <div className="text-5xl font-bold">{marketItems[currentAudioIndex].name}</div> */}
              <div className="text-5xl font-bold line-clamp-1">{tracks[currentAudioIndex]?.name}</div>
              <div className="text-2xl text-gray-400 py-4">Artist</div>
            </div>
            <div className="flex flex-col w-full items-center justify-center">
              <Slider
                defaultValue={[0]}
                max={100}
                min={0}
                onValueChange={handleSliderChange}
                step={1}
                value={[playbackPosition]}
              />
              {formatTime(elapsedTime)} / {formatTime(totalTime)}
            </div>
            <div className="flex pt-4">
              <Button variant="ghost">
                <MdOutlineShuffle className="w-6 h-6" />
              </Button>
              <Button onClick={() => changeSong(false)} variant="ghost">
                <MdOutlineSkipPrevious className="w-8 h-8" />
              </Button>
              <Button onClick={() => setIsAudioPlaying(!isAudioPlaying)} variant="ghost">
                {isAudioPlaying ? <MdOutlinePause className="w-8 h-8" /> : <MdOutlinePlayArrow className="w-10 h-10" />}
              </Button>
              <Button onClick={() => changeSong(true)} variant="ghost">
                <MdOutlineSkipNext className="w-8 h-8" />
              </Button>
              <Button variant="ghost">
                <MdOutlineRepeatOne className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-2 p-6 w-full max-w-md space-y-4 bg-background rounded-lg border">
          <div className="text-primary text-base font-bold">Buy This Song</div>
          <div className="text-left">
            {/* <div className="text-lg font-bold">{marketItems[currentAudioIndex].name}</div> */}
            <div className="text-lg font-bold">{tracks[currentAudioIndex]?.name}</div>
            <div className="text-sm text-gray-400">{tracks[currentAudioIndex]?.artist}</div>
          </div>
          <div className="flex justify-center">
            {/* <Button onClick={() => purchaseItem(marketItems[currentAudioIndex])} variant="outline">
              {`Buy for ${ethers.utils.formatEther(marketItems[currentAudioIndex].price)} ETH`}
            </Button> */}
            <Button variant="outline">{`Buy for ${tracks[currentAudioIndex]?.price} ETH`}</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
