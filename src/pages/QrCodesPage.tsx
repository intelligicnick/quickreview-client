import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { QrProductCard } from '../components/QrProductCard';
import { api, ApiError } from '../lib/api';
import { loadWorkspaceSnapshot, productStatusLabel } from '../lib/location-workspace';
import { useLocationContext } from '../lib/location-context';

export function QrCodesPage() {
  const { selected } = useLocationContext();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadWorkspaceSnapshot>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [standeeCode, setStandeeCode] = useState('');
  const [standeeKind, setStandeeKind] = useState<'review' | 'menu' | 'revisit'>('review');
  const [standeeMsg, setStandeeMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await loadWorkspaceSnapshot(selected.id);
        if (!cancelled) {
          setSnapshot(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load QR codes');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function claimStandee() {
    if (!selected || !standeeCode.trim()) return;
    try {
      const result = await api<{ targetUrl: string; code: string }>(
        `/api/locations/${selected.id}/qr-codes/claim`,
        { method: 'POST', body: { code: standeeCode.trim(), kind: standeeKind } },
      );
      setStandeeMsg(`Linked ${result.code} — scans now route to your ${standeeKind === 'revisit' ? 'Quick Revisit' : standeeKind} page`);
      setStandeeCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not link standee');
    }
  }

  const review = snapshot?.review;
  const menu = snapshot?.menu;
  const connect = snapshot?.connect;

  return (
    <div>
      <PageHeader
        icon={QrCode}
        title="QR codes"
        description={
          selected
            ? `Download and print codes for ${selected.name}. Guests scan once — you manage everything here.`
            : 'All public QR codes for your selected location in one place.'
        }
      />

      {!selected ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold">Select a location</p>
          <p className="mt-1 text-sm text-muted">Use the location switcher above, or add a shop to get started.</p>
          <Link
            to="/app/businesses"
            className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Add business
          </Link>
        </div>
      ) : null}

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && snapshot ? (
        <>
          <div className="mt-8 flex flex-wrap items-stretch justify-start gap-4">
            {review ? (
              <QrProductCard
                title="QuickReview"
                purpose="Star ratings & Google reviews"
                publicUrl={review.publicUrl}
                publicPath={review.publicPath}
                unlocked={review.reviewUnlocked}
                statusLabel={productStatusLabel(review.reviewUnlocked, review.reviewAccess.status)}
                manageHref="/app/quickreview"
                manageLabel="Reviews & inbox"
              />
            ) : null}
            {menu ? (
              <QrProductCard
                title="Quick Commerce"
                purpose="Catalogue + Quick Revisit (one scan)"
                publicUrl={menu.publicUrl}
                publicPath={menu.publicPath}
                unlocked={menu.menuUnlocked}
                statusLabel={productStatusLabel(menu.menuUnlocked, menu.menuAccess.status)}
                manageHref="/app/quickmenu"
                manageLabel="Edit catalogue"
              />
            ) : null}
            {connect ? (
              <QrProductCard
                title="QuickConnect"
                purpose="Digital business card"
                publicUrl={connect.publicUrl}
                publicPath={connect.publicPath}
                unlocked={connect.connectUnlocked}
                statusLabel={productStatusLabel(connect.connectUnlocked, connect.connectAccess.status)}
                manageHref="/app/quickconnect"
                manageLabel="Edit card"
              />
            ) : null}
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-white p-5">
            <p className="font-bold">Link physical standee</p>
            <p className="mt-1 text-sm text-muted">
              Enter the code from a Marketplace QR card ({'/q/…'}) to point it at this location&apos;s review page,
              combined commerce hub, or revisit-only page.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                className="min-w-[8rem] flex-1 rounded-xl border border-line px-3 py-2 font-mono text-sm uppercase"
                value={standeeCode}
                onChange={(e) => setStandeeCode(e.target.value)}
                placeholder="AB12CD34"
              />
              <select
                className="rounded-xl border border-line px-2 py-2 text-sm"
                value={standeeKind}
                onChange={(e) => setStandeeKind(e.target.value as 'review' | 'menu' | 'revisit')}
              >
                <option value="review">Review QR</option>
                <option value="menu">Commerce + Revisit QR</option>
                <option value="revisit">Revisit only QR</option>
              </select>
              <button
                type="button"
                onClick={() => void claimStandee()}
                className="min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Link standee
              </button>
            </div>
            {standeeMsg ? <p className="mt-2 text-xs text-brand-dark">{standeeMsg}</p> : null}
            <p className="mt-3 text-xs text-muted">
              Need new hardware?{' '}
              <Link to="/app/marketplace" className="font-semibold text-brand">
                Order from Marketplace
              </Link>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
