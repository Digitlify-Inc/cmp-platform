"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

// Filter categories based on Saleor attribute schema
const filterGroups = [
	{
		id: "roles",
		name: "Role",
		options: [
			{ value: "customer_support", label: "Customer Support" },
			{ value: "sales", label: "Sales / SDR" },
			{ value: "marketing", label: "Marketing" },
			{ value: "hr", label: "HR" },
			{ value: "it_helpdesk", label: "IT / Helpdesk" },
			{ value: "ops", label: "Operations" },
			{ value: "finance", label: "Finance" },
		],
	},
	{
		id: "value_streams",
		name: "Outcome",
		options: [
			{ value: "customer_support", label: "Customer Support" },
			{ value: "sales_outreach", label: "Sales Outreach" },
			{ value: "hr_ops", label: "HR Operations" },
			{ value: "marketing_content", label: "Marketing Content" },
			{ value: "knowledge_assistant", label: "Knowledge Assistant" },
			{ value: "meeting_scheduler", label: "Meeting Scheduler" },
			{ value: "data_extraction", label: "Data Extraction" },
			{ value: "monitoring_alerting", label: "Monitoring & Alerting" },
		],
	},
	{
		id: "capabilities",
		name: "Capabilities",
		options: [
			{ value: "rag.knowledge_base", label: "Knowledge Base (RAG)" },
			{ value: "web_widget.branding", label: "Web Widget" },
			{ value: "integrations.mcp_tools", label: "MCP Tools" },
			{ value: "multilingual.i18n", label: "Multilingual" },
			{ value: "multimodal.vision_audio", label: "Vision & Audio" },
			{ value: "governance.audit_logging", label: "Audit Logging" },
			{ value: "ops.scheduling", label: "Scheduling" },
		],
	},
	{
		id: "integrations",
		name: "Integrations",
		options: [
			{ value: "slack", label: "Slack" },
			{ value: "zendesk", label: "Zendesk" },
			{ value: "salesforce", label: "Salesforce" },
			{ value: "gmail", label: "Gmail" },
			{ value: "google_calendar", label: "Google Calendar" },
			{ value: "jira", label: "Jira" },
			{ value: "confluence", label: "Confluence" },
		],
	},
	{
		id: "deployment",
		name: "Deployment",
		options: [
			{ value: "shared", label: "Shared" },
			{ value: "dedicated_namespace", label: "Dedicated Namespace" },
			{ value: "vcluster", label: "Virtual Cluster" },
			{ value: "dedicated_cluster", label: "Dedicated Cluster" },
		],
	},
];

const trustSignals = [
	{ id: "verified", label: "Verified" },
	{ id: "featured", label: "Featured" },
	{ id: "trial", label: "Trial Available" },
];

type Props = {
	activeFilters?: Record<string, string[]>;
	onFilterChange?: (filters: Record<string, string[]>) => void;
};

export function FacetRail({ activeFilters = {}, onFilterChange }: Props) {
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
		roles: true,
		capabilities: true,
	});
	const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(activeFilters);

	const toggleGroup = (groupId: string) => {
		setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
	};

	const toggleFilter = (groupId: string, value: string) => {
		setLocalFilters((prev) => {
			const current = prev[groupId] || [];
			const updated = current.includes(value)
				? current.filter((v) => v !== value)
				: [...current, value];
			const newFilters = { ...prev, [groupId]: updated };
			onFilterChange?.(newFilters);
			return newFilters;
		});
	};

	const clearAllFilters = () => {
		setLocalFilters({});
		onFilterChange?.({});
	};

	const activeCount = Object.values(localFilters).flat().length;

	return (
		<aside className="w-64 shrink-0">
			<div className="sticky top-32">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold text-neutral-900">Filters</h3>
					{activeCount > 0 && (
						<button
							onClick={clearAllFilters}
							className="text-sm text-violet-600 hover:text-violet-700"
						>
							Clear all ({activeCount})
						</button>
					)}
				</div>

				{/* Trust Signals */}
				<div className="mb-6 space-y-2">
					{trustSignals.map((signal) => (
						<label
							key={signal.id}
							className="flex items-center gap-2 cursor-pointer"
						>
							<input
								type="checkbox"
								checked={localFilters.trust?.includes(signal.id) || false}
								onChange={() => toggleFilter("trust", signal.id)}
								className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
							/>
							<span className="text-sm text-neutral-700">{signal.label}</span>
						</label>
					))}
				</div>

				{/* Filter Groups */}
				<div className="space-y-4">
					{filterGroups.map((group) => (
						<div key={group.id} className="border-t border-neutral-200 pt-4">
							<button
								onClick={() => toggleGroup(group.id)}
								className="flex w-full items-center justify-between text-left"
							>
								<span className="font-medium text-neutral-900">{group.name}</span>
								<ChevronDown
									className={clsx(
										"h-4 w-4 text-neutral-500 transition-transform",
										expandedGroups[group.id] && "rotate-180"
									)}
								/>
							</button>
							{expandedGroups[group.id] && (
								<div className="mt-3 space-y-2">
									{group.options.map((option) => (
										<label
											key={option.value}
											className="flex items-center gap-2 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={localFilters[group.id]?.includes(option.value) || false}
												onChange={() => toggleFilter(group.id, option.value)}
												className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
											/>
											<span className="text-sm text-neutral-600">{option.label}</span>
										</label>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</aside>
	);
}
