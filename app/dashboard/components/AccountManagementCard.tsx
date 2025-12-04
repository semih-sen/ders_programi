"use client";

import React, { useState } from "react";
import { Settings, RotateCcw, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteAccountButton from "../DeleteAccountButton";

export default function AccountManagementCard() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRestartOnboarding = async () => {
    if (confirm("Onboarding sürecini yeniden başlatmak istediğinize emin misiniz?")) {
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
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold text-lg">Hesap Yönetimi</h3>
      </div>

      <div className="space-y-3">
        {/* Onboarding Yeniden Başlat */}
        <button
          onClick={handleRestartOnboarding}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 text-sm font-medium text-white transition-colors flex items-center gap-2 justify-center"
        >
          <RotateCcw className="w-4 h-4" />
          Onboarding'i Yeniden Başlat
        </button>

        {/* Bilgileri Güncelle */}
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 text-sm font-medium text-white transition-colors flex items-center gap-2 justify-center"
        >
          <Edit className="w-4 h-4" />
          Bilgilerimi Güncelle
        </button>

        {/* Hesabı Sil */}
        <div className="pt-3 border-t border-slate-700">
          <p className="text-slate-400 text-xs mb-2">Tehlikeli Alan</p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
