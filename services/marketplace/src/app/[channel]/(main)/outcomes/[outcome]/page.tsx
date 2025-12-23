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

const outcomeMeta: Record<string, { title: string; description: string; saleorValue: string }> = {
	customer_support: {
		title: "Reduce Support Tickets",
		description: "AI agents that handle customer inquiries, reducing ticket volume by up to 40%",
		saleorValue: "customer_support",
	},
	sales_outreach: {
		title: "Send Personalized Outreach",
		description: "Automate personalized sales emails and follow-ups at scale",
		saleorValue: "sales_outreach",
	},
	knowledge_assistant: {
		title: "Turn Documents into Answers",
		description: "Knowledge assistants that answer questions from your documents",
		saleorValue: "knowledge_assistant",
	},
	meeting_scheduler: {
		title: "Book Meetings Automatically",
		description: "AI that coordinates scheduling across time zones and calendars",
		saleorValue: "meeting_scheduler",
	},
	marketing_content: {
		title: "Create On-Brand Content",
		description: "Generate marketing content that matches your brand voice",
		saleorValue: "marketing_content",
	},
	data_extraction: {
		title: "Extract Data from Files",
		description: "Automatically extract structured data from documents and images",
		saleorValue: "data_extraction",
	},
	monitoring_alerting: {
		title: "Monitor & Alert on Changes",
		description: "Automated monitoring with real-time alerts",
		saleorValue: "monitoring_alerting",
	},
	hr_ops: {
		title: "Streamline HR Ops",
		description: "Automate HR workflows from onboarding to employee support",
		saleorValue: "hr_ops",
	},
};

const validOutcomes = Object.keys(outcomeMeta);

// Mapping from URL filter keys to Saleor attribute slugs
const filterToAttribute: Record<string, string> = {
	roles: "gsv_roles",
	value_streams: "gsv_value_stream",
	capabilities: "gsv_capabilities",
	integrations: "gsv_integrations_required",
	deployment: "gsv_deployment",
};

export async function generateMetadata(props: {
	params: Promise<{ outcome: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const meta = outcomeMeta[params.outcome];
	if (!meta) return { title: "Outcomes | Digitlify" };
	return {
		title: `${meta.title} | Digitlify Marketplace`,
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

export default async function OutcomePage(props: {
	params: Promise<{ channel: string; outcome: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;

	if (!validOutcomes.includes(params.outcome)) {
		notFound();
	}

	const meta = outcomeMeta[params.outcome];
	const urlFilters = parseFiltersFromParams(searchParams);

	// Build attribute filters from URL params
	const attributeFilters = [
		// Always include the outcome filter
		{ slug: "gsv_value_stream", values: [meta.saleorValue] },
	];

	// Add additional filters from URL
	for (const [key, values] of Object.entries(urlFilters)) {
		const attrSlug = filterToAttribute[key];
		if (attrSlug && values.length > 0) {
			attributeFilters.push({ slug: attrSlug, values });
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

	// Build active filters for FacetRail (include the outcome as a value_stream filter)
	const activeFilters = {
		...urlFilters,
		value_streams: [params.outcome, ...(urlFilters.value_streams || [])],
	};

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Hero */}
			<div className="bg-gradient-to-br from-green-600 to-teal-700 py-12 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<p className="text-sm font-medium text-green-200 mb-2">Outcome</p>
					<h1 className="text-3xl font-bold">{meta.title}</h1>
					<p className="mt-2 text-lg text-green-100">{meta.description}</p>
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
								{totalCount} offering{totalCount !== 1 ? "s" : ""} that {meta.title.toLowerCase()}
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
							emptyMessage={`No offerings found for "${meta.title}".`}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
