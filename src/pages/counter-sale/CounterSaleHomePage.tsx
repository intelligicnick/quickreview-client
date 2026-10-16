import { Navigate } from 'react-router-dom';
import { getCounterSaleToken } from '../../lib/counter-sale-api';

export function CounterSaleHomePage() {
  if (getCounterSaleToken()) {
    return <Navigate to="/counter-sale/link" replace />;
  }
  return <Navigate to="/counter-sale/login" replace />;
}
