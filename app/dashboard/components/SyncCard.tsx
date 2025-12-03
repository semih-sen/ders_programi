"use client";

import React, { useTransition } from "react";
import { triggerYearlySync } from "../actions";

export default function SyncCard({ hasYearlySynced, userEmail }: { hasYearlySynced: boolean; userEmail: string }) {
  const [isPending, startTransition] = useTransition();

  const onStartSync = () => {
    startTransition(async () => {
      const formData = new FormData();
      const res = await triggerYearlySync(undefined, formData);
      // Basit toast yerine inline mesaj gösterimi yapılabilir
      // Burada UI framework'e göre toast eklenebilir
      console.log(res);
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold text-xl">Akademik Senkronizasyon</h2>
          <p className="text-slate-300 text-sm">Ders programını Google Takvim ile eşitle, güncellemeleri anında al.</p>
          <p className="text-slate-500 text-xs mt-1">Bağlı hesap: <span className="text-slate-300">{userEmail}</span></p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          <p>• Bu işlem yalnızca bir kez yapılabilir</p>
          <p>• Seçili dersleriniz takvime eklenecek</p>
          <p>• İşlem birkaç dakika sürebilir</p>
        </div>
        <button
          disabled={hasYearlySynced || isPending}
          onClick={onStartSync}
          className={`relative inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold transition-all focus:outline-none border ${
            hasYearlySynced ? "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-transparent hover:opacity-95"
          }`}
        >
          {hasYearlySynced ? "Senkronizasyon Tamamlandı" : isPending ? "İşleniyor..." : "Senkronizasyonu Başlat"}
        </button>
      </div>
    </div>
  );
}
