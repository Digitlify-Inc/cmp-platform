"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { CreditCard, LayoutGrid, ShoppingBag, LogOut } from "lucide-react";
import { UserInfo } from "./components/UserInfo";
import { UserAvatar } from "./components/UserAvatar";
import { type UserDetailsFragment } from "@/gql/graphql";
import { logout } from "@/app/actions";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type Props = {
	user: UserDetailsFragment;
};

const menuLinks = [
	{ href: "/account/instances", label: "My Instances", icon: LayoutGrid },
	{ href: "/account/billing", label: "Billing", icon: CreditCard },
	{ href: "/orders", label: "Orders", icon: ShoppingBag },
];

export function UserMenu({ user }: Props) {
	return (
		<Menu as="div" className="relative">
			<Menu.Button className="relative flex rounded-full bg-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
				<span className="sr-only">Open user menu</span>
				<UserAvatar user={user} />
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
				<Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-neutral-200 rounded-lg bg-white py-1 text-start shadow-lg ring-1 ring-neutral-200 ring-opacity-5 focus:outline-none">
					<UserInfo user={user} />
					<div className="flex flex-col px-1 py-1">
						{menuLinks.map((link) => (
							<Menu.Item key={link.href}>
								{({ active }) => (
									<LinkWithChannel
										href={link.href}
										className={clsx(
											active && "bg-neutral-100",
											"flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900",
										)}
									>
										<link.icon className="h-4 w-4" />
										{link.label}
									</LinkWithChannel>
								)}
							</Menu.Item>
						))}
					</div>
					<div className="flex flex-col px-1 py-1">
						<Menu.Item>
							{({ active }) => (
								<form action={logout}>
									<button
										type="submit"
										className={clsx(
											active && "bg-neutral-100",
											"flex w-full items-center gap-3 px-4 py-2 text-start text-sm font-medium text-neutral-600 hover:text-neutral-900",
										)}
									>
										<LogOut className="h-4 w-4" />
										Log Out
									</button>
								</form>
							)}
						</Menu.Item>
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
