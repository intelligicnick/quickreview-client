import { ExternalLink } from 'lucide-react';

export type ReviewGrowthPoint = {
  date: string;
  label: string;
  totalReviews: number;
  dayIncrement: number | null;
  isBaseline: boolean;
};

export type ReviewGrowthData = {
  trackingStartedAt: string | null;
  startedReviewCount: number | null;
  totalReviews: number | null;
  netGained: number | null;
  googleMapsUrl: string | null;
  googleReviewUrl: string | null;
  points: ReviewGrowthPoint[];
};

function formatStarted(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function incrementLabel(n: number | null): string {
  if (n == null) return '—';
  if (n === 0) return '0';
  return n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString();
}

export function ReviewGrowthCard({ data }: { data: ReviewGrowthData }) {
  const points = data.points;
  const maxTotal = points.length ? Math.max(...points.map((p) => p.totalReviews)) : 0;
  const minTotal = points.length ? Math.min(...points.map((p) => p.totalReviews)) : 0;
  const span = Math.max(1, maxTotal - minTotal);

  if (!data.googleReviewUrl && !points.length) {
    return (
      <article className="rounded-2xl border border-line bg-white p-5">
        <h3 className="font-bold">Review growth</h3>
        <p className="mt-1 text-sm text-muted">
          Connect your Google business on the QR &amp; link tab to track total review count over time.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">Review growth</h3>
          <p className="mt-0.5 text-sm text-muted">
            Track how your Google review count grows day by day.
          </p>
          {data.trackingStartedAt ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-semibold">Started tracking:</span>{' '}
              {formatStarted(data.trackingStartedAt)}
              {data.startedReviewCount != null ? (
                <span className="text-muted">
                  {' '}
                  · {data.startedReviewCount.toLocaleString()} reviews then
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Total reviews</p>
            <p className="text-2xl font-extrabold tabular-nums text-ink">
              {data.totalReviews != null ? data.totalReviews.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Net gained</p>
            <p className="text-2xl font-extrabold tabular-nums text-brand">
              {data.netGained != null ? incrementLabel(data.netGained) : '—'}
            </p>
          </div>
          {data.googleMapsUrl ? (
            <a
              href={data.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Google Maps
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      {points.length ? (
        <>
          <div className="mt-8 flex h-52 items-end gap-2 sm:gap-3" role="img" aria-label="Review count by day">
            {points.map((point) => {
              const heightPct = 12 + ((point.totalReviews - minTotal) / span) * 88;
              return (
                <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-bold tabular-nums text-ink sm:text-xs">
                    {point.totalReviews.toLocaleString()}
                  </span>
                  <div
                    className="w-full max-w-[3rem] rounded-t-lg bg-brand/80"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="max-w-full truncate text-center text-[9px] font-semibold text-muted sm:text-[10px]">
                    {point.isBaseline ? 'Start' : point.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3">Day</th>
                  <th className="py-2 pr-3 text-right">Total reviews</th>
                  <th className="py-2 text-right">Day change</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={`row-${point.date}`} className="border-b border-line/60">
                    <td className="py-2 pr-3 font-medium text-ink">
                      {point.isBaseline ? formatStarted(`${point.date}T00:00:00.000Z`) : point.label}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{point.totalReviews.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums font-semibold text-brand">
                      {incrementLabel(point.dayIncrement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted">
          Checking Google for your review count — refresh this page in a moment.
        </p>
      )}
    </article>
  );
}
