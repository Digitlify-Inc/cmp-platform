"use server";

import { auth } from "@/lib/auth/config";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://api.dev.gsv.dev";

export type RunResult = {
  success: boolean;
  runId?: string;
  text?: string;
  data?: Record<string, unknown>;
  usage?: {
    tokensIn: number;
    tokensOut: number;
    toolCalls: number;
  };
  billing?: {
    debited: number;
    balance: number;
  };
  error?: string;
};

export async function executeRun({
  instanceId,
  query,
  messages,
}: {
  instanceId: string;
  query?: string;
  messages?: Array<{ role: string; content: string }>;
}): Promise<RunResult> {
  const session = await auth();

  if (!session?.accessToken) {
    return {
      success: false,
      error: "Not authenticated. Please sign in.",
    };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/v1/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        instance_id: instanceId,
        input: {
          query,
          messages,
        },
      }),
    });

    if (res.status === 402) {
      return {
        success: false,
        error: "Insufficient credits. Please top up your balance.",
      };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})) as { detail?: string; error?: { message?: string } };
      return {
        success: false,
        error: errorData.detail || `Request failed: ${res.statusText}`,
      };
    }

    const data = await res.json() as { run_id?: string; output?: { text?: string; data?: Record<string, unknown> }; usage?: { llm_tokens_in?: number; llm_tokens_out?: number; tool_calls?: number }; billing?: { debited?: number; balance?: number } };
    return {
      success: true,
      runId: data.run_id,
      text: data.output?.text,
      data: data.output?.data,
      usage: {
        tokensIn: data.usage?.llm_tokens_in || 0,
        tokensOut: data.usage?.llm_tokens_out || 0,
        toolCalls: data.usage?.tool_calls || 0,
      },
      billing: {
        debited: data.billing?.debited || 0,
        balance: data.billing?.balance || 0,
      },
    };
  } catch (e) {
    console.error("Run execution failed:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to execute run",
    };
  }
}
