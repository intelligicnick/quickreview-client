import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';
import type { Business, Location } from '../lib/types';

export function BusinessDetailPage() {
  const { refresh: refreshLocations, setSelectedId } = useLocationContext();
  const navigate = useNavigate();
  const { businessId = '' } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [biz, locs] = await Promise.all([
        api<Business>(`/api/businesses/${businessId}`),
        api<Location[]>(`/api/businesses/${businessId}/locations`),
      ]);
      setBusiness(biz);
      setLocations(locs);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load business');
    }
  }

  useEffect(() => {
    void load();
  }, [businessId]);

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      await api(`/api/businesses/${businessId}/locations`, {
        method: 'POST',
          body: {
          name: String(data.get('name') ?? ''),
          address: String(data.get('address') ?? '') || undefined,
          googleReviewUrl: String(data.get('googleReviewUrl') ?? '') || undefined,
        },
      });
      form.reset();
      await load();
      await refreshLocations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create location');
    } finally {
      setBusy(false);
    }
  }

  if (error && !business) {
    return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!business) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div>
      <Link to="/app/businesses" className="text-sm font-semibold text-brand">
        ← All businesses
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{business.name}</h1>
      <p className="mt-1 text-sm text-muted">{business.category || 'No category'}</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="font-bold">Locations</h2>
          {locations.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-muted">
              No locations yet.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="rounded-2xl border border-line bg-white p-4">
                  <p className="font-semibold">{location.name}</p>
                  <p className="text-sm text-muted">{location.address || 'No address'}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted">{location.status}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(location.id);
                      navigate('/app/quickreview');
                    }}
                    className="mt-3 text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    Open workspace →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={addLocation} className="h-fit rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">Add location</h2>
          <label className="mt-4 block text-sm font-medium">
            Name
            <input
              name="name"
              required
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm"
            />
          </label>
          <label className="mt-3 block text-sm font-medium">
            Address
            <input
              name="address"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm"
            />
          </label>
          <label className="mt-3 block text-sm font-medium">
            Google review URL
            <input
              name="googleReviewUrl"
              placeholder="https://search.google.com/local/writereview?placeid=…"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? 'Adding…' : 'Add location'}
          </button>
        </form>
      </div>
    </div>
  );
}
