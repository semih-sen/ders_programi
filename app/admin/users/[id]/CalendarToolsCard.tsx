"use client";
import { useState, useTransition } from 'react';
import { fetchUserCalendarEvents, wipeUserCalendar } from '../actions';

export default function CalendarToolsCard({ userId }: { userId: string }) {
  const [log, setLog] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col md:col-span-2">
      <h3 className="text-base font-semibold text-white mb-2">Takvim Araçları</h3>
      <p className="text-xs text-slate-500 mb-4">Belirli ay için Sirkadiyen etkinlikleri getir veya tümünü sil.</p>
      <form
        onSubmit={e => {
          e.preventDefault();
          startTransition(async () => {
            const res = await fetchUserCalendarEvents(userId, month, year);
            if ('error' in res) {
              setStatus(res.error);
              setLog([]);
            } else {
              setStatus(`${res.count} etkinlik bulundu.`);
              setLog(res.events);
            }
          });
        }}
        className="flex flex-wrap gap-3 items-end mb-4"
      >
        <div>
          <label className="block text-xs text-slate-400 mb-1">Ay</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={e => setMonth(parseInt(e.target.value) || 1)}
            className="w-24 px-2 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Yıl</label>
          <input
            type="number"
            value={year}
            onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-28 px-2 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
        >{pending ? 'Getiriliyor...' : 'Logları Getir'}</button>
        <button
          type="button"
          onClick={() => startTransition(async () => { const res = await wipeUserCalendar(userId); setStatus(res.error || res.message || 'Tamamlandı'); })}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 hover:bg-red-500 text-white"
        >Takvimi Temizle</button>
      </form>
      {status && <div className="text-xs mb-3 text-slate-400">{status}</div>}
      <div className="max-h-48 overflow-auto space-y-2 text-xs">
        {log.map(ev => (
          <div key={ev.id} className="border border-slate-700 rounded p-2 bg-slate-900/40">
            <div className="font-medium text-white truncate" title={ev.summary}>{ev.summary}</div>
            <div className="text-slate-400 truncate" title={ev.description}>{ev.description}</div>
            <div className="text-slate-500">{ev.start} → {ev.end}</div>
          </div>
        ))}
        {log.length === 0 && <div className="text-slate-500">Gösterilecek etkinlik yok.</div>}
      </div>
    </div>
  );
}
