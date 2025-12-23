import { redirect } from "next/navigation";

/**
 * Registration page - redirects to auto-signin with register mode
 *
 * This page redirects to the auto-signin page with mode=register,
 * which will initiate the OAuth flow with Keycloak's registration.
 */

export default async function RegisterPage(props: {
	searchParams: Promise<{ callbackUrl?: string }>;
}) {
	const searchParams = await props.searchParams;
	const callbackUrl = searchParams.callbackUrl || "/";

	// Redirect to auto page with register mode
	redirect(`/auth/signin/auto?mode=register&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
