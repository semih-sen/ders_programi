"use client";

import { useState, useTransition } from "react";
import { listUserEvents, deleteSelectedEvents } from "../actions";

interface Event {
  id: string;
  summary: string;
  start: string | null;
  end: string | null;
  description: string;
}

const MONTHS = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
];

function getYears() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function DeleteEventsCard({ userId }: { userId: string }) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useTransition();
  const [deleting, setDeleting] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toast benzeri bildirim (otomatik kapanır)
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Tüm etkinlikleri seç/kaldır
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEventIds(new Set(events.map((e) => e.id)));
    } else {
      setSelectedEventIds(new Set());
    }
  };

  // Tek bir etkinliği seç/kaldır
  const toggleSelectEvent = (eventId: string) => {
    const newSelected = new Set(selectedEventIds);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEventIds(newSelected);
  };

  // Etkinlikleri getir
  const handleFetchEvents = async () => {
    setLoading(async () => {
      const result = await listUserEvents(userId, year, month);
      if ("error" in result) {
        showMessage(result.error, 'error');
        setEvents([]);
      } else {
        setEvents(result.events || []);
        setSelectedEventIds(new Set());
        showMessage(`${result.count || 0} etkinlik yüklendi.`, 'success');
      }
    });
  };

  // Seçilmiş etkinlikleri sil
  const handleDeleteSelected = async () => {
    if (selectedEventIds.size === 0) {
      showMessage('Silinecek etkinlik seçilmedi.', 'error');
      return;
    }

    // Doğrulama uyarısı
    const confirmed = confirm(
      `${selectedEventIds.size} etkinliği silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    setDeleting(async () => {
      const result = await deleteSelectedEvents(userId, Array.from(selectedEventIds));
      if ("error" in result) {
        showMessage(result.error, 'error');
      } else {
        showMessage(result.message, 'success');
        setEvents([]);
        setSelectedEventIds(new Set());
      }
    });
  };

  const allSelected = events.length > 0 && selectedEventIds.size === events.length;
  const someSelected = selectedEventIds.size > 0 && selectedEventIds.size < events.length;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col space-y-4">
      {/* Başlık */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">
          Takvim Etkinliklerini Sil
        </h3>
        <p className="text-xs text-slate-400">
          ⚠️ Uyarı: Seçilen etkinlikler kalıcı olarak silinir. İşlem geri alınamaz.
        </p>
      </div>

      {/* Mesaj Gösterimi */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400 border border-green-700/50'
              : 'bg-red-900/30 text-red-400 border border-red-700/50'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filtre Kısmı */}
      <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4 space-y-3">
        <div className="flex gap-3 items-end">
          {/* Yıl Seçimi */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Yıl
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              disabled={loading || deleting}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
            >
              {getYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Ay Seçimi */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Ay
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              disabled={loading || deleting}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Getir Butonu */}
          <button
            onClick={handleFetchEvents}
            disabled={loading || deleting}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Yükleniyor..." : "Etkinlikleri Getir"}
          </button>
        </div>
      </div>

      {/* Etkinlikler Listesi */}
      {events.length > 0 && (
        <div className="space-y-3">
          {/* Tümünü Seç */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
            <input
              type="checkbox"
              id="select-all"
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected && !allSelected;
                }
              }}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              disabled={deleting}
              className="w-4 h-4 cursor-pointer disabled:opacity-50"
            />
            <label
              htmlFor="select-all"
              className="text-xs text-slate-300 font-medium cursor-pointer flex-1"
            >
              Tümünü Seç ({events.length} etkinlik)
            </label>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="w-10 text-left px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      disabled={deleting}
                      className="w-4 h-4 cursor-pointer disabled:opacity-50"
                    />
                  </th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">
                    Tarih/Saat
                  </th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">
                    Başlık
                  </th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">
                    Açıklama
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-700/50 hover:bg-slate-900/20 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedEventIds.has(event.id)}
                        onChange={() => toggleSelectEvent(event.id)}
                        disabled={deleting}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono text-xs">
                      {formatDateTime(event.start)}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-medium truncate max-w-xs">
                      {event.summary}
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-xs truncate max-w-xs">
                      {event.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Silme Butonu */}
          <div className="flex justify-end gap-2 pt-2">
            <div className="text-xs text-slate-400">
              {selectedEventIds.size > 0 && `${selectedEventIds.size} seçildi`}
            </div>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedEventIds.size === 0 || deleting}
              className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {deleting && <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {deleting
                ? "Siliniyor..."
                : `Seçili ${selectedEventIds.size} Etkinliği Sil`}
            </button>
          </div>
        </div>
      )}

      {/* Boş Durum */}
      {events.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">
            Etkinlikleri görmek için yukarıda yıl ve ay seçin, sonra "Getir" butonuna basın.
          </p>
        </div>
      )}
    </div>
  );
}
