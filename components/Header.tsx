import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import Link from "next/link";

import logo from "../public/logo.png";

interface HeaderProps {
  handleWeb3Connection: () => Promise<void>;
  userAccount: null | string;
}

const ARTIST_ACCOUNT_NUMBER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const Header: React.FC<HeaderProps> = ({ handleWeb3Connection, userAccount }) => {
  return (
    <div className="text-white pt-3 flex justify-center">
      <div className="container flex justify-between items-center px-5 py-4">
        <Link className="flex items-center" href="/">
          <Image alt="Logo" height={40} src={logo} width={40} />
          <span className="ml-2 font-bold text-2xl">Todayland</span>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            {userAccount && userAccount.toLowerCase() !== ARTIST_ACCOUNT_NUMBER.toLowerCase() && (
              <>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <div className="text-base">Home</div>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/tokens" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <div className="text-base">My Tokens</div>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/resales" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <div className="text-base">My Resales</div>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </>
            )}
            <NavigationMenuItem>
              {userAccount ? (
                <Button asChild variant="secondary">
                  <Link href={`https://etherscan.io/address/${userAccount}`} rel="noopener noreferrer" target="_blank">
                    {/* {userAccount.slice(0, 5) + "..." + userAccount.slice(38, 42)} */}
                    <div className="text-base">View on Etherscan</div>
                  </Link>
                </Button>
              ) : (
                <Button onClick={handleWeb3Connection}>Connect Wallet</Button>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default Header;
