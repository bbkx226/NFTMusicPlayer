import { useState, useEffect, useRef, FC } from 'react'
import { ethers } from "ethers"
import Identicon from 'identicon.js';
import { BigNumber } from 'ethers'

interface MarketItem {
  price: BigNumber,
  itemId: BigNumber,
  name: string,
  audio: string,
  identicon: string
}

interface HomeProps {
  contract: {
    getAllUnsoldTokens: () => Promise<{ price: BigNumber, tokenId: BigNumber }[]>,
    tokenURI: (tokenId: BigNumber) => Promise<string>,
    buyToken: (tokenId: BigNumber, options: { value: BigNumber }) => Promise<{ wait: () => Promise<void> }>
  }
}

const Home: FC<HomeProps> = ({ contract }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState<null | boolean>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [marketItems, setMarketItems] = useState<null | MarketItem[]>(null)

  const loadMarketplaceItems = async () => {
    // Get all unsold items/tokens
    const results = await contract.getAllUnsoldTokens()
    const marketItems: MarketItem[] = await Promise.all(results.map(async i => {
      // get uri url from contract
      const uri = await contract.tokenURI(i.tokenId)
      // use uri to fetch the nft metadata stored on ipfs 
      const response = await fetch(uri + ".json")
      const metadata = await response.json()
      const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`
      // define item object
      let item: MarketItem = {
        price: i.price,
        itemId: i.tokenId,
        name: metadata.name,
        audio: metadata.audio,
        identicon
      }
      return item
    }))
    setMarketItems(marketItems)
    setLoading(false)
  }
  
  const buyMarketItem = async (item: MarketItem) => {
    await (await contract.buyToken(item.itemId, { value: item.price })).wait()
    loadMarketplaceItems()
  }
  
  const skipSong = (forwards: boolean) => {
    if (forwards && marketItems) {
      setCurrentItemIndex(() => {
        let index = currentItemIndex
        index++
        if (index > marketItems.length - 1) {
          index = 0;
        }
        return index
      })
    } else {
      setCurrentItemIndex(() => {
        let index = currentItemIndex
        index--
        if (index < 0 && marketItems) {
          index = marketItems.length - 1;
        }
        return index
      })
    }
  }
  
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play()
    } else if (isPlaying !== null) {
      audioRef.current?.pause()
    }
  })
  
  useEffect(() => {
    if (!marketItems) {
      loadMarketplaceItems()
    }
  }, [marketItems])
  
  if (loading) return (
    <main className="py-4">
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div className="container mx-auto mt-5">
      {marketItems && marketItems.length > 0 ?
        <div className="flex flex-col items-center">
          <main role="main" className="mx-auto" style={{ maxWidth: '500px' }}>
            <div className="content mx-auto">
              <audio src={marketItems[currentItemIndex].audio} ref={audioRef}></audio>
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">{currentItemIndex + 1} of {marketItems.length}</div>
                <img className="w-full h-64 object-cover" src={marketItems[currentItemIndex].identicon} />
                <div className="px-4 py-5 sm:p-6 bg-gray-200">
                  <h2 className="text-2xl"> {marketItems[currentItemIndex].name}</h2>
                  <div className="grid grid-cols-3 gap-4 px-4">
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l" onClick={() => skipSong(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-skip-backward" viewBox="0 0 16 16">
                          <path d="M.5 3.5A.5.5 0 0 1 1 4v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v2.94l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L8.5 8.752v2.94c0 .653-.713.998-1.233.696L1 8.752V12a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm7 1.133L1.696 8 7.5 11.367V4.633zm7.5 0L9.196 8 15 11.367V4.633z" />
                        </svg>
                    </button>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-pause" viewBox="0 0 16 16">
                            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-play" viewBox="0 0 16 16">
                            <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" />
                          </svg>
                        )}
                    </button>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r" onClick={() => skipSong(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-skip-forward" viewBox="0 0 16 16">
                          <path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.752l-6.267 3.636c-.52.302-1.233-.043-1.233-.696v-2.94l-6.267 3.636C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696L7.5 7.248v-2.94c0-.653.713-.998 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5zM1 4.633v6.734L6.804 8 1 4.633zm7.5 0v6.734L14.304 8 8.5 4.633z" />
                        </svg>
                    </button>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className='grid my-1'>
                    <button onClick={() => buyMarketItem(marketItems[currentItemIndex])} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                      {`Buy for ${ethers.utils.formatEther(marketItems[currentItemIndex].price)} ETH`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        : (
          <main className="py-4">
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}

export default Home;