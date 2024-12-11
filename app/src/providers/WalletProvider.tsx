"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import Web3 from "web3";
import { Provider } from "web3/providers";
import { toast } from "react-hot-toast";

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  web3: Web3 | null;
  switchWallet: () => Promise<void>;
  connectedAccounts: string[];
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connect: async () => {},
  disconnect: () => {},
  isLoading: true,
  web3: null,
  switchWallet: async () => {},
  connectedAccounts: [],
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);

  const updateAccounts = async (web3Instance: Web3) => {
    const accounts = await web3Instance.eth.getAccounts();
    setConnectedAccounts(accounts);
    return accounts;
  };

  useEffect(() => {
    const savedAddress = localStorage.getItem("lastConnectedAddress");

    const checkConnection = async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          const web3Instance = new Web3(window.ethereum as unknown as Provider);
          const accounts = await updateAccounts(web3Instance);

          if (accounts.length > 0) {
            // Connect to the last used address if available, otherwise use the first account
            const addressToUse =
              savedAddress && accounts.includes(savedAddress)
                ? savedAddress
                : accounts[0];

            setWeb3(web3Instance);
            setAddress(addressToUse);
            localStorage.setItem("lastConnectedAddress", addressToUse);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const connect = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        setIsLoading(true);
        const web3Instance = new Web3(window.ethereum as unknown as Provider);

        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await updateAccounts(web3Instance);

        if (accounts.length > 0) {
          setWeb3(web3Instance);
          setAddress(accounts[0]);
          localStorage.setItem("lastConnectedAddress", accounts[0]);
          toast.success("Wallet connected successfully");
        }
        setIsLoading(false);
      } else {
        toast.error("Please install MetaMask!");
        throw new Error("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
      setIsLoading(false);
      throw error;
    }
  };

  const switchWallet = async () => {
    try {
      setIsLoading(true);

      // Request to switch accounts
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // Get the newly selected account
      const accounts = await web3!.eth.getAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        localStorage.setItem("lastConnectedAddress", accounts[0]);
        await updateAccounts(web3!);
        toast.success("Wallet switched successfully");
      }
    } catch (error) {
      console.error("Failed to switch wallet:", error);
      toast.error("Failed to switch wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setWeb3(null);
    setConnectedAccounts([]);
    localStorage.removeItem("lastConnectedAddress");
    toast.success("Wallet disconnected");
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          localStorage.setItem("lastConnectedAddress", accounts[0]);
          if (web3) {
            await updateAccounts(web3);
          }
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [web3]);

  return (
    <WalletContext.Provider
      value={{
        address,
        connect,
        disconnect,
        isLoading,
        web3,
        switchWallet,
        connectedAccounts,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
