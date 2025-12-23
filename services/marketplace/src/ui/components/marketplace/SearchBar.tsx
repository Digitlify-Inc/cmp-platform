"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
	channel: string;
	placeholder?: string;
};

export function SearchBar({ channel, placeholder = "Search outcomes, tools, capabilities..." }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("q") || "");

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (query.trim()) {
				router.push(`/${channel}/search?q=${encodeURIComponent(query.trim())}`);
			}
		},
		[channel, query, router]
	);

	return (
		<form onSubmit={handleSearch} className="relative w-full max-w-xl">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={placeholder}
					className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
				/>
			</div>
		</form>
	);
}
