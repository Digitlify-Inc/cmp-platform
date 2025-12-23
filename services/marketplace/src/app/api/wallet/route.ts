import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

// Use internal URL for API routes - CONTROL_PLANE_URL is the k8s service URL
const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const res = await fetch(`${CP_URL}/wallets/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      // Don't cache wallet balance
      cache: "no-store",
    });

    if (!res.ok) {
      // If 404, user has no wallet yet - return zero balance
      if (res.status === 404) {
        return NextResponse.json({
          wallet_id: null,
          balance: 0,
          currency: "CREDITS",
        });
      }
      return NextResponse.json(
        { error: "Failed to fetch wallet" },
        { status: res.status }
      );
    }

    const wallet = await res.json();
    return NextResponse.json(wallet);
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
