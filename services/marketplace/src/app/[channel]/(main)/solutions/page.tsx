import { Metadata } from "next";
import Link from "next/link";
import { Users, Briefcase, Megaphone, Heart, Headphones, Settings, Calculator } from "lucide-react";

export const metadata: Metadata = {
	title: "Solutions by Role | Digitlify Marketplace",
	description: "Find AI workers tailored for your role - Customer Support, Sales, Marketing, HR, IT, Operations, and Finance",
};

const roles = [
	{
		key: "customer-support",
		label: "Customer Support",
		description: "Reduce ticket volume and improve resolution times with AI-powered support agents",
		icon: Headphones,
		color: "bg-violet-100 text-violet-700",
		outcomes: ["Reduce support tickets by 40%", "24/7 availability", "Faster resolution times"],
	},
	{
		key: "sales",
		label: "Sales / SDR",
		description: "Automate outreach and qualification to focus on closing deals",
		icon: Briefcase,
		color: "bg-blue-100 text-blue-700",
		outcomes: ["Personalized outreach at scale", "Automated follow-ups", "Lead qualification"],
	},
	{
		key: "marketing",
		label: "Marketing",
		description: "Create on-brand content and automate campaign workflows",
		icon: Megaphone,
		color: "bg-pink-100 text-pink-700",
		outcomes: ["Content generation", "Campaign automation", "Analytics insights"],
	},
	{
		key: "hr",
		label: "HR",
		description: "Streamline recruitment, onboarding, and employee experience",
		icon: Heart,
		color: "bg-red-100 text-red-700",
		outcomes: ["Faster onboarding", "Employee self-service", "Policy Q&A"],
	},
	{
		key: "it-helpdesk",
		label: "IT / Helpdesk",
		description: "Resolve IT issues faster with intelligent ticketing and automation",
		icon: Settings,
		color: "bg-gray-100 text-gray-700",
		outcomes: ["Automated ticket routing", "Self-service resolution", "Knowledge base"],
	},
	{
		key: "operations",
		label: "Operations",
		description: "Automate workflows and extract insights from operational data",
		icon: Users,
		color: "bg-green-100 text-green-700",
		outcomes: ["Workflow automation", "Data extraction", "Process monitoring"],
	},
	{
		key: "finance",
		label: "Finance",
		description: "Automate financial operations and reporting",
		icon: Calculator,
		color: "bg-amber-100 text-amber-700",
		outcomes: ["Invoice processing", "Expense management", "Financial reporting"],
	},
];

export default async function SolutionsPage(props: {
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
						Solutions by Role
					</h1>
					<p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
						Find AI workers tailored for your team's specific needs
					</p>
				</div>
			</section>

			{/* Role Cards */}
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{roles.map((role) => {
						const Icon = role.icon;
						return (
							<Link
								key={role.key}
								href={`/${params.channel}/solutions/${role.key}`}
								className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-violet-300 hover:shadow-lg"
							>
								<div className="flex items-start gap-4">
									<div className={`rounded-lg p-3 ${role.color}`}>
										<Icon className="h-6 w-6" />
									</div>
									<div className="flex-1">
										<h2 className="font-semibold text-neutral-900 group-hover:text-violet-700">
											{role.label}
										</h2>
										<p className="mt-1 text-sm text-neutral-600">
											{role.description}
										</p>
									</div>
								</div>
								<div className="mt-4 space-y-2">
									{role.outcomes.map((outcome) => (
										<div
											key={outcome}
											className="flex items-center gap-2 text-sm text-neutral-500"
										>
											<span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
											{outcome}
										</div>
									))}
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}
