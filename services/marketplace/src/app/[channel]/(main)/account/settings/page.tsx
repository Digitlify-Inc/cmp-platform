import { Metadata } from "next";
import { Bell, Shield, Key, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings | Digitlify",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  // Use KEYCLOAK_ISSUER which should be https://sso.dev.gsv.dev/realms/gsv
  const keycloakUrl = process.env.KEYCLOAK_ISSUER || "https://sso.dev.gsv.dev/realms/gsv";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account preferences and security settings
        </p>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">Email notifications</p>
              <p className="text-sm text-neutral-500">Receive updates about your agents via email</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">Usage alerts</p>
              <p className="text-sm text-neutral-500">Get notified when approaching credit limits</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">Marketing emails</p>
              <p className="text-sm text-neutral-500">Receive news about new features and agents</p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div>
              <p className="font-medium text-neutral-900">Two-factor authentication</p>
              <p className="text-sm text-neutral-500">Add an extra layer of security to your account</p>
            </div>
            <a
              href={`${keycloakUrl}/account/totp`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Manage
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div>
              <p className="font-medium text-neutral-900">Password</p>
              <p className="text-sm text-neutral-500">Change your account password</p>
            </div>
            <a
              href={`${keycloakUrl}/account/password`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Change
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-neutral-900">Active sessions</p>
              <p className="text-sm text-neutral-500">Manage devices where you're signed in</p>
            </div>
            <a
              href={`${keycloakUrl}/account/sessions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-neutral-900">API Access</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Manage API keys for programmatic access to your agents and data.
        </p>
        <a
          href={`${process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "https://cp.dev.gsv.dev"}/settings/api-keys`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Manage API Keys
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
