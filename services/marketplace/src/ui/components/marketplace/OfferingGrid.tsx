import { OfferingCard, type Offering } from "./OfferingCard";

interface OfferingGridProps {
  offerings: Offering[];
  channel: string;
  loading?: boolean;
  emptyMessage?: string;
}

export function OfferingGrid({
  offerings,
  channel,
  loading = false,
  emptyMessage = "No offerings found",
}: OfferingGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-neutral-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-200" />
                <div className="h-3 w-1/2 rounded bg-neutral-200" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-neutral-200" />
              <div className="h-3 w-2/3 rounded bg-neutral-200" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 rounded-full bg-neutral-200" />
              <div className="h-6 w-16 rounded-full bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (offerings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900">{emptyMessage}</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offerings.map((offering) => (
        <OfferingCard key={offering.id} offering={offering} channel={channel} />
      ))}
    </div>
  );
}
