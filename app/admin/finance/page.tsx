import { getFinancialStats } from './actions';
import FinanceClient from './FinanceClient';

export const metadata = {
  title: 'Finans & Kasa Yönetimi',
};

export default async function FinancePage() {
  const stats = await getFinancialStats();

  return <FinanceClient stats={stats} />;
}
