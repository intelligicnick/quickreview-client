import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { api, apiForm } from '../../lib/api';

type Props = {
  locationId: string;
  bannerUrl: string | null;
  onUpdated: () => void | Promise<void>;
};

export function CatalogBannerUpload({ locationId, bannerUrl, onUpdated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const form = new FormData();
    form.set('image', file);
    await apiForm(`/api/locations/${locationId}/quickmenu/banner`, form);
    await onUpdated();
  }

  async function remove() {
    await api(`/api/locations/${locationId}/quickmenu/banner`, { method: 'DELETE' });
    await onUpdated();
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="font-semibold text-ink">Storefront banner</p>
      <p className="mt-1 text-sm text-muted">
        Shown at the top of your guest catalogue. Use a wide image (e.g. 1200×400).
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-paper">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="aspect-[3/1] w-full object-cover" />
        ) : (
          <div className="flex aspect-[3/1] items-center justify-center text-sm text-muted">
            No banner yet
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:border-brand/40"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {bannerUrl ? 'Replace banner' : 'Upload banner'}
        </button>
        {bannerUrl ? (
          <button
            type="button"
            onClick={() => void remove()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
