import TypographyPlugin from "@tailwindcss/typography";
import FormPlugin from "@tailwindcss/forms";
import ContainerQueriesPlugin from "@tailwindcss/container-queries";
import { type Config } from "tailwindcss";

/**
 * Digitlify Brand Colors
 * Consistent with CMS site (dev.gsv.dev) and marketing materials
 * Primary: Purple/Violet gradient
 */
const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				// Brand primary - matches CMS site
				brand: {
					50: "#faf5ff",
					100: "#f3e8ff",
					200: "#e9d5ff",
					300: "#d8b4fe",
					400: "#c084fc",
					500: "#a855f7", // Primary accent
					600: "#9333ea", // Primary
					700: "#7c3aed", // Violet-600 - main brand color
					800: "#6b21a8",
					900: "#581c87",
					950: "#3b0764",
				},
				// Primary color palette - consistent with CMS
				primary: {
					50: "#faf5ff",
					100: "#f3e8ff",
					200: "#e9d5ff",
					300: "#d8b4fe",
					400: "#c084fc",
					500: "#a855f7",
					600: "#9333ea",
					700: "#7c3aed", // Primary brand color
					800: "#6b21a8",
					900: "#581c87",
					950: "#3b0764",
					DEFAULT: "#7c3aed",
					hover: "#6d28d9",
					light: "#8b5cf6",
					dark: "#5b21b6",
				},
				// Accent colors
				accent: {
					violet: "#8b5cf6",
					purple: "#6d28d9",
				},
			},
			backgroundImage: {
				// Brand gradients matching CMS site
				"brand-gradient": "linear-gradient(to right, #7c3aed, #9333ea)",
				"brand-gradient-dark": "linear-gradient(to right, #6d28d9, #7c3aed)",
				"cta-gradient": "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
			},
		},
	},
	plugins: [TypographyPlugin, FormPlugin, ContainerQueriesPlugin],
};

export default config;
