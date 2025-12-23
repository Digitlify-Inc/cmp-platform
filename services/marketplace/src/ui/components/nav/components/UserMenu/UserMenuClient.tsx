"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { CreditCard, LayoutGrid, Bot, LogOut, Settings, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type Props = {
	session: Session;
};

const menuLinks = [
	{ href: "/account", label: "My Account", icon: LayoutGrid },
	{ href: "/account/subscriptions", label: "My Agents", icon: Bot },
	{ href: "/account/billing", label: "Billing & Credits", icon: CreditCard },
	{ href: "/account/settings", label: "Settings", icon: Settings },
];

export function UserMenuClient({ session }: Props) {
	const user = session.user;
	
	const initials = user?.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "U";

	return (
		<Menu as="div" className="relative">
			<Menu.Button className="relative flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 pr-3 hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
				<span className="sr-only">Open user menu</span>
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
					{initials}
				</div>
				<ChevronDown className="h-4 w-4 text-neutral-500" />
			</Menu.Button>
			<Transition
				as={Fragment}
				enter="transition ease-out duration-100"
				enterFrom="transform opacity-0 scale-95"
				enterTo="transform opacity-100 scale-100"
				leave="transition ease-in duration-75"
				leaveFrom="transform opacity-100 scale-100"
				leaveTo="transform opacity-0 scale-95"
			>
				<Menu.Items className="absolute right-0 z-50 mt-2 w-64 origin-top-right divide-y divide-neutral-100 rounded-xl bg-white py-1 text-start shadow-lg ring-1 ring-neutral-200 ring-opacity-5 focus:outline-none">
					{/* User info */}
					<div className="px-4 py-3">
						<p className="font-medium text-neutral-900">{user?.name}</p>
						<p className="text-sm text-neutral-500">{user?.email}</p>
						{(user as { organization?: string })?.organization && (
							<p className="text-xs text-neutral-400 mt-1">
								{(user as { organization?: string }).organization}
							</p>
						)}
					</div>
					
					{/* Menu items */}
					<div className="flex flex-col py-1">
						{menuLinks.map((link) => (
							<Menu.Item key={link.href}>
								{({ active }) => (
									<LinkWithChannel
										href={link.href}
										className={clsx(
											active && "bg-neutral-50",
											"flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50",
										)}
									>
										<link.icon className="h-4 w-4 text-neutral-400" />
										{link.label}
									</LinkWithChannel>
								)}
							</Menu.Item>
						))}
					</div>
					
					{/* Sign out */}
					<div className="flex flex-col py-1">
						<Menu.Item>
							{({ active }) => (
								<button
									onClick={() => signOut({ callbackUrl: "/" })}
									className={clsx(
										active && "bg-red-50",
										"flex w-full items-center gap-3 px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50",
									)}
								>
									<LogOut className="h-4 w-4" />
									Sign Out
								</button>
							)}
						</Menu.Item>
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
