/**
 * Control Plane API client for marketplace
 * Handles wallet, instances, and billing data fetching
 */

import { auth } from "@/lib/auth/config";

// Get the Control Plane URL - prefer server-side CONTROL_PLANE_URL, fallback to NEXT_PUBLIC_
function getControlPlaneUrl(): string {
  // Server-side: prefer CONTROL_PLANE_URL (internal service URL)
  if (typeof window === "undefined" && process.env.CONTROL_PLANE_URL) {
    return process.env.CONTROL_PLANE_URL;
  }
  // Client-side or fallback: use NEXT_PUBLIC_ (external URL)
  return process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "https://cp.dev.gsv.dev";
}

const CP_URL = getControlPlaneUrl();

/**
 * Fetch from Control Plane API with authentication
 */
export async function fetchFromControlPlane<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${CP_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Control Plane API error: ${res.status} ${res.statusText} - ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// Type definitions for Control Plane responses
// These match the actual serializer output from the Control Plane

export type Wallet = {
  wallet_id: string;
  balance: number;
  currency: string;
};

export type Instance = {
  id: string;
  name: string;
  state: "REQUESTED" | "PROVISIONING" | "ACTIVE" | "PAUSED" | "TERMINATED";
  organization: string;
  project: string;
  offering_version: {
    id: string;
    version_label: string;
    offering: {
      id: string;
      name: string;
      slug: string;
      category: string;
    };
  };
  plan: {
    id: string;
    name: string;
  };
  overrides: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LedgerEntry = {
  id: string;
  amount: number;
  entry_type: "topup" | "usage" | "trial_grant" | "refund" | "reservation" | "settlement";
  reference_id: string;
  instance: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

// API functions

/**
 * Get current user's wallet
 */
export async function getWallet(): Promise<Wallet> {
  return await fetchFromControlPlane<Wallet>("/wallets/me");
}

/**
 * Get current user's wallet ledger (transaction history)
 */
export async function getWalletLedger(): Promise<LedgerEntry[]> {
  return await fetchFromControlPlane<LedgerEntry[]>("/wallets/me/ledger");
}

/**
 * Get user's instances
 */
export async function getInstances(): Promise<Instance[]> {
  return await fetchFromControlPlane<Instance[]>("/instances/");
}

/**
 * Get a single instance by ID
 */
export async function getInstance(instanceId: string): Promise<Instance> {
  return await fetchFromControlPlane<Instance>(`/instances/${instanceId}/`);
}

/**
 * Auto-create or get organization for current user
 */
export async function getOrCreateOrganization() {
  return await fetchFromControlPlane<{
    organization: {
      id: string;
      name: string;
    };
    project: {
      id: string;
      name: string;
    };
    wallet: {
      id: string;
      balance: number;
    };
    trial_granted: boolean;
  }>("/orgs/auto", { method: "POST" });
}

// Helper to transform Instance to display format
export function formatInstanceForDisplay(instance: Instance) {
  return {
    id: instance.id,
    name: instance.name || instance.offering_version?.offering?.name || "Unnamed",
    state: instance.state,
    offeringName: instance.offering_version?.offering?.name || "Unknown",
    offeringSlug: instance.offering_version?.offering?.slug || "unknown",
    category: instance.offering_version?.offering?.category || "agent",
    planName: instance.plan?.name || "Free",
    createdAt: instance.created_at,
    updatedAt: instance.updated_at,
  };
}

// Helper to format ledger entry for display
export function formatLedgerEntry(entry: LedgerEntry) {
  const entryTypeLabels: Record<string, string> = {
    topup: "Credit Top-up",
    usage: "Agent Usage",
    trial_grant: "Trial Credits",
    refund: "Refund",
    reservation: "Reserved",
    settlement: "Settled",
  };

  return {
    id: entry.id,
    amount: entry.amount,
    type: entry.entry_type,
    typeLabel: entryTypeLabels[entry.entry_type] || entry.entry_type,
    isCredit: entry.amount > 0,
    referenceId: entry.reference_id,
    instanceId: entry.instance,
    metadata: entry.metadata,
    createdAt: entry.created_at,
  };
}
