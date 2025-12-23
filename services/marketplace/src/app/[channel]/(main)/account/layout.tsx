import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Wallet, Bot, Settings } from "lucide-react";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Account | Digitlify",
  description: "Manage your account, billing, and instances",
};

const accountNav = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/instances", label: "My Instances", icon: Bot },
  { href: "/account/billing", label: "Billing & Credits", icon: Wallet },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default async function AccountLayout(props: {
  children: React.ReactNode;
  params: Promise<{ channel: string }>;
}) {
  const params = await props.params;
  const session = await auth();
  
  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/${params.channel}/account`);
  }
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <nav className="space-y-1">
              {accountNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={`/${params.channel}${item.href}`}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <Icon className="h-5 w-5 text-neutral-400" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">{props.children}</main>
        </div>
      </div>
    </div>
  );
}
