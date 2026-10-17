import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, getAccessToken } from '../../lib/api';
import { counterSaleProvisionApi, CounterSaleApiError } from '../../lib/counter-sale-api';
import {
  CounterSalePage,
  type Agent,
  type GooglePlace,
  type ProvisionedLocation,
  type Service,
} from '../../components/admin/CounterSalePage';

type ApiAgent = {
  id: string;
  username: string;
  isActive: boolean;
};

type ApiProvision = {
  id: string;
  qrCode: string;
  service: 'review' | 'menu';
  createdAt: string;
  agentUsername: string | null;
  business: {
    id: string;
    name: string;
    onHoldingAccount: boolean;
  } | null;
  location: {
    name: string;
    address: string | null;
  } | null;
};

type PlaceRow = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
};

function toService(api: 'review' | 'menu'): Service {
  return api === 'menu' ? 'quickcommerce' : 'quickreview';
}

function toApiService(service: Service): 'review' | 'menu' {
  return service === 'quickcommerce' ? 'menu' : 'review';
}

function toAgent(row: ApiAgent): Agent {
  return {
    id: row.id,
    username: row.username,
    status: row.isActive ? 'active' : 'disabled',
  };
}

function toLocation(row: ApiProvision): ProvisionedLocation {
  return {
    id: row.id,
    businessId: row.business?.id ?? '',
    businessName: row.location?.name ?? row.business?.name ?? '—',
    address: row.location?.address ?? undefined,
    qrCode: row.qrCode,
    service: toService(row.service),
    agentUsername: row.agentUsername === 'Admin' ? null : row.agentUsername,
    linkedAt: row.createdAt,
    onHoldingAccount: row.business?.onHoldingAccount ?? false,
  };
}

export function AdminCounterSalePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [locations, setLocations] = useState<ProvisionedLocation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [agentRows, provisionRows] = await Promise.all([
      api<ApiAgent[]>('/api/admin/counter-sale/agents'),
      api<ApiProvision[]>('/api/admin/counter-sale/provisions'),
    ]);
    setAgents(agentRows.map(toAgent));
    setLocations(provisionRows.map(toLocation));
    setLoadError(null);
  }, []);

  useEffect(() => {
    void reload().catch((err) => {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load counter sale data');
    });
  }, [reload]);

  const agentAppUrl = `${window.location.origin}/counter-sale/`;

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</p>
      ) : null}
      {toast ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{toast}</p>
      ) : null}
      <CounterSalePage
        agents={agents}
        locations={locations}
        agentAppUrl={agentAppUrl}
        onAddAgent={async (username, pin) => {
          await api('/api/admin/counter-sale/agents', {
            method: 'POST',
            body: { username, pin },
          });
          setToast('Agent added.');
          await reload();
        }}
        onToggleAgent={async (agentId, nextStatus) => {
          await api(`/api/admin/counter-sale/agents/${agentId}`, {
            method: 'PATCH',
            body: { isActive: nextStatus === 'active' },
          });
          await reload();
        }}
        onLoginAsAgent={async (agentId) => {
          const data = await api<{ accessToken: string }>(
            `/api/admin/counter-sale/agents/${agentId}/session`,
            { method: 'POST' },
          );
          const url = `${window.location.origin}/counter-sale/link#t=${encodeURIComponent(data.accessToken)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
        onSearchPlaces={async (query) => {
          if (query.length < 3) {
            throw new Error('Type at least 3 characters to search.');
          }
          const rows = await counterSaleProvisionApi<PlaceRow[]>(
            `/api/counter-sale/places/search?q=${encodeURIComponent(query)}`,
            getAccessToken(),
          );
          return rows.map(
            (row): GooglePlace => ({
              placeId: row.placeId,
              name: row.name,
              address: row.formattedAddress ?? '',
            }),
          );
        }}
        onLinkStandee={async ({ qrCode, service, placeId }) => {
          try {
            await counterSaleProvisionApi('/api/counter-sale/provisions', getAccessToken(), {
              method: 'POST',
              body: { qrCode, placeId, service: toApiService(service) },
            });
            setToast('Standee linked.');
            await reload();
          } catch (err) {
            throw err instanceof CounterSaleApiError ? new Error(err.message) : err;
          }
        }}
        onTransferShop={async ({ businessId, email }) => {
          try {
            await api(`/api/admin/businesses/${businessId}/transfer`, {
              method: 'POST',
              body: { email },
            });
            setToast(`Transferred to ${email}.`);
            await reload();
          } catch (err) {
            throw err instanceof ApiError ? new Error(err.message) : err;
          }
        }}
      />
    </div>
  );
}
