import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BrowseModeSwitcher } from "@/ui/components/marketplace/BrowseModeSwitcher";
import { FacetRailWrapper } from "@/ui/components/marketplace/FacetRailWrapper";
import { OfferingGrid } from "@/ui/components/marketplace/OfferingGrid";
import { SortBy } from "@/ui/components/SortBy";
import { executeGraphQL } from "@/lib/graphql";
import { transformProduct, type SaleorProduct } from "@/lib/marketplace";
import { MarketplaceProductsDocument, OrderDirection, ProductOrderField } from "@/gql/graphql";

const roleMeta: Record<string, { title: string; description: string; saleorValue: string }> = {
	"customer-support": {
		title: "Customer Support",
		description: "AI workers to reduce ticket volume and improve resolution times",
		saleorValue: "customer_support",
	},
	sales: {
		title: "Sales / SDR",
		description: "Automate outreach and qualification to focus on closing deals",
		saleorValue: "sales_sdr",
	},
	marketing: {
		title: "Marketing",
		description: "Create on-brand content and automate campaign workflows",
		saleorValue: "marketing",
	},
	hr: {
		title: "HR",
		description: "Streamline recruitment, onboarding, and employee experience",
		saleorValue: "hr",
	},
	"it-helpdesk": {
		title: "IT / Helpdesk",
		description: "Resolve IT issues faster with intelligent ticketing and automation",
		saleorValue: "it_helpdesk",
	},
	operations: {
		title: "Operations",
		description: "Automate workflows and extract insights from operational data",
		saleorValue: "operations",
	},
	finance: {
		title: "Finance",
		description: "Automate financial operations and reporting",
		saleorValue: "finance",
	},
};

const validRoles = Object.keys(roleMeta);

// Mapping from URL filter keys to Saleor attribute slugs
const filterToAttribute: Record<string, string> = {
	roles: "gsv_roles",
	value_streams: "gsv_value_stream",
	capabilities: "gsv_capabilities",
	integrations: "gsv_integrations_required",
	deployment: "gsv_deployment",
};

export async function generateMetadata(props: {
	params: Promise<{ role: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const meta = roleMeta[params.role];
	if (!meta) return { title: "Solutions | Digitlify" };
	return {
		title: `${meta.title} Solutions | Digitlify Marketplace`,
		description: meta.description,
	};
}

function parseFiltersFromParams(
	searchParams: Record<string, string | string[] | undefined>
): Record<string, string[]> {
	const filters: Record<string, string[]> = {};
	for (const [key, value] of Object.entries(searchParams)) {
		if (filterToAttribute[key] || key === "trust") {
			if (Array.isArray(value)) {
				filters[key] = value;
			} else if (value) {
				filters[key] = [value];
			}
		}
	}
	return filters;
}

export default async function RolePage(props: {
	params: Promise<{ channel: string; role: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;

	if (!validRoles.includes(params.role)) {
		notFound();
	}

	const meta = roleMeta[params.role];
	const urlFilters = parseFiltersFromParams(searchParams);

	// Build attribute filters from URL params
	const attributeFilters = [
		// Always include the role filter
		{ slug: "gsv_roles", values: [meta.saleorValue] },
	];

	// Add additional filters from URL
	for (const [key, values] of Object.entries(urlFilters)) {
		const attrSlug = filterToAttribute[key];
		if (attrSlug && values.length > 0) {
			// Don't duplicate roles filter
			if (attrSlug === "gsv_roles") {
				attributeFilters[0].values = [...new Set([...attributeFilters[0].values, ...values])];
			} else {
				attributeFilters.push({ slug: attrSlug, values });
			}
		}
	}

	const filter = { attributes: attributeFilters };

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
				sortBy: { field: ProductOrderField.Name, direction: OrderDirection.Asc },
			},
			revalidate: 60,
			withAuth: false,
		});

		totalCount = products?.totalCount || 0;
		offerings = (products?.edges || []).map(({ node }) =>
			transformProduct(node as SaleorProduct)
		);
	} catch (e) {
		console.error("Failed to fetch products:", e);
		error = e instanceof Error ? e.message : "Failed to load products";
	}

	// Build active filters for FacetRail (include the role filter)
	const activeFilters = {
		...urlFilters,
		roles: [params.role, ...(urlFilters.roles || [])],
	};

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Hero */}
			<div className="bg-gradient-to-br from-violet-600 to-purple-700 py-12 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<p className="text-sm font-medium text-violet-200 mb-2">Solutions for</p>
					<h1 className="text-3xl font-bold">{meta.title}</h1>
					<p className="mt-2 text-lg text-violet-100">{meta.description}</p>
				</div>
			</div>

			{/* Browse Mode Switcher */}
			<Suspense fallback={<div className="h-16 w-full animate-pulse bg-neutral-100" />}>
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
						<div className="mb-6 flex items-center justify-between">
							<p className="text-sm text-neutral-500">
								{totalCount} offering{totalCount !== 1 ? "s" : ""} for {meta.title}
							</p>
							<Suspense fallback={<div className="h-10 w-24 animate-pulse rounded bg-neutral-200" />}>
								<SortBy />
							</Suspense>
						</div>

						{error && (
							<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
								<p className="font-medium">Unable to load products</p>
								<p className="text-sm mt-1">{error}</p>
							</div>
						)}

						<OfferingGrid
							offerings={offerings}
							channel={params.channel}
							emptyMessage={`No offerings found for ${meta.title}.`}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
