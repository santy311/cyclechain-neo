"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface NFTItem {
  id: string;
  name: string;
  image: string;
  description: string;
}

// This is temporary mock data - should be moved to a proper data service
const mockItems: NFTItem[] = [
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
];

export default function ItemDetailsPage() {
  const params = useParams();
  const [item, setItem] = useState<NFTItem | null>(null);

  useEffect(() => {
    // In a real application, this would fetch from an API
    const foundItem = mockItems.find((i) => i.id === params.id);
    setItem(foundItem || null);
  }, [params.id]);

  if (!item) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl">
            <p className="text-secondary-500">Item not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="aspect-square relative bg-secondary-50 rounded-xl">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover p-4"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-secondary-800 mb-4">
                {item.name}
              </h1>
              <p className="text-secondary-600 mb-6">{item.description}</p>

              <div className="space-y-4">
                <button className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Transfer Item
                </button>
                <button className="w-full px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors">
                  View History
                </button>
                <button className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Report Stolen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
