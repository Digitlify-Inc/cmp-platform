/**
 * Re-export NextAuth configuration from lib/auth/config
 * This allows imports from "@/auth" to work
 */
export { handlers, auth, signIn, signOut } from "@/lib/auth/config";
