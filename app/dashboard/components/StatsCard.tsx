"use client";

import React from "react";
import { BarChart3, BookOpen, Calendar } from "lucide-react";

interface StatsCardProps {
  courseCount: number;
  classYear?: number | null;
  uygulamaGrubu?: string | null;
}

export default function StatsCard({ courseCount, classYear, uygulamaGrubu }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-5">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h2 className="text-lg font-bold text-white">İstatistikler</h2>
      </div>

      <div className="space-y-4">
        {/* Takip Edilen Ders Sayısı */}
        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400 text-sm">Takip Edilen Dersleri</span>
            </div>
            <span className="text-white font-bold text-lg">{courseCount}</span>
          </div>
        </div>

        {/* Sınıf Yılı */}
        {classYear && (
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-sm">Sınıf Yılı</span>
              </div>
              <span className="text-white font-bold text-lg">{classYear}. Sınıf</span>
            </div>
          </div>
        )}

        {/* Uygulama Grubu */}
        {uygulamaGrubu && (
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
            <div>
              <span className="text-slate-400 text-sm block mb-1">Uygulama Grubu</span>
              <span className="text-white font-semibold">{uygulamaGrubu}</span>
            </div>
          </div>
        )}

        {!classYear && !uygulamaGrubu && (
          <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/20 text-center">
            <p className="text-slate-500 text-sm">Daha fazla bilgi onboarding'de ayarlanır</p>
          </div>
        )}
      </div>
    </div>
  );
}
