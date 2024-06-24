"use client";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

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
  const swiper = useRef<SwiperClass>(null!);

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
          const uri = await blockchainContract?.tokenURI(args.nftTokenId);
          // use uri to fetch the NFT metadata stored on IPFS
          const response = await fetch(uri + ".json");
          const metadata = await response.json();
          const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
          // define listed item object
          const resaleItem: ResaleItem = {
            audio: metadata?.audio ?? "",
            identicon,
            itemId: args?.nftTokenId ?? 0,
            name: metadata?.name ?? "",
            price: args?.nftPrice ?? 0
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
        results?.some(j => j.args && i && i.itemId.toString() === j.args.nftTokenId.toString())
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

  const handleSlideItemClick = (index: number) => {
    if (swiper.current !== null) {
      swiper.current.slideTo(index);
      // If clicked on the same slide that is currently playing
      if (currentAudioIndex === index) {
        const audio = audioRefs.current[index];
        if (audio.paused) {
          audio.play(); // Play audio if paused
        } else {
          audio.pause(); // Pause audio if playing
        }
      } else {
        // Pause currently playing audio (if any)
        if (currentAudioIndex !== null) {
          audioRefs.current[currentAudioIndex].pause();
        }
        // Play the clicked audio
        audioRefs.current[index].play();
        setCurrentAudioIndex(index); // Update the current audio index
      }
    }
  };

  if (isLoading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex container justify-center">
      <div className="flex justify-center w-full ">
        {resaleItems && resaleItems.length > 0 ? (
          <div className="px-5 w-full">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3"> */}
            <div className="py-3 glass">
              <h2 className="text-2xl font-bold">Listed</h2>
              <Swiper
                centeredSlides={true}
                className="relative h-128 py-8 w-full"
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
                  swiper.current = ref;
                }}
                pagination={true}
                slidesPerView={"auto"}
              >
                {resaleItems.map((item, idx) => (
                  <SwiperSlide
                    className="relative glass rounded-lg w-148 h-168 md:w-72 md:h-96 lg:w-92 lg:h-104"
                    key={idx}
                    onClick={() => handleSlideItemClick(idx)}
                  >
                    <audio
                      ref={el => {
                        if (el) audioRefs.current[idx] = el;
                      }}
                      src={item.audio}
                    ></audio>
                    <div
                      className="w-full rounded-lg h-64 bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.identicon})` }}
                    ></div>
                    <div className="p-4">
                      <p className="text-lg font-bold">{item.name}</p>
                      <p className="mt-2">{ethers.utils.formatEther(item.price)} ETH</p>
                    </div>
                  </SwiperSlide>
                ))}

                <div className="absolute top-1/2 z-10 left-0 transform -translate-y-1/2 -translate-x-full flex items-center justify-center">
                  <div className="swiper-button-prev w-14 h-14 rounded-full shadow-lg"  >
                    {/* <MoveLeftIcon className="text-gray-800 w-8 h-8" /> */}
                  </div>
                </div>

                <div className="absolute top-1/2 z-10 right-0 transform -translate-y-1/2 translate-x-full flex items-center justify-center">
                  <div className="swiper-button-next w-14 h-14 rounded-full shadow-lg" >
                    {/* <MoveRightIcon className="text-gray-800 w-8 h-8" /> */}
                  </div>
                </div>
              </Swiper>
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
          <main className="flex flex-col justify-center items-center py-48 ">
            <Image
              alt="No listed assets"
              className="w-full h-96 object-cover rounded-t-lg"
              height={240}
              src="/noListedAsset.png"
              width={240}
            />
            <h2 className="text-2xl font-bold">No listed assets</h2>
          </main>
        )}
      </div>
    </div>
  );
}

// <Swiper
//       // install Swiper modules
//       modules={[Navigation, Pagination, Scrollbar, A11y]}
//       spaceBetween={50}
//       slidesPerView={3}
//       navigation
//       pagination={{ clickable: true }}
//       scrollbar={{ draggable: true }}
//       onSwiper={(swiper) => console.log(swiper)}
//       onSlideChange={() => console.log('slide change')}
//     >
//       <SwiperSlide>Slide 1</SwiperSlide>
//       <SwiperSlide>Slide 2</SwiperSlide>
//       <SwiperSlide>Slide 3</SwiperSlide>
//       <SwiperSlide>Slide 4</SwiperSlide>
//       ...
//     </Swiper>
