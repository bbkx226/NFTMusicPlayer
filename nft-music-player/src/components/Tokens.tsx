import { useState, useEffect, useRef, FC } from "react";
import { ethers } from "ethers";
import Identicon from "identicon.js";

interface TokensProps {
  loading: boolean;
  account: string | null;
  contract: ethers.Contract;
  web3Handler: () => Promise<void>;
}

interface Item {
  price: ethers.BigNumber;
  itemId: number;
  name: string;
  audio: string;
  identicon: string;
  resellPrice: null | string;
}

const Tokens: FC<TokensProps> = ({ contract }) => {
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [isPlaying, setIsPlaying] = useState<null | boolean>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [myTokens, setMyTokens] = useState<Item[] | null>(null);
  const [selected, setSelected] = useState<number>(0);
  const [previous, setPrevious] = useState<null | number>(null);
  const [resellId, setResellId] = useState<null | number>(null);
  const [resellPrice, setResellPrice] = useState<string | number | readonly string[] | undefined>(undefined);

  const loadMyTokens = async () => {
    // Get all unsold items/tokens
    const results = await contract.getMyTokens();
    const myTokens = await Promise.all(
      results.map(async (i: { args: any; tokenId: any }) => {
        const args = i.args;
        if (!args) {
          return;
        }
        // get uri url from contract
        const uri = await contract.tokenURI(i.tokenId);
        // use uri to fetch the nft metadata stored on ipfs
        const response = await fetch(uri + ".json");
        const metadata = await response.json();
        const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;
        // define item object
        let item = {
          price: args.price,
          itemId: args.tokenId,
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
  };
  const resellItem = async (item: Item) => {
    if (resellPrice === "0" || item.itemId !== resellId || !resellPrice) return;
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
    if (myTokens && myTokens.length === 0) {
      loadMyTokens();
    }
  }, [myTokens]);

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
                  <img className="w-full" src={item.identicon} />
                  <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">{item.name}</div>
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
};

export default Tokens;
