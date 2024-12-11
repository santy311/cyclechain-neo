"use client";

import { useWallet } from "@/providers/WalletProvider";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cycleChainService, Bicycle } from "@/utils/cyclechain";
import { toast } from "react-hot-toast";

export function DashboardContent() {
  const { address, switchWallet, connectedAccounts } = useWallet();
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBicycles = async () => {
      try {
        setIsLoading(true);
        const ownedBicycles = await cycleChainService.getOwnedBicycles();
        setBicycles(ownedBicycles);
      } catch (error) {
        console.error("Error loading bicycles:", error);
        toast.error("Failed to load your bicycles");
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      loadBicycles();
    }
  }, [address]);

  return (
    <div className="min-h-[calc(100vh-73px)] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-secondary-800">
            Your Bicycles
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm px-4 py-2 rounded-full bg-secondary-100 text-secondary-600">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <button
              onClick={switchWallet}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
            >
              Switch Wallet
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl">
            <p className="text-secondary-500">Loading your bicycles...</p>
          </div>
        ) : bicycles.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl">
            <p className="text-secondary-500">You don't own any bicycles yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bicycles.map((bicycle) => (
              <Link
                key={bicycle.tokenId}
                href={`/bicycles/${bicycle.tokenId}`}
                className="block group"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="aspect-square bg-secondary-50 relative">
                    <Image
                      src="/images/bike-placeholder.png" // Add a default bicycle image
                      alt={`${bicycle.manufacturer} ${bicycle.model}`}
                      fill
                      className="object-cover p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-secondary-800 group-hover:text-primary-600 transition-colors">
                      {bicycle.manufacturer} {bicycle.model}
                    </h3>
                    <p className="text-sm text-secondary-500 mt-1">
                      Frame: {bicycle.frameNumber}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          bicycle.isStolen
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {bicycle.isStolen ? "Stolen" : "Safe"}
                      </span>
                      <span className="text-xs text-secondary-400">
                        ID: {bicycle.tokenId}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
