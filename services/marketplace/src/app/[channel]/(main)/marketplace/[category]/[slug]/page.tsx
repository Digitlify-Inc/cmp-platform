import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
	Bot, Zap, Sparkles, Workflow,
	Star, BadgeCheck, ChevronRight,
	Coins, Check,
	Globe, Shield, Clock, AlertCircle
} from "lucide-react";
import { executeGraphQL } from "@/lib/graphql";
import { MarketplaceProductDetailDocument } from "@/gql/graphql";
import { AddToCartButton } from "@/ui/components/marketplace/AddToCartButton";
import { TryFreeButton } from "@/ui/components/marketplace/TryFreeButton";

// Category icons
const categoryIcons: Record<string, typeof Bot> = {
	agent: Bot,
	app: Zap,
	assistant: Sparkles,
	automation: Workflow,
};

// Category display mapping (singular to display)
const categoryDisplay: Record<string, string> = {
	agent: "Agent",
	app: "App",
	assistant: "Assistant",
	automation: "Automation",
};


// Helper to extract attribute values
function getAttributeValues(
	attributes: Array<{ attribute: { slug: string }; values: Array<{ slug: string; name: string }> }>,
	slug: string
): string[] {
	const attr = attributes.find((a) => a.attribute.slug === slug);
	return attr?.values.map((v) => v.name) || [];
}

// Helper to get metadata value
function getMetadataValue(
	metadata: Array<{ key: string; value: string }>,
	key: string
): string | undefined {
	return metadata.find((m) => m.key === key)?.value;
}

// Transform Saleor product to display format
function transformProductForDetail(product: any) {
	const attributes = product.attributes || [];
	const metadata = product.metadata || [];

	// Get category from gsv_category attribute
	const categoryValues = getAttributeValues(attributes, "gsv_category");
	const category = categoryValues[0]?.toLowerCase() || "agent";

	// Parse credits estimate
	const creditsMin = getMetadataValue(metadata, "credits_estimate_min");
	const creditsMax = getMetadataValue(metadata, "credits_estimate_max");

	// Get capabilities from attribute
	const capabilities = getAttributeValues(attributes, "gsv_capabilities");

	// Get integrations from attribute
	const integrations = getAttributeValues(attributes, "gsv_integrations_required");

	// Get other attributes
	const valueStreams = getAttributeValues(attributes, "gsv_value_stream");
	const deploymentModes = getAttributeValues(attributes, "gsv_deployment");
	const badges = getAttributeValues(attributes, "gsv_badges");

	// Check verified status
	const verified = badges.some(b => b.toLowerCase().includes("verified"));

	// Check trial available
	const trialAvailable = getAttributeValues(attributes, "gsv_trial_available").some(v => v.toLowerCase() === "true");

	// Get languages (default if not set)
	const languages = getAttributeValues(attributes, "gsv_languages") || ["en"];

	// Transform variants into plans
	const plans = (product.variants || []).map((variant: any) => {
		const variantMeta = variant.metadata || [];
		const price = variant.pricing?.price?.gross?.amount || 0;
		const creditsGrant = parseInt(getMetadataValue(variantMeta, "credits_grant") || "0", 10);

		return {
			id: variant.id,
			name: variant.name,
			sku: variant.sku,
			price,
			billingPeriod: price === 0 ? "14 days" : "monthly",
			creditsGrant: creditsGrant || (price === 0 ? 100 : price * 100),
			features: getAttributeValues(variant.attributes || [], "plan_features"),
		};
	});

	// Sort plans by price
	plans.sort((a: { price: number }, b: { price: number }) => a.price - b.price);

	return {
		id: product.id,
		slug: product.slug,
		name: product.name,
		shortDescription: product.seoDescription || product.description?.slice(0, 200),
		longDescription: product.description,
		category,
		thumbnail: product.thumbnail?.url,
		rating: 4.5 + Math.random() * 0.4, // Mock rating until we have reviews
		reviewCount: Math.floor(50 + Math.random() * 100), // Mock count
		verified,
		trialAvailable,
		capabilities,
		integrations,
		plans: plans.length > 0 ? plans : [
			{
				id: "default-trial",
				name: "Free Trial",
				price: 0,
				billingPeriod: "14 days",
				creditsGrant: 100,
				features: ["100 credits included", "Basic features"],
			},
		],
		valueStreams,
		languages,
		deploymentModes,
		creditsEstimateMin: creditsMin ? parseInt(creditsMin, 10) : undefined,
		creditsEstimateMax: creditsMax ? parseInt(creditsMax, 10) : undefined,
		startingPrice: product.pricing?.priceRange?.start?.gross?.amount,
	};
}

