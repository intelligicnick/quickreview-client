import { useState } from 'react';

export type OnboardingOption = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
};

type Props = {
  options: OnboardingOption[];
  busy?: boolean;
  initialPrimary?: string | null;
  initialAlso?: string[];
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  onComplete: (primary: string, alsoSelected: string[]) => void | Promise<void>;
};

export function QuickCommerceOnboarding({
  options,
  busy = false,
  initialPrimary = null,
  initialAlso = [],
  title = "Let's set up your QuickCommerce",
  subtitle = 'What type of business do you run?',
  onCancel,
  onComplete,
}: Props) {
  const [primary, setPrimary] = useState<string | null>(initialPrimary);
  const [multi, setMulti] = useState(initialAlso.length > 0);
  const [also, setAlso] = useState<string[]>(initialAlso);

  function toggleAlso(id: string) {
    setAlso((prev) => (prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]));
  }

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <div className="text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={multi}
            onChange={(e) => {
              setMulti(e.target.checked);
              if (!e.target.checked) setAlso([]);
            }}
          />
          I also need multiple categories
        </label>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const isPrimary = primary === option.id;
          const isSecondary = multi && also.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!multi) {
                    setPrimary(option.id);
                    setAlso([]);
                    return;
                  }
                  if (!primary || primary === option.id) {
                    setPrimary(option.id);
                    setAlso((prev) => prev.filter((row) => row !== option.id));
                    return;
                  }
                  toggleAlso(option.id);
                }}
                className={`flex w-full flex-col items-start rounded-2xl border px-4 py-4 text-left transition ${
                  isPrimary
                    ? 'border-brand bg-brand/5 ring-2 ring-brand/30'
                    : isSecondary
                      ? 'border-brand/40 bg-brand/[0.03]'
                      : 'border-line bg-white hover:border-brand/30'
                }`}
              >
                <span className="text-2xl" aria-hidden>{option.emoji}</span>
                <span className="mt-2 font-bold text-ink">{option.title}</span>
                <span className="mt-0.5 text-xs text-muted">{option.subtitle}</span>
                {isPrimary ? (
                  <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-brand">Primary</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center rounded-2xl border border-line px-6 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          disabled={!primary || busy}
          onClick={() => void onComplete(primary!, also.filter((row) => row !== primary))}
          className="inline-flex min-h-11 items-center rounded-2xl bg-brand px-8 text-sm font-semibold text-white disabled:opacity-50"
        >
          {onCancel ? 'Save' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
