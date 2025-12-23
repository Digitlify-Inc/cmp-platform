"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { addToCart, addToCartAndCheckout } from "@/app/[channel]/(main)/cart/actions";
import clsx from "clsx";

type Props = {
	channel: string;
	variantId: string;
	planName: string;
	goToCheckout?: boolean;
	className?: string;
};

export function AddToCartButton({ 
	channel, 
	variantId, 
	planName,
	goToCheckout = false,
	className 
}: Props) {
	const [isPending, startTransition] = useTransition();
	const [added, setAdded] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleClick = () => {
		setError(null);
		startTransition(async () => {
			try {
				if (goToCheckout) {
					await addToCartAndCheckout({ channel, variantId });
				} else {
					await addToCart({ channel, variantId });
					setAdded(true);
					// Reset added state after 2 seconds
					setTimeout(() => setAdded(false), 2000);
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to add to cart");
			}
		});
	};

	return (
		<div>
			<button
				onClick={handleClick}
				disabled={isPending}
				className={clsx(
					"w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 font-medium transition-all",
					added
						? "bg-green-600 text-white"
						: "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
					isPending && "opacity-70 cursor-not-allowed",
					className
				)}
			>
				{isPending ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Adding...
					</>
				) : added ? (
					<>
						<Check className="h-4 w-4" />
						Added!
					</>
				) : (
					<>
						<ShoppingCart className="h-4 w-4" />
						{goToCheckout ? "Subscribe Now" : "Add to Cart"}
					</>
				)}
			</button>
			{error && (
				<p className="mt-2 text-sm text-red-600">{error}</p>
			)}
		</div>
	);
}
