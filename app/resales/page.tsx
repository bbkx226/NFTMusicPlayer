"use client";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

import { useBlockchain } from "../layout";

interface ResaleItem {
  artist: string;
  audio: string;
  identicon: string;
  itemId: ethers.BigNumber;
  name: string;
  price: ethers.BigNumber;
}

export default function Resales() {
  const { blockchainContract, s3, userAccount } = useBlockchain();

  // const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [resaleItems, setResaleItems] = useState<ResaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSales, setCompletedSales] = useState<ResaleItem[] | undefined>([]);
  // const [isAudioPlaying, setIsAudioPlaying] = useState<boolean | null>(null);
  // const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  // const [previousAudioIndex, setPreviousAudioIndex] = useState<null | number>(null);
  const listedSwiper = useRef<SwiperClass | null>(null);
  const soldSwiper = useRef<SwiperClass | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  const loadUserResales = async () => {
    if (blockchainContract && s3) {
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

          let metadata = null;
          if (blockchainContract !== null && blockchainContract !== undefined) {
            const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_ENV || "";
            const uri = await blockchainContract.tokenURI(args.nftTokenId);
            const url = new URL(uri);
            const objectKey = url.pathname.startsWith("/") ? `${url.pathname}.json`.slice(1) : `${url.pathname}.json`;

            try {
              const fileData = await s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
              metadata = fileData.Body ? JSON.parse(fileData.Body.toString("utf-8")) : null;
            } catch (error) {
              console.error("Error fetching metadata from S3:", error);
            }
          }

          const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price + metadata.artist, 330).toString()}`;
          // define listed item object
          const resaleItem: ResaleItem = {
            artist: metadata?.artist ?? "Unknown Artist",
            audio: metadata?.audio ?? "",
            identicon,
            itemId: args?.nftTokenId ?? 0,
            name: metadata?.name ?? "",
            price: args?.nftPrice ?? 0
          };
          return resaleItem;
        })
      );

      filter = blockchainContract.filters.MarketItemPurchased(null, userAccount, null, null);
      results = await blockchainContract.queryFilter(filter);
      // Filter out the sold items from the resaleItems
      const completedSales = resaleItems.filter(i =>
        results?.some(j => j.args && i && i.itemId.toString() === j.args.nftTokenId.toString())
      );
      // Filter out the completed sales from resaleItems to get only unsold items
      const unsoldResaleItems = resaleItems.filter(i => !completedSales.includes(i));

      // Update the state to only include unsold resale items
      setResaleItems(unsoldResaleItems.filter(item => item !== undefined) as ResaleItem[]);
      setCompletedSales(completedSales.filter(item => item !== undefined) as ResaleItem[]);
      setIsLoading(false);
    }
  };

  // Effect to handle audio play/pause
  // useEffect(() => {
  //   if (isAudioPlaying) {
  //     audioRefs.current[currentAudioIndex].play();
  //     if (currentAudioIndex !== previousAudioIndex && previousAudioIndex !== null)
  //       audioRefs.current[previousAudioIndex].pause();
  //   } else if (isAudioPlaying !== null) {
  //     audioRefs.current[currentAudioIndex].pause();
  //   }
  // }, [isAudioPlaying, currentAudioIndex, previousAudioIndex]);

  // Effect to load user's resale items
  useEffect(() => {
    if (resaleItems && resaleItems.length === 0) {
      loadUserResales();
    }
  });

  const handleSlideItemClick = (index: number, type: "listed" | "sold") => {
    const swiper = type === "listed" ? listedSwiper.current : soldSwiper.current;
    if (swiper) {
      swiper.slideTo(index);
    }

    if (type === "listed") {
      // Trigger the shiny effect
      const slide = document.querySelectorAll(".glass-hover")[index];
      slide.classList.remove("animate"); // Remove the class if it exists
      // Use requestAnimationFrame to force reflow
      requestAnimationFrame(() => {
        slide.classList.add("animate"); // Add the class to start the animation
      });
    } else {
      // Trigger the shiny effect
      const slide = document.querySelectorAll(".glass-hover2")[index];
      slide.classList.remove("animate"); // Remove the class if it exists
      // Use requestAnimationFrame to force reflow
      requestAnimationFrame(() => {
        slide.classList.add("animate"); // Add the class to start the animation
      });
    }
  };

  useEffect(() => {
    if (listedSwiper.current) {
      setTotalSlides(listedSwiper.current.slides.length);
    }
  }, []);

  // useEffect(() => {
  //   const handleMouseMove = (e: MouseEvent) => {
  //     const btn = e.target as HTMLElement;
  //     if (btn.classList.contains("glass-button")) {
  //       const x = e.pageX - btn.offsetLeft;
  //       const y = e.pageY - btn.offsetTop;
  //       btn.style.setProperty("--x", `${x}px`);
  //       btn.style.setProperty("--y", `${y}px`);
  //     }
  //   };

  //   document.addEventListener("mousemove", handleMouseMove);

  //   return () => {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //   };
  // }, []);

  if (isLoading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex container justify-center pb-8">
      <div className="flex justify-center w-full ">
        {resaleItems && resaleItems.length > 0 ? (
          <div className="px-5 w-full">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3"> */}
            <div className="glass">
              <div className="glass-header py-4 spotlight-left">
                <h2 className="text-2xl font-semibold">Listed NFT Music</h2>
                <span className="text-base font-normal text-zinc-300">
                  - Explore the catalog of NFT music ready for resale -
                </span>
              </div>
              <div className="flex items-center h-128 w-full px-16 py-8 pb-12">
                {resaleItems.length > 0 && (
                  <div
                    className={`absolute top-1/2 z-10 left-0 transform -translate-y-1/2 -translate-x-full flex items-center justify-center`}
                  >
                    <ChevronLeft
                      className={`swiper-button-prev-listed w-12 h-12 border-2 border-blue-500 rounded-full text-white hover:bg-gray-300 hover:bg-opacity-20 hover:text-blue-500 ${activeSlide === 0 ? "opacity-50 pointer-events-none" : ""}`}
                    />
                  </div>
                )}

                <Swiper
                  autoplay={{ delay: 5000 }}
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
                  modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
                  navigation={{ nextEl: ".swiper-button-next-listed", prevEl: ".swiper-button-prev-listed" }}
                  onSlideChange={swiper => setActiveSlide(swiper.activeIndex)}
                  onSwiper={ref => {
                    listedSwiper.current = ref;
                    setTotalSlides(ref.slides.length);
                  }}
                  // pagination={true}
                  slidesPerView={"auto"}
                >
                  {resaleItems.map((item, idx) => (
                    <SwiperSlide
                      className={`relative hover:shadow-cyan-600 shadow-lg glass grid grid-rows-3 rounded-lg w-148 h-168 md:w-72 md:h-96 lg:w-92 lg:h-104 glass-hover`}
                      key={idx}
                      onClick={() => handleSlideItemClick(idx, "listed")}
                    >
                      <div className="row-span-2">
                        <Image
                          alt={item.name}
                          className="w-full h-full object-cover rounded-t-lg"
                          height={120}
                          src={item.identicon}
                          width={120}
                        />
                      </div>
                      <div className="p-4 grid grid-rows-3">
                        <p className="flex items-center justify-center text-2xl font-bold row-span-2">
                          {item.name} - {item.artist}
                        </p>
                        <div className="mt-2 flex items-center justify-center">
                          <p className="">{ethers.utils.formatEther(item.price)} ETH</p>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {resaleItems.length > 0 && (
                  <div
                    className={`absolute top-1/2 z-10 right-0 transform -translate-y-1/2 translate-x-full flex items-center justify-center`}
                  >
                    <ChevronRight
                      className={`swiper-button-next-listed w-12 h-12 border-2 border-blue-500 rounded-full text-white hover:bg-gray-300 hover:bg-opacity-20 hover:text-blue-500 ${activeSlide === totalSlides - 1 ? "opacity-50 pointer-events-none" : ""}`}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="glass w-full mt-4">
              <div className="glass-header py-4 spotlight-right">
                <h2 className="text-2xl font-semibold">Music Sales Insights</h2>
                <span className="text-base font-normal text-zinc-300">- Gain insights into your NFT music sales -</span>
              </div>
              <div className="flex items-center h-128 w-full px-16 py-8 relative">
                {completedSales && completedSales.length > 0 && (
                  <div className="absolute top-1/2 z-10 left-0 transform -translate-y-1/2 -translate-x-full flex items-center justify-center">
                    <ChevronLeft className="swiper-button-prev w-12 h-12 border-2 border-blue-500 rounded-full text-white hover:bg-gray-300 hover:bg-opacity-20 hover:text-blue-500" />
                  </div>
                )}
                <Swiper
                  autoplay={{ delay: 5000 }}
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
                  modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
                  navigation={{ nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }}
                  onSwiper={ref => {
                    soldSwiper.current = ref;
                  }}
                  // pagination={true}
                  slidesPerView={"auto"}
                >
                  {completedSales && completedSales.length > 0 ? (
                    completedSales.map((item, idx) => (
                      <SwiperSlide
                        className={`relative hover:shadow-cyan-600 shadow-lg glass grid grid-rows-3 rounded-lg w-148 h-168 md:w-72 md:h-96 lg:w-92 lg:h-104 glass-hover2`}
                        key={idx}
                        onClick={() => handleSlideItemClick(idx, "sold")}
                      >
                        <div className="row-span-2">
                          <Image
                            alt={item.name}
                            className="w-full h-full object-cover rounded-t-lg"
                            height={120}
                            src={item.identicon}
                            width={120}
                          />
                        </div>
                        <div className="p-4 grid grid-rows-3">
                          <p className="flex items-center justify-center text-2xl font-bold row-span-2">
                            {item.name} - {item.artist}
                          </p>
                          <div className="mt-2 flex items-center justify-center">
                            <p className="">{ethers.utils.formatEther(item.price)} ETH</p>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))
                  ) : (
                    <main className="py-4">
                      <h2>No sold assets</h2>
                    </main>
                  )}
                </Swiper>
                {completedSales && completedSales.length > 0 && (
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
            <h2 className="text-3xl font-bold moving-text mt-20">No Listed Assets</h2>
          </main>
        )}
      </div>
    </div>
  );
}
