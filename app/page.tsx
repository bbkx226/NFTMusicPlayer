"use client"; // Directive indicating that this is a client-side module in Next.js

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdOutlinePause,
  MdOutlinePlayArrow,
  MdOutlineRepeat,
  MdOutlineRepeatOne,
  MdOutlineShuffle,
  MdOutlineSkipNext,
  MdOutlineSkipPrevious
} from "react-icons/md";

import { PlaybackSlider } from "../components/PlaybackSlider";
import { PlaylistBar } from "../components/PlaylistBar";
import { useBlockchain } from "./layout";

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

export enum repeatModes {
  NONE,
  ONE,
  PLAYLIST
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
  const [playlist, setPlaylist] = useState<IItem[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<repeatModes>(repeatModes.NONE); // State for repeat mode

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
        let audioDuration = 0;
        if (metadata.audio) {
          try {
            audioDuration = await new Promise((resolve, reject) => {
              const audio = new Audio(metadata.audio);
              audio.addEventListener("loadedmetadata", () => {
                resolve(audio.duration);
              });
              audio.addEventListener("error", () => {
                reject(new Error("Failed to load audio"));
              });
            });
          } catch (error) {
            console.error("Error fetching audio duration:", error);
            audioDuration = 0; // Fallback duration in case of error
          }
        }

        const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`; // Generate identicon based on metadata
        const item: IItem = {
          artist: metadata.artist ?? "Uknown Artist",
          audio: metadata.audio,
          duration: audioDuration ?? 0,
          identicon: identicon,
          itemId: token.nftTokenId,
          name: metadata.name,
          price: token.nftPrice
        };
        return item;
      })
    );
    setMarketItems(fetchedItems);
    setPlaylist(fetchedItems);
    setIsLoading(false);
  };

  // Function to buy a marketplace item
  const purchaseItem = async (item: IItem) => {
    if (blockchainContract) {
      await (await blockchainContract.purchaseNFT(item.itemId, { value: item.price })).wait(); // Call purchaseNFT function on the blockchain and wait for the transaction to complete
      fetchMarketItems(); // Refresh market items after purchase
    }
  };

  // Effect to load marketplace items on component mount
  useEffect(() => {
    // Function to load dummy tracks
    // const fetchTracks = async () => {
    //   const tracks = await fetch("/tracks.json").then(response => response.json());
    //   setMarketItems(tracks);
    //   setPlaylist(tracks);
    //   setIsLoading(false);
    // };
    if (marketItems.length === 0) {
      fetchMarketItems(); // Fetch market items if the list is empty
      // fetchTracks(); // Fetch tracks if the list is empty (dummy tracks)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to skip to the next or previous song
  const handleChangeSong = useCallback(
    (isNext: boolean) => {
      setCurrentAudioIndex(prevIndex => {
        let newIndex = isNext ? prevIndex + 1 : prevIndex - 1;
        if (newIndex < 0) newIndex = playlist.length - 1;
        else if (newIndex >= playlist.length) newIndex = 0;
        return newIndex;
      });
      setPlaybackPosition(0);
    },
    [playlist.length]
  ); // Add an empty array as the second argument

  // Function to shuffle the playlist
  const handleShuffle = () => {
    const newShuffleState = !isShuffle;
    setIsShuffle(newShuffleState);

    if (newShuffleState) {
      const shuffledPlaylist = [...marketItems].sort(() => Math.random() - 0.5);
      setPlaylist(shuffledPlaylist);
    } else {
      setPlaylist([...marketItems]);
    }

    setCurrentAudioIndex(0);
  };

  // Function to change the repeat mode
  const handleRepeatModeChange = () => {
    setRepeatMode(prevMode => {
      switch (prevMode) {
        case repeatModes.NONE:
          return repeatModes.PLAYLIST;
        case repeatModes.PLAYLIST:
          return repeatModes.ONE;
        case repeatModes.ONE:
        default:
          return repeatModes.NONE;
      }
    });
  };

  useEffect(() => {
    const currentAudio = audioElement.current; // Capture audioElement.current in a local variable

    // Function to handle song end event
    const handleEnd = () => {
      if (repeatMode === repeatModes.ONE && currentAudio) {
        currentAudio.currentTime = 0;
        currentAudio.play();
        return;
      }
      if (
        repeatMode === repeatModes.PLAYLIST ||
        (repeatMode === repeatModes.NONE && currentAudioIndex !== playlist.length - 1)
      )
        handleChangeSong(true);
    };

    // Function to update playback position
    const updateProgress = () => {
      if (currentAudio) {
        const currentTime = audioElement.current.currentTime;
        const duration = audioElement.current.duration;
        setElapsedTime(currentTime);
        setTotalTime(duration);
        setPlaybackPosition((currentTime / duration) * 100);
      }
    };

    if (currentAudio) {
      currentAudio.addEventListener("timeupdate", updateProgress);
      currentAudio.addEventListener("ended", handleEnd);
    }

    return () => {
      if (currentAudio) {
        currentAudio.removeEventListener("timeupdate", updateProgress);
        currentAudio.removeEventListener("ended", handleEnd);
      }
    };
  }, [repeatMode, currentAudioIndex, playlist.length, handleChangeSong]);

  // Function to handle audio playback
  useEffect(() => {
    if (audioElement.current) {
      if (isAudioPlaying) {
        audioElement.current.play();
      } else {
        audioElement.current.pause();
      }
    }
  }, [isAudioPlaying, currentAudioIndex]);

  // Function to handle slider changes and update playback position
  const handleSliderChange = (value: number[]) => {
    if (audioElement.current) {
      const newTime = (value[0] / 100) * audioElement.current.duration;
      audioElement.current.currentTime = newTime;
      setPlaybackPosition(value[0]);
    }
  };

  // Function to format song elapsed time and total duration from seconds to mm:ss format
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
  if (marketItems.length === 0) {
    return (
      <main className="p-4">
        <h2>No listed assets</h2>
      </main>
    );
  }

  return (
    <div className="container mx-auto mt-5">
      <audio ref={audioElement} src={playlist[currentAudioIndex]?.audio}></audio>
      <main className="grid grid-cols-7" role="main">
        <div className="col-span-2">
          <PlaylistBar
            currentAudioIndex={currentAudioIndex}
            handleRepeatModeChange={handleRepeatModeChange}
            handleShuffle={handleShuffle}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            setCurrentAudioIndex={setCurrentAudioIndex}
            tracks={playlist}
          />
        </div>

        <div className="card col-span-3 space-y-10 px-4 text-primary">
          <div className="flex items-center justify-center pt-2">
            <Image
              alt=""
              className="card-img-top"
              height={300}
              src={playlist[currentAudioIndex]?.identicon}
              width={300}
            />
          </div>
          <div className="flex flex-col items-center justify-between px-4">
            <div className="h-36 flex flex-col justify-center">
              <div className="text-4xl font-bold">{playlist[currentAudioIndex]?.name}</div>
              <div className="text-2xl text-gray-400 py-2">{playlist[currentAudioIndex]?.artist}</div>
            </div>
            <div className="flex flex-col w-full items-center justify-center">
              <PlaybackSlider handleSliderChange={handleSliderChange} playbackPosition={playbackPosition} />
              {formatTime(elapsedTime)} / {formatTime(totalTime)}
            </div>
            <div className="flex pt-4">
              <Button onClick={handleShuffle} variant="ghost">
                <MdOutlineShuffle className={cn("w-6 h-6 text-primary/50", { "text-primary": isShuffle })} />
              </Button>
              <Button onClick={() => handleChangeSong(false)} variant="ghost">
                <MdOutlineSkipPrevious className="w-8 h-8" />
              </Button>
              <Button onClick={() => setIsAudioPlaying(!isAudioPlaying)} variant="ghost">
                {isAudioPlaying ? <MdOutlinePause className="w-8 h-8" /> : <MdOutlinePlayArrow className="w-10 h-10" />}
              </Button>
              <Button onClick={() => handleChangeSong(true)} variant="ghost">
                <MdOutlineSkipNext className="w-8 h-8" />
              </Button>
              <Button onClick={handleRepeatModeChange} variant="ghost">
                {repeatMode === repeatModes.NONE ? (
                  <MdOutlineRepeat className="w-6 h-6 text-primary/50" />
                ) : repeatMode === repeatModes.PLAYLIST ? (
                  <MdOutlineRepeat className="w-6 h-6 text-primary" />
                ) : (
                  <MdOutlineRepeatOne className="w-6 h-6 text-primary" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-2 p-6 w-full max-w-md space-y-4 bg-background rounded-lg border">
          <div className="text-primary text-base font-bold">Buy This Song</div>
          <div className="text-left">
            <div className="text-lg font-bold">{playlist[currentAudioIndex]?.name}</div>
            <div className="text-sm text-gray-400">{playlist[currentAudioIndex]?.artist}</div>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => purchaseItem(playlist[currentAudioIndex])} variant="outline">
              {`Buy for ${ethers.utils.formatEther(playlist[currentAudioIndex]?.price)} ETH`}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
