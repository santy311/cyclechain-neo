import { LoginSection } from "@/components/LoginSection";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Welcome to CycleChain
          </h1>
          <p className="mt-2 text-secondary-600">
            Connect your wallet or login as a store owner
          </p>
        </div>
        <LoginSection />
      </main>
    </div>
  );
}
