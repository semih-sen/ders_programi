'use client';

interface FinanceSummaryProps {
  openingBalance: number;
  currentBalance: number;
  projectedClosing: number;
  periodIncome: {
    completed: number;
    pending: number;
    total: number;
  };
  periodExpense: {
    completed: number;
    pending: number;
    total: number;
  };
  netChange: number;
}

export default function FinanceSummary({
  openingBalance,
  currentBalance,
  projectedClosing,
  periodIncome,
  periodExpense,
  netChange,
}: FinanceSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Satır 1: Kasa Akışı - Varlık Durumu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {/* Devreden Varlık */}
        <div className="bg-gradient-to-br from-slate-600/30 to-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/50 p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-slate-300 font-semibold text-xs sm:text-sm">Devreden Varlık</h3>
            <span className="text-xl sm:text-2xl">📦</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-200 mb-1">
            {formatCurrency(openingBalance)}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400">Dönem başındaki kasa</p>
        </div>

        {/* Bugünkü Kasa */}
        <div className={`bg-gradient-to-br ${
          currentBalance >= 0 
            ? 'from-green-500/20 to-emerald-600/20 border-green-500/30' 
            : 'from-red-500/20 to-rose-600/20 border-red-500/30'
        } backdrop-blur-sm rounded-xl border p-3 sm:p-4 md:p-5`}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className={`${currentBalance >= 0 ? 'text-green-300' : 'text-red-300'} font-semibold text-xs sm:text-sm`}>
              Bugünkü Kasa
            </h3>
            <span className="text-xl sm:text-2xl">{currentBalance >= 0 ? '💰' : '⚠️'}</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${currentBalance >= 0 ? 'text-green-200' : 'text-red-200'} mb-1`}>
            {formatCurrency(currentBalance)}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400">Şu anki anlık bakiye</p>
        </div>

        {/* Devredecek Varlık (Tahmini) */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-sm rounded-xl border border-blue-500/30 p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-blue-300 font-semibold text-xs sm:text-sm">Devredecek Varlık</h3>
            <span className="text-xl sm:text-2xl">🔮</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-200 mb-1">
            {formatCurrency(projectedClosing)}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Tahmini dönem sonu
            {(periodIncome.pending > 0 || periodExpense.pending > 0) && (
              <span className="block mt-1 text-amber-400">
                (Bekleyen işlemler dahil)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Satır 2: Dönem Performansı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {/* Gelirler */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-300 font-semibold text-sm">Dönem Gelirleri</h3>
            <span className="text-xl sm:text-2xl">📈</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-200 mb-2">
            {formatCurrency(periodIncome.total)}
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-green-300">✓ Tahsilat:</span>
              <span className="font-semibold text-green-200">{formatCurrency(periodIncome.completed)}</span>
            </div>
            {periodIncome.pending > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-amber-300">⏳ Alacak:</span>
                <span className="font-semibold text-amber-200">{formatCurrency(periodIncome.pending)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dönem Net Farkı */}
        <div className={`bg-gradient-to-br ${
          netChange >= 0 
            ? 'from-blue-500/30 to-cyan-600/30 border-blue-500/40' 
            : 'from-rose-500/30 to-red-600/30 border-rose-500/40'
        } backdrop-blur-sm rounded-xl border p-3 sm:p-4 md:p-5 ring-2 ${
          netChange >= 0 ? 'ring-blue-400/30' : 'ring-rose-400/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${netChange >= 0 ? 'text-blue-300' : 'text-rose-300'} font-semibold text-sm`}>
              Dönem Net Farkı
            </h3>
            <span className="text-2xl sm:text-3xl">{netChange >= 0 ? '📊' : '📉'}</span>
          </div>
          <p className={`text-3xl sm:text-4xl font-bold ${netChange >= 0 ? 'text-blue-100' : 'text-rose-100'} mb-1 sm:mb-2`}>
            {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300">
            {netChange >= 0 ? '✓ Dönem Kârda' : '⚠ Dönem Zararda'}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            (Gelir - Gider)
          </p>
        </div>

        {/* Giderler */}
        <div className="bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-sm rounded-xl border border-red-500/30 p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-300 font-semibold text-sm">Dönem Giderleri</h3>
            <span className="text-xl sm:text-2xl">📉</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-200 mb-2">
            {formatCurrency(periodExpense.total)}
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-red-300">✓ Ödenen:</span>
              <span className="font-semibold text-red-200">{formatCurrency(periodExpense.completed)}</span>
            </div>
            {periodExpense.pending > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-orange-300">⏳ Borç:</span>
                <span className="font-semibold text-orange-200">{formatCurrency(periodExpense.pending)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Açıklama Notu */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">💡</span>
          <div className="flex-1 text-xs sm:text-sm text-slate-300 space-y-1">
            <p>
              <strong className="text-white">Devreden Varlık:</strong> Dönem başından önceki tüm gerçekleşen işlemlerin net bakiyesi.
            </p>
            <p>
              <strong className="text-white">Bugünkü Kasa:</strong> Devreden varlık + Bu dönemde gerçekleşen gelirler - Bu dönemde gerçekleşen giderler.
            </p>
            <p>
              <strong className="text-white">Devredecek Varlık:</strong> Bekleyen alacaklar tahsil edilip borçlar ödendiğinde dönem sonunda olacak tahmini bakiye.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
