"use client";

import React, { useTransition } from "react";
import { RefreshCw, Loader2, CheckCircle2, Clock } from "lucide-react";
import { triggerYearlySync } from "../actions";

interface SyncStatusCardProps {
  hasYearlySynced: boolean;
  syncStatus?: string | null;
  lastSyncedAt?: Date | null;
}

export default function SyncStatusCard({
  hasYearlySynced,
  syncStatus,
  lastSyncedAt,
}: SyncStatusCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const formData = new FormData();
      const res = await triggerYearlySync(undefined, formData);
      if (res.success) {
        alert(res.message);
      } else {
        alert(res.message || "Bir hata oluştu");
      }
    });
  };

  const isQueued = syncStatus === "QUEUED";
  const isProcessing = syncStatus === "PROCESSING";
  const isDisabled = hasYearlySynced || isQueued || isProcessing || isPending;

  // Determine icon based on state
  const getIcon = () => {
    if (isProcessing) {
      return <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />;
    }
    if (hasYearlySynced) {
      return <CheckCircle2 className="w-12 h-12 text-green-400" />;
    }
    if (isQueued) {
      return <Clock className="w-12 h-12 text-yellow-400" />;
    }
    return <RefreshCw className="w-12 h-12 text-indigo-400" />;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30 p-6 shadow-xl overflow-hidden">
      <div className="flex items-start justify-between">
        {/* Sol: Başlık ve Açıklama */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            Senkronizasyon Durumu
          </h2>
          <p className="text-slate-300 text-sm mb-4">
            Ders programın Google Takvim ile eşitleniyor. Tek tıkla güncel kal.
          </p>

          {/* Son Eşitleme */}
          <div className="mb-6 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-4 h-4" />
              <span>Son eşitleme:</span>
            </div>
            <p className="text-white font-semibold">
              {lastSyncedAt
                ? new Date(lastSyncedAt).toLocaleString("tr-TR")
                : "Henüz yapılmadı"}
            </p>
          </div>

          {/* Senkronize Et Butonu */}
          <button
            onClick={handleSync}
            disabled={isDisabled}
            className={`w-full rounded-xl px-6 py-3 text-base font-semibold transition-all shadow-lg flex items-center justify-center gap-3 ${
              isDisabled
                ? "bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
            {hasYearlySynced && <CheckCircle2 className="w-5 h-5" />}
            <span>
              {hasYearlySynced
                ? "Senkronizasyon Tamamlandı"
                : isQueued
                ? "Sırada Bekliyor..."
                : isProcessing
                ? "İşleniyor..."
                : isPending
                ? "Gönderiliyor..."
                : "🔄 Takvime Senkronize Et"}
            </span>
          </button>
        </div>

        {/* Sağ: İkon */}
        <div className="ml-6 flex-shrink-0 pt-2">
          {getIcon()}
        </div>
      </div>
    </div>
  );
}
