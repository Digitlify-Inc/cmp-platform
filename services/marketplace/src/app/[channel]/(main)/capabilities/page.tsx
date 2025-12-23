import { Metadata } from "next";
import Link from "next/link";
import { Database, Globe, MessageSquare, Languages, Wrench, Plug, Clock, Shield } from "lucide-react";

export const metadata: Metadata = {
	title: "Browse by Capability | Digitlify Marketplace",
	description: "Find AI workers by their capabilities - RAG, Web Widget, Multilingual, MCP Tools, and more",
};

const capabilities = [
	{
		key: "rag_knowledgebase",
		label: "RAG Knowledgebase",
		description: "Retrieval-augmented generation for accurate answers from your documents",
		icon: Database,
		color: "bg-violet-100 text-violet-700",
	},
	{
		key: "web_widget",
		label: "Web Widget",
		description: "Embeddable chat widget for your website with custom branding",
		icon: Globe,
		color: "bg-blue-100 text-blue-700",
	},
	{
		key: "chat_ui",
		label: "Chat UI",
		description: "Conversational interface for natural language interactions",
		icon: MessageSquare,
		color: "bg-green-100 text-green-700",
	},
	{
		key: "multilingual",
		label: "Multilingual",
		description: "Support for multiple languages with automatic translation",
		icon: Languages,
		color: "bg-amber-100 text-amber-700",
	},
	{
		key: "mcp_tools",
		label: "MCP Tools",
		description: "Model Context Protocol tools for extended AI capabilities",
		icon: Wrench,
		color: "bg-pink-100 text-pink-700",
	},
	{
		key: "tool_connectors",
		label: "Tool Connectors",
		description: "Pre-built integrations with popular business tools",
		icon: Plug,
		color: "bg-cyan-100 text-cyan-700",
	},
	{
		key: "scheduler_triggers",
		label: "Scheduler & Triggers",
		description: "Automated scheduling and event-based triggers",
		icon: Clock,
		color: "bg-orange-100 text-orange-700",
	},
	{
		key: "guardrails_policy",
		label: "Guardrails & Policies",
		description: "Safety guardrails and policy enforcement for AI outputs",
		icon: Shield,
		color: "bg-red-100 text-red-700",
	},
];

export default async function CapabilitiesPage(props: {
	params: Promise<{ channel: string }>;
}) {
	const params = await props.params;

	return (
		<div className="min-h-screen bg-neutral-50">
			{/* Hero */}
			<div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<h1 className="text-4xl font-bold">Browse by Capability</h1>
					<p className="mt-4 text-xl text-blue-100">
						Find AI workers by the features they offer
					</p>
				</div>
			</div>

			{/* Capability Cards */}
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{capabilities.map((cap) => {
						const Icon = cap.icon;
						return (
							<Link
								key={cap.key}
								href={`/${params.channel}/capabilities/${cap.key}`}
								className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg"
							>
								<div className={`inline-flex rounded-lg p-3 ${cap.color}`}>
									<Icon className="h-6 w-6" />
								</div>
								<h2 className="mt-4 font-semibold text-neutral-900 group-hover:text-blue-700">
									{cap.label}
								</h2>
								<p className="mt-2 text-sm text-neutral-600 line-clamp-2">
									{cap.description}
								</p>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}
