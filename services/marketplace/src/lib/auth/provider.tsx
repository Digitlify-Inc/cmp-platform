"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface AuthProviderProps {
	children: React.ReactNode;
	session?: Session | null;
}

/**
 * Client-side session provider wrapper
 * Provides session context to all client components
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
	return (
		<NextAuthSessionProvider session={session}>
			{children}
		</NextAuthSessionProvider>
	);
}
