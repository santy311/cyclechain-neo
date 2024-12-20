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
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

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

const SecureContextWarning = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-red-600">Security Notice</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <p className="text-gray-800 mb-4">
        Camera access is only available in secure contexts (HTTPS or localhost).
        To use the QR scanner:
      </p>
      <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
        <li>Access this page via localhost, or</li>
        <li>Use a secure HTTPS connection, or</li>
        <li>Enter the recipient's address manually</li>
      </ul>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
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
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanError, setScanError] = useState<string>("");
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

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

  useEffect(() => {
    if (bicycle && address) {
      console.log("Ownership check:", {
        currentOwner: bicycle.currentOwner.toLowerCase(),
        userAddress: address.toLowerCase(),
        isMatch: bicycle.currentOwner.toLowerCase() === address.toLowerCase(),
      });
    }
  }, [bicycle, address]);

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

  const handleTransferOwnership = async (address: string) => {
    try {
      if (!bicycle) return;

      await cycleChainService.transferBicycle(bicycle.tokenId, address);
      toast.success("Bicycle transferred successfully");
      setShowQRScanner(false);
      // Redirect to dashboard after successful transfer
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error transferring bicycle:", error);
      toast.error("Failed to transfer bicycle");
      throw error; // Re-throw to handle in the scanner
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

  const QRScannerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transfer Ownership</h3>
          <button
            onClick={() => {
              setShowQRScanner(false);
              setShowManualInput(false);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {showManualInput ? (
          <div className="space-y-4">
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter Ethereum address (0x...)"
              className="w-full p-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowManualInput(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransferOwnership(manualAddress)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Transfer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Point your camera at the recipient's Ethereum address QR code to
              transfer ownership.
            </div>

            <div className="relative">
              <div id="qr-reader" className="w-full"></div>
            </div>

            {scanError && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {scanError}
              </p>
            )}

            <button
              onClick={() => setShowManualInput(true)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Enter Address Manually
            </button>
          </>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    let scanner: any = null;

    if (showQRScanner && !showManualInput) {
      try {
        // Check if we're in a secure context
        if (!window.isSecureContext) {
          setShowSecurityWarning(true);
          return;
        }

        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            console.log("Scanned QR Code content:", decodedText);

            // Extract Ethereum address from URI format
            let address = decodedText;
            if (decodedText.startsWith("ethereum:")) {
              address = decodedText.split(":")[1].split("@")[0];
            }

            console.log("Extracted address:", address);

            if (address.startsWith("0x")) {
              setScanError("");
              // First clear the scanner
              scanner.clear();
              setShowQRScanner(false);
              // Then attempt the transfer
              handleTransferOwnership(address).catch((error) => {
                console.error("Transfer failed:", error);
                toast.error("Failed to transfer bicycle");
              });
            } else {
              setScanError(
                "Invalid Ethereum address. Please scan a valid address QR code."
              );
            }
          },
          (errorMessage: string) => {
            if (!errorMessage.includes("No barcode or QR code detected")) {
              console.log("Scanning error:", errorMessage);
            }

            if (
              errorMessage.includes("No barcode or QR code detected") ||
              errorMessage.includes("NotFound") ||
              errorMessage.includes("NotAllowed") ||
              errorMessage.includes("QR code parse error")
            ) {
              return;
            }

            if (errorMessage.includes("Camera access denied")) {
              setScanError("Please allow camera access to scan QR codes.");
            } else if (errorMessage.includes("Camera not found")) {
              setScanError("No camera found on your device.");
            } else {
              setScanError("Error scanning QR code. Please try again.");
            }
          }
        );
      } catch (err) {
        console.error("Failed to start scanner:", err);
        setScanError(
          "Failed to start QR scanner. Please check camera permissions."
        );
      }
    }

    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (error) {
          console.error("Error clearing scanner:", error);
        }
      }
    };
  }, [showQRScanner, showManualInput]);

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

            {/* Move Action Buttons here, right after the main details */}
            <div className="mt-8">
              {bicycle.currentOwner.toLowerCase() === address?.toLowerCase() ? (
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowQRScanner(true)}
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
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Only the owner can perform actions on this bicycle
                </p>
              )}
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
                  {bicycle.currentOwner.toLowerCase() === address?.toLowerCase()
                    ? "You"
                    : bicycle.currentOwner}
                </p>
              </div>
            </div>

            {/* Service History Section */}
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
      {showQRScanner && <QRScannerModal />}
      {showSecurityWarning && (
        <SecureContextWarning onClose={() => setShowSecurityWarning(false)} />
      )}
    </div>
  );
}
