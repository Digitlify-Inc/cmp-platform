import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { APIKeysList } from "./api-keys-list";

interface APIKeysPageProps {
  params: Promise<{ channel: string; instanceId: string }>;
}

// Use internal URL for server-side rendering
const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string;
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

    if (!response.ok) {
      return [];
    }

    return await response.json() as APIKey[];
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return [];
  }
}

export default async function APIKeysPage({ params }: APIKeysPageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.accessToken) {
    redirect(`/${resolvedParams.channel}/login?callbackUrl=/account/instances/${resolvedParams.instanceId}/api-keys`);
  }

  const apiKeys = await getAPIKeys(resolvedParams.instanceId, session.accessToken);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}`}
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Instance
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-1 text-gray-500">
            Manage API keys for programmatic access to your agent
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About API Keys</h3>
            <p className="mt-1 text-sm text-blue-700">
              API keys allow you to authenticate requests to your agent programmatically.
              Keys are prefixed with <code className="rounded bg-blue-100 px-1">cmp_sk_</code> and
              the full key is only shown once when created. Store it securely.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys List Component */}
      <APIKeysList
        instanceId={resolvedParams.instanceId}
        channel={resolvedParams.channel}
        initialKeys={apiKeys}
      />

      {/* Usage Examples */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Usage Examples</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">cURL</h4>
            <pre className="mt-2 overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
{`curl -X POST https://runtime.dev.gsv.dev/v1/chat \
  -H "Authorization: Bearer cmp_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'`}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Python</h4>
            <pre className="mt-2 overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
{`import requests

response = requests.post(
    "https://runtime.dev.gsv.dev/v1/chat",
    headers={"Authorization": "Bearer cmp_sk_your_key_here"},
    json={"message": "Hello!"}
)
print(response.json())`}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">JavaScript</h4>
            <pre className="mt-2 overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
{`const response = await fetch("https://runtime.dev.gsv.dev/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer cmp_sk_your_key_here",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ message: "Hello!" })
});
const data = await response.json();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
