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

const capabilityMeta: Record<string, { title: string; description: string; saleorValue: string }> = {
	rag_knowledgebase: {
		title: "RAG Knowledgebase",
		description: "Retrieval-augmented generation for accurate answers from your documents",
		saleorValue: "rag.knowledge_base",
	},
	web_widget: {
		title: "Web Widget",
		description: "Embeddable chat widget for your website with custom branding",
		saleorValue: "web_widget.branding",
	},
	chat_ui: {
		title: "Chat UI",
		description: "Conversational interface for natural language interactions",
		saleorValue: "chat_ui.floating",
	},
	multilingual: {
		title: "Multilingual",
		description: "Support for multiple languages with automatic translation",
		saleorValue: "multilingual.i18n",
	},
	mcp_tools: {
		title: "MCP Tools",
		description: "Model Context Protocol tools for extended AI capabilities",
		saleorValue: "integrations.mcp_tools",
	},
	tool_connectors: {
		title: "Tool Connectors",
		description: "Pre-built integrations with popular business tools",
		saleorValue: "integrations.tool_connectors",
	},
	scheduler_triggers: {
		title: "Scheduler & Triggers",
		description: "Automated scheduling and event-based triggers",
		saleorValue: "ops.scheduling",
	},
	guardrails_policy: {
		title: "Guardrails & Policies",
		description: "Safety guardrails and policy enforcement for AI outputs",
		saleorValue: "governance.guardrails",
	},
};

const validCapabilities = Object.keys(capabilityMeta);

// Mapping from URL filter keys to Saleor attribute slugs
const filterToAttribute: Record<string, string> = {
	roles: "gsv_roles",
	value_streams: "gsv_value_stream",
	capabilities: "gsv_capabilities",
	integrations: "gsv_integrations_required",
	deployment: "gsv_deployment",
};

export async function generateMetadata(props: {
	params: Promise<{ capability: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const meta = capabilityMeta[params.capability];
	if (!meta) return { title: "Capabilities | Digitlify" };
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

export default async function CapabilityPage(props: {
	params: Promise<{ channel: string; capability: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;

	if (!validCapabilities.includes(params.capability)) {
		notFound();
	}

	const meta = capabilityMeta[params.capability];
	const urlFilters = parseFiltersFromParams(searchParams);

	// Build attribute filters from URL params
	const attributeFilters = [
		// Always include the capability filter
		{ slug: "gsv_capabilities", values: [meta.saleorValue] },
	];

	// Add additional filters from URL
	for (const [key, values] of Object.entries(urlFilters)) {
		const attrSlug = filterToAttribute[key];
		if (attrSlug && values.length > 0) {
			// Don't duplicate capabilities filter
			if (attrSlug === "gsv_capabilities") {
				// Merge with existing capability filter
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

	// Build active filters for FacetRail (include the capability filter)
	const activeFilters = {
		...urlFilters,
		capabilities: [params.capability, ...(urlFilters.capabilities || [])],
	};

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Hero */}
			<div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<p className="text-sm font-medium text-blue-200 mb-2">Capability</p>
					<h1 className="text-3xl font-bold">{meta.title}</h1>
					<p className="mt-2 text-lg text-blue-100">{meta.description}</p>
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
								{totalCount} offering{totalCount !== 1 ? "s" : ""} with {meta.title}
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
							emptyMessage={`No offerings found with "${meta.title}" capability.`}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
