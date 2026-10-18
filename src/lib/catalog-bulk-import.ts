import * as XLSX from 'xlsx';
import { parsePriceInput } from './menu-pricing';

export type BulkImportRow = {
  category: string;
  name: string;
  description?: string;
  priceInr: number | null;
  variantName?: string;
  isAvailable: boolean;
  isNonVeg: boolean;
};

export type BulkImportResult = {
  categoriesCreated: number;
  itemsCreated: number;
  rowsSkipped: number;
  errors: string[];
};

const SAMPLE_ROWS: Record<string, string | number>[] = [
  {
    category: 'Mobile',
    product_name: 'Vivo X1',
    description: '6.5" display, 128GB',
    variant_name: 'Vivo X1 Max',
    price_inr: 15999,
    available: 'yes',
  },
  {
    category: 'Mobile',
    product_name: 'Vivo X1',
    description: '6.5" display, 128GB',
    variant_name: 'Vivo X1 Large',
    price_inr: 7999,
    available: 'yes',
  },
  {
    category: 'Computer',
    product_name: 'Office keyboard',
    description: '',
    variant_name: '',
    price_inr: 1299,
    available: 'yes',
  },
];

const HEADER_ALIASES: Record<string, keyof BulkImportRow | 'skip'> = {
  category: 'category',
  categories: 'category',
  product_name: 'name',
  product: 'name',
  name: 'name',
  item: 'name',
  description: 'description',
  desc: 'description',
  price: 'priceInr',
  price_inr: 'priceInr',
  priceinr: 'priceInr',
  mrp: 'priceInr',
  variant: 'variantName',
  variant_name: 'variantName',
  variation: 'variantName',
  model: 'variantName',
  available: 'isAvailable',
  in_stock: 'isAvailable',
  stock: 'isAvailable',
  non_veg: 'isNonVeg',
  nonveg: 'isNonVeg',
  is_non_veg: 'isNonVeg',
};

function normHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function parseYesNo(raw: unknown, defaultValue: boolean): boolean {
  if (raw === undefined || raw === null || String(raw).trim() === '') return defaultValue;
  const v = String(raw).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 'in stock', 'available'].includes(v)) return true;
  if (['no', 'n', 'false', '0', 'out of stock', 'unavailable'].includes(v)) return false;
  return defaultValue;
}

function parseRowsFromSheet(rows: Record<string, unknown>[]): BulkImportRow[] {
  const out: BulkImportRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const mapped: Partial<BulkImportRow> = {
      isAvailable: true,
      isNonVeg: false,
      priceInr: null,
    };
    for (const [key, value] of Object.entries(raw)) {
      const field = HEADER_ALIASES[normHeader(key)];
      if (!field || field === 'skip') continue;
      if (field === 'priceInr') {
        const n =
          typeof value === 'number'
            ? value
            : parsePriceInput(String(value ?? ''));
        mapped.priceInr = n;
      } else if (field === 'isAvailable') {
        mapped.isAvailable = parseYesNo(value, true);
      } else if (field === 'isNonVeg') {
        mapped.isNonVeg = parseYesNo(value, false);
      } else if (field === 'variantName') {
        const s = String(value ?? '').trim();
        if (s) mapped.variantName = s;
      } else if (field === 'name' || field === 'category' || field === 'description') {
        mapped[field] = String(value ?? '').trim();
      }
    }
    if (!mapped.category || !mapped.name) continue;
    out.push({
      category: mapped.category,
      name: mapped.name,
      description: mapped.description,
      priceInr: mapped.priceInr ?? null,
      variantName: mapped.variantName,
      isAvailable: mapped.isAvailable ?? true,
      isNonVeg: mapped.isNonVeg ?? false,
    });
  }
  return out;
}

export function parseBulkImportFile(file: File): Promise<BulkImportRow[]> {
  return file.arrayBuffer().then((buf) => {
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return parseRowsFromSheet(rows);
  });
}

export function downloadBulkImportSample() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'quickcommerce-bulk-import-sample.xlsx');
}

type CategoryRef = { id: string; name: string; priceVariants?: { id: string; name: string }[] };

