/**
 * Channel validation utilities
 * Prevents redirect loops when Saleor channel doesn't exist
 */

import { executeGraphQL } from "@/lib/graphql";
import { ChannelDocument } from "@/gql/graphql";
import { DefaultChannelSlug } from "@/app/config";

export interface ChannelInfo {
	slug: string;
	name: string;
	currencyCode: string;
	isActive: boolean;
}

/**
 * Validates that a channel exists and is active in Saleor
 * Returns channel info if valid, null if not found or inactive
 */
export async function validateChannel(channelSlug: string): Promise<ChannelInfo | null> {
	try {
		const result = await executeGraphQL(ChannelDocument, {
			variables: { slug: channelSlug },
			withAuth: false,
			cache: "force-cache",
			revalidate: 60, // Cache for 1 minute
		});

		if (result.channel && result.channel.isActive) {
			return {
				slug: result.channel.slug,
				name: result.channel.name,
				currencyCode: result.channel.currencyCode,
				isActive: result.channel.isActive,
			};
		}

		return null;
	} catch (error) {
		console.error(`[channel] Failed to validate channel "${channelSlug}":`, error);
		return null;
	}
}

/**
 * Gets the default channel slug from environment or fallback
 */
export function getDefaultChannelSlug(): string {
	return DefaultChannelSlug;
}

/**
 * Checks if Saleor API is reachable
 */
export async function isSaleorReachable(): Promise<boolean> {
	const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
	if (!saleorApiUrl) {
		return false;
	}

	try {
		const response = await fetch(saleorApiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: "{ __typename }" }),
			cache: "no-store",
		});
		return response.ok;
	} catch {
		return false;
	}
}
