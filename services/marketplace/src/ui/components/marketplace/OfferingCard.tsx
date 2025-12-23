"use client";

import Link from "next/link";
import Image from "next/image";
import { Bot, Zap, Sparkles, Workflow, Star, Coins, BadgeCheck } from "lucide-react";
import clsx from "clsx";

// Category configuration
const categoryConfig = {
	agent: { icon: Bot, color: "bg-violet-100 text-violet-700", label: "Agent" },
	app: { icon: Zap, color: "bg-blue-100 text-blue-700", label: "App" },
	assistant: { icon: Sparkles, color: "bg-amber-100 text-amber-700", label: "Assistant" },
	automation: { icon: Workflow, color: "bg-green-100 text-green-700", label: "Automation" },
};

type Category = keyof typeof categoryConfig;

export type Offering = {
	id: string;
	slug: string;
	name: string;
	description?: string;
	outcomeTagline?: string;
	thumbnail?: string;
	category: Category;
	capabilities?: string[];
	rating?: number;
	reviewCount?: number;
	verified?: boolean;
	trialAvailable?: boolean;
	startingPrice?: number;
	creditsEstimateMin?: number;
	creditsEstimateMax?: number;
	isNew?: boolean;
};

type Props = {
	offering: Offering;
	channel: string;
};

export function OfferingCard({ offering, channel }: Props) {
	const categoryInfo = categoryConfig[offering.category] || categoryConfig.agent;
	const CategoryIcon = categoryInfo.icon;

	// Show top 3 capabilities + count of remaining
	const displayCapabilities = offering.capabilities?.slice(0, 3) || [];
	const remainingCount = (offering.capabilities?.length || 0) - 3;

	// Format credit estimate range
	const creditsDisplay = offering.creditsEstimateMin !== undefined
		? offering.creditsEstimateMax && offering.creditsEstimateMax !== offering.creditsEstimateMin
			? `${offering.creditsEstimateMin}-${offering.creditsEstimateMax}`
			: `~${offering.creditsEstimateMin}`
		: null;

	return (
		<Link
			href={`/${channel}/marketplace/${offering.category}s/${offering.slug}`}
			className="group block"
		>
			<div className="rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-violet-300 hover:shadow-lg">
				{/* Header */}
				<div className="flex items-start gap-3">
					{/* Thumbnail */}
					<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
						{offering.thumbnail ? (
							<Image
								src={offering.thumbnail}
								alt={offering.name}
								fill
								className="object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
								<CategoryIcon className="h-6 w-6 text-white" />
							</div>
						)}
						{offering.isNew && (
							<span className="absolute -top-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
								NEW
							</span>
						)}
					</div>

					{/* Title & Category */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-neutral-900 truncate group-hover:text-violet-700 transition-colors">
								{offering.name}
							</h3>
							{offering.verified && (
								<BadgeCheck className="h-4 w-4 shrink-0 text-violet-600" />
							)}
						</div>
						<div className="flex items-center gap-2 mt-1">
							<span
								className={clsx(
									"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
									categoryInfo.color
								)}
							>
								<CategoryIcon className="h-3 w-3" />
								{categoryInfo.label}
							</span>
							{offering.rating && (
								<span className="flex items-center gap-1 text-xs text-neutral-500">
									<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
									{offering.rating.toFixed(1)}
									{offering.reviewCount && (
										<span className="text-neutral-400">({offering.reviewCount})</span>
									)}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Description - prefer outcomeTagline */}
				{(offering.outcomeTagline || offering.description) && (
					<p className="mt-3 text-sm text-neutral-600 line-clamp-2">
						{offering.outcomeTagline || offering.description}
					</p>
				)}

				{/* Capabilities */}
				{displayCapabilities.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-1">
						{displayCapabilities.map((cap) => (
							<span
								key={cap}
								className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
							>
								{cap}
							</span>
						))}
						{remainingCount > 0 && (
							<span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
								+{remainingCount} more
							</span>
						)}
					</div>
				)}

				{/* Footer */}
				<div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
					{/* Pricing & Credits */}
					<div className="flex items-center gap-3 text-sm">
						{offering.startingPrice !== undefined && offering.startingPrice > 0 && (
							<span className="font-medium text-neutral-900">
								from ${offering.startingPrice}/mo
							</span>
						)}
						{creditsDisplay && (
							<span className="flex items-center gap-1 text-neutral-500">
								<Coins className="h-3 w-3" />
								{creditsDisplay} credits/run
							</span>
						)}
					</div>

					{/* CTA hint */}
					<div className="flex items-center gap-2">
						{offering.trialAvailable && (
							<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
								Try Free
							</span>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
