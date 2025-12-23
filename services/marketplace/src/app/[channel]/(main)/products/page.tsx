import Link from "next/link";
import {
	Bot,
	Zap,
	MessageSquare,
	Workflow,
	ArrowRight,
	Shield,
	Gauge,
	Plug,
	CreditCard,
} from "lucide-react";

export const metadata = {
	title: "Products - AI Agents, Apps, Assistants & Automations | Digitlify",
	description: "Explore Digitlify's product categories: AI Agents, Apps, Assistants, and Automations. Production-ready AI solutions for your business.",
};

const productCategories = [
	{
		id: "agents",
		name: "AI Agents",
		icon: Bot,
		tagline: "Autonomous AI that works for you",
		description: "Deploy autonomous AI agents that complete complex tasks independently. From customer support to data analysis, our agents work 24/7 without supervision.",
		features: [
			"Multi-step task completion",
			"Context-aware decision making",
			"Tool and API integrations",
			"Customizable personas",
		],
		useCases: ["Customer Support", "Sales Outreach", "Research Assistant", "Code Review"],
		color: "violet",
	},
	{
		id: "apps",
		name: "AI Apps",
		icon: Zap,
		tagline: "Structured AI-powered applications",
		description: "Ready-to-deploy applications with AI at their core. Embed intelligent features into your workflows with minimal setup.",
		features: [
			"Pre-built UI components",
			"API-first architecture",
			"White-label options",
			"Analytics dashboard",
		],
		useCases: ["Document Processing", "Image Generation", "Data Extraction", "Content Creation"],
		color: "blue",
	},
	{
		id: "assistants",
		name: "AI Assistants",
		icon: MessageSquare,
		tagline: "Interactive chat and voice AI",
		description: "Conversational AI assistants that understand context, remember history, and provide helpful responses in natural language.",
		features: [
			"Multi-turn conversations",
			"Voice and text interfaces",
			"Knowledge base integration",
			"Sentiment analysis",
		],
		useCases: ["Help Desk Bot", "FAQ Automation", "Onboarding Guide", "Virtual Concierge"],
		color: "emerald",
	},
	{
		id: "automations",
		name: "AI Automations",
		icon: Workflow,
		tagline: "Event-driven workflows on autopilot",
		description: "Set up intelligent workflows that trigger automatically based on events. Connect your tools and let AI handle the rest.",
		features: [
			"Event-based triggers",
			"Conditional logic",
			"Multi-app orchestration",
			"Scheduled tasks",
		],
		useCases: ["Lead Scoring", "Email Triage", "Report Generation", "Data Sync"],
		color: "orange",
	},
];

const platformFeatures = [
	{
		icon: Shield,
		title: "Enterprise Security",
		description: "SOC 2 compliant, tenant isolation, encrypted at rest and in transit.",
	},
	{
		icon: Gauge,
		title: "99.9% Uptime",
		description: "Highly available infrastructure with automatic failover.",
	},
	{
		icon: Plug,
		title: "100+ Integrations",
		description: "Connect to Slack, Salesforce, HubSpot, and more via MCP.",
	},
	{
		icon: CreditCard,
		title: "Pay Per Use",
		description: "Credit-based pricing. Only pay for what you actually use.",
	},
];

const colorMap = {
	violet: {
		bg: "bg-violet-50",
		border: "border-violet-200",
		text: "text-violet-600",
		hover: "hover:border-violet-400",
		button: "bg-violet-600 hover:bg-violet-700",
	},
	blue: {
		bg: "bg-blue-50",
		border: "border-blue-200",
		text: "text-blue-600",
		hover: "hover:border-blue-400",
		button: "bg-blue-600 hover:bg-blue-700",
	},
	emerald: {
		bg: "bg-emerald-50",
		border: "border-emerald-200",
		text: "text-emerald-600",
		hover: "hover:border-emerald-400",
		button: "bg-emerald-600 hover:bg-emerald-700",
	},
	orange: {
		bg: "bg-orange-50",
		border: "border-orange-200",
		text: "text-orange-600",
		hover: "hover:border-orange-400",
		button: "bg-orange-600 hover:bg-orange-700",
	},
};

export default async function ProductsPage({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;

	return (
		<div className="min-h-screen bg-white">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-16 lg:py-24">
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl" />
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/50 rounded-full blur-3xl" />
				</div>

				<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
						Our Products
					</h1>
					<p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
						Production-ready AI solutions organized around the 4 A's: Agents, Apps, Assistants, and Automations.
					</p>
				</div>
			</section>

			{/* Product Categories */}
			<section className="py-16 lg:py-24">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="space-y-16">
						{productCategories.map((category, index) => {
							const Icon = category.icon;
							const colors = colorMap[category.color as keyof typeof colorMap];
							const isEven = index % 2 === 0;

							return (
								<div
									key={category.id}
									className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-16 items-center`}
								>
									{/* Content */}
									<div className="flex-1">
										<div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-sm font-medium mb-4`}>
											<Icon className="w-4 h-4" />
											{category.name}
										</div>
										<h2 className="text-3xl font-bold text-neutral-900">{category.tagline}</h2>
										<p className="mt-4 text-lg text-neutral-600">{category.description}</p>

										<div className="mt-6">
											<h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Key Features</h3>
											<ul className="mt-3 space-y-2">
												{category.features.map((feature) => (
													<li key={feature} className="flex items-center gap-2 text-neutral-600">
														<span className={`w-1.5 h-1.5 rounded-full ${colors.button}`} />
														{feature}
													</li>
												))}
											</ul>
										</div>

										<div className="mt-8">
											<Link
												href={`/${channel}/marketplace/${category.id}`}
												className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold ${colors.button} transition-colors`}
											>
												Browse {category.name}
												<ArrowRight className="w-4 h-4" />
											</Link>
										</div>
									</div>

									{/* Use Cases Card */}
									<div className={`flex-1 w-full rounded-2xl border ${colors.border} ${colors.bg} p-8 ${colors.hover} transition-colors`}>
										<h3 className="text-lg font-semibold text-neutral-900 mb-4">Popular Use Cases</h3>
										<div className="grid grid-cols-2 gap-4">
											{category.useCases.map((useCase) => (
												<div
													key={useCase}
													className="bg-white rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700"
												>
													{useCase}
												</div>
											))}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Platform Features */}
			<section className="py-16 lg:py-24 bg-neutral-50">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-neutral-900">Built for Enterprise</h2>
						<p className="mt-4 text-lg text-neutral-600">Every product comes with enterprise-grade features included.</p>
					</div>

					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{platformFeatures.map((feature) => {
							const Icon = feature.icon;
							return (
								<div key={feature.title} className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
									<div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-4">
										<Icon className="w-6 h-6" />
									</div>
									<h3 className="font-semibold text-neutral-900">{feature.title}</h3>
									<p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 lg:py-24 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl font-bold sm:text-4xl">Ready to Get Started?</h2>
					<p className="mt-4 text-lg text-violet-100">Browse our marketplace and deploy your first AI agent in minutes.</p>
					<div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href={`/${channel}/marketplace`}
							className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-xl bg-white text-violet-700 hover:bg-violet-50 transition-colors"
						>
							Browse Marketplace
						</Link>
						<Link
							href={`/${channel}/pricing`}
							className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-xl border-2 border-white text-white hover:bg-white/10 transition-colors"
						>
							View Pricing
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
