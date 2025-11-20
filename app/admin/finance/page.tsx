import { getFinanceReport } from './actions';
import FinanceClient from './FinanceClient';
import PeriodSelector from './PeriodSelector';
import FinanceSummary from './FinanceSummary';
import { parseSearchParams, getDateRangeFromPeriod, getPeriodLabel } from './periodUtils';
import { PeriodParams } from './types';

export const metadata = {
  title: 'Finans & Kasa Yönetimi',
};

interface FinancePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  // URL parametrelerinden period'u parse et
  const urlSearchParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      urlSearchParams.set(key, value);
    }
  });
  
  const period: PeriodParams = parseSearchParams(urlSearchParams);
  const { startDate, endDate } = getDateRangeFromPeriod(period);
  
  // Dönem bazlı raporu getir
  const report = await getFinanceReport(startDate, endDate);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          💰 Finans & Kasa Yönetimi
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Dönem bazlı gelir ve gider takibi, vadeli işlemler, kasa akışı
        </p>
      </div>

      {/* Dönem Seçici */}
      <div className="mb-6">
        <PeriodSelector period={period} />
      </div>

      {/* Finansal Özet Kartları */}
      <div className="mb-8">
        <FinanceSummary
          openingBalance={report.openingBalance}
          currentBalance={report.currentBalance}
          projectedClosing={report.projectedClosing}
          periodIncome={report.periodIncome}
          periodExpense={report.periodExpense}
          netChange={report.netChange}
        />
      </div>

      {/* Client Component - İşlem Tablosu ve Modallar */}
      <FinanceClient 
        transactions={report.transactions}
        accounts={report.accounts}
        periodLabel={getPeriodLabel(period)}
      />
    </div>
  );
}
