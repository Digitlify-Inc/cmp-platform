import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Mail, Brain, Calendar, FileText, Database, Bell, Users } from "lucide-react";

export const metadata: Metadata = {
	title: "Browse by Outcome | Digitlify Marketplace",
	description: "Find AI workers by the outcomes they deliver - reduce tickets, automate outreach, extract data, and more",
};

const outcomes = [
	{
		key: "customer_support",
		label: "Reduce support tickets",
		description: "Deploy AI agents that handle customer inquiries, reducing ticket volume by up to 40%",
		icon: MessageSquare,
		color: "bg-violet-100 text-violet-700",
		stat: "40% reduction",
	},
	{
		key: "sales_outreach",
		label: "Send personalized outreach",
		description: "Automate personalized sales emails and follow-ups at scale",
		icon: Mail,
		color: "bg-blue-100 text-blue-700",
		stat: "10x more touches",
	},
	{
		key: "knowledge_assistant",
		label: "Turn documents into answers",
		description: "Build knowledge assistants that answer questions from your documents",
		icon: Brain,
		color: "bg-green-100 text-green-700",
		stat: "Instant answers",
	},
	{
		key: "meeting_scheduler",
		label: "Book meetings automatically",
		description: "Let AI coordinate scheduling across time zones and calendars",
		icon: Calendar,
		color: "bg-amber-100 text-amber-700",
		stat: "Zero back-and-forth",
	},
	{
		key: "marketing_content",
		label: "Create on-brand content",
		description: "Generate marketing content that matches your brand voice and style",
		icon: FileText,
		color: "bg-pink-100 text-pink-700",
		stat: "5x faster creation",
	},
	{
		key: "data_extraction",
		label: "Extract data from files",
		description: "Automatically extract structured data from documents, PDFs, and images",
		icon: Database,
		color: "bg-cyan-100 text-cyan-700",
		stat: "99% accuracy",
	},
	{
		key: "monitoring_alerting",
		label: "Monitor & alert on changes",
		description: "Set up automated monitoring and get alerts when things change",
		icon: Bell,
		color: "bg-red-100 text-red-700",
		stat: "Real-time alerts",
	},
	{
		key: "hr_ops",
		label: "Streamline HR ops",
		description: "Automate HR workflows from onboarding to employee support",
		icon: Users,
		color: "bg-orange-100 text-orange-700",
		stat: "50% faster onboarding",
	},
];

export default async function OutcomesPage(props: {
	params: Promise<{ channel: string }>;
}) {
	const params = await props.params;

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Hero */}
			<div className="bg-gradient-to-br from-green-600 to-teal-700 py-16 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<h1 className="text-4xl font-bold">Browse by Outcome</h1>
					<p className="mt-4 text-xl text-green-100">
						Find AI workers by the results they deliver
					</p>
				</div>
			</div>

			{/* Outcome Cards */}
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{outcomes.map((outcome) => {
						const Icon = outcome.icon;
						return (
							<Link
								key={outcome.key}
								href={`/${params.channel}/outcomes/${outcome.key}`}
								className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-green-300 hover:shadow-lg"
							>
								<div className={`inline-flex rounded-lg p-3 ${outcome.color}`}>
									<Icon className="h-6 w-6" />
								</div>
								<h2 className="mt-4 font-semibold text-neutral-900 group-hover:text-green-700">
									{outcome.label}
								</h2>
								<p className="mt-2 text-sm text-neutral-600 line-clamp-2">
									{outcome.description}
								</p>
								<div className="mt-4 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
									{outcome.stat}
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}
