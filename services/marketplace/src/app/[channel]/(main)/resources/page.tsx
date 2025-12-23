import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, Video, MessageSquare, Newspaper, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
	title: "Resources | Digitlify",
	description: "Documentation, guides, tutorials, and support resources for Digitlify AI agents",
};

const resourceCategories = [
	{
		key: "docs",
		label: "Documentation",
		description: "Technical guides and API references for developers",
		icon: BookOpen,
		color: "bg-blue-100 text-blue-700",
		href: "/docs",
		items: [
			"Getting Started Guide",
			"API Reference",
			"SDK Documentation",
			"Integration Guides",
		],
	},
	{
		key: "tutorials",
		label: "Tutorials",
		description: "Step-by-step guides to help you get the most out of Digitlify",
		icon: Video,
		color: "bg-purple-100 text-purple-700",
		href: "/tutorials",
		items: [
			"Build Your First Agent",
			"Connect Your Knowledge Base",
			"Set Up Approvals",
			"Monitor Usage & Costs",
		],
	},
	{
		key: "templates",
		label: "Templates",
		description: "Pre-built agent configurations to jumpstart your automation",
		icon: FileText,
		color: "bg-green-100 text-green-700",
		href: "/templates",
		items: [
			"Support Triage Template",
			"Lead Qualification Template",
			"Meeting Notes Template",
			"Onboarding Template",
		],
	},
	{
		key: "blog",
		label: "Blog",
		description: "Latest news, updates, and insights from the Digitlify team",
		icon: Newspaper,
		color: "bg-pink-100 text-pink-700",
		href: "/blog",
		items: [
			"Product Updates",
			"Customer Stories",
			"Best Practices",
			"Industry Insights",
		],
	},
	{
		key: "community",
		label: "Community",
		description: "Connect with other users and get help from the community",
		icon: MessageSquare,
		color: "bg-amber-100 text-amber-700",
		href: "/community",
		items: [
			"Discord Community",
			"GitHub Discussions",
			"User Forums",
			"Meetups & Events",
		],
	},
	{
		key: "support",
		label: "Help & Support",
		description: "Get help from our support team and access FAQ",
		icon: HelpCircle,
		color: "bg-red-100 text-red-700",
		href: "/support",
		items: [
			"FAQ",
			"Contact Support",
			"Status Page",
			"Feature Requests",
		],
	},
];

export default async function ResourcesPage(props: {
	params: Promise<{ channel: string }>;
}) {
	const params = await props.params;

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Hero */}
			<section className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-16 lg:py-24">
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl" />
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/50 rounded-full blur-3xl" />
				</div>

				<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
						Resources
					</h1>
					<p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
						Everything you need to get started and succeed with Digitlify
					</p>
				</div>
			</section>

			{/* Resource Categories */}
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{resourceCategories.map((category) => {
						const Icon = category.icon;
						return (
							<Link
								key={category.key}
								href={`/${params.channel}${category.href}`}
								className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-violet-300 hover:shadow-lg"
							>
								<div className="flex items-start gap-4">
									<div className={`rounded-lg p-3 ${category.color}`}>
										<Icon className="h-6 w-6" />
									</div>
									<div className="flex-1">
										<h2 className="font-semibold text-neutral-900 group-hover:text-violet-700">
											{category.label}
										</h2>
										<p className="mt-1 text-sm text-neutral-600">
											{category.description}
										</p>
									</div>
								</div>
								<div className="mt-4 space-y-2">
									{category.items.map((item) => (
										<div
											key={item}
											className="flex items-center gap-2 text-sm text-neutral-500"
										>
											<span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
											{item}
										</div>
									))}
								</div>
								<div className="mt-4 text-sm font-medium text-violet-600 group-hover:underline">
									Explore {category.label} →
								</div>
							</Link>
						);
					})}
				</div>
			</div>

			{/* CTA Section */}
			<div className="bg-white py-12 border-t border-neutral-200">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-2xl font-bold text-neutral-900">Can't find what you're looking for?</h2>
					<p className="mt-2 text-neutral-600">
						Our support team is here to help you get the most out of Digitlify
					</p>
					<div className="mt-6 flex justify-center gap-4">
						<Link
							href={`/${params.channel}/contact`}
							className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
						>
							Contact Support
						</Link>
						<Link
							href={`/${params.channel}/docs`}
							className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
						>
							Browse Documentation
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
