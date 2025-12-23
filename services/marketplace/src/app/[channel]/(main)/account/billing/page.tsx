import { Metadata } from "next";
import Link from "next/link";
import { Coins, Plus, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle } from "lucide-react";
import { getWallet, getWalletLedger, formatLedgerEntry, type Wallet, type LedgerEntry } from "@/lib/control-plane";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Billing & Credits | Digitlify",
  description: "Manage your credits and billing",
};

// Fallback wallet for when API is unavailable
const fallbackWallet: Wallet = {
  wallet_id: "demo",
  balance: 0,
  currency: "CREDITS",
};

async function fetchWalletData(): Promise<{ wallet: Wallet; ledger: LedgerEntry[]; isLive: boolean }> {
  try {
    const [wallet, ledger] = await Promise.all([
      getWallet(),
      getWalletLedger().catch(() => []),
    ]);
    return { wallet, ledger, isLive: true };
  } catch (error) {
    console.error("Failed to fetch wallet:", error);
    return { wallet: fallbackWallet, ledger: [], isLive: false };
  }
}

export default async function BillingPage(props: {
  params: Promise<{ channel: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session) {
    redirect(`/${params.channel}/login?callbackUrl=/${params.channel}/account/billing`);
  }

  const { wallet, ledger, isLive } = await fetchWalletData();
  const displayLedger = ledger.map(formatLedgerEntry);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Billing & Credits</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your credits, view usage, and purchase top-ups
        </p>
      </div>

      {!isLive && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Unable to load live data</p>
            <p className="text-sm text-amber-700 mt-1">
              Showing placeholder information. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* Wallet Card */}
      <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-violet-200">Current Balance</p>
            <div className="mt-1 flex items-center gap-2">
              <Coins className="h-8 w-8 text-amber-300" />
              <span className="text-4xl font-bold">{wallet.balance.toLocaleString()}</span>
              <span className="text-lg text-violet-200">credits</span>
            </div>
          </div>
          <Link
            href={`/${params.channel}/pricing#topups`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Top Up
          </Link>
        </div>
        {wallet.balance === 0 && (
          <div className="mt-4 rounded-lg bg-violet-500/20 p-3">
            <p className="text-sm text-violet-100">
              Your credits balance is empty. Top up to continue using your AI agents.
            </p>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Transaction History</h2>
        </div>
        {displayLedger.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {displayLedger.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    entry.isCredit ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {entry.isCredit ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{entry.typeLabel}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  entry.isCredit ? "text-green-600" : "text-red-600"
                }`}>
                  {entry.isCredit ? "+" : ""}{entry.amount.toLocaleString()} credits
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-sm text-neutral-500">
              Transaction history will appear here as you use your AI agents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
