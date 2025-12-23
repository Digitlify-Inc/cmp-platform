import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

/**
 * NextAuth v5 configuration for Keycloak SSO
 * Provides unified authentication across marketplace and Control Plane
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		// Default Keycloak provider for login
		Keycloak({
			clientId: process.env.KEYCLOAK_CLIENT_ID!,
			clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
			issuer: process.env.KEYCLOAK_ISSUER,
		}),
		// Keycloak provider configured for registration (prompt=create)
		Keycloak({
			id: "keycloak-register",
			name: "Keycloak Register",
			clientId: process.env.KEYCLOAK_CLIENT_ID!,
			clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
			issuer: process.env.KEYCLOAK_ISSUER,
			authorization: {
				params: {
					prompt: "create",
				},
			},
		}),
	],
	callbacks: {
		async jwt({ token, account, profile }) {
			// Persist Keycloak tokens and user info
			if (account) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.idToken = account.id_token;
				token.expiresAt = account.expires_at;
			}
			if (profile) {
				token.organization = (profile as Record<string, unknown>).organization as string | undefined;
				token.roles = (profile as Record<string, unknown>).roles as string[] | undefined;
			}
			return token;
		},
		async session({ session, token }) {
			// Expose tokens and custom claims to session
			return {
				...session,
				accessToken: token.accessToken as string | undefined,
				user: {
					...session.user,
					id: token.sub,
					organization: token.organization as string | undefined,
					roles: token.roles as string[] | undefined,
				},
			};
		},
		async redirect({ url, baseUrl }) {
			// Allow redirects to same origin or Control Plane
			if (url.startsWith(baseUrl)) return url;
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allow Control Plane redirects
			const controlPlaneUrl = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL;
			if (controlPlaneUrl && url.startsWith(controlPlaneUrl)) return url;
			return baseUrl;
		},
	},
	pages: {
		// signIn page removed - redirect directly to Keycloak SSO
		error: "/auth/error",
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	trustHost: true,
});

// Extended session type with custom fields
declare module "next-auth" {
	interface Session {
		accessToken?: string;
		user: {
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			organization?: string;
			roles?: string[];
		};
	}
}
