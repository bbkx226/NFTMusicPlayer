import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import logo from "../../public/logo.png";

interface HeaderProps {
  handleWeb3Connection: () => Promise<void>;
  userAccount: null | string;
}

const Header: React.FC<HeaderProps> = ({ handleWeb3Connection, userAccount }) => {
  return (
    <nav className="bg-secondary text-white pt-4 flex justify-center">
      <div className="container flex justify-between items-center glass px-5 py-3">
        <Link className="flex items-center" href="/">
          <Image alt="Logo" height={40} src={logo} width={40} />
          <span className="ml-2 font-bold text-xl">TodayLand</span>
        </Link>
        
        <div className="flex items-center justify-between flex-grow ml-24">
          <Link href="/">Home</Link>
          <Link href="/tokens">My Tokens</Link>
          <Link href="/resales">My Resales</Link>
          {userAccount ? (
            <a
              className="mx-4"
              href={`https://etherscan.io/address/${userAccount}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {userAccount.slice(0, 5) + "..." + userAccount.slice(38, 42)}
            </a>
          ) : (
            <button className="bg-white text-black px-4 py-2 rounded" onClick={handleWeb3Connection}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
