"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, CreditCard, Bot, ChevronDown } from "lucide-react";

export function UserMenu() {
	const { data: session, status } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (status === "loading") {
		return (
			<div className="h-9 w-9 rounded-full bg-neutral-200 animate-pulse" />
		);
	}

	if (!session) {
		return (
			<button
				onClick={() => signIn("keycloak")}
				className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
			>
				Sign In
			</button>
		);
	}

	const initials = session.user?.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "U";

	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 pr-3 hover:bg-neutral-50 transition-colors"
			>
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
					{initials}
				</div>
				<ChevronDown className="h-4 w-4 text-neutral-500" />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white py-2 shadow-lg z-50">
					{/* User info */}
					<div className="px-4 py-3 border-b border-neutral-100">
						<p className="font-medium text-neutral-900">{session.user?.name}</p>
						<p className="text-sm text-neutral-500">{session.user?.email}</p>
						{session.user?.organization && (
							<p className="text-xs text-neutral-400 mt-1">
								{session.user.organization}
							</p>
						)}
					</div>

					{/* Menu items */}
					<div className="py-2">
						<Link
							href="/account"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
						>
							<User className="h-4 w-4 text-neutral-400" />
							My Account
						</Link>
						<Link
							href="/account/subscriptions"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
						>
							<Bot className="h-4 w-4 text-neutral-400" />
							My Agents
						</Link>
						<Link
							href="/account/billing"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
						>
							<CreditCard className="h-4 w-4 text-neutral-400" />
							Billing & Credits
						</Link>
						<Link
							href="/account/settings"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
						>
							<Settings className="h-4 w-4 text-neutral-400" />
							Settings
						</Link>
					</div>

					{/* Sign out */}
					<div className="border-t border-neutral-100 pt-2">
						<button
							onClick={() => signOut({ callbackUrl: "/" })}
							className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
						>
							<LogOut className="h-4 w-4" />
							Sign Out
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
