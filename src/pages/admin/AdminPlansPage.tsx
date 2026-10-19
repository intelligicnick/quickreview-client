import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { Sheet } from '../../components/admin/ui/Sheet';
import { ADMIN_PRODUCT_LABEL, productDisplayName } from '../../lib/admin-products';
import { api, ApiError } from '../../lib/api';
import { formatINR, pluralize } from '../../lib/admin-ui';
import { isTrialPlanCode } from '../../lib/plan-codes';

type Plan = {
  id: string;
  code: string;
  name: string;
  product: string;
  amountInr: number;
  durationDays: number;
  isActive: boolean;
  activeLocationCount: number;
};

type PlanDraft = {
  code: string;
  name: string;
  product: string;
  amountInr: string;
  durationDays: string;
  isActive: boolean;
};

const PRODUCT_OPTIONS = Object.keys(ADMIN_PRODUCT_LABEL);

const emptyDraft = (product = 'QUICK_REVIEW'): PlanDraft => ({
  code: '',
  name: '',
  product,
  amountInr: '499',
  durationDays: '30',
  isActive: true,
});

function draftFromPlan(plan: Plan): PlanDraft {
  return {
    code: plan.code,
    name: plan.name,
    product: plan.product,
    amountInr: String(plan.amountInr),
    durationDays: String(plan.durationDays),
    isActive: plan.isActive,
  };
}

