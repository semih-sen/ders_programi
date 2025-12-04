"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Clock, Coffee } from "lucide-react";
import type { GoogleCalendarEvent } from "@/lib/googleCalendarHelper";

interface NextLessonCardProps {
  events: GoogleCalendarEvent[];
}

export default function NextLessonCard({ events }: NextLessonCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // Her 30 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  const current = events.find((e) => {
    const start = new Date(e.start);
    const end = new Date(e.end);
    return now >= start && now <= end;
  });

  const upcoming = events
    .filter((e) => new Date(e.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const getTimeUntil = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours} saat ${minutes % 60} dakika`;
    return `${minutes} dakika`;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 shadow-xl h-full">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-semibold text-lg">Sonraki Ders</h3>
      </div>

      <div className="space-y-3">
        {current && (
          <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Şu An</p>
            </div>
            <p className="text-white font-bold text-base mb-1">{current.title}</p>
            <p className="text-slate-300 text-sm flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {current.extendedProps?.place || "-"}
            </p>
            <p className="text-slate-400 text-xs mt-2">
              {formatTime(new Date(current.start))} - {formatTime(new Date(current.end))}
            </p>
          </div>
        )}

        {upcoming && (
          <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Sırada</p>
            </div>
            <p className="text-white font-bold text-base mb-1">{upcoming.title}</p>
            <p className="text-slate-300 text-sm flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {upcoming.extendedProps?.place || "-"}
            </p>
            <p className="text-slate-400 text-xs mt-2">
              {formatTime(new Date(upcoming.start))} • {getTimeUntil(new Date(upcoming.start))} sonra
            </p>
          </div>
        )}

        {!current && !upcoming && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 text-center">
            <Coffee className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-300 text-sm font-medium">Şimdilik serbestsin, keyfine bak ☕️</p>
          </div>
        )}
      </div>
    </div>
  );
}
