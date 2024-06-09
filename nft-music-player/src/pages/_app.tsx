import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import NFTMusicPlayerAbi from '../contracts/contractsData/NFTMusicPlayer.json'
import NFTMusicPlayerAddress from '../contracts/contractsData/NFTMusicPlayer-address.json'
import type { AppProps } from 'next/app'

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
    <Component {...pageProps} loading={loading} account={account} contract={contract} web3Handler={web3Handler} />
  )
}

export default MyApp