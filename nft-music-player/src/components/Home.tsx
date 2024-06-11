import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Identicon from "identicon.js";
import Image from "next/image";

interface HomeProps {
  contract: ethers.Contract;
}

interface Token {
  price: ethers.BigNumber;
  tokenId: ethers.BigNumber;
}

interface Item {
  price: ethers.BigNumber;
  itemId: ethers.BigNumber;
  name: string;
  audio: string;
  identicon: string;
}

const Home: React.FC<HomeProps> = ({ contract }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [marketItems, setMarketItems] = useState<Item[]>([]);

  const loadMarketplaceItems = async () => {
    const results: Token[] = await contract.getAllUnsoldTokens();
    const marketItems: Item[] = await Promise.all(
      results.map(async (i: Token) => {
        const uri = await contract.tokenURI(i.tokenId);
        const response = await fetch(uri + ".json");
        const metadata = await response.json();
        const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
        const item: Item = {
          price: i.price,
          itemId: i.tokenId,
          name: metadata.name,
          audio: metadata.audio,
          identicon
        };
        return item;
      })
    );
    setMarketItems(marketItems);
    setLoading(false);
  };

  const buyMarketItem = async (item: Item) => {
    await (await contract.buyToken(item.itemId, { value: item.price })).wait();
    loadMarketplaceItems();
  };

  const skipSong = (forwards: boolean) => {
    if (forwards) {
      setCurrentItemIndex(() => {
        let index = currentItemIndex;
        index++;
        if (index > marketItems.length - 1) {
          index = 0;
        }
        return index;
      });
    } else {
      setCurrentItemIndex(() => {
        let index = currentItemIndex;
        index--;
        if (index < 0) {
          index = marketItems.length - 1;
        }
        return index;
      });
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else if (isPlaying !== null) {
        audioRef.current.pause();
      }
    }
  });

  useEffect(() => {
    if (marketItems.length === 0) {
      loadMarketplaceItems();
    }
  });

  if (loading)
    return (
      <main className="p-4">
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="container mx-auto mt-5">
      {marketItems.length > 0 ? (
        <div className="row">
          <main role="main" className="mx-auto" style={{ maxWidth: "500px" }}>
            <div className="content mx-auto">
              <audio src={marketItems[currentItemIndex].audio} ref={audioRef}></audio>
              <div className="card">
                <div className="card-header">
                  {currentItemIndex + 1} of {marketItems.length}
                </div>
                <Image
                  alt=""
                  className="card-img-top"
                  src={marketItems[currentItemIndex].identicon}
                  width={120}
                  height={120}
                />
                <div className="card-body text-secondary">
                  <h2 className="card-title">{marketItems[currentItemIndex].name}</h2>
                  <div className="d-grid px-4">
                    <div className="btn-group" role="group" aria-label="Basic example">
                      <button className="btn btn-secondary" onClick={() => skipSong(false)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          fill="currentColor"
                          className="bi bi-skip-backward"
                          viewBox="0 0 16 16"
                        >
                          <path d="M.5 3.5A.5.5 0 0 1 1 4v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v2.94l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L8.5 8.752v2.94c0 .653-.713.998-1.233.696L1 8.752V12a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm7 1.133L1.696 8 7.5 11.367V4.633zm7.5 0L9.196 8 15 11.367V4.633z" />
                        </svg>
                      </button>
                      <button className="btn btn-secondary" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            fill="currentColor"
                            className="bi bi-pause"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            fill="currentColor"
                            className="bi bi-play"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" />
                          </svg>
                        )}
                      </button>
                      <button className="btn btn-secondary" onClick={() => skipSong(true)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          fill="currentColor"
                          className="bi bi-skip-forward"
                          viewBox="0 0 16 16"
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
                      onClick={() => buyMarketItem(marketItems[currentItemIndex])}
                      className="btn btn-primary btn-lg"
                    >
                      {`Buy for ${ethers.utils.formatEther(marketItems[currentItemIndex].price)} ETH`}
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
};

export default Home;
