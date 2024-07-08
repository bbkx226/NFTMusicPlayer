"use client";
import { ethers } from "ethers";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

import { useBlockchain } from "../layout";

interface TokenItem {
  artist: string;
  audio: string;
  icon: string;
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
  const [toastShown, setToastShown] = useState(false);

  const tokenswiper = useRef<SwiperClass | null>(null);

  const { blockchainContract, s3 } = useBlockchain();

  // Function to load user's tokens
  const loadUserTokens = async () => {
    if (blockchainContract && s3) {
      // Get all unsold items/tokens
      try {
        const results = await blockchainContract.fetchUserNFTs();
        const userTokens = await Promise.all(
          results.map(async (i: ResultItem) => {
            let metadata = null;
            if (blockchainContract !== null && blockchainContract !== undefined) {
              const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_ENV || "";
              const uri = await blockchainContract.tokenURI(i.nftTokenId);
              const url = new URL(uri);
              const objectKey = url.pathname.startsWith("/") ? `${url.pathname}.json`.slice(1) : `${url.pathname}.json`;

              try {
                const fileData = await s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
                metadata = fileData.Body ? JSON.parse(fileData.Body.toString("utf-8")) : null;
              } catch (error) {
                console.error("Error fetching metadata from S3:", error);
              }
            }

            const tokenItem: TokenItem = {
              artist: metadata?.artist ?? "Unknown Artist",
              audio: metadata.audio,
              icon: metadata.icon,
              itemId: i.nftTokenId,
              name: metadata?.name,
              price: i.nftPrice,
              resellPrice: null
            };
            return tokenItem;
          })
        );
        setUserTokens(userTokens);
      } catch {
        if (!toastShown) {
          toast.error(
            "Oops! We hit a snag fetching your tokens. 🎵 Check back after a short interlude. \n\nDeveloper note: Ensure the music contracts are deployed.",
            {
              duration: 4000,
              icon: "⚠️",
              style: {
                background: "#333",
                color: "#fff"
              }
            }
          );
          setToastShown(true); // Update the state to prevent the toast from showing again
        }
      }
      setIsLoading(false);
    }
  };

