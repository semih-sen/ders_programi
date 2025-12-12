"use client";
import { useEffect, useMemo, useState, useTransition } from 'react';
import { sendBulkCalendarEvent } from './actions';

type PaymentStatus = 'UNPAID' | 'PAID' | 'FREE';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  paymentStatus: PaymentStatus;
  isActivated: boolean;
  createdAt: string | Date;
  hasCalendar: boolean;
};

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'gray' | 'red' }) {
  const map = {
    green: 'bg-green-600/20 text-green-300 border-green-600/30',
    gray: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
    red: 'bg-red-600/20 text-red-300 border-red-600/30',
  } as const;
  return <span className={`text-xs border px-2 py-1 rounded ${map[color]}`}>{children}</span>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toIstanbulOffset(dtLocal: string) {
  // Convert 'YYYY-MM-DDTHH:mm' to RFC3339 with +03:00 offset (Istanbul permanent UTC+3)
  if (!dtLocal) return '';
  return `${dtLocal}:00+03:00`;
}

export default function Client({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('Deneme Süreniz Bitiyor!');
  const [description, setDescription] = useState('Aboneliğinizi yenileyin.');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, startTransition] = useTransition();

  // Varsayılan bitiş: başlangıçtan +1 saat
  useEffect(() => {
    if (!start || end) return;
    try {
      const startIso = toIstanbulOffset(start);
      const d = new Date(startIso);
      const d2 = new Date(d.getTime() + 60 * 60 * 1000);
      // Back to datetime-local string in local fields (YYYY-MM-DDTHH:mm)
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = d2.getUTCFullYear();
      const m = pad(d2.getUTCMonth() + 1);
      const day = pad(d2.getUTCDate());
      const hh = pad(d2.getUTCHours());
      const mm = pad(d2.getUTCMinutes());
      setEnd(`${y}-${m}-${day}T${hh}:${mm}`);
    } catch {}
  }, [start]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const s = `${u.name || ''} ${u.email || ''}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [users, q]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map(u => u.id) : []);
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected(prev => (checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id)));
  }

  async function onSend() {
    if (!title || !start || !end || selected.length === 0) return;
    const startIso = toIstanbulOffset(start);
    const endIso = toIstanbulOffset(end);
    startTransition(async () => {
      const res = await sendBulkCalendarEvent(selected, { title, description, start: startIso, end: endIso });
      alert(`Gönderim: Başarılı ${res.successCount}, Hata ${res.errorCount}`);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700 rounded-xl">
        <div className="p-4 flex items-center gap-3 border-b border-slate-700">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="İsim veya email ile ara"
            className="flex-1 px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
          />
          <label className="text-xs text-slate-400 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.length === filtered.length && filtered.length > 0}
              onChange={e => toggleAll(e.target.checked)}
            />
            Tümünü Seç
          </label>
        </div>
        <div className="divide-y divide-slate-700">
          {filtered.map(u => (
            <div key={u.id} className="p-4 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={e => toggleOne(u.id, e.target.checked)}
              />
              <div className="flex-1">
                <div className="text-sm text-white">{u.name}</div>
                <div className="text-xs text-slate-400">{u.email}</div>
              </div>
              <div className="w-24 text-center">
                {u.paymentStatus === 'PAID' && <Badge color="green">PRO</Badge>}
                {u.paymentStatus === 'FREE' && <Badge color="gray">FREE</Badge>}
                {u.paymentStatus === 'UNPAID' && <Badge color="red">UNPAID</Badge>}
              </div>
              <div className="w-24 text-center">
                {u.isActivated ? <Badge color="green">Onaylı</Badge> : <Badge color="red">Onaysız</Badge>}
              </div>
              <div className="w-24 text-center">
                {u.hasCalendar ? <Badge color="green">Bağlı</Badge> : <Badge color="red">Yok</Badge>}
              </div>
              <div className="w-32 text-xs text-slate-400">{formatDate(new Date(u.createdAt))}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-sm text-slate-400">Sonuç yok</div>
          )}
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-base font-semibold text-white">Etkinlik Formu</h3>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Başlık</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Açıklama</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Başlangıç</label>
            <input
              type="datetime-local"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Bitiş</label>
            <input
              type="datetime-local"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
            />
          </div>
        </div>
        <button
          onClick={onSend}
          disabled={loading || selected.length === 0}
          className="w-full px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white"
        >
          {loading ? 'Gönderiliyor...' : `Seçili ${selected.length} Kullanıcıya Gönder`}
        </button>
      </div>
    </div>
  );
}
