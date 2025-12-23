import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelsListDocument } from "@/gql/graphql";
import { DefaultChannelSlug } from "@/app/config";

// Allow dynamic rendering to validate channel at request time
export const dynamic = "force-dynamic";

export const generateStaticParams = async () => {
	// Skip static generation during build when API is not accessible
	if (process.env.SKIP_STATIC_GENERATION === "true") {
		return [{ channel: DefaultChannelSlug }];
	}

	// the `channels` query is protected
	// you can either hardcode the channels or use an app token to fetch the channel list here

	if (process.env.SALEOR_APP_TOKEN) {
		try {
			const channels = await executeGraphQL(ChannelsListDocument, {
			withAuth: false, // disable cookie-based auth for this call
			headers: {
				// and use app token instead
				Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
			},
		});
		return (
			channels.channels
				?.filter((channel) => channel.isActive)
				.map((channel) => ({ channel: channel.slug })) ?? []
		);
		} catch {
			// If API is not reachable, use default channel
			return [{ channel: DefaultChannelSlug }];
		}
	} else {
		return [{ channel: DefaultChannelSlug }];
	}
};

/**
 * Validates that the channel exists in Saleor
 * Returns true if valid, false if API unreachable (allows graceful degradation)
 * Throws notFound() if API reachable but channel doesn't exist
 */
async function validateChannelExists(channelSlug: string): Promise<boolean> {
	const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;

	if (!saleorApiUrl) {
		console.warn("[channel] No Saleor API URL configured, skipping validation");
		return true; // Allow rendering without validation
	}

	try {
		const response = await fetch(saleorApiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `query Channel($slug: String!) { channel(slug: $slug) { slug isActive } }`,
				variables: { slug: channelSlug },
			}),
			cache: "no-store", // Always check fresh
		});

		if (!response.ok) {
			console.warn(`[channel] Saleor API returned ${response.status}, allowing graceful degradation`);
			return true; // API error, allow rendering
		}

		const data = await response.json() as { errors?: unknown; data?: { channel?: { slug: string; isActive: boolean } } };

		if (data.errors) {
			console.warn("[channel] GraphQL errors:", data.errors);
			return true; // GraphQL error, allow rendering
		}

		const channel = data.data?.channel;

		if (!channel) {
			console.error(`[channel] Channel "${channelSlug}" not found in Saleor`);
			return false; // Channel doesn't exist
		}

		if (!channel.isActive) {
			console.error(`[channel] Channel "${channelSlug}" exists but is not active`);
			return false; // Channel inactive
		}

		return true; // Channel valid
	} catch (error) {
		console.warn("[channel] Failed to validate channel, allowing graceful degradation:", error);
		return true; // Network error, allow rendering
	}
}

export default async function ChannelLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;

	// Validate channel exists in Saleor
	const isValid = await validateChannelExists(channel);

	if (!isValid) {
		notFound();
	}

	return children;
}
