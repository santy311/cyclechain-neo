"use client";

import dynamic from "next/dynamic";

const ConnectWallet = dynamic(
  () => import("@/components/ConnectWallet").then((mod) => mod.ConnectWallet),
  {
    ssr: false,
  }
);

const StoreLogin = dynamic(
  () => import("@/components/StoreLogin").then((mod) => mod.StoreLogin),
  {
    ssr: false,
  }
);

export function LoginSection() {
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <ConnectWallet />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-700 font-medium">Or</span>
        </div>
      </div>
      <StoreLogin />
    </div>
  );
}
