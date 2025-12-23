import { type ReactNode } from "react";
import { AuthProvider } from "@/ui/components/AuthProvider";

export const metadata = {
	title: "Checkout · Digitlify Marketplace",
	description: "Complete your purchase on Digitlify Marketplace.",
};

export default function CheckoutLayout(props: { children: ReactNode }) {
	return (
		<main>
			<AuthProvider>{props.children}</AuthProvider>
		</main>
	);
}
