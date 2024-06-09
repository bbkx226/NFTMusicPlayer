import Link from 'next/link'
import Image from 'next/image'
import logo from '../public/logo.png'
import { ethers } from "ethers";

interface AppProps {
    loading: boolean;
    account: string | null;
    contract: ethers.Contract;
    web3Handler: () => Promise<void>;
  }

const App: React.FC<AppProps> = ({ loading, account, contract, web3Handler }) => {
  return (
    <div className="App">
      <nav className="bg-secondary text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="http://www.dappuniversity.com/bootcamp" className="flex items-center">
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
          <div className="flex justify-center items-center h-screen">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <p className='mx-3 my-0'>The component will be rendered here based on the route</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App