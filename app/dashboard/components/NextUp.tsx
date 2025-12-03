"use client";

import React, { useMemo } from "react";

// In a real setup, get events from props or SWR.
const events = [
  {
    title: "Anatomi - Amfi 4",
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000),
    place: "Amfi 4",
  },
  {
    title: "Yemek Molası",
    start: new Date(Date.now() + 60 * 60 * 1000 * 2),
    end: new Date(Date.now() + 60 * 60 * 1000 * 3),
    place: "Yemekhane",
    timeLabel: "13:30",
  },
];

export default function NextUp() {
  const now = new Date();

  const current = useMemo(() => {
    return events.find((e) => now >= e.start && now <= e.end);
  }, [now]);

  const upcoming = useMemo(() => {
    return events
      .filter((e) => e.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  }, [now]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 h-full">
      <h3 className="text-white font-semibold text-lg mb-3">Şu An / Sırada</h3>
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs text-slate-300">Şu An</p>
          <p className="mt-1 text-white font-medium">
            {current ? `${current.title} (${current.place}) • Devam Ediyor` : "Şu anda etkinlik yok"}
          </p>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="text-xs text-slate-300">Sırada</p>
          <p className="mt-1 text-white font-medium">
            {upcoming ? `${upcoming.timeLabel || upcoming.start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} - ${upcoming.title}` : "Sırada bir etkinlik yok"}
          </p>
        </div>
      </div>
    </div>
  );
}
