"use client";
import { useMemo, useState, useTransition } from 'react';
import { banUsersBulk } from './actions';

type PaymentStatus = 'UNPAID' | 'PAID' | 'FREE';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  paymentStatus: PaymentStatus;
  isActivated: boolean;
  createdAt: string | Date;
  classYear?: number | null;
};

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'gray' | 'red' | 'yellow' }) {
  const map = {
    green: 'bg-green-600/20 text-green-300 border-green-600/30',
    gray: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
    red: 'bg-red-600/20 text-red-300 border-red-600/30',
    yellow: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
  } as const;
  return <span className={`text-xs border px-2 py-1 rounded ${map[color]}`}>{children}</span>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Client({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState('Ödeme yapılmadığı için erişim kısıtlandı.');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const s = `${u.name || ''} ${u.email || ''}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [users, q]);

  const activeUnpaidIds = useMemo(
    () => filtered.filter((u) => u.paymentStatus === 'UNPAID' && u.isActivated).map((u) => u.id),
    [filtered]
  );

  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map((u) => u.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  }

  function togglePreset(checked: boolean) {
    if (checked) {
      setSelected((prev) => [...new Set([...prev, ...activeUnpaidIds])]);
    } else {
      setSelected((prev) => prev.filter((id) => !activeUnpaidIds.includes(id)));
    }
  }

  async function onBan() {
    const trimmedReason = reason.trim();
    if (!trimmedReason || selected.length === 0) {
      setMessage('Ban sebebi ve en az bir kullanıcı seçimi zorunludur.');
      return;
    }

    startTransition(async () => {
      const res = await banUsersBulk(selected, trimmedReason);

      if ('error' in res && res.error) {
        setMessage(res.error);
        return;
      }

      setMessage(`Banlandı: ${res.successCount}${res.skippedCount ? `, zaten banlı: ${res.skippedCount}` : ''}`);
      setSelected([]);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700 rounded-xl">
        <div className="p-4 flex items-center gap-3 border-b border-slate-700">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim veya email ile ara"
            className="flex-1 px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white"
          />
          <label className="text-xs text-slate-400 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.length === filtered.length && filtered.length > 0}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            Tümünü Seç
          </label>
          <label className="text-xs text-slate-400 flex items-center gap-2">
            <input type="checkbox" onChange={(e) => togglePreset(e.target.checked)} />
            Aktif & Ödeme Yapmamışları Seç
          </label>
        </div>
        <div className="divide-y divide-slate-700">
          {filtered.map((u) => (
            <div key={u.id} className="p-4 flex items-center gap-4">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={(e) => toggleOne(u.id, e.target.checked)} />
              <div className="flex-1">
                <div className="text-sm text-white">{u.name || 'İsimsiz'}</div>
                <div className="text-xs text-slate-400">{u.email}</div>
              </div>
              <div className="w-24 text-center">
                {u.paymentStatus === 'PAID' && <Badge color="green">PRO</Badge>}
                {u.paymentStatus === 'FREE' && <Badge color="gray">FREE</Badge>}
                {u.paymentStatus === 'UNPAID' && <Badge color="red">UNPAID</Badge>}
              </div>
              <div className="w-24 text-center">
                {u.isActivated ? <Badge color="green">Aktif</Badge> : <Badge color="yellow">Pasif</Badge>}
              </div>
              <div className="w-28 text-xs text-slate-400 text-right">{formatDate(new Date(u.createdAt))}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-6 text-sm text-slate-400">Sonuç yok</div>}
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-base font-semibold text-white">Ban Formu</h3>
        <p className="text-xs text-slate-400">Ban sebebi tüm seçili kullanıcılara aynı şekilde uygulanır.</p>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Ban Sebebi</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white resize-none"
            placeholder="Örn: Ödeme yapılmadığı için erişim durduruldu."
          />
        </div>
        {message && <div className="text-xs text-slate-300 bg-slate-700/60 border border-slate-600 rounded-md px-3 py-2">{message}</div>}
        <button
          onClick={onBan}
          disabled={loading || selected.length === 0}
          className="w-full px-4 py-2 text-sm font-semibold rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white"
        >
          {loading ? 'Banlanıyor...' : `Seçili ${selected.length} Kullanıcıyı Banla`}
        </button>
      </div>
    </div>
  );
}
