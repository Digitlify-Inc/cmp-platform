import { Metadata } from "next";
import Link from "next/link";
import { Bot, Zap, Sparkles, Workflow, Play, Settings, AlertCircle, PackageOpen } from "lucide-react";
import { getInstances, formatInstanceForDisplay, type Instance } from "@/lib/control-plane";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Instances | Digitlify",
  description: "Manage your agent instances",
};

const categoryIcons: Record<string, typeof Bot> = {
  agent: Bot,
  app: Zap,
  assistant: Sparkles,
  automation: Workflow,
};

const stateColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700",
  PROVISIONING: "bg-blue-100 text-blue-700",
  REQUESTED: "bg-blue-100 text-blue-700",
  TERMINATED: "bg-neutral-100 text-neutral-500",
};

async function fetchInstances(): Promise<{ instances: Instance[]; isLive: boolean }> {
  try {
    const instances = await getInstances();
    return { instances, isLive: true };
  } catch (error) {
    console.error("Failed to fetch instances:", error);
    return { instances: [], isLive: false };
  }
}

export default async function InstancesPage(props: {
  params: Promise<{ channel: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session) {
    redirect(`/${params.channel}/login?callbackUrl=/${params.channel}/account/instances`);
  }

  const { instances, isLive } = await fetchInstances();
  const displayInstances = instances.map(formatInstanceForDisplay);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Instances</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage and run your deployed agents and automations
          </p>
        </div>
        <Link
          href={`/${params.channel}/marketplace`}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          Add New
        </Link>
      </div>

      {!isLive && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Unable to load live data</p>
            <p className="text-sm text-amber-700 mt-1">
              Please try again later or check your connection.
            </p>
          </div>
        </div>
      )}

      {/* Instances Grid */}
      {displayInstances.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayInstances.map((instance) => {
            const Icon = categoryIcons[instance.category] || Bot;
            return (
              <div
                key={instance.id}
                className="rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{instance.name}</h3>
                      <p className="text-sm text-neutral-500">{instance.planName} plan</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColors[instance.state] || stateColors.PROVISIONING}`}>
                    {instance.state}
                  </span>
                </div>

                <div className="mt-4 text-sm text-neutral-500">
                  Created: {new Date(instance.createdAt).toLocaleDateString()}
                </div>

                <div className="mt-4 flex gap-2">
                  {instance.state === "ACTIVE" && (
                    <Link
                      href={`/${params.channel}/run/${instance.id}`}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      Run
                    </Link>
                  )}
                  <Link
                    href={`/${params.channel}/account/instances/${instance.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configure
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-neutral-200 bg-white">
          <PackageOpen className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-medium text-neutral-900">No instances yet</h3>
          <p className="mt-2 text-sm text-neutral-500">
            Get started by ordering an agent from the marketplace
          </p>
          <Link
            href={`/${params.channel}/marketplace`}
            className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            Explore Marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
