import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WidgetEmbedCode } from "./widget-embed-code";

interface ChannelsPageProps {
  params: Promise<{ channel: string; instanceId: string }>;
}

const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://api.digitlify.com";

interface Instance {
  id: string;
  name: string;
  state: string;
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
}

async function getInstance(instanceId: string, accessToken: string): Promise<Instance | null> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json() as Instance;
  } catch {
    return null;
  }
}

async function getAPIKeys(instanceId: string, accessToken: string): Promise<APIKey[]> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/api_keys/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json() as APIKey[];
  } catch {
    return [];
  }
}

export default async function ChannelsPage({ params }: ChannelsPageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.accessToken) {
    redirect(`/${resolvedParams.channel}/login?callbackUrl=/account/instances/${resolvedParams.instanceId}/channels`);
  }

  const [instance, apiKeys] = await Promise.all([
    getInstance(resolvedParams.instanceId, session.accessToken),
    getAPIKeys(resolvedParams.instanceId, session.accessToken),
  ]);

  const hasApiKey = apiKeys.length > 0;

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
        <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
        <p className="mt-1 text-gray-500">
          Configure how users interact with your agent
        </p>
      </div>

      {/* Widget Channel */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chat Widget</h2>
              <p className="text-gray-500">Embed a chat widget on your website</p>
            </div>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Available
          </span>
        </div>

        {!hasApiKey ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800">API Key Required</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Create an API key to use the widget on your website.
                </p>
                <Link
                  href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}/api-keys`}
                  className="mt-3 inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Create API Key
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <WidgetEmbedCode
            instanceId={resolvedParams.instanceId}
            instanceName={instance?.name || "Agent"}
            gatewayUrl={GATEWAY_URL}
          />
        )}
      </div>

      {/* API Channel */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">REST API</h2>
              <p className="text-gray-500">Integrate directly via our REST API</p>
            </div>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Available
          </span>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-600">
            Use the REST API for full programmatic control. See the API Keys section for authentication.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}/api-keys`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage API Keys
            </Link>
            <a
              href="https://docs.digitlify.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              API Documentation
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* MCP Channel - Coming Soon */}
      <div className="rounded-lg border bg-white p-6 shadow-sm opacity-75">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">MCP (Model Context Protocol)</h2>
              <p className="text-gray-500">Connect to Claude Desktop and other MCP clients</p>
            </div>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            Coming Soon
          </span>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          MCP integration will allow your agent to be used directly within Claude Desktop and other MCP-compatible applications.
        </div>
      </div>
    </div>
  );
}
