"use client";

import React, { useTransition } from "react";
import { RefreshCw, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { triggerYearlySync } from "../actions";

interface SyncStatusCardProps {
  hasYearlySynced: boolean;
  syncStatus?: string | null;
  lastSyncedAt?: Date | null;
}

export default function SyncStatusCard({ hasYearlySynced, syncStatus, lastSyncedAt }: SyncStatusCardProps) {
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

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-semibold text-lg">Durum Paneli</h3>
      </div>

      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={isDisabled}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all shadow-lg mb-4 flex items-center justify-center gap-2 ${
          isDisabled
            ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-[1.02]"
        }`}
      >
        {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
        {hasYearlySynced && <CheckCircle2 className="w-4 h-4" />}
        {hasYearlySynced
          ? "Senkronizasyon Tamamlandı"
          : isQueued
          ? "Sırada Bekliyor..."
          : isProcessing
          ? "İşleniyor..."
          : isPending
          ? "Gönderiliyor..."
          : "🔄 Takvime Senkronize Et"}
      </button>

      {/* Last Sync Info */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Son eşitleme:</span>
        </div>
        <p className="text-white font-medium text-sm mt-1">
          {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("tr-TR") : "Henüz yapılmadı"}
        </p>
      </div>

      {/* Info Text */}
      <p className="text-slate-400 text-xs mt-3 text-center">
        {hasYearlySynced
          ? "Yıllık senkronizasyon tamamlandı"
          : "Tüm dersleriniz Google Takvim'e eklenecek"}
      </p>
    </div>
  );
}
