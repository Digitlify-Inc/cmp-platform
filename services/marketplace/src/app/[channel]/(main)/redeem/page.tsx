import { Metadata } from "next";
import { Gift, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Redeem Gift Card | Digitlify",
  description: "Redeem your Digitlify gift card for credits",
};

export default async function RedeemPage(props: {
  params: Promise<{ channel: string }>;
}) {
  const params = await props.params;

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-neutral-200">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full">
              <Gift className="h-8 w-8 text-violet-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
            Redeem Gift Card
          </h1>
          <p className="text-center text-neutral-500 mb-6">
            Enter your gift card code to add credits to your account
          </p>

          <form className="space-y-4">
            <div>
              <label htmlFor="code" className="sr-only">Gift Card Code</label>
              <input
                id="code"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-center text-lg font-mono uppercase tracking-wider focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                maxLength={19}
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 font-medium text-white hover:from-violet-700 hover:to-purple-800 transition-all"
            >
              Redeem
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-sm text-center text-neutral-500">
              Don't have a gift card?{" "}
              <Link
                href={`/${params.channel}/pricing#gift-cards`}
                className="text-violet-600 hover:text-violet-700 font-medium"
              >
                Purchase one here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/${params.channel}/marketplace`}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
