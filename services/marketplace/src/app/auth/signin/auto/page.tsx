"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Auto-signin page that immediately redirects to Keycloak SSO
 *
 * This client component fetches the CSRF token and submits a POST form
 * to NextAuth's signin endpoint, which properly initiates the OAuth flow.
 *
 * Supports ?mode=register to redirect to Keycloak registration page.
 * Registration uses Keycloak's /registrations endpoint which shows the
 * registration form and then automatically logs in the user.
 */
function AutoSignInForm() {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/";
	const mode = searchParams.get("mode"); // "register" for registration flow
	const formRef = useRef<HTMLFormElement>(null);
	const csrfInputRef = useRef<HTMLInputElement>(null);
	const [statusText, setStatusText] = useState("Loading...");

	const isRegister = mode === "register";

	useEffect(() => {
		const initiateAuth = async () => {
			try {
				// Fetch CSRF token first (needed for both flows)
				const response = await fetch("/api/auth/csrf");
				const data = (await response.json()) as { csrfToken: string };

				if (isRegister) {
					// For registration, we still use NextAuth but tell Keycloak to show registration
					// Keycloak accepts prompt=create to show registration form (OpenID Connect standard)
					setStatusText("Redirecting to registration...");
				} else {
					setStatusText("Redirecting to login...");
				}

				// Set CSRF token and submit form
				if (csrfInputRef.current && formRef.current) {
					csrfInputRef.current.value = data.csrfToken;
					formRef.current.submit();
				}
			} catch (error) {
				console.error("Failed to initiate auth:", error);
				window.location.href = "/auth/signin?error=OAuthSignin";
			}
		};

		initiateAuth();
	}, [isRegister, callbackUrl]);

	// For registration, use the keycloak-register provider which has prompt=create configured
	// For login, use the default keycloak provider
	const actionUrl = isRegister
		? "/api/auth/signin/keycloak-register"
		: "/api/auth/signin/keycloak";

	return (
		<div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
				<p className="text-neutral-600">{statusText}</p>
				{/* Hidden form that posts to NextAuth signin endpoint */}
				<form
					ref={formRef}
					method="POST"
					action={actionUrl}
					style={{ display: "none" }}
				>
					<input ref={csrfInputRef} type="hidden" name="csrfToken" />
					<input type="hidden" name="callbackUrl" value={callbackUrl} />
				</form>
			</div>
		</div>
	);
}

export default function AutoSignInPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
						<p className="text-neutral-600">Loading...</p>
					</div>
				</div>
			}
		>
			<AutoSignInForm />
		</Suspense>
	);
}
