"use client";

import { useWallet } from "@/providers/WalletProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { disconnect, address } = useWallet();
  const router = useRouter();

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              CycleChain
            </h1>
          </Link>
          {address && (
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-sm text-secondary-500">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button
                onClick={handleDisconnect}
                className="text-sm px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
