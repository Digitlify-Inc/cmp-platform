import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BrowseModeSwitcher } from "@/ui/components/marketplace/BrowseModeSwitcher";
import { OfferingGrid } from "@/ui/components/marketplace/OfferingGrid";
import { executeGraphQL } from "@/lib/graphql";
import { transformProduct, type SaleorProduct } from "@/lib/marketplace";
import { MarketplaceProductsDocument, OrderDirection, ProductOrderField } from "@/gql/graphql";

export const metadata: Metadata = {
	title: "Search Results | Digitlify Marketplace",
	description: "Search for AI workers, agents, assistants, and automations",
};

export default async function MarketplaceSearchPage(props: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;

	// Support both 'q' (from BrowseModeSwitcher) and 'query' (from generic search)
	const searchQuery = (searchParams.q || searchParams.query) as string | undefined;

	if (!searchQuery?.trim()) {
		notFound();
	}

	// Fetch products with search filter
	let offerings: ReturnType<typeof transformProduct>[] = [];
	let totalCount = 0;
	let error = null;

	try {
		const { products } = await executeGraphQL(MarketplaceProductsDocument, {
			variables: {
				first: 50,
				channel: params.channel,
				filter: {
					search: searchQuery.trim(),
				},
				sortBy: {
					field: ProductOrderField.Name,
					direction: OrderDirection.Asc,
				},
			},
			revalidate: 60,
			withAuth: false,
		});

		totalCount = products?.totalCount || 0;
		offerings = (products?.edges || []).map(({ node }) =>
			transformProduct(node as SaleorProduct)
		);
	} catch (e) {
		console.error("Failed to search products:", e);
		error = e instanceof Error ? e.message : "Failed to search products";
	}

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Browse Mode Switcher */}
			<Suspense fallback={<div className="h-24 w-full animate-pulse bg-neutral-100" />}>
				<BrowseModeSwitcher channel={params.channel} />
			</Suspense>

			{/* Main Content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-2xl font-bold text-neutral-900">
						Search results for &quot;{searchQuery}&quot;
					</h1>
					<p className="mt-2 text-sm text-neutral-500">
						{totalCount} {totalCount === 1 ? "result" : "results"} found
					</p>
				</div>

				{/* Error State */}
				{error && (
					<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
						<p className="font-medium">Unable to search</p>
						<p className="text-sm mt-1">{error}</p>
					</div>
				)}

				{/* Results Grid */}
				<OfferingGrid
					offerings={offerings}
					channel={params.channel}
					emptyMessage={`No results found for "${searchQuery}". Try a different search term.`}
				/>
			</div>
		</div>
	);
}
