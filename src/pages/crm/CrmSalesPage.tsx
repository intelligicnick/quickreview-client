import { Link, useSearchParams } from 'react-router-dom';
import { ContactActions } from '../../components/crm/ContactActions';
import { formatInr, formatRelativeDay, pendingAmount, paymentStatus } from '../../lib/crm/format';
import { paymentReminderMessage } from '../../lib/crm/whatsapp';
import { useCrm } from '../../lib/crm/context';
import { DEAL_STAGE_LABELS, salesLabel } from '../../lib/crm/terminology';

const STAGES = ['new', 'interested', 'quotation', 'negotiation', 'won', 'lost'] as const;

export function CrmSalesPage() {
  const { state, customerById, setDealStage, logCall } = useCrm();
  const [params] = useSearchParams();
  const pendingOnly = params.get('filter') === 'pending';

  const sales = state.sales.filter((s) => !pendingOnly || pendingAmount(s) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{salesLabel(state.profile?.businessType)}</h1>
          <p className="text-sm text-muted">Move deals forward with one tap</p>
        </div>
        <Link to="/app/quickcrm/sales/new" className="btn-gradient w-full shrink-0 px-4 py-2.5 text-center text-sm sm:w-auto">
          New sale
        </Link>
      </div>

      <ul className="space-y-3">
        {sales.map((sale) => {
          const customer = customerById(sale.customerId);
          if (!customer) return null;
          const pending = pendingAmount(sale);
          const fu = state.followUps.find((f) => f.customerId === sale.customerId && !f.completedAt);
          return (
            <li key={sale.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-sm text-muted">{sale.title}</p>
                  <p className="mt-1 font-display text-lg font-bold">{formatInr(sale.amount)}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-dark">
                  {DEAL_STAGE_LABELS[sale.stage]}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Payment: {paymentStatus(sale)} {pending > 0 ? `· ${formatInr(pending)} pending` : ''}
              </p>
              {fu ? <p className="text-xs text-muted">Follow-up {formatRelativeDay(fu.dueAt)}</p> : null}
              <select
                className="field mt-3"
                value={sale.stage}
                onChange={(e) => setDealStage(sale.id, e.target.value as typeof sale.stage)}
              >
                {STAGES.map((st) => (
                  <option key={st} value={st}>{DEAL_STAGE_LABELS[st]}</option>
                ))}
              </select>
              <div className="mt-3">
                <ContactActions
                  mobile={customer.mobile}
                  whatsAppMessage={pending > 0 ? paymentReminderMessage(customer.name, pending) : undefined}
                  onCall={() => logCall(customer.id)}
                  compact
                />
              </div>
              {pending > 0 ? (
                <Link
                  to={`/app/quickcrm/payments/new?sale=${sale.id}`}
                  className="mt-2 flex min-h-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-800"
                >
                  + Record payment
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
