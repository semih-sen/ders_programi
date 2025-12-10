'use client';

import { useState } from 'react';
import { updateUserPreferences } from '../actions';

interface User {
  id: string;
  classYear: number | null;
  uygulamaGrubu: string | null;
  anatomiGrubu: string | null;
  yemekhaneEklensin: boolean;
  studentId: string | null;
}

interface Props {
  user: User;
}

const classYearOptions = [1, 2, 3, 4, 5, 6];
const uygulamaGrubuOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const anatomiGrubuOptions = ['Anatomi-1', 'Anatomi-2', 'Anatomi-3'];

export default function UserPreferencesForm({ user }: Props) {
  const [formState, setFormState] = useState({
    classYear: user.classYear ?? 1,
    uygulamaGrubu: user.uygulamaGrubu ?? '',
    anatomiGrubu: user.anatomiGrubu ?? '',
    yemekhaneEklensin: user.yemekhaneEklensin ?? false,
    studentId: user.studentId ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await updateUserPreferences(user.id, formData);
    if (res?.success) {
      setResult('✅ ' + res.success);
    } else {
      setResult('❌ ' + (res?.error || 'Bilinmeyen hata'));
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Kullanıcı Tercihleri / Kurulum Bilgileri</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dönem (Sınıf) */}
        <div>
          
          <label htmlFor="classYear" className="block text-sm font-medium text-slate-300 mb-1">Dönem (Sınıf)</label>
          <select
            id="classYear"
            name="classYear"
            value={formState.classYear}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none"
          >
            {classYearOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Uygulama Grubu */}
        <div>
          <label htmlFor="uygulamaGrubu" className="block text-sm font-medium text-slate-300 mb-1">Uygulama Grubu</label>
          <select
            id="uygulamaGrubu"
            name="uygulamaGrubu"
            value={formState.uygulamaGrubu}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none"
          >
            <option value="">Seçiniz</option>
            {uygulamaGrubuOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Anatomi Grubu */}
        <div>
          <label htmlFor="anatomiGrubu" className="block text-sm font-medium text-slate-300 mb-1">Anatomi Grubu</label>
          <select
            id="anatomiGrubu"
            name="anatomiGrubu"
            value={formState.anatomiGrubu}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none"
          >
            <option value="">Seçiniz</option>
            {anatomiGrubuOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Öğrenci Numarası */}
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-slate-300 mb-1">Öğrenci Numarası</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formState.studentId}
            onChange={handleChange}
            maxLength={10}
            placeholder="Örn: 0101241234"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none font-mono"
          />
          <p className="text-xs text-slate-400 mt-1">10 haneli öğrenci numarası (Sadece rakam)</p>
        </div>
        {/* Yemekhane */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="yemekhaneEklensin"
            name="yemekhaneEklensin"
            checked={formState.yemekhaneEklensin}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="yemekhaneEklensin" className="ml-2 block text-sm text-slate-300">
            Yemekhane listesi takvime eklensin
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
        </button>
        {result && (
          <div className="mt-2 text-sm text-center">
            {result}
          </div>
        )}
      </form>
    </div>
  );
}
