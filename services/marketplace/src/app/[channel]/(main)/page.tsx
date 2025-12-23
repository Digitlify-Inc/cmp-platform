import Link from "next/link";
import {
	Bot,
	Zap,
	Sparkles,
	Workflow,
	Shield,
	CreditCard,
	Scaling,
	Sliders,
	Plug,
	GitBranch,
	Users,
	BarChart3,
	MessageSquare,
} from "lucide-react";

/**
 * Homepage - Primary Public Site Landing
 * Per PRD_SINGLE_SITE.md: Single-site architecture with marketplace focus
 *
 * Sections:
 * 1. Hero with stats
 * 2. Browse by Category (4 A's)
 * 3. How It Works
 * 4. Why Digitlify (features)
 * 5. Testimonials
 * 6. CTA
 */

const stats = [
	{ value: "50+", label: "AI Agents" },
	{ value: "10K+", label: "API Calls Daily" },
	{ value: "99.9%", label: "Uptime" },
];

const categories = [
	{
		id: "agents",
		name: "Agents",
		icon: Bot,
		description: "Autonomous AI workers that complete tasks independently.",
		count: 15,
	},
	{
		id: "apps",
		name: "Apps",
		icon: Zap,
		description: "Structured AI-powered applications and workflows.",
		count: 12,
	},
	{
		id: "assistants",
		name: "Assistants",
		icon: MessageSquare,
		description: "Interactive chat and voice assistants.",
		count: 18,
		popular: true,
	},
	{
		id: "automations",
		name: "Automations",
		icon: Workflow,
		description: "Event-driven workflows that run on autopilot.",
		count: 10,
	},
];

const howItWorks = [
	{
		step: 1,
		title: "Browse",
		description: "Explore our marketplace of production-ready AI agents, apps, and automations.",
	},
	{
		step: 2,
		title: "Connect",
		description: "Link your tools - Slack, Email, CRM, Docs - with simple OAuth or API keys.",
	},
	{
		step: 3,
		title: "Run",
		description: "Deploy instantly or embed as a widget. Pay only for what you use with credits.",
	},
];

const features = [
	{ icon: Zap, title: "Deploy in Minutes", description: "No ML expertise required. Launch in under 5 minutes." },
	{ icon: Shield, title: "Enterprise Security", description: "Tenant isolation, Vault secrets, audit logs. Your data stays yours." },
	{ icon: Zap, title: "Instant Deployment", description: "From browse to running in minutes. No infrastructure to manage." },
	{ icon: Sparkles, title: "Fully Customizable", description: "Match your brand. Customize personas and behavior." },
	{ icon: CreditCard, title: "Credit-Based Pricing", description: "Pay for what you use. No subscriptions, no surprises." },
	{ icon: Scaling, title: "Auto-Scaling", description: "Handle 10 requests or 10 million automatically." },
	{ icon: Sliders, title: "Full Customization", description: "Configure prompts, connect your data, brand your widgets." },
	{ icon: Plug, title: "100+ Integrations", description: "Connect to Slack, Salesforce, and more via MCP." },
	{ icon: GitBranch, title: "Version Control", description: "Track changes, rollback anytime. Production-grade reliability." },
	{ icon: Users, title: "Team Collaboration", description: "Share agents across teams with role-based access control." },
	{ icon: BarChart3, title: "Analytics & Insights", description: "Track conversations and optimize performance." },
];

const testimonials = [
	{
		quote: "Digitlify transformed our customer support. Response times went from 24 hours to instant.",
		author: "Sarah Chen",
		role: "VP Customer Success, TechCorp",
		initial: "S",
	},
	{
		quote: "We reduced our support ticket volume by 45% in the first month. The AI agents handle tier-1 inquiries flawlessly.",
		author: "Sarah Chen",
		role: "VP of Customer Success, TechScale Inc",
		initial: "S",
	},
	{
		quote: "The MCP servers made integrating with Salesforce incredibly easy. Under an hour.",
		author: "Marcus Johnson",
		role: "CTO, FinanceHub",
		initial: "M",
	},
];

