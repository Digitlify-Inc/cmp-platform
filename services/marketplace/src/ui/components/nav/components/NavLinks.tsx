import { NavLink } from "./NavLink";

/**
 * Primary navigation per PRD_SINGLE_SITE.md
 * Nav structure: Home | Products | Solutions | Pricing | Resources
 * Marketplace is NOT a nav item - it's a CTA button (handled in Header)
 *
 * Note: Saleor category collections (Agents, Apps, Assistants, Automations)
 * are shown on the marketplace page, not in the main navigation.
 */
const getPrimaryNavLinks = (channel: string) => [
	{ label: "Home", href: `/${channel}` },
	{ label: "Products", href: `/${channel}/products` },
	{ label: "Solutions", href: `/${channel}/solutions` },
	{ label: "Pricing", href: `/${channel}/pricing` },
	{ label: "Resources", href: `/${channel}/resources` },
];

export const NavLinks = ({ channel }: { channel: string }) => {
	const primaryNavLinks = getPrimaryNavLinks(channel);

	return (
		<>
			{primaryNavLinks.map((link) => (
				<NavLink key={link.label} href={link.href} isActive={false}>
					{link.label}
				</NavLink>
			))}
		</>
	);
};
