import type { QuickScanContact, QuickScanHistoryRow } from './types';

const DB_NAME = 'quickscan-history';
const STORE = 'scans';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('Could not open history'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function listScanHistory(): Promise<QuickScanHistoryRow[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onerror = () => reject(req.error ?? new Error('History read failed'));
    req.onsuccess = () => {
      const rows = (req.result as QuickScanHistoryRow[]).sort(
        (a, b) => b.scannedAt.localeCompare(a.scannedAt),
      );
      resolve(rows);
    };
  });
}

export async function saveScanHistory(contact: QuickScanContact): Promise<QuickScanHistoryRow> {
  const row: QuickScanHistoryRow = {
    id: crypto.randomUUID(),
    scannedAt: new Date().toISOString(),
    contact,
  };
  if (typeof indexedDB === 'undefined') return row;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('History write failed'));
    tx.objectStore(STORE).put(row);
  });
  return row;
}

export async function deleteScanHistory(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('History delete failed'));
    tx.objectStore(STORE).delete(id);
  });
}

export async function clearScanHistory(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('History clear failed'));
    tx.objectStore(STORE).clear();
  });
}
