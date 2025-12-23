"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { FacetRail } from "./FacetRail";

type Props = {
	activeFilters?: Record<string, string[]>;
};

export function FacetRailWrapper({ activeFilters = {} }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleFilterChange = useCallback(
		(filters: Record<string, string[]>) => {
			const params = new URLSearchParams(searchParams.toString());

			// Clear all filter params first
			const filterKeys = [
				"roles",
				"value_streams",
				"capabilities",
				"integrations",
				"deployment",
				"trust",
			];
			filterKeys.forEach((key) => params.delete(key));

			// Add new filter values
			for (const [key, values] of Object.entries(filters)) {
				if (values.length > 0) {
					// Use multiple params for multi-select
					values.forEach((v) => params.append(key, v));
				}
			}

			router.push(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams]
	);

	return <FacetRail activeFilters={activeFilters} onFilterChange={handleFilterChange} />;
}
