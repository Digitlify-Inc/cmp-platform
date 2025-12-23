import { redirect } from "next/navigation";

// Redirect to the instances page which has the proper implementation
export default async function SubscriptionsPage(props: {
  params: Promise<{ channel: string }>;
}) {
  const params = await props.params;
  redirect(`/${params.channel}/account/instances`);
}
