"use client";

import React from "react";

export default function EventModal({ event, onClose }: { event: any | null; onClose: () => void }) {
  if (!event) return null;

  const start = event.start ? new Date(event.start).toLocaleString("tr-TR") : "";
  const end = event.end ? new Date(event.end).toLocaleString("tr-TR") : "";
  const place = event.extendedProps?.place || "-";
  const lecturer = event.extendedProps?.lecturer || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-white font-semibold text-lg">{event.title}</h3>
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={onClose}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Başlangıç:</span>
            <span className="text-slate-200 font-medium">{start}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Bitiş:</span>
            <span className="text-slate-200 font-medium">{end}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Ders Yeri:</span>
            <span className="text-slate-200 font-medium">{place}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Hoca:</span>
            <span className="text-slate-200 font-medium">{lecturer}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm hover:bg-slate-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
