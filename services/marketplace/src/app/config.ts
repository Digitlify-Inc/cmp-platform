import { createSaleorAuthClient } from "@saleor/auth-sdk";
import { getNextServerCookiesStorageAsync } from "@saleor/auth-sdk/next/server";
import { invariant } from "ts-invariant";

export const ProductsPerPage = 12;

// Get Saleor API URL - prefer server-side SALEOR_API_URL, fallback to NEXT_PUBLIC_
function getSaleorApiUrl(): string {
	// Server-side: prefer SALEOR_API_URL (runtime env, not baked in)
	if (typeof window === "undefined" && process.env.SALEOR_API_URL) {
		return process.env.SALEOR_API_URL;
	}
	// Client-side or fallback
	return process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
}

export const DefaultChannelSlug =
	process.env.NEXT_PUBLIC_DEFAULT_CHANNEL ?? "default-channel";

export const getServerAuthClient = async () => {
	const saleorApiUrl = getSaleorApiUrl();
	invariant(saleorApiUrl, "Missing SALEOR_API_URL or NEXT_PUBLIC_SALEOR_API_URL env variable");
	const nextServerCookiesStorage = await getNextServerCookiesStorageAsync();
	return createSaleorAuthClient({
		saleorApiUrl,
		refreshTokenStorage: nextServerCookiesStorage,
		accessTokenStorage: nextServerCookiesStorage,
	});
};
