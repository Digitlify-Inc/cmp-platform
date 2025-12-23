import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

interface UsagePageProps {
  params: Promise<{ channel: string; instanceId: string }>;
}

export default async function UsagePage({ params }: UsagePageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.accessToken) {
    redirect(`/${resolvedParams.channel}/login`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/${resolvedParams.channel}/account/instances/${resolvedParams.instanceId}`} className="mb-4 inline-flex items-center text-sm text-gray-500">Back</Link>
      <h1 className="text-3xl font-bold mb-8">Usage</h1>
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">Usage page - coming soon.</p>
      </div>
    </div>
  );
}
