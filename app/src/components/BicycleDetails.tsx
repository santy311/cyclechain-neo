"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/providers/WalletProvider";
import {
  cycleChainService,
  Bicycle,
  MaintenanceRecord,
  ComponentChange,
} from "@/utils/cyclechain";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-6 h-6 transition-transform duration-200 ${
      isOpen ? "transform rotate-180" : ""
    }`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export default function BicycleDetails() {
  const params = useParams();
  const id = params.id as string;
  const { address } = useWallet();
  const [bicycle, setBicycle] = useState<Bicycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showServiceHistory, setShowServiceHistory] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [componentChanges, setComponentChanges] = useState<ComponentChange[]>(
    []
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const loadBicycle = async () => {
      try {
        setIsLoading(true);
        const details = await cycleChainService.getBicycleDetails(Number(id));
        setBicycle(details);
      } catch (error) {
        console.error("Error loading bicycle:", error);
        toast.error("Failed to load bicycle details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadBicycle();
    }
  }, [id]);

  const loadServiceHistory = async () => {
    if (!bicycle) return;

    try {
      setIsLoadingHistory(true);
      const [maintenance, components] = await Promise.all([
        cycleChainService.getMaintenanceHistory(bicycle.tokenId),
        cycleChainService.getComponentChanges(bicycle.tokenId),
      ]);

      setMaintenanceRecords(maintenance);
      setComponentChanges(components);
      setShowServiceHistory(true);
    } catch (error) {
      console.error("Error loading service history:", error);
      toast.error("Failed to load service history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReportStolen = async () => {
    try {
      if (!bicycle) return;
      await cycleChainService.reportStolen(bicycle.tokenId);
      // Refresh bicycle details
      const updated = await cycleChainService.getBicycleDetails(
        bicycle.tokenId
      );
      setBicycle(updated);
      toast.success("Bicycle reported as stolen");
    } catch (error) {
      console.error("Error reporting stolen:", error);
      toast.error("Failed to report bicycle as stolen");
    }
  };

  const handleTransferOwnership = async () => {
    try {
      if (!bicycle) return;
      const newOwner = prompt("Enter the address of the new owner:");
      if (!newOwner) return;

      await cycleChainService.transferBicycle(bicycle.tokenId, newOwner);
      toast.success("Bicycle transferred successfully");
      // Redirect to dashboard after successful transfer
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error transferring bicycle:", error);
      toast.error("Failed to transfer bicycle");
    }
  };

  const ServiceHistoryHeader = () => (
    <div
      onClick={() => {
        if (showServiceHistory) {
          setShowServiceHistory(false);
        } else {
          loadServiceHistory();
        }
      }}
      className="mt-8 border-t pt-8 cursor-pointer group"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-secondary-800">
          Service History
        </h2>
        <div className="text-secondary-600 group-hover:text-secondary-800 transition-colors">
          <ChevronIcon isOpen={showServiceHistory} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-secondary-500">
            Loading bicycle details...
          </p>
        </div>
      </div>
    );
  }

  if (!bicycle) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-500">Bicycle not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Image Section */}
          <div className="relative h-64 sm:h-96 bg-secondary-50">
            <Image
              src="/images/bike-placeholder.png"
              alt={`${bicycle.manufacturer} ${bicycle.model}`}
              fill
              className="object-contain p-4"
            />
          </div>

          {/* Details Section */}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-secondary-800">
                  {bicycle.manufacturer} {bicycle.model}
                </h1>
                <p className="text-secondary-500 mt-1">
                  Frame Number: {bicycle.frameNumber}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  bicycle.isStolen
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {bicycle.isStolen ? "Stolen" : "Safe"}
              </span>
            </div>

            {/* Additional Details */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary-50 rounded-lg">
                <h3 className="font-semibold text-secondary-700">
                  Manufacture Date
                </h3>
                <p className="text-secondary-600">
                  {bicycle.manufactureDate.toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <h3 className="font-semibold text-secondary-700">
                  Current Owner
                </h3>
                <p className="text-secondary-600 break-all">
                  {bicycle.currentOwner === address
                    ? "You"
                    : bicycle.currentOwner}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {bicycle.currentOwner === address && (
                <>
                  <button
                    onClick={handleTransferOwnership}
                    className="px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                  >
                    Transfer Ownership
                  </button>
                  {!bicycle.isStolen && (
                    <button
                      onClick={handleReportStolen}
                      className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      Report Stolen
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Service History Section with new header */}
            <ServiceHistoryHeader />

            {/* Animate the content */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showServiceHistory
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              {showServiceHistory && (
                <div className="space-y-8">
                  {isLoadingHistory ? (
                    <p className="text-center text-secondary-500">
                      Loading service history...
                    </p>
                  ) : (
                    <>
                      {/* Maintenance Records section */}
                      <div>
                        <h3 className="text-lg font-semibold text-secondary-700 mb-4">
                          Maintenance Records
                        </h3>
                        {maintenanceRecords.length === 0 ? (
                          <p className="text-secondary-500">
                            No maintenance records found
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {maintenanceRecords.map((record, index) => (
                              <div
                                key={index}
                                className="bg-secondary-50 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-secondary-800">
                                      {record.serviceDescription}
                                    </h4>
                                    <p className="text-sm text-secondary-600 mt-1">
                                      {record.notes}
                                    </p>
                                  </div>
                                  <div className="text-sm text-secondary-500">
                                    {new Date(record.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <p className="text-sm text-secondary-600 mt-2">
                                  Service Provider: {record.serviceProvider}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Component Changes section */}
                      <div>
                        <h3 className="text-lg font-semibold text-secondary-700 mb-4">
                          Component Changes
                        </h3>
                        {componentChanges.length === 0 ? (
                          <p className="text-secondary-500">
                            No component changes recorded
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {componentChanges.map((change, index) => (
                              <div
                                key={index}
                                className="bg-secondary-50 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-secondary-800">
                                      {change.componentType}
                                    </h4>
                                    <p className="text-sm text-secondary-600 mt-1">
                                      {change.newComponentDetails}
                                    </p>
                                  </div>
                                  <div className="text-sm text-secondary-500">
                                    {new Date(change.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <p className="text-sm text-secondary-600 mt-2">
                                  Installed By: {change.installedBy}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
