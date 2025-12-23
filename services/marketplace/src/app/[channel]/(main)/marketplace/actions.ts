"use server";

import { auth } from "@/lib/auth/config";

// Use internal URL for server actions - CONTROL_PLANE_URL is the k8s service URL
const CP_URL = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://cmp-control-plane.cmp:8000";

type StartTrialResult = {
	success: boolean;
	instanceId?: string;
	redirectUrl?: string;
	error?: string;
};

export async function startTrial({
	productSlug,
}: {
	productSlug: string;
}): Promise<StartTrialResult> {
	const session = await auth();

	if (!session?.accessToken) {
		// Redirect to login - will come back after auth
		return {
			success: false,
			error: "Please sign in to start a free trial",
		};
	}

	try {
		const res = await fetch(`${CP_URL}/instances/trial`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${session.accessToken}`,
			},
			body: JSON.stringify({ product_slug: productSlug }),
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({})) as { error?: { message?: string } };
			const errorMessage = errorData.error?.message || `Failed to start trial: ${res.statusText}`;
			return {
				success: false,
				error: errorMessage,
			};
		}

		const data = await res.json() as { instance_id: string; redirect_url?: string };

		return {
			success: true,
			instanceId: data.instance_id,
			redirectUrl: data.redirect_url || `/run/${data.instance_id}`,
		};
	} catch (e) {
		console.error("Failed to start trial:", e);
		return {
			success: false,
			error: e instanceof Error ? e.message : "Failed to start trial",
		};
	}
}
