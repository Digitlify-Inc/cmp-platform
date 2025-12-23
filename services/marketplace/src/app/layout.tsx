import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense, type ReactNode } from "react";
import { type Metadata } from "next";
import { DraftModeNotification } from "@/ui/components/DraftModeNotification";
import { AuthProvider } from "@/lib/auth/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		default: "Digitlify | AI Agent Marketplace",
		template: "%s | Digitlify",
	},
	description: "Discover and deploy AI agents, apps, assistants, and automations for your business.",
	metadataBase: process.env.NEXT_PUBLIC_MARKETPLACE_URL
		? new URL(process.env.NEXT_PUBLIC_MARKETPLACE_URL)
		: undefined,
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/icon.svg", type: "image/svg+xml" },
		],
		apple: "/icon.svg",
	},
};

export default function RootLayout(props: { children: ReactNode }) {
	const { children } = props;

	return (
		<html lang="en" className="min-h-dvh">
			<body className={`${inter.className} min-h-dvh`}>
				<AuthProvider>
					{children}
					<Suspense>
						<DraftModeNotification />
					</Suspense>
				</AuthProvider>
			</body>
		</html>
	);
}
