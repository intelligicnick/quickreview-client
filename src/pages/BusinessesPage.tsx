import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleImportPanel } from '../components/GoogleImportPanel';
import { PageHeader } from '../components/PageHeader';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';
import type { Business } from '../lib/types';

export function BusinessesPage() {
  const { refresh: refreshLocations } = useLocationContext();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Business[]>('/api/businesses');
      setBusinesses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load businesses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description="Import from Google Business Profile. Locations power Reviews, Menu, and Connect."
      />

      <GoogleImportPanel
        onImported={() => {
          void load();
          void refreshLocations();
        }}
      />

      <div>
        {error ? (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-muted">Loading…</p> : null}
        {!loading && businesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold">No businesses yet</p>
            <p className="mt-1 text-sm text-muted">Import your shop from Google above to get started.</p>
          </div>
        ) : null}
        <div className="space-y-3">
          {businesses.map((business) => (
            <Link
              key={business.id}
              to={`/app/businesses/${business.id}`}
              className="block rounded-2xl border border-line bg-white p-5 hover:border-brand/40"
            >
              <p className="font-semibold">{business.name}</p>
              <p className="mt-1 text-sm text-muted">{business.category || 'No category yet'}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
