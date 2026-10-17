type StepState = 'done' | 'current' | 'pending';

const BAR: Record<StepState, string> = {
  done: 'bg-[#0F7B4B]',
  current: 'bg-[#1A5FD6]',
  pending: 'bg-[#DCE2EA]',
};

const LABEL: Record<StepState, string> = {
  done: 'text-[#0F7B4B]',
  current: 'text-[#1A5FD6]',
  pending: 'text-[#5B6474]',
};

type ProgressStepsProps = {
  states: [StepState, StepState, StepState];
};

const LABELS = ['QR code', 'Business', 'Service'] as const;

export function ProgressSteps({ states }: ProgressStepsProps) {
  return (
    <div className="mt-5" aria-label="Progress">
      <div className="flex gap-1.5">
        {states.map((state, i) => (
          <div key={LABELS[i]} className={`h-1 flex-1 rounded-full ${BAR[state]}`} aria-hidden />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[11px] font-medium">
        {states.map((state, i) => (
          <span key={LABELS[i]} className={LABEL[state]}>{LABELS[i]}</span>
        ))}
      </div>
    </div>
  );
}

export function deriveStepStates(qrDone: boolean, placeDone: boolean, serviceDone: boolean): [StepState, StepState, StepState] {
  const completed = [qrDone, placeDone, serviceDone];
  return completed.map((done, i) => {
    if (done) return 'done';
    const firstOpen = completed.findIndex((c) => !c);
    return firstOpen === i ? 'current' : 'pending';
  }) as [StepState, StepState, StepState];
}
