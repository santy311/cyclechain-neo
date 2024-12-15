"use client";

import { useState } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { cycleChainService } from "@/utils/cyclechain";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function RegisterBicycle() {
  const { address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    manufacturer: "",
    model: "",
    frameNumber: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.manufacturer || !formData.model || !formData.frameNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Register the bicycle
      await cycleChainService.registerBicycle(
        formData.frameNumber,
        formData.manufacturer,
        formData.model
      );

      // Reset form
      setFormData({
        manufacturer: "",
        model: "",
        frameNumber: "",
      });
    } catch (error) {
      console.error("Error registering bicycle:", error);
      toast.error("Failed to register bicycle");
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-secondary-500">
            Please connect your wallet to register bicycles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-secondary-800 mb-6">
            Register New Bicycle
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Frame Number
              </label>
              <input
                type="text"
                name="frameNumber"
                value={formData.frameNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:bg-primary-400"
            >
              {isLoading ? "Registering..." : "Register Bicycle"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
