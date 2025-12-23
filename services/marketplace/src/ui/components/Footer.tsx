import Link from "next/link";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { ChannelsListDocument, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

// Digitlify logo for footer
const FooterLogo = () => (
	<div className="flex items-center">
		<svg
			width="28"
			height="28"
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="mr-2"
		>
			<path
				d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z"
				fill="url(#digitlify-footer-gradient)"
			/>
			<text
				x="16"
				y="20"
				textAnchor="middle"
				fill="white"
				fontSize="14"
				fontWeight="bold"
				fontFamily="system-ui, sans-serif"
			>
				D
			</text>
			<defs>
				<linearGradient
					id="digitlify-footer-gradient"
					x1="3.87564"
					y1="2"
					x2="28.1244"
					y2="30"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#8b5cf6" />
					<stop offset="1" stopColor="#6d28d9" />
				</linearGradient>
			</defs>
		</svg>
		<span className="font-bold text-violet-600">Digitlify</span>
	</div>
);

/**
 * Footer links per PRD_SINGLE_SITE.md
 * Single-site architecture: All pages served by Next.js
 * Footer columns: Product | Resources | Company
 */
const getDefaultFooterSections = (channel: string) => [
	{
		title: "Product",
		links: [
			{ label: "Marketplace", href: `/${channel}/marketplace` },
			{ label: "Solutions", href: `/${channel}/solutions` },
			{ label: "Pricing", href: `/${channel}/pricing` },
			{ label: "Integrations", href: `/${channel}/integrations` },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Documentation", href: `/${channel}/docs` },
			{ label: "Blog", href: `/${channel}/blog` },
			{ label: "Changelog", href: `/${channel}/changelog` },
			{ label: "Templates", href: `/${channel}/templates` },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "About", href: `/${channel}/about` },
			{ label: "Security", href: `/${channel}/security` },
			{ label: "Contact", href: `/${channel}/contact` },
		],
	},
];

// Legal links for footer bottom (internal routes per single-site architecture)
const getLegalLinks = (channel: string) => [
	{ label: "Privacy", href: `/${channel}/legal/privacy` },
	{ label: "Terms", href: `/${channel}/legal/terms` },
	{ label: "Security", href: `/${channel}/security` },
];

export async function Footer({ channel }: { channel: string }) {
	const footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "footer", channel },
		revalidate: 60 * 60 * 24,
	});
	const channels = process.env.SALEOR_APP_TOKEN
		? await executeGraphQL(ChannelsListDocument, {
				withAuth: false,
				headers: {
					Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
				},
		  })
		: null;
	const currentYear = new Date().getFullYear();
	const hasMenuItems = footerLinks.menu?.items && footerLinks.menu.items.length > 0;
	const legalLinks = getLegalLinks(channel);

	return (
		<footer className="border-t border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-900">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
				<div className="grid grid-cols-2 md:grid-cols-5 gap-8">
					{/* Logo and tagline - takes 2 columns */}
					<div className="col-span-2">
						<FooterLogo />
						<p className="mt-4 text-sm text-neutral-600 dark:text-slate-400">
							Simplify IT. Amplify IT. Digitlify IT.
						</p>
						<p className="mt-1 text-sm text-neutral-500 dark:text-slate-500">
							The AI Agent Marketplace.
						</p>
					</div>
					{hasMenuItems ? (
						footerLinks.menu?.items?.map((item) => (
							<div key={item.id}>
								<h3 className="text-sm font-semibold text-neutral-900 dark:text-slate-100">{item.name}</h3>
								<ul className="mt-4 space-y-3">
									{item.children?.map((child) => {
										if (child.category) {
											return (
												<li key={child.id} className="text-sm">
													<LinkWithChannel
														href={`/marketplace/${child.category.slug}`}
														className="text-neutral-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
													>
														{child.category.name}
													</LinkWithChannel>
												</li>
											);
										}
										if (child.collection) {
											return (
												<li key={child.id} className="text-sm">
													<LinkWithChannel
														href={`/marketplace/${child.collection.slug}`}
														className="text-neutral-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
													>
														{child.collection.name}
													</LinkWithChannel>
												</li>
											);
										}
										if (child.page) {
											return (
												<li key={child.id} className="text-sm">
													<LinkWithChannel
														href={`/pages/${child.page.slug}`}
														className="text-neutral-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
													>
														{child.page.title}
													</LinkWithChannel>
												</li>
											);
										}
										if (child.url) {
											return (
												<li key={child.id} className="text-sm">
													<Link
														href={child.url}
														className="text-neutral-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
													>
														{child.name}
													</Link>
												</li>
											);
										}
										return null;
									})}
								</ul>
							</div>
						))
					) : (
						getDefaultFooterSections(channel).map((section) => (
							<div key={section.title}>
								<h3 className="text-sm font-semibold text-neutral-900 dark:text-slate-100">{section.title}</h3>
								<ul className="mt-4 space-y-3">
									{section.links.map((link) => (
										<li key={link.label} className="text-sm">
											<Link
												href={link.href}
												className="text-neutral-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))
					)}
				</div>
				{channels?.channels && (
					<div className="mb-4 text-neutral-500 dark:text-slate-400">
						<label>
							<span className="text-sm">Change currency:</span> <ChannelSelect channels={channels.channels} />
						</label>
					</div>
				)}
				{/* Bottom bar with copyright and legal links */}
				<div className="mt-12 pt-8 border-t border-neutral-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-neutral-500 dark:text-slate-400 text-sm">
						&copy; {currentYear} Digitlify Inc. All rights reserved.
					</p>
					<div className="flex gap-6">
						{legalLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-neutral-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-violet-400 text-sm transition-colors"
							>
								{link.label}
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
