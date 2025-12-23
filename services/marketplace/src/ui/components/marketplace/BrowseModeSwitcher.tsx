"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bot, Zap, Sparkles, Workflow, Search } from "lucide-react";
import { useCallback, useState } from "react";

// Category tabs for marketplace browsing (per docs/website-content/02-Marketplace.md)
const categoryTabs = [
	{ slug: "all", name: "All", icon: null, href: "/marketplace" },
	{ slug: "agents", name: "Agents", icon: Bot, href: "/marketplace/agents" },
	{ slug: "apps", name: "Apps", icon: Zap, href: "/marketplace/apps" },
	{ slug: "assistants", name: "Assistants", icon: Sparkles, href: "/marketplace/assistants" },
	{ slug: "automations", name: "Automations", icon: Workflow, href: "/marketplace/automations" },
];

// Browse mode options per docs/website-content/02-Marketplace.md
// "Browse mode switcher: Outcome | Role | Capability | Category"
const browseModes = [
	{ id: "outcome", name: "Outcome", param: "outcome" },
	{ id: "role", name: "Role", param: "role" },
	{ id: "capability", name: "Capability", param: "capability" },
	{ id: "category", name: "Category", param: "category" },
];

type Props = {
	channel: string;
	activeCategory?: string;
};

export function BrowseModeSwitcher({ channel }: Props) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

	// Current browse mode from URL
	const currentMode = searchParams.get("browse") || "category";

	// Determine active category from pathname
	const currentCategory =
		categoryTabs.find((tab) => tab.slug !== "all" && pathname.includes(`/marketplace/${tab.slug}`))?.slug || "all";

	// Handle browse mode change
	const handleModeChange = useCallback(
		(modeId: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("browse", modeId);
			router.push(`/${channel}/marketplace?${params.toString()}`);
		},
		[channel, router, searchParams]
	);

	// Handle search - redirect to marketplace search
	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (searchQuery.trim()) {
				router.push(`/${channel}/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`);
			}
		},
		[channel, router, searchQuery]
	);

	return (
		<div className="sticky top-16 z-10 bg-white border-b border-neutral-200">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Search bar per spec: "Search outcomes, tools, capabilities..." */}
				<div className="py-4">
					<form onSubmit={handleSearch} className="relative w-full max-w-2xl">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search outcomes, tools, capabilities..."
							className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
						/>
					</form>
				</div>

				{/* Browse Mode Selector per spec */}
				<div className="flex items-center justify-between py-3 border-t border-neutral-100">
					<div className="flex items-center gap-2">
						<span className="text-sm text-neutral-500">Browse by:</span>
						<div className="flex gap-1">
							{browseModes.map((mode) => (
								<button
									key={mode.id}
									onClick={() => handleModeChange(mode.id)}
									className={clsx(
										"rounded-full px-3 py-1 text-sm font-medium transition-colors",
										currentMode === mode.id
											? "bg-violet-100 text-violet-700"
											: "text-neutral-600 hover:bg-neutral-100"
									)}
								>
									{mode.name}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Category Tabs - shown when browse mode is "category" */}
				{currentMode === "category" && (
					<div className="flex gap-1 pb-3 overflow-x-auto">
						{categoryTabs.map((tab) => {
							const isActive = currentCategory === tab.slug;
							const Icon = tab.icon;
							return (
								<Link
									key={tab.slug}
									href={`/${channel}${tab.href}`}
									className={clsx(
										"flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
										isActive
											? "bg-gradient-to-r from-violet-600 to-purple-700 text-white"
											: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
									)}
								>
									{Icon && <Icon className="h-4 w-4" />}
									{tab.name}
								</Link>
							);
						})}
					</div>
				)}

				{/* Outcome tabs - per docs/wagtail-model-spec/24 §1.3 */}
				{currentMode === "outcome" && (
					<div className="flex gap-1 pb-3 overflow-x-auto">
						{[
							{ key: "customer_support", label: "Reduce support tickets" },
							{ key: "sales_outreach", label: "Send personalized outreach" },
							{ key: "knowledge_assistant", label: "Turn documents into answers" },
							{ key: "meeting_scheduler", label: "Book meetings automatically" },
							{ key: "marketing_content", label: "Create on-brand content" },
							{ key: "data_extraction", label: "Extract data from files" },
							{ key: "monitoring_alerting", label: "Monitor & alert on changes" },
							{ key: "hr_ops", label: "Streamline HR ops" },
						].map((outcome) => (
							<Link
								key={outcome.key}
								href={`/${channel}/outcomes/${outcome.key}`}
								className="whitespace-nowrap rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-all"
							>
								{outcome.label}
							</Link>
						))}
					</div>
				)}

				{/* Role tabs - per docs/wagtail-model-spec/24 §1.2 */}
				{currentMode === "role" && (
					<div className="flex gap-1 pb-3 overflow-x-auto">
						{[
							{ key: "customer-support", label: "Customer Support" },
							{ key: "sales", label: "Sales / SDR" },
							{ key: "marketing", label: "Marketing" },
							{ key: "hr", label: "HR" },
							{ key: "it-helpdesk", label: "IT / Helpdesk" },
							{ key: "operations", label: "Operations" },
							{ key: "finance", label: "Finance" },
						].map((role) => (
							<Link
								key={role.key}
								href={`/${channel}/solutions/${role.key}`}
								className="whitespace-nowrap rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-all"
							>
								{role.label}
							</Link>
						))}
					</div>
				)}

				{/* Capability tabs - per docs/wagtail-model-spec/24 §1.4 (MVP 15) */}
				{currentMode === "capability" && (
					<div className="flex gap-1 pb-3 overflow-x-auto">
						{[
							{ key: "rag_knowledgebase", label: "RAG Knowledgebase" },
							{ key: "web_widget", label: "Web Widget" },
							{ key: "chat_ui", label: "Chat UI" },
							{ key: "multilingual", label: "Multilingual" },
							{ key: "mcp_tools", label: "MCP Tools" },
							{ key: "tool_connectors", label: "Tool Connectors" },
							{ key: "scheduler_triggers", label: "Scheduler & Triggers" },
							{ key: "guardrails_policy", label: "Guardrails & Policies" },
						].map((cap) => (
							<Link
								key={cap.key}
								href={`/${channel}/capabilities/${cap.key}`}
								className="whitespace-nowrap rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-all"
							>
								{cap.label}
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
