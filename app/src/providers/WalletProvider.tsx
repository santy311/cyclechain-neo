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

// Add these network constants
const REQUIRED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const NETWORK_CONFIG = {
  chainId: `0x${Number(REQUIRED_CHAIN_ID).toString(16)}`,
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME,
  nativeCurrency: {
    name: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL,
    symbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
};

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

  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      // Try switching to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
          toast.error("Failed to add network to wallet");
          throw addError;
        }
      } else {
        console.error("Failed to switch network:", switchError);
        toast.error("Failed to switch network");
        throw switchError;
      }
    }
  };

  const connect = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        setIsLoading(true);

        // First ensure we're on the correct network
        await checkAndSwitchNetwork();

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
      } else {
        toast.error("Please install MetaMask!");
        throw new Error("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
      throw error;
    } finally {
      setIsLoading(false);
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

  // Modify the useEffect for checking initial connection
  useEffect(() => {
    const savedAddress = localStorage.getItem("lastConnectedAddress");

    const checkConnection = async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          // Check if we're on the correct network
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          if (parseInt(chainId, 16) !== REQUIRED_CHAIN_ID) {
            setIsLoading(false);
            return;
          }

          const web3Instance = new Web3(window.ethereum as unknown as Provider);
          const accounts = await updateAccounts(web3Instance);

          if (accounts.length > 0) {
            const addressToUse =
              savedAddress && accounts.includes(savedAddress)
                ? savedAddress
                : accounts[0];

            setWeb3(web3Instance);
            setAddress(addressToUse);
            localStorage.setItem("lastConnectedAddress", addressToUse);
          }
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

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
