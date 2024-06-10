import Resales from '../components/Resales'
import { ethers } from "ethers";

interface ResalesProps {
  loading: boolean;
  account: string | null;
  contract: ethers.Contract;
  web3Handler: () => Promise<void>;
}


const ResalesPage: React.FC<ResalesProps> = ({ contract, loading, account, web3Handler }) => {
  return <Resales contract={contract} loading={loading} account={account} web3Handler={web3Handler}/>
}

export default ResalesPage