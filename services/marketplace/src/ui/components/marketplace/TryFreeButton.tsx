"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, Check } from "lucide-react";
import { startTrial } from "@/app/[channel]/(main)/marketplace/actions";
import clsx from "clsx";

type Props = {
	channel: string;
	productSlug: string;
	className?: string;
};

export function TryFreeButton({ channel, productSlug, className }: Props) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleClick = () => {
		setError(null);
		startTransition(async () => {
			try {
				const result = await startTrial({ productSlug });
				if (result.success && result.redirectUrl) {
					router.push(`/${channel}${result.redirectUrl}`);
				} else if (result.error) {
					setError(result.error);
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to start trial");
			}
		});
	};

	return (
		<div>
			<button
				onClick={handleClick}
				disabled={isPending}
				className={clsx(
					"w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 font-medium text-white transition-all",
					"bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800",
					isPending && "opacity-70 cursor-not-allowed",
					className
				)}
			>
				{isPending ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Starting Trial...
					</>
				) : (
					<>
						<Play className="h-4 w-4" />
						Try Free
					</>
				)}
			</button>
			{error && (
				<p className="mt-2 text-sm text-red-600">{error}</p>
			)}
		</div>
	);
}
