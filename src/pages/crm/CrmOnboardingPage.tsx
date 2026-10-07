import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BUSINESS_TYPE_LABELS } from '../../lib/crm/terminology';
import { useCrm } from '../../lib/crm/context';
import type { BusinessType, CrmProfile } from '../../lib/crm/types';

const GOALS = [
  { id: 'customers' as const, label: 'Customers' },
  { id: 'sales' as const, label: 'Sales' },
  { id: 'followups' as const, label: 'Follow-ups' },
  { id: 'payments' as const, label: 'Payments' },
];

export function CrmOnboardingPage() {
  const { state, setProfile } = useCrm();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<CrmProfile>>({
    goals: ['customers', 'followups'],
  });

  if (state.profile?.onboardedAt) {
    return <Navigate to="/app/quickcrm" replace />;
  }

  function next() {
    if (step < 4) setStep((s) => s + 1);
    else {
      setProfile({
        businessName: draft.businessName!.trim(),
        businessType: draft.businessType!,
        ownerName: draft.ownerName!.trim(),
        mobile: draft.mobile!.trim(),
        goals: draft.goals!.length ? draft.goals! : ['customers'],
        onboardedAt: new Date().toISOString(),
      });
      navigate('/app/quickcrm', { replace: true });
    }
  }

  const canNext =
    (step === 0 && draft.businessName?.trim()) ||
    (step === 1 && draft.businessType) ||
    (step === 2 && draft.ownerName?.trim()) ||
    (step === 3 && draft.mobile?.trim()) ||
    step === 4;

  return (
    <div className="mx-auto max-w-md pb-6">
      <p className="text-sm font-medium text-brand">Step {step + 1} of 5</p>
      <h1 className="mt-2 font-display text-2xl font-bold">Welcome to Quick CRM</h1>
      <p className="mt-2 text-sm text-muted">Set up in under 2 minutes — no training needed.</p>

      <div className="mt-8 space-y-4">
        {step === 0 ? (
          <Field label="Business name" required>
            <input
              autoFocus
              className="field"
              value={draft.businessName ?? ''}
              onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
              placeholder="ABC Enterprises"
            />
          </Field>
        ) : null}
        {step === 1 ? (
          <Field label="What type of business do you run?" required>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft({ ...draft, businessType: key })}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-medium ${
                    draft.businessType === key ? 'border-brand bg-brand/10 text-brand-dark' : 'border-line bg-white'
                  }`}
                >
                  {BUSINESS_TYPE_LABELS[key]}
                </button>
              ))}
            </div>
          </Field>
        ) : null}
        {step === 2 ? (
          <Field label="Your name" required>
            <input
              autoFocus
              className="field"
              value={draft.ownerName ?? ''}
              onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })}
            />
          </Field>
        ) : null}
        {step === 3 ? (
          <Field label="Mobile number" required>
            <input
              autoFocus
              className="field"
              inputMode="tel"
              value={draft.mobile ?? ''}
              onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
              placeholder="98XXXXXXXX"
            />
          </Field>
        ) : null}
        {step === 4 ? (
          <Field label="What do you want to manage?">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const on = draft.goals?.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        goals: on ? draft.goals!.filter((x) => x !== g.id) : [...(draft.goals ?? []), g.id],
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      on ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </Field>
        ) : null}
      </div>

      <button type="button" disabled={!canNext} onClick={next} className="btn-gradient mt-10 w-full disabled:opacity-50">
        {step === 4 ? 'Go to dashboard' : 'Continue'}
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">
        {label}
        {required ? ' *' : ''}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
