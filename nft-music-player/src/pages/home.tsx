import Home from '../components/Home'
import { ethers } from "ethers";

interface HomeProps {
    contract: ethers.Contract;
  }

const HomePage: React.FC<HomeProps> = ({ contract }) => {
  return <Home contract={contract} />
}

export default HomePage