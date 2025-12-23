import { auth } from "@/lib/auth/config";
import { UserMenuClient } from "./UserMenuClient";
import Link from "next/link";

export async function UserMenuContainer() {
	let session = null;
	try {
		session = await auth();
	} catch (error) {
		// Log error but don't crash - show login buttons as fallback
		console.error("Auth error in UserMenuContainer:", error);
	}

	if (session?.user) {
		return <UserMenuClient session={session} />;
	} else {
		return (
			<div className="flex items-center gap-3">
				<Link
					href="/auth/signin"
					className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
				>
					Log in
				</Link>
				<Link
					href="/auth/register"
					className="rounded-full bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-800 transition-all"
				>
					Get Started Free
				</Link>
			</div>
		);
	}
}
