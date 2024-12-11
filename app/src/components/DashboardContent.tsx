"use client";

import { useWallet } from "@/providers/WalletProvider";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cycleChainService, Bicycle } from "@/utils/cyclechain";

interface NFTItem {
  id: string;
  name: string;
  image: string;
  description: string;
}

export function DashboardContent() {
  const { address } = useWallet();
  const [items] = useState<NFTItem[]>([
    {
      id: "1",
      name: "Mountain Bike",
      image: "/images/bike.png",
      description: "High-performance mountain bike",
    },
    {
      id: "2",
      name: "Richard Mille RM 72-01",
      image: "/images/watch.jpg",
      description: "Automatic Winding Lifestyle Flyback Chronograph",
    },
  ]);
  const [bicycle, setBicycle] = useState<Bicycle | null>(null);

  useEffect(() => {
    // Example: Load bicycle with tokenId 1
    const loadBicycle = async () => {
      const details = await cycleChainService.getBicycleDetails(1);
      if (details) {
        setBicycle(details);
      }
    };

    loadBicycle();
  }, []);

  return (
    <div className="min-h-[calc(100vh-73px)] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-secondary-800">
            Things you own
          </h1>
          <div className="text-sm px-4 py-2 rounded-full bg-secondary-100 text-secondary-600">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl">
            <p className="text-secondary-500">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="block group"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="aspect-square bg-secondary-50 relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-secondary-800 group-hover:text-primary-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-secondary-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {bicycle ? (
          <div>
            <h2>Bicycle Details</h2>
            <p>Frame Number: {bicycle.frameNumber}</p>
            <p>Manufacturer: {bicycle.manufacturer}</p>
            <p>Model: {bicycle.model}</p>
            <p>Status: {bicycle.isStolen ? "Stolen" : "Safe"}</p>
          </div>
        ) : (
          <p>Loading bicycle details...</p>
        )}
      </div>
    </div>
  );
}
