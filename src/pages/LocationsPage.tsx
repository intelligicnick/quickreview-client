import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocationContext } from '../lib/location-context';
import { api, ApiError } from '../lib/api';
import type { Business, Location } from '../lib/types';

type Row = Location & { businessName: string };

export function LocationsPage() {
  const { setSelectedId } = useLocationContext();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const businesses = await api<Business[]>('/api/businesses');
        const lists = await Promise.all(
          businesses.map(async (business) => {
            const locations = await api<Location[]>(`/api/businesses/${business.id}/locations`);
            return locations.map((location) => ({ ...location, businessName: business.name }));
          }),
        );
        if (!cancelled) setRows(lists.flat());
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load locations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Locations</h1>
      <p className="mt-1 text-sm text-muted">Every location belongs to a business you can access.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-muted">Loading…</p> : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold">No locations yet</p>
          <Link to="/app/businesses" className="mt-3 inline-block text-sm font-semibold text-brand">
            Create a business first
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-line bg-white p-4">
                <p className="font-semibold">{row.name}</p>
                <Link className="mt-1 inline-block text-sm font-medium text-brand" to={`/app/businesses/${row.businessId}`}>
                  {row.businessName}
                </Link>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{row.status}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(row.id);
                    navigate('/app');
                  }}
                  className="mt-3 text-sm font-semibold text-brand"
                >
                  Select & open dashboard
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <Link className="text-brand" to={`/app/businesses/${row.businessId}`}>
                        {row.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="mr-3">{row.status}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(row.id);
                          navigate('/app');
                        }}
                        className="font-semibold text-brand"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
