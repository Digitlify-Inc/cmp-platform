"use client";

import { Coins, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface WalletData {
  wallet_id: string | null;
  balance: number;
  currency: string;
}

interface CreditsBadgeProps {
  compact?: boolean;
  channel: string;
}

export function CreditsBadge({ compact = false, channel }: CreditsBadgeProps) {
  const { data: session, status } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Only fetch if authenticated
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      setLoading(false);
      return;
    }

    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/wallet");
        if (!res.ok) {
          throw new Error("Failed to fetch wallet");
        }
        const data = await res.json() as WalletData;
        setWallet(data);
      } catch (err) {
        console.error("Error fetching wallet:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [session, status]);

  // Not logged in - show nothing (UserMenu handles login)
  if (status === "unauthenticated" || !session) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 animate-pulse">
        <div className="h-4 w-4 rounded-full bg-neutral-200" />
        <div className="h-4 w-12 rounded bg-neutral-200" />
      </div>
    );
  }

  if (error || !wallet) {
    // Show zero balance on error
    return (
      <Link
        href={`/${channel}/account/billing`}
        className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-200 transition-colors"
      >
        <Coins className="h-4 w-4" />
        <span>0</span>
      </Link>
    );
  }

  if (compact) {
    return (
      <Link
        href={`/${channel}/account/billing`}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:from-amber-100 hover:to-orange-100 transition-colors"
      >
        <Coins className="h-4 w-4 text-amber-500" />
        <span>{wallet.balance.toLocaleString()}</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/${channel}/account/billing`}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-2 hover:from-amber-100 hover:to-orange-100 transition-colors"
      >
        <Coins className="h-5 w-5 text-amber-500" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-amber-800">
            {wallet.balance.toLocaleString()} credits
          </span>
        </div>
      </Link>
      <Link
        href={`/${channel}/pricing#topups`}
        className="flex items-center justify-center h-9 w-9 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        title="Top up credits"
      >
        <Plus className="h-4 w-4" />
      </Link>
    </div>
  );
}
