import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import NFTMusicPlayerAbi from '../contracts/contractsData/NFTMusicPlayer.json'
import NFTMusicPlayerAddress from '../contracts/contractsData/NFTMusicPlayer-address.json'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import Image from 'next/image'
import logo from '../public/logo.png'

declare global {
  interface Window {
    ethereum: any;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<string | null>(null)  
  const [contract, setContract] = useState({})

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      web3Handler()
    }
  }, [])

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    loadContract(signer)
  }

  const loadContract = async (signer: ethers.providers.JsonRpcSigner) => {
    const contract = new ethers.Contract(NFTMusicPlayerAddress.address, NFTMusicPlayerAbi.abi, signer)
    setContract(contract)
    setLoading(false)
  }

  return (
    <div className="text-center">
      <nav className="bg-secondary text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src={logo} width={40} height={40} alt="Logo" />
            <span className="ml-2">Music NFT player</span>
          </Link>
          <div className="flex items-center">
            <Link href="/">Home</Link>
            <Link href="/my-tokens">My Tokens</Link>
            <Link href="/my-resales">My Resales</Link>
            {account ? (
              <a
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-4"
              >
                {account.slice(0, 5) + '...' + account.slice(38, 42)}
              </a>
            ) : (
              <button onClick={web3Handler} className="bg-white text-black px-4 py-2 rounded">Connect Wallet</button>
            )}
          </div>
        </div>
      </nav>
      <div>
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
          </div>
        ) : (
          <Component {...pageProps} loading={loading} account={account} contract={contract} web3Handler={web3Handler} />
        )}
      </div>
    </div>
  )
}

export default MyApp