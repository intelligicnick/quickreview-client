import { ImagePlus } from 'lucide-react';
import { useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectClass?: string;
};

export function ImageUrlDropZone({ label, value, onChange, aspectClass = 'aspect-[4/3]' }: Props) {
  const [draft, setDraft] = useState('');

  function applyUrl(url: string) {
    const trimmed = url.trim();
    if (trimmed) onChange(trimmed);
    setDraft('');
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div
        className={`relative mt-2 overflow-hidden rounded-[10px] border border-dashed border-line bg-surface-2 ${aspectClass}`}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[7rem] flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted">
            <ImagePlus className="h-8 w-8 stroke-[1.8] text-muted" aria-hidden />
            <span>Drop an image or paste a URL below</span>
          </div>
        )}
      </div>
      <input
        type="url"
        placeholder="https://… image URL"
        className="mt-2 w-full min-h-11 rounded-[10px] border border-[#CBD5E1] px-3 py-2 text-sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => applyUrl(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applyUrl(draft);
          }
        }}
      />
      {value ? (
        <button type="button" className="mt-1 text-xs font-semibold text-red-700" onClick={() => onChange('')}>
          Remove image
        </button>
      ) : null}
    </div>
  );
}
