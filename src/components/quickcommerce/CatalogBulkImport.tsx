import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import {
  downloadBulkImportSample,
  parseBulkImportFile,
  runBulkImport,
  type BulkImportResult,
} from '../../lib/catalog-bulk-import';

type Props = {
  locationId: string;
  priceVariantScope: 'category' | 'product';
  categories: { id: string; name: string; priceVariants?: { id: string; name: string }[] }[];
  itemLabelPlural: string;
  onComplete: () => Promise<void>;
  onError: (message: string | null) => void;
  onMessage: (message: string) => void;
};

export function CatalogBulkImport({
  locationId,
  priceVariantScope,
  categories,
  itemLabelPlural,
  onComplete,
  onError,
  onMessage,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<BulkImportResult | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setLastResult(null);
    onError(null);
    try {
      const rows = await parseBulkImportFile(file);
      if (!rows.length) {
        onError('No product rows found. Use the sample file columns.');
        return;
      }
      const result = await runBulkImport(locationId, priceVariantScope, categories, rows, api);
      setLastResult(result);
      await onComplete();
      const parts = [
        `${result.itemsCreated} ${itemLabelPlural.toLowerCase()} imported`,
        result.categoriesCreated ? `${result.categoriesCreated} categories created` : null,
        result.rowsSkipped ? `${result.rowsSkipped} rows skipped` : null,
      ].filter(Boolean);
      onMessage(parts.join(' · '));
      if (result.errors.length) {
        onError(result.errors.slice(0, 5).join(' '));
      }
    } catch {
      onError('Could not read file. Use .xlsx or .csv from the sample.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper px-5 py-8">
      <p className="text-center font-semibold">Import bulk</p>
      <p className="mt-2 text-center text-sm text-muted">
        Download the sample Excel, fill in your {itemLabelPlural.toLowerCase()}, then upload. Categories are
        created automatically when missing.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => downloadBulkImportSample()}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-paper"
        >
          <Download className="h-4 w-4" />
          Download sample Excel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {busy ? 'Importing…' : 'Upload file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Columns: category, product_name, description, variant_name (optional), price_inr, available (yes/no)
      </p>
      {lastResult && lastResult.errors.length > 5 ? (
        <p className="mt-2 text-center text-xs text-amber-700">
          +{lastResult.errors.length - 5} more issues — fix those rows and import again.
        </p>
      ) : null}
    </div>
  );
}
