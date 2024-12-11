"use client";

import { useWallet } from "@/providers/WalletProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectWallet() {
  const { connect, address, disconnect, isLoading } = useWallet();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect wallet");
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-400 cursor-not-allowed"
      >
        Connecting...
      </button>
    );
  }

  if (address) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleDisconnect}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Disconnect Wallet
        </button>
        <p className="text-xs text-center text-gray-500">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Connect Wallet
      </button>
      {error && <p className="text-xs text-center text-red-500">{error}</p>}
    </div>
  );
}
