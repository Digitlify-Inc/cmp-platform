"use client";

import { usePathname } from "next/navigation";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

const companyName = "Digitlify";

// Digitlify hexagon logo SVG
const LogoIcon = () => (
	<svg
		width="32"
		height="32"
		viewBox="0 0 32 32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className="mr-2"
	>
		<path
			d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z"
			fill="url(#digitlify-gradient)"
		/>
		<text
			x="16"
			y="20"
			textAnchor="middle"
			fill="white"
			fontSize="14"
			fontWeight="bold"
			fontFamily="system-ui, sans-serif"
		>
			D
		</text>
		<defs>
			<linearGradient
				id="digitlify-gradient"
				x1="3.87564"
				y1="2"
				x2="28.1244"
				y2="30"
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor="#8b5cf6" />
				<stop offset="1" stopColor="#6d28d9" />
			</linearGradient>
		</defs>
	</svg>
);

export const Logo = () => {
	const pathname = usePathname();

	if (pathname === "/") {
		return (
			<h1 className="flex items-center font-bold text-violet-600" aria-label="homepage">
				<LogoIcon />
				{companyName}
			</h1>
		);
	}
	return (
		<div className="flex items-center font-bold text-violet-600">
			<LinkWithChannel aria-label="homepage" href="/" className="flex items-center">
				<LogoIcon />
				{companyName}
			</LinkWithChannel>
		</div>
	);
};
