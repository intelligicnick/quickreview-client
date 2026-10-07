import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth';
import { useLocationContext } from '../location-context';
import { api } from '../api';
import type { CommerceCategory } from './commerce-sync';
import { seedDemoIfEmpty } from './demo-seed';
import * as store from './store';
import type {
  CatalogItem,
  CrmProfile,
  CrmState,
  Customer,
  DealStage,
  FollowUp,
  QuotationLine,
} from './types';

type CrmContextValue = {
  workspaceId: string;
  state: CrmState;
  ready: boolean;
  setProfile: (profile: CrmProfile) => void;
  addCustomer: (input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: DealStage }) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addFollowUp: (input: { customerId: string; dueAt: string; reason: string }) => FollowUp;
  completeFollowUp: (id: string) => void;
  rescheduleFollowUp: (id: string, dueAt: string) => void;
  addNote: (customerId: string, text: string) => void;
  logCall: (customerId: string) => void;
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => CatalogItem;
  createQuotation: (input: { customerId: string; lines: QuotationLine[]; discount: number }) => void;
  createSale: (input: {
    customerId: string;
    title: string;
    amount: number;
    expectedDate?: string;
    stage?: DealStage;
  }) => void;
  setDealStage: (saleId: string, stage: DealStage) => void;
  recordPayment: (input: { saleId: string; amount: number; note?: string }) => void;
  convertQuotationToInvoice: (quotationId: string) => void;
  markInvoicePaid: (invoiceId: string) => void;
  syncCommerce: () => Promise<{ ok: true; added: number; updated: number } | { ok: false; error: string }>;
  commerceSyncing: boolean;
  customerById: (id: string) => Customer | undefined;
  persist: () => void;
};

const CrmContext = createContext<CrmContextValue | null>(null);

function workspaceFromLocation(businessId: string | undefined, userId: string | undefined): string {
  return businessId || userId || 'local';
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { selected } = useLocationContext();
  const workspaceId = workspaceFromLocation(selected?.businessId, user?.id);
  const [state, setState] = useState<CrmState>(() => store.emptyState());
  const [ready, setReady] = useState(false);
  const [commerceSyncing, setCommerceSyncing] = useState(false);

  useEffect(() => {
    const loaded = store.loadState(workspaceId);
    setState(loaded);
    setReady(true);
  }, [workspaceId]);

  const persist = useCallback(() => {
    store.saveState(workspaceId, state);
  }, [workspaceId, state]);

  useEffect(() => {
    if (!ready) return;
    store.saveState(workspaceId, state);
  }, [state, workspaceId, ready]);

  const mutate = useCallback(<T,>(fn: (draft: CrmState) => T): T => {
    let result!: T;
    setState((prev) => {
      const draft = structuredClone(prev);
      result = fn(draft);
      return draft;
    });
    return result;
  }, []);

  const syncCommerce = useCallback(async () => {
    if (!selected?.id) {
      return { ok: false as const, error: 'Select a location in the menu bar first.' };
    }
    setCommerceSyncing(true);
    try {
      const hub = await api<{ categories: CommerceCategory[] }>(`/api/locations/${selected.id}/quickmenu`);
      let added = 0;
      let updated = 0;
      mutate((s) => {
        const r = store.syncCommerceCatalog(s, hub.categories ?? [], selected.id);
        added = r.added;
        updated = r.updated;
      });
      return { ok: true as const, added, updated };
    } catch {
      return { ok: false as const, error: 'Could not load Quick Commerce. Open Quick Commerce once to set up.' };
    } finally {
      setCommerceSyncing(false);
    }
  }, [selected?.id, mutate]);

  useEffect(() => {
    if (!ready || !selected?.id || !state.profile?.onboardedAt) return;
    if (state.commerceSync?.locationId === selected.id && state.commerceSync.itemCount > 0) return;
    void syncCommerce();
    // ponytail: auto-sync once per location when CRM opens; manual sync updates prices
  }, [ready, selected?.id, state.profile?.onboardedAt, state.commerceSync?.locationId, state.commerceSync?.itemCount, syncCommerce]);

  const value = useMemo<CrmContextValue>(
    () => ({
      workspaceId,
      state,
      ready,
      persist,
      setProfile: (profile) =>
        mutate((s) => {
          store.setProfile(s, profile);
          if (s.customers.length === 0) seedDemoIfEmpty(s);
        }),
      addCustomer: (input) => mutate((s) => store.addCustomer(s, input)),
      updateCustomer: (id, patch) => mutate((s) => store.updateCustomer(s, id, patch)),
      addFollowUp: (input) => mutate((s) => store.addFollowUp(s, input)),
      completeFollowUp: (id) => mutate((s) => store.completeFollowUp(s, id)),
      rescheduleFollowUp: (id, dueAt) => mutate((s) => store.rescheduleFollowUp(s, id, dueAt)),
      addNote: (customerId, text) => mutate((s) => store.addNote(s, customerId, text)),
      logCall: (customerId) => mutate((s) => store.logCall(s, customerId)),
      addCatalogItem: (item) => mutate((s) => store.addCatalogItem(s, item)),
      createQuotation: (input) => mutate((s) => store.createQuotation(s, input)),
      createSale: (input) => mutate((s) => store.createSale(s, input)),
      setDealStage: (saleId, stage) => mutate((s) => store.setDealStage(s, saleId, stage)),
      recordPayment: (input) => mutate((s) => store.recordPayment(s, input)),
      convertQuotationToInvoice: (quotationId) => mutate((s) => store.convertQuotationToInvoice(s, quotationId)),
      markInvoicePaid: (invoiceId) => mutate((s) => store.markInvoicePaid(s, invoiceId)),
      syncCommerce,
      commerceSyncing,
      customerById: (id) => state.customers.find((c) => c.id === id),
    }),
    [workspaceId, state, ready, mutate, persist, syncCommerce, commerceSyncing],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm requires CrmProvider');
  return ctx;
}
