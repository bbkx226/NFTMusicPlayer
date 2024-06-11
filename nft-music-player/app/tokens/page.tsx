"use client";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useBlockchain } from "../layout";

interface Item {
  price: ethers.BigNumber;
  itemId: number;
  name: string;
  audio: string;
  identicon: string;
  resellPrice: null | string;
}

export default function Tokens() {
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [isPlaying, setIsPlaying] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [myTokens, setMyTokens] = useState<Item[] | null>(null);
  const [selected, setSelected] = useState<number>(0);
  const [previous, setPrevious] = useState<null | number>(null);
  const [resellId, setResellId] = useState<null | number>(null);
  const [resellPrice, setResellPrice] = useState<string | number | readonly string[] | undefined>(undefined);

  const { contract } = useBlockchain();

  const loadMyTokens = async () => {
    if (contract) {
      // Get all unsold items/tokens
      const results = await contract.getMyTokens();
      const myTokens = await Promise.all(
        results.map(async i => {
          // get uri url from contract
          const uri = await contract.tokenURI(i.tokenId);
          // use uri to fetch the nft metadata stored on ipfs
          const response = await fetch(uri + ".json");
          const metadata = await response.json();
          const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
          // define item object
          const item = {
            price: i.price,
            itemId: i.tokenId,
            name: metadata.name,
            audio: metadata.audio,
            identicon,
            resellPrice: null
          };
          return item;
        })
      );
      setMyTokens(myTokens);
      setLoading(false);
    }
  };

  const resellItem = async (item: Item) => {
    if (resellPrice === "0" || item.itemId !== resellId || !resellPrice || !contract) return;
    // Get royalty fee
    const fee = await contract.royaltyFee();
    const price = ethers.utils.parseEther(resellPrice.toString());
    await (await contract.resellToken(item.itemId, price, { value: fee })).wait();
    loadMyTokens();
  };

  useEffect(() => {
    if (isPlaying) {
      audioRefs.current[selected].play();
      if (selected !== previous && previous) audioRefs.current[previous].pause();
    } else if (isPlaying !== null) {
      audioRefs.current[selected].pause();
    }
  });

  useEffect(() => {
    !myTokens && loadMyTokens();
  });

  if (loading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      {myTokens && myTokens.length > 0 ? (
        <div className="px-5 container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-5">
            {myTokens.map((item, idx) => (
              <div key={idx} className="overflow-hidden">
                <audio
                  src={item.audio}
                  key={idx}
                  ref={el => {
                    if (el) audioRefs.current[idx] = el;
                  }}
                ></audio>
                <div className="card">
                  <Image width={120} height={120} alt="" className="w-full" src={item.identicon} />
                  <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">{item.name}</div>
                    <div className="d-grid px-4">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setPrevious(selected);
                          setSelected(idx);
                          if (!isPlaying || idx === selected) setIsPlaying(!isPlaying);
                        }}
                      >
                        {isPlaying && selected === idx ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="23"
                            height="23"
                            fill="currentColor"
                            className="bi bi-pause"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="23"
                            height="23"
                            fill="currentColor"
                            className="bi bi-play"
                            viewBox="0 0 16 16"
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
                      onClick={() => resellItem(item)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Resell
                    </button>
                    <input
                      onChange={e => {
                        setResellId(item.itemId);
                        setResellPrice(e.target.value);
                      }}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={resellId === item.itemId ? resellPrice : ""}
                      required
                      type="number"
                      placeholder="Price in ETH"
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
