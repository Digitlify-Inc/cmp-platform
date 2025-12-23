import { Metadata } from "next";
import Link from "next/link";
import { Check, Coins, Zap, Gift } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | Digitlify",
  description: "Simple, credit-based pricing for AI agents and automations",
};

const plans = [
  {
    name: "Free",
    description: "Try agents with no commitment",
    price: 0,
    credits: 100,
    features: [
      "100 trial credits",
      "Access to all agents",
      "Web widget (basic)",
      "Community support",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Starter",
    description: "For individuals and small teams",
    price: 49,
    credits: 5000,
    features: [
      "5,000 credits/month",
      "All agent capabilities",
      "Custom branding",
      "Email support",
      "API access",
    ],
    cta: "Start Starter",
    ctaVariant: "primary" as const,
    popular: true,
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: 149,
    credits: 20000,
    features: [
      "20,000 credits/month",
      "Advanced RAG",
      "Dedicated namespace",
      "Priority support",
      "Slack integration",
      "Custom connectors",
    ],
    cta: "Start Pro",
    ctaVariant: "primary" as const,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: null,
    credits: null,
    features: [
      "Unlimited credits",
      "Dedicated cluster",
      "SSO / SAML",
      "SLA guarantee",
      "Dedicated support",
      "Custom integrations",
      "On-premise option",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
  },
];

const creditPacks = [
  { credits: 1000, price: 10, savings: null },
  { credits: 5000, price: 45, savings: "10%" },
  { credits: 10000, price: 80, savings: "20%" },
  { credits: 50000, price: 350, savings: "30%" },
];

const giftCards = [
  { credits: 1000, price: 12 },
  { credits: 5000, price: 55 },
  { credits: 10000, price: 100 },
];

export default async function PricingPage(props: {
  params: Promise<{ channel: string }>;
}) {
  const params = await props.params;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-16 lg:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/50 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
            Simple, Credit-Based Pricing
          </h1>
          <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
            Pay for what you use. No hidden fees, no surprises. Start free and scale as you grow.
          </p>
        </div>
      </section>

      {/* Plans */}
      <div id="plans" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-neutral-900 text-center">Subscription Plans</h2>
        <p className="mt-2 text-center text-neutral-600">Choose the plan that fits your needs</p>

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border bg-white p-6 ${
                plan.popular
                  ? "border-violet-500 ring-2 ring-violet-500"
                  : "border-neutral-200"
              }`}
            >
              {plan.popular && (
                <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-neutral-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{plan.description}</p>
              <div className="mt-4">
                {plan.price !== null ? (
                  <>
                    <span className="text-4xl font-bold text-neutral-900">${plan.price}</span>
                    <span className="text-neutral-500">/month</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-neutral-900">Custom</span>
                )}
              </div>
              {plan.credits && (
                <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                  <Coins className="h-4 w-4" />
                  {plan.credits.toLocaleString()} credits/month
                </div>
              )}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaVariant === "outline" ? `/${params.channel}/login` : `/${params.channel}/checkout`}
                className={`mt-6 block w-full rounded-lg py-3 text-center text-sm font-medium transition-colors ${
                  plan.ctaVariant === "primary"
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Top-ups */}
      <div id="topups" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Zap className="mx-auto h-10 w-10 text-amber-500" />
            <h2 className="mt-4 text-2xl font-bold text-neutral-900">Credit Top-ups</h2>
            <p className="mt-2 text-neutral-600">Need more credits? Buy additional packs anytime.</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className="rounded-xl border border-neutral-200 p-6 hover:border-violet-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Coins className="h-6 w-6 text-amber-500" />
                  <span className="text-2xl font-bold text-neutral-900">
                    {pack.credits.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-neutral-900">${pack.price}</span>
                  {pack.savings && (
                    <span className="text-sm text-green-600 font-medium">Save {pack.savings}</span>
                  )}
                </div>
                <button className="mt-4 w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gift Cards */}
      <div id="gift-cards" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Gift className="mx-auto h-10 w-10 text-pink-500" />
            <h2 className="mt-4 text-2xl font-bold text-neutral-900">Gift Cards</h2>
            <p className="mt-2 text-neutral-600">Give the gift of AI automation</p>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            {giftCards.map((card) => (
              <div
                key={card.credits}
                className="rounded-xl border border-neutral-200 bg-white p-6 w-64 text-center hover:border-pink-300 transition-colors cursor-pointer"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                  <Gift className="h-6 w-6" />
                </div>
                <div className="mt-4 text-xl font-bold text-neutral-900">
                  {card.credits.toLocaleString()} Credits
                </div>
                <div className="mt-1 text-2xl font-semibold text-neutral-900">${card.price}</div>
                <button className="mt-4 w-full rounded-lg border border-pink-300 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50 transition-colors">
                  Purchase Gift
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
