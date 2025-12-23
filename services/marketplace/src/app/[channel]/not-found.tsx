import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DefaultChannelSlug } from "@/app/config";

export default function ChannelNotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
			<div className="mx-auto max-w-md text-center">
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
					<AlertTriangle className="h-8 w-8 text-amber-600" />
				</div>
				<h1 className="mb-2 text-2xl font-bold text-gray-900">
					Channel Not Available
				</h1>
				<p className="mb-6 text-gray-600">
					The marketplace channel you requested is not currently available.
					This may be a temporary issue while we set up the store.
				</p>
				<div className="space-y-3">
					<Link
						href={`/${DefaultChannelSlug}`}
						className="block w-full rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
					>
						Go to Marketplace
					</Link>
					<a
						href="https://dev.gsv.dev"
						className="block w-full rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
					>
						Visit Homepage
					</a>
				</div>
				<p className="mt-6 text-sm text-gray-500">
					If this problem persists, please contact support.
				</p>
			</div>
		</div>
	);
}
