import Home from '../components/Home'
import { ethers } from "ethers";

interface HomeProps {
  loading: boolean;
  account: string | null;
  contract: ethers.Contract;
  web3Handler: () => Promise<void>;
}


const HomePage: React.FC<HomeProps> = ({ contract, loading, account, web3Handler }) => {
  return <Home contract={contract} loading={loading} account={account} web3Handler={web3Handler}/>
}

export default HomePage