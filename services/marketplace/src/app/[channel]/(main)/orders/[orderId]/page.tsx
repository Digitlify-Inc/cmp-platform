import { OrderByIdDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { formatDate, formatMoney } from "@/lib/utils";
import { LoginForm } from "@/ui/components/LoginForm";
import { PaymentStatus } from "@/ui/components/PaymentStatus";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import Image from "next/image";
import { notFound } from "next/navigation";

type PageProps = {
	params: Promise<{ orderId: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
	const { orderId } = await params;

	const { order } = await executeGraphQL(OrderByIdDocument, {
		variables: { id: orderId },
		cache: "no-cache",
	});

	if (!order) {
		notFound();
	}

	return (
		<div className="mx-auto max-w-7xl p-8">
			<div className="mb-8">
				<LinkWithChannel
					href="/orders"
					className="text-sm text-neutral-600 hover:text-neutral-900"
				>
					← Back to Orders
				</LinkWithChannel>
			</div>

			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight text-neutral-900">
					Order #{order.number}
				</h1>
				<p className="mt-1 text-sm text-neutral-600">
					Placed on <time dateTime={order.created}>{formatDate(new Date(order.created))}</time>
				</p>
			</div>

			{/* Order Status */}
			<div className="mb-8 rounded-lg border bg-white p-6">
				<h2 className="mb-4 text-lg font-medium text-neutral-900">Order Status</h2>
				<div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
					<div>
						<dt className="text-sm font-medium text-neutral-500">Payment Status</dt>
						<dd className="mt-1">
							<PaymentStatus status={order.paymentStatus} />
						</dd>
					</div>
					{order.statusDisplay && (
						<div>
							<dt className="text-sm font-medium text-neutral-500">Order Status</dt>
							<dd className="mt-1 text-sm text-neutral-900">{order.statusDisplay}</dd>
						</div>
					)}
				</div>
			</div>

			{/* Order Items */}
			<div className="mb-8 rounded-lg border bg-white">
				<h2 className="border-b p-6 text-lg font-medium text-neutral-900">Order Items</h2>
				<table className="w-full text-sm text-neutral-500">
					<thead className="sr-only">
						<tr>
							<td>Product</td>
							<td className="max-md:hidden">Quantity and unit price</td>
							<td>Price</td>
						</tr>
					</thead>
					<tbody className="divide-y">
						{order.lines.map((item) => {
							if (!item.variant) return null;

							const product = item.variant.product;

							return (
								<tr key={item.variant.id}>
									<td className="p-6 md:w-[60%] lg:w-[70%]">
										<div className="flex flex-row items-center">
											{product.thumbnail && (
												<div className="mr-4 aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-neutral-50 md:h-24 md:w-24">
													<Image
														src={product.thumbnail.url}
														alt={product.thumbnail.alt ?? ""}
														width={200}
														height={200}
														className="h-full w-full object-contain object-center"
													/>
												</div>
											)}
											<div>
												<LinkWithChannel
													href={`/products/${product.slug}`}
													className="font-medium text-neutral-900 hover:underline"
												>
													{product.name}
												</LinkWithChannel>
												{item.variant.name !== item.variant.id && Boolean(item.variant.name) && (
													<p className="mt-1 text-neutral-500">Variant: {item.variant.name}</p>
												)}
												{product.category && (
													<p className="mt-1 text-neutral-500">{product.category.name}</p>
												)}
											</div>
										</div>
									</td>
									<td className="p-6 max-md:hidden">
										{item.quantity} ×{" "}
										{item.variant.pricing?.price &&
											formatMoney(
												item.variant.pricing.price.gross.amount,
												item.variant.pricing.price.gross.currency,
											)}
									</td>
									<td className="p-6 text-end">
										<div className="flex flex-col gap-1 text-neutral-900">
											{item.variant.pricing?.price &&
												formatMoney(
													item.variant.pricing.price.gross.amount * item.quantity,
													item.variant.pricing.price.gross.currency,
												)}
											{item.quantity > 1 && (
												<span className="text-xs md:hidden">
													{item.quantity} ×{" "}
													{item.variant.pricing?.price &&
														formatMoney(
															item.variant.pricing.price.gross.amount,
															item.variant.pricing.price.gross.currency,
														)}
												</span>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				<div className="flex justify-between border-t p-6 text-sm font-medium text-neutral-900">
					<dt>Total</dt>
					<dd>{formatMoney(order.total.gross.amount, order.total.gross.currency)}</dd>
				</div>
			</div>

			{/* Addresses */}
			<div className="grid gap-8 md:grid-cols-2">
				{order.shippingAddress && (
					<div className="rounded-lg border bg-white p-6">
						<h2 className="mb-4 text-lg font-medium text-neutral-900">Shipping Address</h2>
						<address className="not-italic text-sm text-neutral-600">
							<p className="font-medium text-neutral-900">
								{order.shippingAddress.firstName} {order.shippingAddress.lastName}
							</p>
							<p>{order.shippingAddress.streetAddress1}</p>
							{order.shippingAddress.streetAddress2 && (
								<p>{order.shippingAddress.streetAddress2}</p>
							)}
							<p>
								{order.shippingAddress.city}, {order.shippingAddress.postalCode}
							</p>
							<p>{order.shippingAddress.country.country}</p>
						</address>
					</div>
				)}

				{order.billingAddress && (
					<div className="rounded-lg border bg-white p-6">
						<h2 className="mb-4 text-lg font-medium text-neutral-900">Billing Address</h2>
						<address className="not-italic text-sm text-neutral-600">
							<p className="font-medium text-neutral-900">
								{order.billingAddress.firstName} {order.billingAddress.lastName}
							</p>
							<p>{order.billingAddress.streetAddress1}</p>
							{order.billingAddress.streetAddress2 && (
								<p>{order.billingAddress.streetAddress2}</p>
							)}
							<p>
								{order.billingAddress.city}, {order.billingAddress.postalCode}
							</p>
							<p>{order.billingAddress.country.country}</p>
						</address>
					</div>
				)}
			</div>
		</div>
	);
}