  // Function to resell a token
  const resellNFT = async (tokenItem: TokenItem) => {
    if (resellNFTPrice === "0") {
      toast.error("Price must be more than zero. Please enter a positive value. 🔢", {
        duration: 4000,
        icon: "⚠️",
        style: {
          background: "#333",
          color: "#fff"
        }
      });
      return;
    }

    if (tokenItem.itemId !== resellNFTId || !resellNFTPrice || !blockchainContract) return;
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

  const handleSlideItemClick = (index: number, type: "token") => {
    const swiper = type == "token" ? tokenswiper.current : null;
    if (swiper) {
      swiper.slideTo(index);
    }

    if (type === "token") {
      // Trigger the shiny effect
      const slide = document.querySelectorAll(".glass-hover")[index];
      slide.classList.remove("animate");
      // Use requestAnimationFrame to force reflow
      requestAnimationFrame(() => {
        slide.classList.add("animate"); // Add the class to start the animation
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const btn = e.target as HTMLElement;
      if (btn.classList.contains("glow-button")) {
        const rect = btn.getBoundingClientRect();
        const x = e.pageX - rect.left;
        const y = e.pageY - rect.top;
        btn.style.setProperty("--x", `${x}px`);
        btn.style.setProperty("--y", `${y}px`);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (isLoading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Summoning Magic...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      <div className="flex justify-center w-full">
        {userTokens && userTokens.length > 0 ? (
          <div className="px-5 w-full">
            <div className="glass h-auto mb-16">
              <div className="glass-header spotlight-left py-4">
                <h2 className="text-2xl font-semibold">My NFT Music</h2>
                <span className="text-base font-normal text-zinc-300">
                  - Discover and Enjoy the Exclusive Music Tokens You Own -
                </span>
              </div>
              <div className="flex items-center h-128 w-full px-16 py-8 relative">
                {userTokens && userTokens.length > 0 && (
                  <div className="absolute top-1/2 z-10 left-0 transform -translate-y-1/2 -translate-x-full flex items-center justify-center">
                    <ChevronLeft className="swiper-button-prev w-12 h-12 border-2 border-blue-500 rounded-full text-white hover:bg-gray-300 hover:bg-opacity-20 hover:text-blue-500" />
                  </div>
                )}
                <Swiper
                  centeredSlides={true}
                  className="relative h-full w-full pb-12"
                  coverflowEffect={{
                    depth: 100,
                    modifier: 2.5,
                    rotate: 0,
                    stretch: 0
                  }}
                  effect={"coverflow"}
                  grabCursor={true}
                  loop={false}
                  modules={[EffectCoverflow, Pagination, Navigation]}
                  navigation={{ nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }}
                  onSwiper={ref => {
                    tokenswiper.current = ref;
                  }}
                  pagination={true}
                  slidesPerView={"auto"}
                >
                  {userTokens.map((item, idx) => (
                    <SwiperSlide
                      className="relative hover:shadow-cyan-600 shadow-lg glass grid grid-rows-1 rounded-lg w-148 h-168 md:w-72 md:h-90 lg:w-92 lg:h-104 glass-hover"
                      key={idx}
                      onClick={() => handleSlideItemClick(idx, "token")}
                    >
                      <div className="overflow-hidden" key={idx}>
                        <audio
                          key={idx}
                          ref={el => {
                            if (el) audioRefs.current[idx] = el;
                          }}
                          src={item.audio}
                        ></audio>
                        <div className="card">
                          <Image
                            alt="cryptopunk-icons"
                            className="w-full h-48 object-cover rounded-t-lg"
                            height={72}
                            priority
                            sizes="100vw"
                            src={item.icon}
                            style={{ objectFit: "cover" }}
                            width={72}
                          />
                          <div className="px-6 py-4">
                            <div className="font-bold text-xl mb-10">
                              {item.name} - {item.artist}
                            </div>
                            <div className=" px-4">
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  setPreviousTokenIndex(currentTokenIndex);
                                  setCurrentTokenIndex(idx);
                                  if (!isAudioPlaying || idx === currentTokenIndex) setIsAudioPlaying(!isAudioPlaying);
                                }}
                              >
                                {isAudioPlaying && currentTokenIndex === idx ? (
                                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-black transform scale-110 hover:bg-gray-300 hover:bg-opacity-20">
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
                                  </div>
                                ) : (
                                  <div className="circle-button hover:bg-gray-300 hover:bg-opacity-20">
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
                                  </div>
                                )}
                              </button>
                            </div>
                            <p className="mt-2">{ethers.utils.formatEther(item.price)} ETH</p>
                          </div>
                          <div className="px-6 pt-4 pb-2">
                            <div className="mb-4 flex space-x-2">
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
                              <button className="glow-button" onClick={() => resellNFT(item)}>
                                <span>Resell</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                {userTokens && userTokens.length > 0 && (
                  <div className="absolute top-1/2 z-10 right-0 transform -translate-y-1/2 translate-x-full flex items-center justify-center">
                    <ChevronRight className="swiper-button-next w-12 h-12 border-2 border-blue-500 rounded-full text-white hover:bg-gray-300 hover:bg-opacity-20 hover:text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <main className="flex flex-col justify-center items-center py-40">
            <div className="cube">
              <div className="face front"></div>
              <div className="face back"></div>
              <div className="face left"></div>
              <div className="face right"></div>
              <div className="face top"></div>
              <div className="face bottom"></div>
            </div>
            <h2 className="text-3xl font-bold moving-text mt-20">Opps.. There are no tokens</h2>
          </main>
        )}
      </div>
    </div>
  );
}