export function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<{ mode: 'add' } | { mode: 'edit'; planId: string } | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(emptyDraft());

  const planGrid = useMemo(() => {
    const byProduct = new Map<string, { trial?: Plan; monthly?: Plan }>();
    for (const plan of plans) {
      const bucket = byProduct.get(plan.product) ?? {};
      if (isTrialPlanCode(plan.code)) bucket.trial = plan;
      else bucket.monthly = plan;
      byProduct.set(plan.product, bucket);
    }
    const seeded = PRODUCT_OPTIONS.map((product) => ({
      product,
      label: productDisplayName(product),
      trial: byProduct.get(product)?.trial,
      monthly: byProduct.get(product)?.monthly,
    }));
    for (const [product, row] of byProduct) {
      if (!PRODUCT_OPTIONS.includes(product)) {
        seeded.push({
          product,
          label: productDisplayName(product),
          trial: row.trial,
          monthly: row.monthly,
        });
      }
    }
    return seeded;
  }, [plans]);

  async function load() {
    setPlans(await api<Plan[]>('/api/admin/plans'));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load plans'));
  }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  function openAdd(product?: string, kind?: 'trial' | 'paid') {
    const next = emptyDraft(product ?? 'QUICK_REVIEW');
    if (kind === 'trial') {
      next.amountInr = '65';
      next.durationDays = '7';
    }
    setDraft(next);
    setSheet({ mode: 'add' });
  }

  function openEdit(plan: Plan) {
    setDraft(draftFromPlan(plan));
    setSheet({ mode: 'edit', planId: plan.id });
  }

  function closeSheet() {
    setSheet(null);
    setDraft(emptyDraft());
  }

  function bodyFromDraft() {
    return {
      name: draft.name.trim(),
      amountInr: Number(draft.amountInr) || 0,
      durationDays: Number(draft.durationDays) || 1,
      isActive: draft.isActive,
    };
  }

  async function savePlan() {
    const body = bodyFromDraft();
    if (!body.name) return;
    if (sheet?.mode === 'add') {
      const code = draft.code.trim().toLowerCase();
      if (!code) return;
      await run(() =>
        api('/api/admin/plans', {
          method: 'POST',
          body: {
            code,
            name: body.name,
            product: draft.product,
            amountInr: body.amountInr,
            durationDays: body.durationDays,
            isActive: body.isActive,
          },
        }),
      );
    } else if (sheet?.mode === 'edit') {
      await run(() => api(`/api/admin/plans/${sheet.planId}`, { method: 'PATCH', body }));
    }
    closeSheet();
  }

  async function togglePlan(plan: Plan) {
    if (plan.isActive && !window.confirm(`Stop offering ${plan.name} to new merchants?`)) return;
    await run(() => api(`/api/admin/plans/${plan.id}`, { method: 'PATCH', body: { isActive: !plan.isActive } }));
  }

  const sheetTitle = sheet?.mode === 'edit' ? 'Edit plan' : 'Add plan';
  const saveLabel = sheet?.mode === 'edit' ? 'Save changes' : 'Create plan';
  const canSave =
    draft.name.trim().length > 0 &&
    (sheet?.mode === 'edit' || draft.code.trim().length > 1) &&
    Number(draft.durationDays) > 0;

  function planCell(product: string, plan: Plan | undefined, kind: 'trial' | 'paid') {
    if (!plan) {
      return (
        <button
          type="button"
          className="text-xs font-semibold text-[var(--admin-brand)]"
          onClick={() => openAdd(product, kind)}
        >
          Add
        </button>
      );
    }
    const label =
      kind === 'trial'
        ? `${formatINR(plan.amountInr)} · ${plan.durationDays} days`
        : `${formatINR(plan.amountInr)} / ${plan.durationDays} d`;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span>{label}</span>
        <button
          type="button"
          disabled={busy}
          className="text-xs font-semibold text-[var(--admin-brand)]"
          onClick={() => openEdit(plan)}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Plans & prices"
        subtitle="Set intro trial price (short period) and monthly price per product."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => openAdd()}>
            Add plan
          </button>
        }
      />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      <section className="admin-card admin-table-scroll p-5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Intro trial</th>
              <th className="py-2 pr-3">Monthly</th>
              <th className="py-2 pr-3">Sold to merchants</th>
              <th className="py-2">Live</th>
            </tr>
          </thead>
          <tbody>
            {planGrid.map((row) => (
              <tr key={row.product} className="border-b border-[var(--admin-border-soft)] last:border-0">
                <td className="py-3 pr-3 font-semibold">{row.label}</td>
                <td className="py-3 pr-3 text-[var(--admin-muted)]">{planCell(row.product, row.trial, 'trial')}</td>
                <td className="py-3 pr-3">{planCell(row.product, row.monthly, 'paid')}</td>
                <td className="py-3 pr-3">
                  {pluralize(
                    row.monthly?.activeLocationCount ?? row.trial?.activeLocationCount ?? 0,
                    'location',
                  )}
                </td>
                <td className="py-3">
                  {row.monthly ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void togglePlan(row.monthly!)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        row.monthly.isActive
                          ? 'admin-pill-success'
                          : 'bg-[var(--admin-border-soft)] text-[var(--admin-muted)]'
                      }`}
                    >
                      {row.monthly.isActive ? 'On sale' : 'Off'}
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Sheet open={sheet !== null} title={sheetTitle} onClose={closeSheet}>
        <div className="space-y-3">
          {sheet?.mode === 'add' ? (
            <>
              <label className="block text-sm">
                <span className="admin-label">Product</span>
                <select
                  className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
                  value={draft.product}
                  onChange={(e) => setDraft((d) => ({ ...d, product: e.target.value }))}
                >
                  {PRODUCT_OPTIONS.map((product) => (
                    <option key={product} value={product}>
                      {productDisplayName(product)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="admin-label">Code</span>
                <input
                  className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
                  placeholder="quickreview_monthly"
                  value={draft.code}
                  onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
                />
              </label>
            </>
          ) : null}
          <label className="block text-sm">
            <span className="admin-label">Name</span>
            <input
              className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="admin-label">Price (₹)</span>
            <input
              className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              inputMode="numeric"
              value={draft.amountInr}
              onChange={(e) => setDraft((d) => ({ ...d, amountInr: e.target.value }))}
            />
            <span className="mt-1 block text-xs text-[var(--admin-muted)]">
              Trial plans use a code ending in <code className="text-xs">_trial</code> (e.g. quickreview_trial).
            </span>
          </label>
          <label className="block text-sm">
            <span className="admin-label">Duration (days)</span>
            <input
              className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              inputMode="numeric"
              value={draft.durationDays}
              onChange={(e) => setDraft((d) => ({ ...d, durationDays: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
            />
            <span>Offer to new merchants</span>
          </label>
          <button type="button" disabled={busy || !canSave} onClick={() => void savePlan()} className="admin-btn-primary">
            {saveLabel}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