export const metadata = {
	title: "Digitlify - AI Agents That Work For You",
	description: "Browse, subscribe, and deploy production-ready AI agents. Pay only for what you use with credits.",
};

export default async function HomePage({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;

	return (
		<div className="min-h-screen bg-white dark:bg-slate-900">
			{/* Hero Section with Purple Accent */}
			<section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 py-16 lg:py-24">
				{/* Decorative background elements */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl" />
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl" />
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl" />
				</div>

				<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
						AI Agents That Work For You
					</h1>
					<p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
						Browse, subscribe, and deploy production-ready AI agents.
					</p>
					<div className="mt-8">
						<Link
							href={`/${channel}/marketplace`}
							className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg"
						>
							Explore Marketplace
						</Link>
					</div>

					{/* Stats */}
					<div className="mt-12 flex justify-center gap-12 lg:gap-20">
						{stats.map((stat) => (
							<div key={stat.label} className="text-center">
								<div className="text-3xl font-bold text-violet-600">{stat.value}</div>
								<div className="text-sm text-neutral-500">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Browse by Category */}
			<section className="py-16 lg:py-24 dark:bg-slate-900">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Browse by Category</h2>
						<p className="mt-2 text-lg text-neutral-600">
							Explore our marketplace organized around the 4 A's: Agents, Assistants, Apps, and Automation
						</p>
					</div>

					<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{categories.map((category) => {
							const Icon = category.icon;
							return (
								<Link
									key={category.id}
									href={`/${channel}/marketplace/${category.id}`}
									className="group rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center hover:border-violet-300 hover:shadow-lg transition-all"
								>
									<div className="flex justify-center mb-4">
										<Icon className="w-10 h-10 text-neutral-400 group-hover:text-violet-600 transition-colors" />
									</div>
									<h3 className="text-lg font-semibold text-neutral-900 group-hover:text-violet-600">
										{category.name}
									</h3>
									<p className="mt-2 text-sm text-neutral-500">{category.description}</p>
									<p className="mt-3 text-sm text-neutral-400">{category.count} available</p>
									{category.popular && (
										<span className="mt-2 inline-block px-2 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full">
											Popular
										</span>
									)}
								</Link>
							);
						})}
					</div>

					<div className="mt-8 text-center">
						<Link
							href={`/${channel}/marketplace`}
							className="text-violet-600 hover:text-violet-700 font-medium"
						>
							Browse all offerings →
						</Link>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-16 lg:py-24 bg-neutral-50">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-neutral-900 dark:text-white">How It Works</h2>
					</div>

					<div className="mt-12 grid gap-8 lg:grid-cols-3">
						{howItWorks.map((item) => (
							<div key={item.step} className="rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
								<div className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 text-violet-600 font-semibold mb-4">
									{item.step}
								</div>
								<h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
								<p className="mt-2 text-sm text-neutral-600">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Why Digitlify */}
			<section className="py-16 lg:py-24 dark:bg-slate-900">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Why Digitlify</h2>
					</div>

					<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{features.slice(0, 11).map((feature, index) => {
							const Icon = feature.icon;
							return (
								<div
									key={index}
									className="rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
								>
									<Icon className="w-6 h-6 text-violet-600 mb-3" />
									<h3 className="font-semibold text-neutral-900">{feature.title}</h3>
									<p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="py-16 lg:py-24 bg-neutral-50">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-neutral-900 dark:text-white">What Our Customers Say</h2>
					</div>

					<div className="mt-12 grid gap-6 lg:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<div
								key={index}
								className="rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
							>
								<p className="text-neutral-600 italic">"{testimonial.quote}"</p>
								<div className="mt-4 flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-semibold">
										{testimonial.initial}
									</div>
									<div>
										<div className="font-semibold text-neutral-900">{testimonial.author}</div>
										<div className="text-sm text-neutral-500">{testimonial.role}</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 lg:py-24 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl font-bold sm:text-4xl">Ready to Transform Your Business?</h2>
					<div className="mt-8">
						<Link
							href="/signup"
							className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
						>
							Get Started Free
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
