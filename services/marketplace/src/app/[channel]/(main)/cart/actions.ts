"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { executeGraphQL } from "@/lib/graphql";
import { CheckoutAddLineDocument, CheckoutDeleteLinesDocument } from "@/gql/graphql";
import { findOrCreate, getIdFromCookies, saveIdToCookie } from "@/lib/checkout";

type deleteLineFromCheckoutArgs = {
	lineId: string;
	checkoutId: string;
};

export const deleteLineFromCheckout = async ({ lineId, checkoutId }: deleteLineFromCheckoutArgs) => {
	await executeGraphQL(CheckoutDeleteLinesDocument, {
		variables: {
			checkoutId,
			lineIds: [lineId],
		},
		cache: "no-cache",
	});

	revalidatePath("/cart");
};

type addToCartArgs = {
	channel: string;
	variantId: string;
};

export const addToCart = async ({ channel, variantId }: addToCartArgs) => {
	// Get or create checkout
	const checkoutId = await getIdFromCookies(channel);
	const checkout = await findOrCreate({ channel, checkoutId });

	if (!checkout) {
		throw new Error("Failed to create checkout");
	}

	// Save checkout ID to cookie
	await saveIdToCookie(channel, checkout.id);

	// Add line to checkout
	const result = await executeGraphQL(CheckoutAddLineDocument, {
		variables: {
			id: checkout.id,
			productVariantId: variantId,
		},
		cache: "no-cache",
	});

	if (result.checkoutLinesAdd?.errors?.length) {
		throw new Error(result.checkoutLinesAdd.errors[0]?.message || "Failed to add to cart");
	}

	revalidatePath("/cart");
	
	return { success: true, checkoutId: checkout.id };
};

type addToCartAndCheckoutArgs = {
	channel: string;
	variantId: string;
};

export const addToCartAndCheckout = async ({ channel, variantId }: addToCartAndCheckoutArgs) => {
	const result = await addToCart({ channel, variantId });
	redirect(`/${channel}/checkout?checkout=${result.checkoutId}`);
};
