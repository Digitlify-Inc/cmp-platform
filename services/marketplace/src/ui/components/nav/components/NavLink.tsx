"use client";

import clsx from "clsx";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type NavLinkProps = {
	href: Route;
	isActive: boolean;
	children: ReactNode;
};

export const NavLink = ({ href, isActive, children }: NavLinkProps) => {
	return (
		<li className="inline-flex">
			<Link
				href={href}
				className={clsx(
					isActive
						? "border-violet-600 text-violet-700 font-semibold"
						: "border-transparent text-neutral-500 hover:text-violet-600",
					"inline-flex items-center border-b-2 pt-px text-sm font-medium transition-colors",
				)}
			>
				{children}
			</Link>
		</li>
	);
};
