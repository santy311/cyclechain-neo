"use client";

import { useState } from "react";
import { cycleChainService } from "@/utils/cyclechain";
import { toast } from "react-hot-toast";

export default function MaintenancePage() {
  const [formData, setFormData] = useState({
    tokenId: "",
    serviceDescription: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const success = await cycleChainService.addMaintenanceRecord(
        Number(formData.tokenId),
        formData.serviceDescription,
        formData.notes
      );

      if (success) {
        toast.success("Maintenance record added successfully");
        setFormData({
          tokenId: "",
          serviceDescription: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error adding maintenance record:", error);
      toast.error("Failed to add maintenance record");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Add Maintenance Record
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="max-w-lg">
            <div className="mb-6">
              <label
                htmlFor="tokenId"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Bicycle Token ID
              </label>
              <input
                type="number"
                id="tokenId"
                placeholder="Enter bicycle token ID (e.g., 123)"
                value={formData.tokenId}
                onChange={(e) =>
                  setFormData({ ...formData, tokenId: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="serviceDescription"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Service Description
              </label>
              <input
                type="text"
                id="serviceDescription"
                placeholder="e.g., Annual maintenance, brake replacement"
                value={formData.serviceDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serviceDescription: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="notes"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Service Notes
              </label>
              <textarea
                id="notes"
                placeholder="Enter detailed notes about the service performed..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Add Maintenance Record
            </button>
          </form>
        </div>

        {/* Example Records Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Example Maintenance Records
          </h2>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <p className="font-semibold text-gray-800 mb-3">Example entries:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Token ID: 1234</li>
              <li>Service Description: Annual maintenance service</li>
              <li>
                Notes: Performed full inspection, replaced brake pads, adjusted
                gears, lubricated chain
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
