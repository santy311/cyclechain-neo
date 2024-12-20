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
      console.error("Error registering Product:", error);
      toast.error("Failed to register Product");
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-900 font-medium">
            Please connect your manufacturer wallet to register Product.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Register New Product
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Frame Number
              </label>
              <input
                type="text"
                name="frameNumber"
                value={formData.frameNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:bg-blue-400"
            >
              {isLoading ? "Registering..." : "Register Product"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
