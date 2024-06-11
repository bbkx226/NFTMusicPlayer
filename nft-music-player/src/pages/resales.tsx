import Resales from "../components/Resales";
import { ethers } from "ethers";

interface ResalesProps {
  account: string | null;
  contract: ethers.Contract;
}

const ResalesPage: React.FC<ResalesProps> = ({ contract, account }) => {
  return <Resales contract={contract} account={account} />;
};

export default ResalesPage;
