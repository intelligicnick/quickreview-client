import { useRef } from 'react';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from '../menu/MenuItemImageCarousel';
import { api, apiForm } from '../../lib/api';

type Props = {
  locationId: string;
  itemId: string;
  imageUrls?: string[];
  placeholder: MenuImagePlaceholder;
  onUpdated: () => void | Promise<void>;
};

export function MenuItemPhotoUpload({
  locationId,
  itemId,
  imageUrls,
  placeholder,
  onUpdated,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const count = imageUrls?.length ?? 0;
  const nextSlot = count >= 2 ? null : count;

  async function upload(slot: number, file: File) {
    const form = new FormData();
    form.set('image', file);
    await apiForm(`/api/locations/${locationId}/quickmenu/items/${itemId}/photos/${slot}`, form);
    await onUpdated();
  }

  async function remove(slot: number) {
    await api(`/api/locations/${locationId}/quickmenu/items/${itemId}/photos/${slot}`, {
      method: 'DELETE',
    });
    await onUpdated();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <MenuItemImageCarousel imageUrls={imageUrls} alt="Product" placeholder={placeholder} size="sm" />
      <div className="flex flex-wrap justify-center gap-1">
        {nextSlot !== null ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file && nextSlot !== null) void upload(nextSlot, file);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-line px-2 py-0.5 text-[10px] font-semibold"
            >
              {count === 0 ? 'Add photo' : 'Add 2nd'}
            </button>
          </>
        ) : null}
        {count > 0 ? (
          <button
            type="button"
            onClick={() => {
              const last = imageUrls?.[count - 1] ?? '';
              const match = last.match(/\/photos\/([01])$/);
              const slot = match ? Number(match[1]) : count - 1;
              void remove(slot);
            }}
            className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-muted hover:text-red-700"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
