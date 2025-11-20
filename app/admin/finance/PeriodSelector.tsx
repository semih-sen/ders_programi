'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PeriodParams } from './types';
import { 
  getPeriodLabel, 
  getNextPeriod, 
  getPreviousPeriod, 
  periodToQueryString,
  getCurrentMonthPeriod
} from './periodUtils';

interface PeriodSelectorProps {
  period: PeriodParams;
}

export default function PeriodSelector({ period }: PeriodSelectorProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handlePeriodChange = (newPeriod: PeriodParams) => {
    const queryString = periodToQueryString(newPeriod);
    router.push(`/admin/finance?${queryString}`);
    setShowMenu(false);
  };

  const handlePrevious = () => {
    const prevPeriod = getPreviousPeriod(period);
    handlePeriodChange(prevPeriod);
  };

  const handleNext = () => {
    const nextPeriod = getNextPeriod(period);
    handlePeriodChange(nextPeriod);
  };

  const switchToMonthly = () => {
    const currentMonth = getCurrentMonthPeriod();
    handlePeriodChange(currentMonth);
  };

  const switchToQuarterly = () => {
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    handlePeriodChange({
      view: 'quarterly',
      year: now.getFullYear(),
      quarter: currentQuarter as 1 | 2 | 3 | 4,
    });
  };

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      handlePeriodChange({
        view: 'custom',
        from: customFrom,
        to: customTo,
      });
      setShowCustomDatePicker(false);
      setCustomFrom('');
      setCustomTo('');
    }
  };

  // Custom view için prev/next butonlarını devre dışı bırak
  const isCustomView = period.view === 'custom';

  return (
    <div className="relative">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 flex items-center justify-between">
        {/* Önceki Buton */}
        <button
          onClick={handlePrevious}
          disabled={isCustomView}
          className={`p-2 rounded-lg transition-all ${
            isCustomView
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
          title="Önceki Dönem"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dönem Etiketi */}
        <div className="flex-1 text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {getPeriodLabel(period)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {period.view === 'monthly' && 'Aylık Görünüm'}
            {period.view === 'quarterly' && 'Çeyrek Yıllık Görünüm'}
            {period.view === 'custom' && 'Özel Tarih Aralığı'}
          </p>
        </div>

        {/* Sonraki Buton */}
        <button
          onClick={handleNext}
          disabled={isCustomView}
          className={`p-2 rounded-lg transition-all ${
            isCustomView
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
          title="Sonraki Dönem"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Ayarlar Menüsü */}
        <div className="relative ml-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            title="Dönem Ayarları"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Dropdown Menü */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={switchToMonthly}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 flex items-center gap-3"
                >
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-white font-medium">Aylık Görünüm</p>
                    <p className="text-xs text-slate-400">Tek bir ayı göster</p>
                  </div>
                </button>
                
                <button
                  onClick={switchToQuarterly}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 flex items-center gap-3"
                >
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="text-white font-medium">Çeyrek Yıllık Görünüm</p>
                    <p className="text-xs text-slate-400">3 aylık dönem</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setShowCustomDatePicker(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">🗓️</span>
                  <div>
                    <p className="text-white font-medium">Özel Tarih Aralığı</p>
                    <p className="text-xs text-slate-400">Başlangıç ve bitiş seç</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Özel Tarih Aralığı Modal */}
      {showCustomDatePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Özel Tarih Aralığı</h3>
              <button
                onClick={() => {
                  setShowCustomDatePicker(false);
                  setCustomFrom('');
                  setCustomTo('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCustomDatePicker(false);
                    setCustomFrom('');
                    setCustomTo('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={applyCustomRange}
                  disabled={!customFrom || !customTo}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
