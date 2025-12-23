import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
	title: "Authentication Error | Digitlify",
	description: "An error occurred during authentication",
};

export default async function AuthErrorPage(props: {
	searchParams: Promise<{ error?: string }>;
}) {
	const searchParams = await props.searchParams;

	const errorMessages: Record<string, string> = {
		Configuration: "There is a problem with the server configuration.",
		AccessDenied: "You do not have access to this resource.",
		Verification: "The verification link has expired or has already been used.",
		OAuthSignin: "Error starting the sign in process.",
		OAuthCallback: "Error completing the sign in process.",
		OAuthAccountNotLinked: "This email is already associated with another account.",
		Callback: "Error in the authentication callback.",
		Default: "An unexpected authentication error occurred.",
	};

	const errorMessage = searchParams.error
		? errorMessages[searchParams.error] || errorMessages.Default
		: errorMessages.Default;

	return (
		<div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md text-center">
				<div className="bg-white rounded-2xl shadow-lg p-8">
					<div className="flex justify-center mb-6">
						<div className="p-3 bg-red-100 rounded-full">
							<AlertCircle className="h-8 w-8 text-red-600" />
						</div>
					</div>

					<h1 className="text-2xl font-bold text-neutral-900 mb-2">
						Authentication Error
					</h1>
					<p className="text-neutral-600 mb-6">{errorMessage}</p>

					{searchParams.error && (
						<p className="text-sm text-neutral-400 mb-6">
							Error code: {searchParams.error}
						</p>
					)}

					<div className="space-y-3">
						<Link
							href="/auth/signin"
							className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-violet-700 transition-colors"
						>
							Try Again
						</Link>
						<Link
							href="/"
							className="w-full flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 rounded-lg px-4 py-3 font-medium hover:bg-neutral-50 transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
