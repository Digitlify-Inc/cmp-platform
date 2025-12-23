import { Suspense } from "react";
import Link from "next/link";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { NavLinks } from "./components/NavLinks";
import { MobileMenu } from "./components/MobileMenu";
import { SearchBar } from "./components/SearchBar";
import { CreditsBadge } from "../CreditsBadge";

/**
 * Main Navigation Component
 * Per PRD_GTM.md:
 * - Nav: Home | Products | Solutions | Pricing | Resources (from NavLinks)
 * - CTAs: "Browse marketplace" (secondary) | "Get started free" (primary)
 * - Marketplace is a CTA button, NOT a nav item
 * - Login/Signup buttons handled by UserMenuContainer (shown when logged out)
 */
export const Nav = ({ channel }: { channel: string }) => {
  return (
    <nav className="flex w-full items-center gap-4 lg:gap-6" aria-label="Main navigation">
      {/* Primary navigation links */}
      <ul className="hidden gap-4 whitespace-nowrap md:flex lg:gap-6">
        <NavLinks channel={channel} />
      </ul>

      {/* Right side: CTAs + user controls */}
      <div className="ml-auto flex items-center justify-center gap-3 whitespace-nowrap">
        {/* Search (marketplace only) */}
        <div className="hidden lg:flex">
          <SearchBar channel={channel} />
        </div>

        {/* Secondary CTA: Marketplace */}
        <Link
          href={`/${channel}/marketplace`}
          className="hidden md:inline-flex items-center justify-center h-10 px-4 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-700 hover:border-neutral-300 dark:hover:border-slate-500 transition-colors"
        >
          Marketplace
        </Link>

        {/* Credits Badge - shows wallet balance for logged in users */}
        <Suspense fallback={null}>
          <CreditsBadge channel={channel} compact />
        </Suspense>

        {/* User menu - handles login/signup CTAs when logged out */}
        <Suspense fallback={<div className="w-8" />}>
          <UserMenuContainer />
        </Suspense>
      </div>

      {/* Mobile menu */}
      <Suspense>
        <MobileMenu>
          <SearchBar channel={channel} />
          <NavLinks channel={channel} />
          {/* Mobile CTAs */}
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-slate-700">
            <Link
              href={`/${channel}/marketplace`}
              className="flex items-center justify-center h-10 px-4 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-200"
            >
              Marketplace
            </Link>
          </div>
        </MobileMenu>
      </Suspense>
    </nav>
  );
};
