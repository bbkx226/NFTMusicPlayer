import Tokens from '../components/Tokens'
import { ethers } from "ethers";

interface TokensProps {
  loading: boolean;
  account: string | null;
  contract: ethers.Contract;
  web3Handler: () => Promise<void>;
}


const TokensPage: React.FC<TokensProps> = ({ contract, loading, account, web3Handler }) => {
  return <Tokens contract={contract} loading={loading} account={account} web3Handler={web3Handler}/>
}

export default TokensPage