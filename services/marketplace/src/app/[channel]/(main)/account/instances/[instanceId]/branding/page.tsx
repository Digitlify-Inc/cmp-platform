import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandingForm } from "./branding-form";

interface BrandingPageProps {
  params: Promise<{ channel: string; instanceId: string }>;
}

const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";

interface InstanceConfig {
  id: string;
  display_name?: string;
  welcome_message?: string;
  primary_color?: string;
  logo_url?: string;
  avatar_url?: string;
}

async function getInstanceConfig(instanceId: string, accessToken: string): Promise<InstanceConfig | null> {
  try {
    const response = await fetch(`${CP_URL}/instances/${instanceId}/config/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      // If no config exists yet, return defaults
      if (response.status === 404) {
        return { id: instanceId };
      }
      return null;
    }
    return await response.json() as InstanceConfig;
  } catch {
    return { id: instanceId };
  }
}

export default async function BrandingPage({ params }: BrandingPageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.accessToken) {
    redirect(`/${resolvedParams.channel}/login?callbackUrl=/account/instances/${resolvedParams.instanceId}/branding`);
  }

  const config = await getInstanceConfig(resolvedParams.instanceId, session.accessToken);

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
        <h1 className="text-3xl font-bold text-gray-900">Branding</h1>
        <p className="mt-1 text-gray-500">
          Customize how your agent appears to users
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Branding Form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Appearance Settings</h2>
          <BrandingForm
            instanceId={resolvedParams.instanceId}
            initialConfig={config || { id: resolvedParams.instanceId }}
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Preview</h2>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 border-b pb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: config?.primary_color || "#7c3aed" }}
              >
                {config?.avatar_url ? (
                  <img src={config.avatar_url} alt="Avatar" className="h-10 w-10 rounded-full" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {config?.display_name || "Your Agent"}
                </h3>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-start">
                <div
                  className="max-w-[80%] rounded-lg px-4 py-2 text-white"
                  style={{ backgroundColor: config?.primary_color || "#7c3aed" }}
                >
                  {config?.welcome_message || "Hello! How can I help you today?"}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2 text-gray-800">
                  Hi, I have a question about your services.
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            This preview shows how your agent will appear in the chat widget.
          </p>
        </div>
      </div>
    </div>
  );
}
