/**
 * Finans Modülü - Dönem Bazlı Yapı için Type Definitions
 */

export type PeriodView = 'monthly' | 'quarterly' | 'custom';

export interface MonthlyPeriod {
  view: 'monthly';
  year: number;
  month: number; // 1-12
}

export interface QuarterlyPeriod {
  view: 'quarterly';
  year: number;
  quarter: number; // 1-4
}

export interface CustomPeriod {
  view: 'custom';
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export type PeriodParams = MonthlyPeriod | QuarterlyPeriod | CustomPeriod;

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FinanceReport {
  // Dönem Bilgisi
  period: PeriodParams;
  dateRange: DateRange;
  periodLabel: string; // "Kasım 2025", "2025 3. Çeyrek" gibi

  // Devreden Varlık (Opening Balance)
  openingBalance: number;

  // Dönem İçi Gelirler
  periodIncome: {
    completed: number; // Tahsil Edilen
    pending: number; // Alacaklar
    total: number;
  };

  // Dönem İçi Giderler
  periodExpense: {
    completed: number; // Ödenen
    pending: number; // Borçlar
    total: number;
  };

  // Dönem Net Farkı
  netChange: number; // periodIncome.completed - periodExpense.completed

  // Kasa Durumu
  currentBalance: number; // Şu anki anlık bakiye (completed işlemlere göre)
  closingBalance: number; // Dönem sonu tahmini (pending'ler gerçekleşirse)
  projectedClosing: number; // openingBalance + netChange + pending gelir - pending gider

  // İşlemler
  transactions: any[];

  // Hesaplar
  accounts: any[];

  // Kategori Bazlı Dağılım (Dönem içi)
  categoryBreakdown: Record<string, number>;
}

export interface PeriodSelectorProps {
  period: PeriodParams;
  onPeriodChange: (newPeriod: PeriodParams) => void;
}