export async function generateMetadata(props: {
	params: Promise<{ channel: string; slug: string }>;
}): Promise<Metadata> {
	const params = await props.params;

	try {
		const { product } = await executeGraphQL(MarketplaceProductDetailDocument, {
			variables: { slug: params.slug, channel: params.channel },
			revalidate: 60,
			withAuth: false,
		});

		if (!product) return { title: "Not Found | Digitlify" };

		return {
			title: `${product.name} | Digitlify Marketplace`,
			description: product.seoDescription || product.description?.slice(0, 160),
		};
	} catch {
		return { title: "Product | Digitlify Marketplace" };
	}
}

export default async function OfferingDetailPage(props: {
	params: Promise<{ channel: string; category: string; slug: string }>;
}) {
	const params = await props.params;


	// Fetch product from Saleor
	let offering = null;
	let error = null;

	try {
		const { product } = await executeGraphQL(MarketplaceProductDetailDocument, {
			variables: { slug: params.slug, channel: params.channel },
			revalidate: 60,
			withAuth: false,
		});

		if (product) {
			offering = transformProductForDetail(product);
		}
	} catch (e) {
		console.error("Failed to fetch product:", e);
		error = e instanceof Error ? e.message : "Failed to load product";
	}

	if (!offering) {
		notFound();
	}

	const CategoryIcon = categoryIcons[offering.category] || Bot;
	const categoryLabel = categoryDisplay[offering.category] || offering.category;
	const defaultVariantId = offering.plans[0]?.id || "";

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Breadcrumb */}
			<div className="border-b border-neutral-200 bg-white">
				<div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
					<nav className="flex items-center gap-2 text-sm">
						<Link href={`/${params.channel}/marketplace`} className="text-neutral-500 hover:text-neutral-700">
							Marketplace
						</Link>
						<ChevronRight className="h-4 w-4 text-neutral-400" />
						<Link href={`/${params.channel}/marketplace/${params.category}`} className="text-neutral-500 hover:text-neutral-700">
							{categoryLabel}s
						</Link>
						<ChevronRight className="h-4 w-4 text-neutral-400" />
						<span className="text-neutral-900 font-medium">{offering.name}</span>
					</nav>
				</div>
			</div>

			{/* Error Banner */}
			{error && (
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
						<div>
							<p className="font-medium text-amber-800">Some data may be unavailable</p>
							<p className="text-sm text-amber-700">{error}</p>
						</div>
					</div>
				</div>
			)}

			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid gap-8 lg:grid-cols-3">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-8">
						{/* Hero */}
						<div className="rounded-xl border border-neutral-200 bg-white p-6">
							<div className="flex items-start gap-4">
								{/* Icon */}
								<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
									<CategoryIcon className="h-8 w-8 text-white" />
								</div>

								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h1 className="text-2xl font-bold text-neutral-900">{offering.name}</h1>
										{offering.verified && (
											<BadgeCheck className="h-5 w-5 text-violet-600" />
										)}
									</div>
									<p className="mt-2 text-neutral-600">{offering.shortDescription}</p>

									{/* Rating & Stats */}
									<div className="mt-4 flex items-center gap-4">
										<div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
											<span className="font-medium">{offering.rating.toFixed(1)}</span>
											<span className="text-neutral-500">({offering.reviewCount} reviews)</span>
										</div>
										<span className="text-neutral-300">|</span>
										<span className="flex items-center gap-1 text-neutral-500">
											<Globe className="h-4 w-4" />
											{offering.languages.length} languages
										</span>
										{offering.creditsEstimateMin && (
											<>
												<span className="text-neutral-300">|</span>
												<span className="flex items-center gap-1 text-neutral-500">
													<Coins className="h-4 w-4" />
													~{offering.creditsEstimateMin} credits/run
												</span>
											</>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* About */}
						<div className="rounded-xl border border-neutral-200 bg-white p-6">
							<h2 className="text-lg font-semibold text-neutral-900 mb-4">About</h2>
							<div className="prose prose-neutral max-w-none">
								<p className="whitespace-pre-line text-neutral-600">{offering.longDescription}</p>
							</div>
						</div>

						{/* Capabilities */}
						{offering.capabilities.length > 0 && (
							<div className="rounded-xl border border-neutral-200 bg-white p-6">
								<h2 className="text-lg font-semibold text-neutral-900 mb-4">Capabilities</h2>
								<div className="grid gap-3 sm:grid-cols-2">
									{offering.capabilities.map((cap: string) => (
										<div key={cap} className="flex items-center gap-2">
											<Check className="h-4 w-4 text-green-600" />
											<span className="text-neutral-700">{cap.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Integrations */}
						{offering.integrations.length > 0 && (
							<div className="rounded-xl border border-neutral-200 bg-white p-6">
								<h2 className="text-lg font-semibold text-neutral-900 mb-4">Integrations</h2>
								<div className="flex flex-wrap gap-2">
									{offering.integrations.map((integration: string) => (
										<span
											key={integration}
											className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 capitalize"
										>
											{integration.replace(/_/g, " ")}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Value Streams */}
						{offering.valueStreams.length > 0 && (
							<div className="rounded-xl border border-neutral-200 bg-white p-6">
								<h2 className="text-lg font-semibold text-neutral-900 mb-4">Outcomes</h2>
								<div className="flex flex-wrap gap-2">
									{offering.valueStreams.map((vs: string) => (
										<Link
											key={vs}
											href={`/${params.channel}/outcomes/${vs}`}
											className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 hover:bg-violet-200 transition-colors"
										>
											{vs.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
										</Link>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Pricing Card */}
						<div className="rounded-xl border border-neutral-200 bg-white p-6 sticky top-24">
							<h2 className="text-lg font-semibold text-neutral-900 mb-4">Plans</h2>

							<div className="space-y-4">
								{offering.plans.map((plan: any) => (
									<div
										key={plan.id}
										className="rounded-lg border border-neutral-200 p-4 hover:border-violet-300 transition-colors cursor-pointer"
									>
										<div className="flex items-center justify-between">
											<h3 className="font-medium text-neutral-900">{plan.name}</h3>
											<div className="text-right">
												{plan.price === 0 ? (
													<span className="text-green-600 font-semibold">Free</span>
												) : (
													<>
														<span className="text-lg font-bold">${plan.price}</span>
														<span className="text-neutral-500 text-sm">/{plan.billingPeriod}</span>
													</>
												)}
											</div>
										</div>
										<div className="mt-2 flex items-center gap-1 text-sm text-neutral-500">
											<Coins className="h-4 w-4" />
											{plan.creditsGrant.toLocaleString()} credits
										</div>
										{plan.features.length > 0 && (
											<ul className="mt-3 space-y-1">
												{plan.features.slice(0, 3).map((feature: string, idx: number) => (
													<li key={idx} className="flex items-center gap-2 text-sm text-neutral-600">
														<Check className="h-3 w-3 text-green-600" />
														{feature}
													</li>
												))}
											</ul>
										)}
									</div>
								))}
							</div>

							{/* Subscribe Button */}
							{defaultVariantId && (
								<div className="mt-6">
									<AddToCartButton
										channel={params.channel}
										variantId={defaultVariantId}
										planName={offering.plans[0]?.name || "Subscribe"}
										goToCheckout={true}
									/>
								</div>
							)}

							{/* Try Free button for trial-enabled products */}
							{offering.trialAvailable && (
								<div className="mt-3">
									<TryFreeButton
										channel={params.channel}
										productSlug={offering.slug}
									/>
								</div>
							)}

							{/* Trust Signals */}
							<div className="mt-6 pt-6 border-t border-neutral-200">
								<div className="flex items-center gap-4 text-sm text-neutral-500">
									{offering.verified && (
										<span className="flex items-center gap-1">
											<Shield className="h-4 w-4" />
											Verified
										</span>
									)}
									{offering.trialAvailable && (
										<span className="flex items-center gap-1">
											<Clock className="h-4 w-4" />
											14-day trial
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
