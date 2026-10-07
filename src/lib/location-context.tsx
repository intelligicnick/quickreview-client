import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import { useAuth } from './auth';
import type { Business, Location } from './types';

const STORAGE_KEY = 'qr_selected_location';

export type LocationOption = {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
  status: Location['status'];
};

type LocationContextValue = {
  locations: LocationOption[];
  selected: LocationOption | null;
  setSelectedId: (id: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLocations([]);
      return;
    }
    setLoading(true);
    try {
      const businesses = await api<Business[]>('/api/businesses');
      const lists = await Promise.all(
        businesses.map(async (business) => {
          const rows = await api<Location[]>(`/api/businesses/${business.id}/locations`);
          return rows.map((location) => ({
            id: location.id,
            name: location.name,
            businessId: business.id,
            businessName: business.name,
            status: location.status,
          }));
        }),
      );
      const flat = lists.flat().sort((a, b) => a.name.localeCompare(b.name));
      setLocations(flat);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) {
      setSelectedId(null);
      return;
    }
    if (locations.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    const valid = selectedId && locations.some((row) => row.id === selectedId);
    const next =
      (valid ? selectedId : null) ??
      locations.find((row) => row.status === 'ACTIVE')?.id ??
      locations[0]?.id ??
      null;
    if (next !== selectedId) setSelectedId(next);
  }, [user, locations, selectedId, setSelectedId]);

  const selected = useMemo(
    () => locations.find((row) => row.id === selectedId) ?? null,
    [locations, selectedId],
  );

  const value = useMemo(
    () => ({ locations, selected, setSelectedId, loading, refresh }),
    [locations, selected, setSelectedId, loading, refresh],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
