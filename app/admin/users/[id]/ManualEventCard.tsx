"use client";
import { useState, useTransition } from 'react';
import { sendManualEvent } from '../actions';

export default function ManualEventCard({ userId }: { userId: string }) {
  const [title, setTitle] = useState('⚠️ Sirkadiyen Deneme Süresi Uyarısı');
  const [description, setDescription] = useState('Deneme süreniz yakında sona eriyor. Lütfen aboneliğinizi yenileyin.');
  const [date, setDate] = useState<string>('');
  const [colorId, setColorId] = useState<'11' | '5' | '9'>('11');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col">
      <h3 className="text-base font-semibold text-white mb-2">Manuel Etkinlik Gönder</h3>
      <p className="text-xs text-slate-500 mb-4">Kullanıcının takvimine tek seferlik uyarı eklemek için formu doldur.</p>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!date) {
            setMessage('Lütfen tarih seçin');
            return;
          }
          startTransition(async () => {
            const res = await sendManualEvent(userId, { title, description, date, colorId });
            if ('error' in res) setMessage(res.error);
            else setMessage(res.success);
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Etkinlik Başlığı</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Başlık"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Mesaj / Açıklama</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            placeholder="Detaylı mesaj"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-slate-400 mb-1">Renk</label>
            <select
              value={colorId}
              onChange={e => setColorId(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="11">Kırmızı</option>
              <option value="5">Sarı</option>
              <option value="9">Mavi</option>
            </select>
          </div>
        </div>
        {message && (
          <div className={`text-xs rounded-md px-3 py-2 ${message.startsWith('Etkinlik') ? 'bg-green-600/20 text-green-300 border border-green-600/30' : 'bg-red-600/20 text-red-300 border border-red-600/30'}`}>{message}</div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        >
          {pending ? 'Gönderiliyor...' : 'Takvime Ekle'}
        </button>
      </form>
    </div>
  );
}
