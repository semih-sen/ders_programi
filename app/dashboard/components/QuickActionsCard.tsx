"use client";

import React, { useState } from "react";
import { Settings, RotateCcw, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteAccountButton from "../DeleteAccountButton";

export default function QuickActionsCard() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRestartOnboarding = async () => {
    if (
      confirm(
        "Onboarding sürecini yeniden başlatmak istediğinize emin misiniz?"
      )
    ) {
      try {
        const res = await fetch("/api/reset-onboarding", { method: "POST" });
        if (res.ok) {
          router.refresh();
        }
      } catch (error) {
        alert("Bir hata oluştu");
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-5">
        <Settings className="w-6 h-6 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Hızlı İşlemler</h2>
      </div>

      <div className="space-y-3">
        {/* Onboarding'i Tekrar Başlat */}
        <button
          onClick={handleRestartOnboarding}
          className="w-full rounded-xl px-4 py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Onboarding'i Başlat
        </button>

        {/* Oturumu Kapat */}
        <a
          href="/api/auth/signout"
          className="w-full rounded-xl px-4 py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Oturumu Kapat
        </a>

        {/* Danger Zone: Hesabı Sil */}
        <div className="pt-3 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs font-semibold mb-2 uppercase">
            Tehlikeli Alan
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
