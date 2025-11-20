/**
 * Finans Modülü - Period Helper Utilities
 */

import { PeriodParams, DateRange, MonthlyPeriod, QuarterlyPeriod, CustomPeriod } from './types';

/**
 * Ay ismini Türkçe olarak döner
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return monthNames[month - 1] || '';
}

/**
 * Çeyrek ismini döner
 */
export function getQuarterName(quarter: number): string {
  return `${quarter}. Çeyrek`;
}

/**
 * Period parametresinden insan okunabilir label oluşturur
 */
export function getPeriodLabel(period: PeriodParams): string {
  switch (period.view) {
    case 'monthly':
      return `${getMonthName(period.month)} ${period.year}`;
    case 'quarterly':
      return `${period.year} ${getQuarterName(period.quarter)}`;
    case 'custom':
      return `${period.from} - ${period.to}`;
  }
}

/**
 * Period parametresinden tarih aralığı hesaplar
 */
export function getDateRangeFromPeriod(period: PeriodParams): DateRange {
  switch (period.view) {
    case 'monthly': {
      const startDate = new Date(period.year, period.month - 1, 1);
      const endDate = new Date(period.year, period.month, 0, 23, 59, 59, 999); // Son gün
      return { startDate, endDate };
    }
    case 'quarterly': {
      const startMonth = (period.quarter - 1) * 3; // Q1: 0, Q2: 3, Q3: 6, Q4: 9
      const startDate = new Date(period.year, startMonth, 1);
      const endDate = new Date(period.year, startMonth + 3, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case 'custom': {
      const startDate = new Date(period.from);
      const endDate = new Date(period.to);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
  }
}

/**
 * Mevcut ayın period parametresini döner
 */
export function getCurrentMonthPeriod(): MonthlyPeriod {
  const now = new Date();
  return {
    view: 'monthly',
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

/**
 * Bir sonraki period'u hesaplar
 */
export function getNextPeriod(period: PeriodParams): PeriodParams {
  switch (period.view) {
    case 'monthly': {
      if (period.month === 12) {
        return { view: 'monthly', year: period.year + 1, month: 1 };
      }
      return { view: 'monthly', year: period.year, month: period.month + 1 };
    }
    case 'quarterly': {
      if (period.quarter === 4) {
        return { view: 'quarterly', year: period.year + 1, quarter: 1 };
      }
      return { view: 'quarterly', year: period.year, quarter: period.quarter + 1 };
    }
    case 'custom': {
      // Custom period için bir sonraki dönemi otomatik hesaplayamayız
      return period;
    }
  }
}

/**
 * Bir önceki period'u hesaplar
 */
export function getPreviousPeriod(period: PeriodParams): PeriodParams {
  switch (period.view) {
    case 'monthly': {
      if (period.month === 1) {
        return { view: 'monthly', year: period.year - 1, month: 12 };
      }
      return { view: 'monthly', year: period.year, month: period.month - 1 };
    }
    case 'quarterly': {
      if (period.quarter === 1) {
        return { view: 'quarterly', year: period.year - 1, quarter: 4 };
      }
      return { view: 'quarterly', year: period.year, quarter: period.quarter - 1 };
    }
    case 'custom': {
      // Custom period için bir önceki dönemi otomatik hesaplayamayız
      return period;
    }
  }
}

/**
 * Period parametresini URL query string'e çevirir
 */
export function periodToQueryString(period: PeriodParams): string {
  const params = new URLSearchParams();
  params.set('view', period.view);
  
  switch (period.view) {
    case 'monthly':
      params.set('year', period.year.toString());
      params.set('month', period.month.toString());
      break;
    case 'quarterly':
      params.set('year', period.year.toString());
      params.set('quarter', period.quarter.toString());
      break;
    case 'custom':
      params.set('from', period.from);
      params.set('to', period.to);
      break;
  }
  
  return params.toString();
}

/**
 * URL search params'tan period parametresini parse eder
 */
export function parseSearchParams(searchParams: URLSearchParams): PeriodParams {
  const view = searchParams.get('view') as PeriodView | null;
  
  if (view === 'monthly') {
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');
    if (year && month >= 1 && month <= 12) {
      return { view: 'monthly', year, month };
    }
  } else if (view === 'quarterly') {
    const year = parseInt(searchParams.get('year') || '');
    const quarter = parseInt(searchParams.get('quarter') || '');
    if (year && quarter >= 1 && quarter <= 4) {
      return { view: 'quarterly', year, quarter };
    }
  } else if (view === 'custom') {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      return { view: 'custom', from, to };
    }
  }
  
  // Varsayılan: Mevcut ay
  return getCurrentMonthPeriod();
}

type PeriodView = 'monthly' | 'quarterly' | 'custom';
