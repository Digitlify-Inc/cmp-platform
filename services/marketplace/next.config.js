/** @type {import('next').NextConfig} */
const config = {
	images: {
		remotePatterns: [
			{
				hostname: "*",
			},
		],
	},
	experimental: {
		typedRoutes: false,
	},
	// used in the Dockerfile
	output:
		process.env.NEXT_OUTPUT === "standalone"
			? "standalone"
			: process.env.NEXT_OUTPUT === "export"
				? "export"
				: undefined,

	// Rewrites to hide default-channel from URLs (keeps URL in browser unchanged)
	async rewrites() {
		return {
			// These rewrites run before filesystem check
			beforeFiles: [
				// Homepage - rewrite to default channel
				{
					source: "/",
					destination: "/default-channel",
				},
				// Marketplace routes - rewrite to default channel
				{
					source: "/marketplace",
					destination: "/default-channel/marketplace",
				},
				{
					source: "/marketplace/:path*",
					destination: "/default-channel/marketplace/:path*",
				},
				// Cart
				{
					source: "/cart",
					destination: "/default-channel/cart",
				},
				// Account routes
				{
					source: "/account",
					destination: "/default-channel/account",
				},
				{
					source: "/account/:path*",
					destination: "/default-channel/account/:path*",
				},
				// Checkout
				{
					source: "/checkout",
					destination: "/default-channel/checkout",
				},
				{
					source: "/checkout/:path*",
					destination: "/default-channel/checkout/:path*",
				},
				// Login
				{
					source: "/login",
					destination: "/default-channel/login",
				},
				// Products
				{
					source: "/products",
					destination: "/default-channel/products",
				},
				{
					source: "/products/:slug",
					destination: "/default-channel/products/:slug",
				},
				// Orders
				{
					source: "/orders",
					destination: "/default-channel/orders",
				},
				{
					source: "/orders/:path*",
					destination: "/default-channel/orders/:path*",
				},
				// Categories
				{
					source: "/categories/:slug",
					destination: "/default-channel/categories/:slug",
				},
				// Resources
				{
					source: "/resources",
					destination: "/default-channel/resources",
				},
				// Search
				{
					source: "/search",
					destination: "/default-channel/search",
				},
			],
		};
	},

	// Redirects for legacy URLs and external redirects
	async redirects() {
		return [
			// Redirect /default-channel URLs to clean URLs (hide default-channel from browser)
			{
				source: "/default-channel",
				destination: "/",
				permanent: true,
			},
			{
				source: "/default-channel/marketplace",
				destination: "/marketplace",
				permanent: true,
			},
			{
				source: "/default-channel/marketplace/:path*",
				destination: "/marketplace/:path*",
				permanent: true,
			},
			{
				source: "/default-channel/account",
				destination: "/account",
				permanent: true,
			},
			{
				source: "/default-channel/account/:path*",
				destination: "/account/:path*",
				permanent: true,
			},
			{
				source: "/default-channel/cart",
				destination: "/cart",
				permanent: true,
			},
			{
				source: "/default-channel/checkout",
				destination: "/checkout",
				permanent: true,
			},
			{
				source: "/default-channel/checkout/:path*",
				destination: "/checkout/:path*",
				permanent: true,
			},
			{
				source: "/default-channel/login",
				destination: "/login",
				permanent: true,
			},
			{
				source: "/default-channel/products",
				destination: "/products",
				permanent: true,
			},
			{
				source: "/default-channel/products/:slug",
				destination: "/products/:slug",
				permanent: true,
			},
			{
				source: "/default-channel/orders",
				destination: "/orders",
				permanent: true,
			},
			{
				source: "/default-channel/orders/:path*",
				destination: "/orders/:path*",
				permanent: true,
			},
			{
				source: "/default-channel/resources",
				destination: "/resources",
				permanent: true,
			},
			{
				source: "/default-channel/search",
				destination: "/search",
				permanent: true,
			},
			// Legacy /categories/ URLs (redirect to new structure)
			{
				source: "/marketplace/categories/:category",
				destination: "/marketplace/:category",
				permanent: true,
			},
			{
				source: "/:channel/marketplace/categories/:category",
				destination: "/:channel/marketplace/:category",
				permanent: true,
			},
			// Note: /pricing, /solutions are now served by Next.js routes (no external redirects needed)
		];
	},

	// Headers for security
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
				],
			},
		];
	},
};

export default config;