type ApiFn = (path: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

function categoryKey(name: string) {
  return name.trim().toLowerCase();
}

function itemGroupKey(category: string, name: string) {
  return `${categoryKey(category)}\0${name.trim().toLowerCase()}`;
}

export async function runBulkImport(
  locationId: string,
  priceVariantScope: 'category' | 'product',
  initialCategories: CategoryRef[],
  rows: BulkImportRow[],
  api: ApiFn,
): Promise<BulkImportResult> {
  const errors: string[] = [];
  let categoriesCreated = 0;
  let itemsCreated = 0;
  let rowsSkipped = 0;

  const categories = [...initialCategories];
  const byKey = new Map(categories.map((c) => [categoryKey(c.name), c]));

  async function ensureCategory(name: string): Promise<CategoryRef | null> {
    const key = categoryKey(name);
    const existing = byKey.get(key);
    if (existing) return existing;
    try {
      const created = (await api(`/api/locations/${locationId}/quickmenu/categories`, {
        method: 'POST',
        body: { name: name.trim() },
      })) as CategoryRef;
      categories.push(created);
      byKey.set(key, created);
      categoriesCreated += 1;
      return created;
    } catch {
      errors.push(`Could not create category "${name}"`);
      return null;
    }
  }

  const groups = new Map<string, BulkImportRow[]>();
  for (const row of rows) {
    const gk = itemGroupKey(row.category, row.name);
    const list = groups.get(gk) ?? [];
    list.push(row);
    groups.set(gk, list);
  }

  for (const group of groups.values()) {
    const first = group[0]!;
    const category = await ensureCategory(first.category);
    if (!category) {
      rowsSkipped += group.length;
      continue;
    }

    const description =
      group.map((r) => r.description?.trim()).find((d) => d) ?? undefined;
    const isAvailable = group.every((r) => r.isAvailable);
    const isNonVeg = group.some((r) => r.isNonVeg);

    let body: Record<string, unknown> = {
      name: first.name.trim(),
      description,
      isAvailable,
      isNonVeg,
    };

    if (priceVariantScope === 'product') {
      const withVariant = group.filter((r) => r.variantName && r.priceInr != null);
      const singlePrice = group.find((r) => r.priceInr != null && !r.variantName);
      if (withVariant.length > 0) {
        body.itemPriceOptions = withVariant.map((r) => ({
          name: r.variantName!,
          priceInr: r.priceInr!,
        }));
      } else if (singlePrice?.priceInr != null) {
        body.priceInr = singlePrice.priceInr;
      } else if (group.length === 1 && first.priceInr != null) {
        body.priceInr = first.priceInr;
      } else {
        errors.push(`"${first.name}" in "${first.category}": missing price`);
        rowsSkipped += group.length;
        continue;
      }
    } else {
      const catVariants = category.priceVariants ?? [];
      if (catVariants.length > 0) {
        const variantPrices: { variantId: string; priceInr: number }[] = [];
        for (const row of group) {
          if (row.priceInr == null) continue;
          const match = catVariants.find(
            (v) => v.name.trim().toLowerCase() === (row.variantName ?? '').trim().toLowerCase(),
          );
          if (match) variantPrices.push({ variantId: match.id, priceInr: row.priceInr });
        }
        if (variantPrices.length === 0 && group.length === 1 && first.priceInr != null) {
          if (catVariants.length === 1) {
            variantPrices.push({ variantId: catVariants[0]!.id, priceInr: first.priceInr });
          } else {
            errors.push(
              `"${first.name}": set variant_name to one of: ${catVariants.map((v) => v.name).join(', ')}`,
            );
            rowsSkipped += group.length;
            continue;
          }
        }
        if (variantPrices.length === 0) {
          errors.push(`"${first.name}" in "${first.category}": missing variant prices`);
          rowsSkipped += group.length;
          continue;
        }
        body.variantPrices = variantPrices;
      } else if (first.priceInr != null) {
        body.priceInr = first.priceInr;
      } else {
        errors.push(`"${first.name}" in "${first.category}": missing price`);
        rowsSkipped += group.length;
        continue;
      }
    }

    try {
      await api(`/api/locations/${locationId}/quickmenu/categories/${category.id}/items`, {
        method: 'POST',
        body,
      });
      itemsCreated += 1;
    } catch {
      errors.push(`Could not add "${first.name}" in "${first.category}"`);
      rowsSkipped += group.length;
    }
  }

  return { categoriesCreated, itemsCreated, rowsSkipped, errors };
}
