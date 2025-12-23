/**
 * Marketplace utilities for transforming Saleor products to Offering format
 * Based on docs/cmp/23-Saleor-Attribute-Schema-v1.md
 */

import type { Offering } from "@/ui/components/marketplace/OfferingCard";

// Saleor product type for transformation
export type SaleorAttribute = {
	attribute: { slug: string; name: string };
	values: Array<{ slug: string; name: string }>;
};

export type SaleorMetadata = {
	key: string;
	value: string;
};

export type SaleorProduct = {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	thumbnail?: { url: string; alt?: string | null } | null;
	pricing?: {
		priceRange?: {
			start?: { gross?: { amount: number; currency: string } | null } | null;
		} | null;
	} | null;
	category?: { slug: string; name: string } | null;
	attributes?: SaleorAttribute[] | null;
	metadata?: SaleorMetadata[] | null;
	collections?: Array<{ id: string; name: string; slug: string }> | null;
};

/**
 * Get attribute values by slug per docs/cmp/23-Saleor-Attribute-Schema-v1.md
 */
export function getAttributeValues(
	attributes: SaleorAttribute[] | null | undefined,
	slug: string
): string[] {
	const attr = attributes?.find((a) => a.attribute.slug === slug);
	return attr?.values.map((v) => v.slug) || [];
}

export function getAttributeValue(
	attributes: SaleorAttribute[] | null | undefined,
	slug: string
): string | undefined {
	return getAttributeValues(attributes, slug)[0];
}

/**
 * Get metadata value by key per docs/cmp/23-Saleor-Attribute-Schema-v1.md §4
 */
export function getMetadataValue(
	metadata: SaleorMetadata[] | null | undefined,
	key: string
): string | undefined {
	return metadata?.find((m) => m.key === key)?.value;
}

/**
 * Map gsv_category attribute to Offering category type
 */
export function mapCategory(
	categoryValue: string | undefined
): Offering["category"] {
	const cat = categoryValue?.toLowerCase() || "";
	if (cat === "agent" || cat === "agents") return "agent";
	if (cat === "app" || cat === "apps") return "app";
	if (cat === "assistant" || cat === "assistants") return "assistant";
	if (cat === "automation" || cat === "automations") return "automation";
	return "agent";
}

/**
 * Transform Saleor product to Offering format per docs/cmp/21-UI-Spec-v1.md §5.3
 */
export function transformProduct(product: SaleorProduct): Offering {
	// Get category from gsv_category attribute (per schema §2.1)
	const gsvCategory = getAttributeValue(product.attributes, "gsv_category");
	// Also check collections for category (Agents, Apps, etc.)
	const collectionCategory = product.collections?.find((c) =>
		["agents", "apps", "assistants", "automations"].includes(c.slug.toLowerCase())
	)?.slug;
	const category = gsvCategory
		? mapCategory(gsvCategory)
		: collectionCategory
			? mapCategory(collectionCategory)
			: mapCategory(product.category?.slug);

	// Get capabilities from gsv_capabilities attribute (per schema §2.2)
	const capabilities = getAttributeValues(product.attributes, "gsv_capabilities");

	// Get boolean attributes (per schema §2.4)
	const trialAvailable =
		getAttributeValue(product.attributes, "gsv_trial_available") === "true";
	const verified =
		getAttributeValue(product.attributes, "gsv_verified") === "true";
	const badges = getAttributeValues(product.attributes, "gsv_badges");
	const isNew = badges.includes("new");

	// Get metadata values (per schema §4.1)
	const creditsEstimateMin = getMetadataValue(
		product.metadata,
		"credits_estimate_min"
	);
	const creditsEstimateMax = getMetadataValue(
		product.metadata,
		"credits_estimate_max"
	);
	const outcomeTagline = getMetadataValue(product.metadata, "outcome_tagline");

	// Fallback credit estimates by category if not in metadata
	const defaultCredits: Record<string, [number, number]> = {
		agent: [5, 25],
		app: [3, 15],
		assistant: [2, 10],
		automation: [1, 5],
	};
	const [defaultMin, defaultMax] = defaultCredits[category] || [5, 25];

	return {
		id: product.id,
		slug: product.slug,
		name: product.name,
		description: outcomeTagline || product.description || undefined,
		outcomeTagline: outcomeTagline || undefined,
		thumbnail: product.thumbnail?.url,
		category,
		capabilities: capabilities.length > 0 ? capabilities : undefined,
		startingPrice: product.pricing?.priceRange?.start?.gross?.amount,
		creditsEstimateMin: creditsEstimateMin
			? parseInt(creditsEstimateMin, 10)
			: defaultMin,
		creditsEstimateMax: creditsEstimateMax
			? parseInt(creditsEstimateMax, 10)
			: defaultMax,
		verified: verified || true, // Default to verified for v1
		trialAvailable: trialAvailable || true, // Default to trial available for v1
		isNew,
	};
}

/**
 * Build Saleor filter from URL search params
 * Maps filter keys to Saleor attribute filter format
 * Filter keys match FacetRail component for consistency
 */
export function buildSaleorFilter(searchParams: Record<string, string | string[] | undefined>) {
	const attributeFilters: Array<{ slug: string; values: string[] }> = [];

	// Map URL params to Saleor attribute slugs
	// Keys match FacetRail.tsx filterGroups for consistency
	const paramToAttribute: Record<string, string> = {
		category: "gsv_category",
		roles: "gsv_roles",
		value_streams: "gsv_value_stream",
		capabilities: "gsv_capabilities",
		integrations: "gsv_integrations_required",
		deployment: "gsv_deployment",
	};

	for (const [param, attrSlug] of Object.entries(paramToAttribute)) {
		const value = searchParams[param];
		if (value) {
			const values = Array.isArray(value) ? value : [value];
			attributeFilters.push({ slug: attrSlug, values });
		}
	}

	// Handle trust signals (verified, featured, trial)
	const trust = searchParams.trust;
	if (trust) {
		const trustValues = Array.isArray(trust) ? trust : [trust];
		if (trustValues.includes("verified")) {
			attributeFilters.push({ slug: "gsv_verified", values: ["true"] });
		}
		if (trustValues.includes("trial")) {
			attributeFilters.push({ slug: "gsv_trial_available", values: ["true"] });
		}
		if (trustValues.includes("featured")) {
			attributeFilters.push({ slug: "gsv_badges", values: ["featured"] });
		}
	}

	// Only return filter if we have attributes to filter by
	if (attributeFilters.length === 0) {
		return undefined;
	}

	return {
		attributes: attributeFilters,
	};
}

/**
 * Category metadata for display
 */
export const categoryMeta: Record<
	string,
	{ title: string; description: string; singular: string; saleorValue: string }
> = {
	agents: {
		title: "AI Agents",
		description: "Autonomous AI agents that handle complex tasks and workflows",
		singular: "agent",
		saleorValue: "agent",
	},
	apps: {
		title: "Apps",
		description: "Applications and integrations to extend your platform",
		singular: "app",
		saleorValue: "app",
	},
	assistants: {
		title: "AI Assistants",
		description: "Conversational AI assistants for various use cases",
		singular: "assistant",
		saleorValue: "assistant",
	},
	automations: {
		title: "Automations",
		description: "Workflow automation tools to streamline operations",
		singular: "automation",
		saleorValue: "automation",
	},
};

export const validCategories = Object.keys(categoryMeta);
