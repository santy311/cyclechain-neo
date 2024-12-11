"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { ethers } from "ethers";

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connect: async () => {},
  disconnect: () => {},
  isLoading: true,
  provider: null,
  signer: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setProvider(provider);
            setSigner(signer);
            setAddress(address);
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
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setProvider(provider);
        setSigner(signer);
        setAddress(address);
        setIsLoading(false);
      } else {
        throw new Error("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        connect,
        disconnect,
        isLoading,
        provider,
        signer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
