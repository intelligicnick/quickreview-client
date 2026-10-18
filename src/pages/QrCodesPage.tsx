import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { QrCodePreview } from '../components/QrCodePreview';
import { QRCard } from '../components/ui/QRCard';
import { Button } from '../components/ui/Button';
import { api, ApiError } from '../lib/api';
import { loadWorkspaceSnapshot } from '../lib/location-workspace';
import { useLocationContext } from '../lib/location-context';

export function QrCodesPage() {
  const { selected } = useLocationContext();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadWorkspaceSnapshot>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [standeeCode, setStandeeCode] = useState('');
  const [standeeKind, setStandeeKind] = useState<'review' | 'menu' | 'revisit'>('review');
  const [standeeMsg, setStandeeMsg] = useState<string | null>(null);
  const [locationQrs, setLocationQrs] = useState<
    { code: string; claimUrl: string; targetUrl: string | null; isMerchantDigital: boolean }[]
  >([]);

  useEffect(() => {
    if (!selected) {
      setSnapshot(null);
      setLocationQrs([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [data, qrs] = await Promise.all([
          loadWorkspaceSnapshot(selected.id),
          api<
            {
              code: string;
              claimUrl: string;
              targetUrl: string | null;
              isMerchantDigital: boolean;
            }[]
          >(`/api/locations/${selected.id}/qr-codes`),
        ]);
        if (!cancelled) {
          setSnapshot(data);
          setLocationQrs(qrs);
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
      const qrs = await api<
        { code: string; claimUrl: string; targetUrl: string | null; isMerchantDigital: boolean }[]
      >(`/api/locations/${selected.id}/qr-codes`);
      setLocationQrs(qrs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not link standee');
    }
  }

  const review = snapshot?.review;
  const menu = snapshot?.menu;
  const connect = snapshot?.connect;
  const merchantDigital = locationQrs.find((row) => row.isMerchantDigital);

  return (
    <div>
      <PageHeader
        breadcrumb="This location / QR codes & standees"
        title="QR codes & standees"
        description={
          selected
            ? `Download and print codes for ${selected.name}. Link physical standees or order new ones from the marketplace.`
            : 'All public QR codes for your selected location in one place.'
        }
        actions={
          selected ? (
            <Button variant="secondary" size="sm" type="button" onClick={() => window.print()}>
              Download all (PDF)
            </Button>
          ) : undefined
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
          <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {review ? (
              <QRCard
                title="QuickReview"
                subtitle="Star ratings & Google reviews"
                publicUrl={review.publicUrl}
                publicPath={review.publicPath}
                unlocked={review.reviewUnlocked}
                manageHref="/app/quickreview"
                manageLabel="Reviews & inbox"
              />
            ) : null}
            {menu ? (
              <QRCard
                title="QuickCommerce"
                subtitle="Catalogue + Quick Revisit"
                publicUrl={menu.publicUrl}
                publicPath={menu.publicPath}
                unlocked={menu.menuUnlocked}
                manageHref="/app/quickcommerce"
                manageLabel="Edit catalogue"
              />
            ) : null}
            {connect ? (
              <QRCard
                title="QuickConnect"
                subtitle="Digital business card"
                publicUrl={connect.publicUrl}
                publicPath={connect.publicPath}
                unlocked={connect.connectUnlocked}
                manageHref="/app/quickconnect"
                manageLabel="Edit card"
              />
            ) : null}
          </div>

          {merchantDigital ? (
            <div className="mt-8 rounded-2xl border border-line bg-white p-5">
              <p className="font-bold">Your QuickReview QR</p>
              <p className="mt-1 text-sm text-muted">
                Created when you activated QuickReview. Scans go to your review page via{' '}
                <span className="font-mono text-xs">/q/{merchantDigital.code}</span>.
              </p>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <QrCodePreview
                  value={merchantDigital.targetUrl ?? merchantDigital.claimUrl}
                  size={120}
                  label={`QR ${merchantDigital.code}`}
                />
                <div className="min-w-0 text-sm">
                  <p className="font-mono font-semibold">{merchantDigital.code}</p>
                  <p className="mt-1 break-all text-muted">{merchantDigital.claimUrl}</p>
                </div>
              </div>
            </div>
          ) : null}

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
                <option value="review">Review page</option>
                <option value="menu">Catalogue + Quick Revisit</option>
                <option value="revisit">Quick Revisit only</option>
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
          </div>

          <Link
            to="/app/marketplace"
            className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 hover:border-brand/30"
          >
            <div>
              <p className="font-semibold text-ink">Need printed standees or NFC cards?</p>
              <p className="mt-0.5 text-sm text-muted">Order hardware from the Marketplace →</p>
            </div>
            <span className="text-brand" aria-hidden>→</span>
          </Link>
        </>
      ) : null}
    </div>
  );
}
