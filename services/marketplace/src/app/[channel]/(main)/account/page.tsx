import { Metadata } from "next";
import { Mail, Building, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Profile | Digitlify",
  description: "Manage your profile settings",
};

export default async function AccountProfilePage() {
  const session = await auth();
  const user = session?.user;
  
  // User is guaranteed to be authenticated via layout protection
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{user?.name || "User"}</h2>
            {(user as { organization?: string })?.organization && (
              <p className="text-sm text-neutral-500">
                {(user as { organization?: string }).organization}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-neutral-400" />
            <span className="text-neutral-700">{user?.email}</span>
          </div>
          {(user as { organization?: string })?.organization && (
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-neutral-400" />
              <span className="text-neutral-700">
                {(user as { organization?: string }).organization}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-sm text-neutral-500 mb-4">
            Profile settings are managed through your organization's identity provider.
          </p>
          <a
            href={`${process.env.KEYCLOAK_ISSUER}/account`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            Manage Account
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
