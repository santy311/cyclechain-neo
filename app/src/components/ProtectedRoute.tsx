"use client";

import { useWallet } from "@/providers/WalletProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { address, isLoading } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !address) {
      router.push("/");
    }
  }, [address, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!address) {
    return null;
  }

  return <>{children}</>;
}
