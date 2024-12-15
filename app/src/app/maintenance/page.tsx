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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add Maintenance Record</h1>

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="tokenId" className="block text-sm font-medium mb-2">
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
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="serviceDescription"
            className="block text-sm font-medium mb-2"
          >
            Service Description
          </label>
          <input
            type="text"
            id="serviceDescription"
            placeholder="e.g., Annual maintenance, brake replacement"
            value={formData.serviceDescription}
            onChange={(e) =>
              setFormData({ ...formData, serviceDescription: e.target.value })
            }
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Service Notes
          </label>
          <textarea
            id="notes"
            placeholder="Enter detailed notes about the service performed..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full p-2 border rounded-md h-32"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Add Maintenance Record
        </button>
      </form>

      {/* Example Records Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Example Maintenance Records
        </h2>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="font-medium">Example entries:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
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
  );
}
