import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

interface UsagePageProps {
  params: Promise<{ channel: string; instanceId: string }>;
}

const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";

interface UsageStats {
  total_runs: number;
  tokens_in: number;
  tokens_out: number;
  credits_used: number;
  credits_remaining: number;
  period_start: string;
  period_end: string;
}

interface UsageEvent {
  id: string;
  run_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  credits: number;
  status: string;
  created_at: string;
}

async function getUsageStats(instanceId: string, accessToken: string): Promise<UsageStats | null> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/usage/stats/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      // Return mock data if endpoint not available
      return {
        total_runs: 0,
        tokens_in: 0,
        tokens_out: 0,
        credits_used: 0,
        credits_remaining: 1000,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
      };
    }
    return await response.json() as UsageStats;
  } catch {
    return {
      total_runs: 0,
      tokens_in: 0,
      tokens_out: 0,
      credits_used: 0,
      credits_remaining: 1000,
      period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    };
  }
}

async function getUsageEvents(instanceId: string, accessToken: string): Promise<UsageEvent[]> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/usage/events/?limit=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json() as UsageEvent[];
  } catch {
    return [];
  }
}

export default async function UsagePage({ params }: UsagePageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.accessToken) {
    redirect(`/${resolvedParams.channel}/login?callbackUrl=/account/instances/${resolvedParams.instanceId}/usage`);
  }

  const [stats, events] = await Promise.all([
    getUsageStats(resolvedParams.instanceId, session.accessToken),
    getUsageEvents(resolvedParams.instanceId, session.accessToken),
  ]);

  const usagePercent = stats ? (stats.credits_used / (stats.credits_used + stats.credits_remaining)) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}`}
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Instance
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usage & Billing</h1>
        <p className="mt-1 text-gray-500">
          Monitor your credit usage and transaction history
        </p>
      </div>

      {/* Usage Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Runs</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.total_runs.toLocaleString() || 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Tokens In</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.tokens_in.toLocaleString() || 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Tokens Out</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.tokens_out.toLocaleString() || 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Credits Used</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.credits_used.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Credit Balance */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Credit Balance</h2>
            <p className="text-sm text-gray-500">
              Current billing period: {stats ? new Date(stats.period_start).toLocaleDateString() : "--"} - {stats ? new Date(stats.period_end).toLocaleDateString() : "--"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {stats?.credits_remaining.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500">credits remaining</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{stats?.credits_used.toLocaleString() || 0} used</span>
            <span>{((stats?.credits_used || 0) + (stats?.credits_remaining || 0)).toLocaleString()} total</span>
          </div>
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-4 rounded-full bg-violet-600 transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          {usagePercent > 80 && (
            <p className="mt-2 text-sm text-amber-600">
              You have used {usagePercent.toFixed(0)}% of your credits. Consider upgrading your plan.
            </p>
          )}
        </div>
      </div>

      {/* Recent Usage Events */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {event.model}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {event.tokens_in.toLocaleString()} / {event.tokens_out.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {event.credits.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        event.status === "success"
                          ? "bg-green-100 text-green-800"
                          : event.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No activity yet</h3>
            <p className="mt-2 text-gray-500">
              Usage data will appear here once you start using your agent.
            </p>
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-8 rounded-lg border border-violet-200 bg-violet-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-violet-900">Need more credits?</h3>
            <p className="mt-1 text-sm text-violet-700">
              Upgrade your plan or purchase additional credit packs.
            </p>
          </div>
          <Link
            href={`/${resolvedParams.channel}/account/billing`}
            className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Manage Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
