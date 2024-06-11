import { useState, useEffect, useRef, FC } from "react";
import { ethers } from "ethers";
import Identicon from "identicon.js";

interface ResalesProps {
  loading: boolean;
  account: string | null;
  contract: ethers.Contract;
  web3Handler: () => Promise<void>;
}

interface Item {
  price: ethers.BigNumber;
  itemId: ethers.BigNumber;
  name: string;
  audio: string;
  identicon: string;
}

const Resales: FC<ResalesProps> = ({ contract, account, loading, web3Handler }) => {
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [listedItems, setListedItems] = useState<Item[] | undefined>([]);
  const [soldItems, setSoldItems] = useState<Item[] | undefined>([]);
  const [isPlaying, setIsPlaying] = useState<boolean | null>(null);
  const [selected, setSelected] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);

  const loadMyResales = async () => {
    // Fetch resale items from marketplace by quering MarketItemRelisted events with the seller set as the user
    let filter = contract.filters.MarketItemRelisted(null, account, null);
    let results = await contract.queryFilter(filter);
    // Fetch metadata of each nft and add that to item object.
    const listedItems = await Promise.all(
      results.map(async i => {
        // fetch arguments from each result
        const args = i.args;
        if (!args) {
          return;
        }
        // get uri url from nft contract
        const uri = await contract.tokenURI(args.tokenId);
        // use uri to fetch the nft metadata stored on ipfs
        const response = await fetch(uri + ".json");
        const metadata = await response.json();
        const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
        // define listed item object
        const purchasedItem: Item = {
          price: args?.price ?? 0,
          itemId: args?.tokenId ?? 0,
          name: metadata?.name ?? "",
          audio: metadata?.audio ?? "",
          identicon
        };
        return purchasedItem;
      })
    );
    setListedItems(listedItems.filter(item => item !== undefined) as Item[]);
    // Fetch sold resale items by quering MarketItemBought events with the seller set as the user.
    filter = contract.filters.MarketItemBought(null, account, null, null);
    results = await contract.queryFilter(filter);
    // Filter out the sold items from the listedItems
    const soldItems = listedItems.filter(i =>
      results.some(j => j.args && i && i.itemId.toString() === j.args.tokenId.toString())
    );
    setSoldItems(soldItems.filter(item => item !== undefined) as Item[]);
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
    if (listedItems && listedItems.length === 0) {
      loadMyResales();
    }
  }, [listedItems]);

  // Rest of the code remains the same
  if (loading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      <div className="flex justify-center">
        {listedItems && listedItems.length > 0 ? (
          <div className="px-5 py-3 container">
            <h2 className="text-2xl font-bold">Listed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
              {listedItems.map((item, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg shadow-lg">
                  <audio
                    src={item.audio}
                    ref={el => {
                      if (el) audioRefs.current[idx] = el;
                    }}
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
                          setPrevious(selected);
                          setSelected(idx);
                          if (!isPlaying || idx === selected) setIsPlaying(!isPlaying);
                        }}
                      >
                        {isPlaying && selected === idx ? "Pause" : "Play"}
                      </button>
                    </div>
                    <p className="mt-2">{ethers.utils.formatEther(item.price)} ETH</p>
                  </div>
                </div>
              ))}
            </div>
            <>
              <h2>Sold</h2>
              {soldItems && soldItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
                  {soldItems.map((item, idx) => (
                    <div key={idx} className="overflow-hidden">
                      <div className="bg-white rounded-lg shadow-md">
                        <img className="w-full h-48 object-cover rounded-t-lg" src={item.identicon} alt={item.name} />
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
};

export default Resales;
