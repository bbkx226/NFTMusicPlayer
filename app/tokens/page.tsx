"use client";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useBlockchain } from "../layout";

interface TokenItem {
  audio: string;
  identicon: string;
  itemId: ethers.BigNumber;
  name: string;
  price: ethers.BigNumber;
  resellPrice: null | string;
}

interface ResultItem {
  nftPrice: ethers.BigNumber;
  nftSeller: string;
  nftTokenId: ethers.BigNumber;
}

export default function Tokens() {
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userTokens, setUserTokens] = useState<TokenItem[] | null>(null);
  const [currentTokenIndex, setCurrentTokenIndex] = useState<number>(0);
  const [previousTokenIndex, setPreviousTokenIndex] = useState<null | number>(null);
  const [resellNFTId, setresellNFTId] = useState<ethers.BigNumber | null>(null);
  const [resellNFTPrice, setresellNFTPrice] = useState<number | readonly string[] | string | undefined>(undefined);

  const { blockchainContract } = useBlockchain();

  // Function to load user's tokens
  const loadUserTokens = async () => {
    if (blockchainContract) {
      // Get all unsold items/tokens
      const results = await blockchainContract.fetchUserNFTs();
      const userTokens = await Promise.all(
        results.map(async (i: ResultItem) => {
          // get uri url from blockchainContract
          const uri = await blockchainContract.tokenURI(i.nftTokenId);
          // use uri to fetch the nft metadata stored on ipfs
          const response = await fetch(uri + ".json");
          const metadata = await response.json();
          const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
          // define item object
          const tokenItem: TokenItem = {
            audio: metadata.audio,
            identicon,
            itemId: i.nftTokenId,
            name: metadata.name,
            price: i.nftPrice,
            resellPrice: null
          };
          return tokenItem;
        })
      );
      setUserTokens(userTokens);
      setIsLoading(false);
    }
  };

  // Function to resell a token
  const resellNFT = async (tokenItem: TokenItem) => {
    if (resellNFTPrice === "0" || tokenItem.itemId !== resellNFTId || !resellNFTPrice || !blockchainContract) return;
    // Get royalty fee
    const fee = await blockchainContract.royaltyFeePercentage();
    const price = ethers.utils.parseEther(resellNFTPrice.toString());
    await (await blockchainContract.resellNFT(tokenItem.itemId, price, { value: fee })).wait();
    loadUserTokens();
  };

  // Effect to handle audio play/pause
  useEffect(() => {
    if (isAudioPlaying) {
      audioRefs.current[currentTokenIndex].play();
      if (currentTokenIndex !== previousTokenIndex && previousTokenIndex !== null)
        audioRefs.current[previousTokenIndex].pause();
    } else if (isAudioPlaying !== null) {
      audioRefs.current[currentTokenIndex].pause();
    }
  }, [isAudioPlaying, currentTokenIndex, previousTokenIndex]);

  // Effect to load user's tokens
  useEffect(() => {
    if (!userTokens) {
      loadUserTokens();
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
      {userTokens && userTokens.length > 0 ? (
        <div className="px-5 container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-5">
            {userTokens.map((item, idx) => (
              <div className="overflow-hidden" key={idx}>
                <audio
                  key={idx}
                  ref={el => {
                    if (el) audioRefs.current[idx] = el;
                  }}
                  src={item.audio}
                ></audio>
                <div className="card">
                  <Image alt="" className="w-full" height={120} src={item.identicon} width={120} />
                  <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">{item.name}</div>
                    <div className="d-grid px-4">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setPreviousTokenIndex(currentTokenIndex);
                          setCurrentTokenIndex(idx);
                          if (!isAudioPlaying || idx === currentTokenIndex) setIsAudioPlaying(!isAudioPlaying);
                        }}
                      >
                        {isAudioPlaying && currentTokenIndex === idx ? (
                          <svg
                            className="bi bi-pause"
                            fill="currentColor"
                            height="23"
                            viewBox="0 0 16 16"
                            width="23"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z" />
                          </svg>
                        ) : (
                          <svg
                            className="bi bi-play"
                            fill="currentColor"
                            height="23"
                            viewBox="0 0 16 16"
                            width="23"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-gray-700 text-base">{ethers.utils.formatEther(item.price)} ETH</p>
                  </div>
                  <div className="px-6 pt-4 pb-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => resellNFT(item)}
                    >
                      Resell
                    </button>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      onChange={e => {
                        setresellNFTId(item.itemId);
                        setresellNFTPrice(e.target.value);
                      }}
                      placeholder="Price in ETH"
                      required
                      type="number"
                      value={resellNFTId === item.itemId ? resellNFTPrice : ""}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <main className="p-4">
          <h2>No owned tokens</h2>
        </main>
      )}
    </div>
  );
}
