"use client";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useBlockchain } from "../layout";

interface ResaleItem {
  audio: string;
  identicon: string;
  itemId: ethers.BigNumber;
  name: string;
  price: ethers.BigNumber;
}

export default function Resales() {
  const { blockchainContract, userAccount } = useBlockchain();

  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [resaleItems, setResaleItems] = useState<ResaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSales, setCompletedSales] = useState<ResaleItem[] | undefined>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean | null>(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [previousAudioIndex, setPreviousAudioIndex] = useState<null | number>(null);

  const loadUserResales = async () => {
    if (blockchainContract) {
      // Fetch resale items from marketplace by querying MarketItemRelisted events with the seller set as the user
      let filter = blockchainContract?.filters.MarketItemRelisted(null, userAccount, null);
      let results = await blockchainContract?.queryFilter(filter);
      // Fetch metadata of each NFT and add that to item object
      const resaleItems = await Promise.all(
        results.map(async i => {
          // fetch arguments from each result
          const args = i.args;
          if (!args) {
            return;
          }
          // get uri url from NFT blockchainContract
          const uri = await blockchainContract?.tokenURI(args.tokenId);
          // use uri to fetch the NFT metadata stored on IPFS
          const response = await fetch(uri + ".json");
          const metadata = await response.json();
          const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
          // define listed item object
          const resaleItem: ResaleItem = {
            audio: metadata?.audio ?? "",
            identicon,
            itemId: args?.tokenId ?? 0,
            name: metadata?.name ?? "",
            price: args?.price ?? 0
          };
          return resaleItem;
        })
      );
      setResaleItems(resaleItems.filter(item => item !== undefined) as ResaleItem[]);
      // Fetch sold resale items by querying MarketItemPurchased events with the seller set as the user
      filter = blockchainContract.filters.MarketItemPurchased(null, userAccount, null, null);
      results = await blockchainContract.queryFilter(filter);
      // Filter out the sold items from the resaleItems
      const completedSales = resaleItems.filter(i =>
        results?.some(j => j.args && i && i.itemId.toString() === j.args.tokenId.toString())
      );
      setCompletedSales(completedSales.filter(item => item !== undefined) as ResaleItem[]);
      setIsLoading(false);
    }
  };

  // Effect to handle audio play/pause
  useEffect(() => {
    if (isAudioPlaying) {
      audioRefs.current[currentAudioIndex].play();
      if (currentAudioIndex !== previousAudioIndex && previousAudioIndex !== null)
        audioRefs.current[previousAudioIndex].pause();
    } else if (isAudioPlaying !== null) {
      audioRefs.current[currentAudioIndex].pause();
    }
  }, [isAudioPlaying, currentAudioIndex, previousAudioIndex]);

  // Effect to load user's resale items
  useEffect(() => {
    if (resaleItems && resaleItems.length === 0) {
      loadUserResales();
    }
  });

  if (isLoading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      <div className="flex justify-center">
        {resaleItems && resaleItems.length > 0 ? (
          <div className="px-5 py-3 container">
            <h2 className="text-2xl font-bold">Listed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
              {resaleItems.map((item, idx) => (
                <div className="overflow-hidden rounded-lg shadow-lg" key={idx}>
                  <audio
                    ref={el => {
                      if (el) audioRefs.current[idx] = el;
                    }}
                    src={item.audio}
                  ></audio>
                  <div
                    className="w-full h-64 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.identicon})` }}
                  ></div>
                  <div className="p-4 bg-white">
                    <p className="text-lg font-bold">{item.name}</p>
                    <div className="mt-2">
                      <button
                        className="w-full px-4 py-2 text-white bg-gray-800 rounded-md"
                        onClick={() => {
                          setPreviousAudioIndex(currentAudioIndex);
                          setCurrentAudioIndex(idx);
                          if (!isAudioPlaying || idx === currentAudioIndex) setIsAudioPlaying(!isAudioPlaying);
                        }}
                      >
                        {isAudioPlaying && currentAudioIndex === idx ? "Pause" : "Play"}
                      </button>
                    </div>
                    <p className="mt-2">{ethers.utils.formatEther(item.price)} ETH</p>
                  </div>
                </div>
              ))}
            </div>
            <>
              <h2>Sold</h2>
              {completedSales && completedSales.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
                  {completedSales.map((item, idx) => (
                    <div className="overflow-hidden" key={idx}>
                      <div className="bg-white rounded-lg shadow-md">
                        <Image
                          alt={item.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                          height={120}
                          src={item.identicon}
                          width={120}
                        />
                        <div className="p-4">
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="mt-1">{ethers.utils.formatEther(item.price)} ETH</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <main className="py-4">
                  <h2>No sold assets</h2>
                </main>
              )}
            </>
          </div>
        ) : (
          <main className="p-4">
            <h2 className="text-2xl font-bold">No listed assets</h2>
          </main>
        )}
      </div>
    </div>
  );
}
