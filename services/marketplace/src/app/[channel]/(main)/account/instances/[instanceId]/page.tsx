import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

interface InstanceDetailPageProps {
  params: Promise<{ channel: string; instanceId: string }>;
}

// Use internal URL for server-side rendering
const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";

// Instance state colors matching Control Plane states
const stateColors: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  provisioning: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-gray-100 text-gray-800",
  terminated: "bg-red-100 text-red-800",
};

// Configuration sections for the agent
const configSections = [
  {
  {
    id: "channels",
    title: "Channels",
    description: "Widget, API, and integration options",
    icon: "W",
    href: "channels",
  },
    id: "api-keys",
    title: "API Keys",
    description: "Manage API keys for programmatic access",
    icon: "K",
    href: "api-keys",
  },
  {
    id: "entitlements",
    title: "Entitlements",
    description: "View your plan capabilities and limits",
    icon: "E",
    href: "entitlements",
  },
  {
    id: "connectors",
    title: "Connectors",
    description: "Configure external service integrations",
    icon: "C",
    href: "connectors",
  },
  {
    id: "branding",
    title: "Branding",
    description: "Customize appearance and messaging",
    icon: "B",
    href: "branding",
  },
  {
    id: "usage",
    title: "Usage & Billing",
    description: "View credit usage and transaction history",
    icon: "U",
    href: "usage",
  },
  {
  },
];

interface Instance {
  id: string;
  name: string;
  state: string;
  offering?: { name: string };
  created_at: string;
  endpoint?: string;
  credits_used?: number;
  offering_version?: string;
}

async function getInstanceDetail(instanceId: string, accessToken: string): Promise<Instance | null> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch instance: ${response.status}`);
    }

    return await response.json() as Instance;
  } catch (error) {
    console.error("Error fetching instance:", error);
    return null;
  }
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
}

async function getInstanceAPIKeys(instanceId: string, accessToken: string): Promise<APIKey[]> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/api_keys/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return await response.json() as APIKey[];
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return [];
  }
}

interface Entitlements {
  credits_remaining?: number;
  capabilities?: Record<string, boolean | string | number>;
  [key: string]: unknown;
}

async function getInstanceEntitlements(instanceId: string, accessToken: string): Promise<Entitlements | null> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/entitlements/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as Entitlements;
  } catch (error) {
    console.error("Error fetching entitlements:", error);
    return null;
  }
}

export default async function InstanceDetailPage({ params }: InstanceDetailPageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.accessToken) {
    redirect(`/${resolvedParams.channel}/login?callbackUrl=/account/instances/${resolvedParams.instanceId}`);
  }

  const [instance, apiKeys, entitlements] = await Promise.all([
    getInstanceDetail(resolvedParams.instanceId, session.accessToken),
    getInstanceAPIKeys(resolvedParams.instanceId, session.accessToken),
    getInstanceEntitlements(resolvedParams.instanceId, session.accessToken),
  ]);

  // If instance not found, show a placeholder with the ID
  const displayInstance = instance || {
    id: resolvedParams.instanceId,
    name: `Agent ${resolvedParams.instanceId.slice(0, 8)}`,
    state: "requested",
    offering: { name: "Unknown Plan" },
    created_at: new Date().toISOString(),
  };

  const stateColorClass = stateColors[displayInstance.state] || stateColors.requested;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href={`/${resolvedParams.channel}/account/instances`}
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Agents
      </Link>

      {/* Instance Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{displayInstance.name}</h1>
          <p className="mt-1 text-gray-500">
            {displayInstance.offering?.name || "Standard Plan"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${stateColorClass}`}>
            {displayInstance.state}
          </span>
          {displayInstance.state === "active" && displayInstance.endpoint && (
            <a
              href={displayInstance.endpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Open Agent
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Status</div>
          <div className="mt-1 text-2xl font-semibold capitalize">{displayInstance.state}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">API Keys</div>
          <div className="mt-1 text-2xl font-semibold">{Array.isArray(apiKeys) ? apiKeys.length : 0}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Credits Used</div>
          <div className="mt-1 text-2xl font-semibold">{displayInstance.credits_used || 0}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Credits Remaining</div>
          <div className="mt-1 text-2xl font-semibold">{entitlements?.credits_remaining ?? "--"}</div>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Manage Your Agent</h2>
        <p className="mt-1 text-gray-500">
          Configure API access, view entitlements, and manage integrations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configSections.map((section) => (
          <Link
            key={section.id}
            href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}/${section.href}`}
            className="group rounded-lg border bg-white p-6 shadow-sm transition-all hover:border-violet-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-lg font-semibold text-violet-600">
              {section.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-violet-600">{section.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{section.description}</p>
          </Link>
        ))}
      </div>

      {/* API Keys Quick View */}
      {Array.isArray(apiKeys) && apiKeys.length > 0 && (
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Active API Keys</h3>
            <Link
              href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}/api-keys`}
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              Manage Keys
            </Link>
          </div>
          <div className="space-y-2">
            {apiKeys.slice(0, 3).map((key: { id: string; name: string; prefix: string; created_at: string }) => (
              <div key={key.id} className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2">
                <div>
                  <span className="font-medium text-gray-900">{key.name}</span>
                  <span className="ml-2 font-mono text-sm text-gray-500">{key.prefix}...</span>
                </div>
                <span className="text-sm text-gray-500">
                  Created {new Date(key.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instance Details */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Instance Details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Instance ID</dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">{displayInstance.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(displayInstance.created_at).toLocaleDateString()}
            </dd>
          </div>
          {displayInstance.offering_version && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Version</dt>
              <dd className="mt-1 text-sm text-gray-900">{displayInstance.offering_version}</dd>
            </div>
          )}
          {displayInstance.endpoint && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Endpoint</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{displayInstance.endpoint}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Entitlements Summary */}
      {entitlements && (
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Plan Entitlements</h3>
            <Link
              href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}/entitlements`}
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {entitlements.capabilities && Object.entries(entitlements.capabilities).slice(0, 4).map(([key, value]) => (
              <div key={key} className="rounded-md bg-gray-50 p-3">
                <div className="text-xs font-medium uppercase text-gray-500">{key.replace(/_/g, " ")}</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 rounded-lg border border-violet-200 bg-violet-50 p-6">
        <h3 className="text-lg font-medium text-violet-900">Getting Started</h3>
        <p className="mt-2 text-sm text-violet-700">
          Your agent is managed through the Control Plane. Use API keys to integrate with your applications,
          configure connectors for external services, and monitor usage through the billing section.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}/api-keys`}
            className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Create API Key
          </Link>
          <a
            href="https://docs.gsv.dev/agents/configuration"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
          >
            View Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
