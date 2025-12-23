import { Bot } from "lucide-react";
import { redirect } from "next/navigation";

/**
 * Direct SSO Sign In Page
 *
 * This page implements a one-step SSO flow:
 * - If no error: redirects directly to Keycloak SSO via CSRF-protected POST
 * - If error: shows error message with retry button
 *
 * The signin-form component handles automatic OAuth redirect using
 * NextAuth's CSRF token mechanism.
 */

export default async function SignInPage(props: {
	searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
	const searchParams = await props.searchParams;
	const callbackUrl = searchParams.callbackUrl || "/";

	// If no error, redirect directly to Keycloak via POST (using csrfToken endpoint)
	// NextAuth v5 expects a POST request to /api/auth/signin/keycloak with csrfToken
	if (!searchParams.error) {
		// Redirect to a special client-side page that handles the OAuth POST
		redirect(`/auth/signin/auto?callbackUrl=${encodeURIComponent(callbackUrl)}`);
	}

	// Show error page only if there's an error
	return (
		<div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{/* Logo */}
					<div className="flex justify-center mb-8">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl">
								<Bot className="h-8 w-8 text-white" />
							</div>
							<span className="text-2xl font-bold text-neutral-900">Digitlify</span>
						</div>
					</div>

					<h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
						Sign In Error
					</h1>
					<p className="text-center text-neutral-600 mb-8">
						There was a problem signing you in
					</p>

					{/* Error message */}
					<div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
						{searchParams.error === "OAuthSignin" && "Error starting sign in flow."}
						{searchParams.error === "OAuthCallback" && "Error completing sign in."}
						{searchParams.error === "OAuthAccountNotLinked" &&
							"This email is linked to another account."}
						{searchParams.error === "Callback" && "Authentication callback error."}
						{searchParams.error === "Configuration" &&
							"Authentication configuration error. Please contact support."}
						{![
							"OAuthSignin",
							"OAuthCallback",
							"OAuthAccountNotLinked",
							"Callback",
							"Configuration",
						].includes(searchParams.error || "") && "An error occurred during sign in."}
					</div>

					{/* Retry Button - goes to auto-redirect page */}
					<a
						href={`/auth/signin/auto?callbackUrl=${encodeURIComponent(callbackUrl)}`}
						className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-lg px-4 py-3 font-medium hover:from-violet-700 hover:to-purple-800 transition-all"
					>
						Try Again
					</a>

					<p className="mt-6 text-center text-sm text-neutral-500">
						By signing in, you agree to our{" "}
						<a href="/terms" className="text-violet-600 hover:underline">
							Terms of Service
						</a>{" "}
						and{" "}
						<a href="/privacy" className="text-violet-600 hover:underline">
							Privacy Policy
						</a>
					</p>
				</div>

				<p className="mt-4 text-center text-sm text-neutral-500">
					Need help?{" "}
					<a href="/support" className="text-violet-600 hover:underline">
						Contact Support
					</a>
				</p>
			</div>
		</div>
	);
}
