import { redirect } from "next/navigation";
import { DefaultChannelSlug } from "@/app/config";

// Force dynamic rendering to ensure fresh redirect
export const dynamic = "force-dynamic";

export default function RootPage() {
	redirect(`/${DefaultChannelSlug}`);
}
