import { Metadata } from "next";
import { Suspense } from "react";
import { BrowseModeSwitcher } from "@/ui/components/marketplace/BrowseModeSwitcher";
import { FacetRailWrapper } from "@/ui/components/marketplace/FacetRailWrapper";
import { OfferingGrid } from "@/ui/components/marketplace/OfferingGrid";
import { SortBy } from "@/ui/components/SortBy";
import { executeGraphQL } from "@/lib/graphql";
import { transformProduct, buildSaleorFilter, type SaleorProduct } from "@/lib/marketplace";
import { MarketplaceProductsDocument, OrderDirection, ProductOrderField } from "@/gql/graphql";

export const metadata: Metadata = {
	title: "Marketplace | Digitlify",
	description: "Browse AI workers by outcome, role, capability, or category",
};

// Parse search params into a clean object
function parseSearchParams(
	searchParams: Record<string, string | string[] | undefined>
): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const [key, value] of Object.entries(searchParams)) {
		if (value) {
			result[key] = Array.isArray(value) ? value : [value];
		}
	}
	return result;
}

export default async function MarketplacePage(props: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;

	// Build filter from URL params
	const filter = buildSaleorFilter(searchParams);

	// Determine sort order
	const sortParam = searchParams.sort as string | undefined;
	const sortBy = {
		field: sortParam === "price" ? ProductOrderField.Price : ProductOrderField.Name,
		direction: sortParam === "price" ? OrderDirection.Asc : OrderDirection.Asc,
	};

	// Fetch products from Saleor
	let offerings: ReturnType<typeof transformProduct>[] = [];
	let totalCount = 0;
	let error = null;

	try {
		const { products } = await executeGraphQL(MarketplaceProductsDocument, {
			variables: {
				first: 20,
				channel: params.channel,
				filter,
				sortBy,
			},
			revalidate: 60,
			withAuth: false,
		});

		totalCount = products?.totalCount || 0;
		offerings = (products?.edges || []).map(({ node }) =>
			transformProduct(node as SaleorProduct)
		);
	} catch (e) {
		console.error("Failed to fetch products from Saleor:", e);
		error = e instanceof Error ? e.message : "Failed to load products";
	}

	// Parse active filters for FacetRail
	const activeFilters = parseSearchParams(searchParams);

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Browse Mode Switcher */}
			<Suspense fallback={<div className="h-24 w-full animate-pulse bg-neutral-100" />}>
				<BrowseModeSwitcher channel={params.channel} />
			</Suspense>

			{/* Main Content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex gap-8">
					{/* Filters Sidebar */}
					<Suspense fallback={<div className="w-64 shrink-0 animate-pulse bg-neutral-100 rounded-lg h-96" />}>
						<FacetRailWrapper activeFilters={activeFilters} />
					</Suspense>

					{/* Offerings Grid */}
					<div className="flex-1">
						{/* Header */}
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold text-neutral-900">
									Explore Marketplace
								</h1>
								<p className="mt-1 text-sm text-neutral-500">
									{totalCount} offerings available
								</p>
							</div>
							<Suspense fallback={<div className="h-10 w-24 animate-pulse rounded bg-neutral-200" />}>
								<SortBy />
							</Suspense>
						</div>

						{/* Error State */}
						{error && (
							<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
								<p className="font-medium">Unable to load products</p>
								<p className="text-sm mt-1">{error}</p>
							</div>
						)}

						{/* Grid */}
						<OfferingGrid
							offerings={offerings}
							channel={params.channel}
							emptyMessage="No offerings found. Try adjusting your filters."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
