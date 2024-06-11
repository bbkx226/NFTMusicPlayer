import Tokens from "../components/Tokens";
import { ethers } from "ethers";

interface TokensProps {
  contract: ethers.Contract;
}

const TokensPage: React.FC<TokensProps> = ({ contract }) => {
  return <Tokens contract={contract} />;
};

export default TokensPage;
