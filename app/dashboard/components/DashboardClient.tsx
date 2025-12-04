"use client";

import React from "react";
import { Book, TrendingUp, AlertCircle, Zap } from "lucide-react";
import ModernCalendar from "./Calendar";
import NextLessonCard from "./NextUp";
import type { CalendarEvent } from "@/lib/calendarHelpers";
import { useTransition } from "react";
import { triggerYearlySync } from "../actions";

interface DashboardClientProps {
  events: CalendarEvent[];
  stats: {
    totalLessons: number;
    subscribedCourses: number;
  };
  hasYearlySynced: boolean;
}

export default function DashboardClient({ events, stats, hasYearlySynced }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const formData = new FormData();
      const res = await triggerYearlySync(undefined, formData);
      console.log(res);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Takvim (2 kolon) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 shadow-2xl">
              <ModernCalendar events={events} />
            </div>
          </div>

          {/* Sağ: Widget'lar (1 kolon) */}
          <div className="space-y-6">
            {/* Sonraki Ders Kartı */}
            <NextLessonCard events={events} />

            {/* İstatistikler */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold text-lg">İstatistikler</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <Book className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Toplam Ders</span>
                  </div>
                  <span className="text-white font-bold text-lg">{stats.totalLessons}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-300 text-sm">Takip Edilen</span>
                  </div>
                  <span className="text-white font-bold text-lg">{stats.subscribedCourses}</span>
                </div>
              </div>
            </div>

            {/* Hızlı İşlemler */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold text-lg">Hızlı İşlemler</h3>
              </div>
              <button
                onClick={handleSync}
                disabled={hasYearlySynced || isPending}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all shadow-lg ${
                  hasYearlySynced
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-[1.02]"
                }`}
              >
                {hasYearlySynced ? "✓ Senkronize Edildi" : isPending ? "İşleniyor..." : "🔄 Takvime Senkronize Et"}
              </button>
              <p className="text-slate-400 text-xs mt-2 text-center">
                {hasYearlySynced ? "Tekrar senkronizasyon yapılamaz" : "Tüm dersleriniz Google Takvim'e eklenecek"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
