'use client';

import React, { useState } from 'react';

export default function AnatomiUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!file) {
      setMessage('Lütfen bir .json dosyası seçin.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload-anatomi', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Yükleme sırasında bir hata oluştu.');
      } else {
        setMessage(data?.message || 'Yükleme başarılı.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
  <h1 className="text-2xl font-bold text-white mb-2">Anatomi JSON Yükleme</h1>
  <p className="text-slate-400 text-sm mb-6">.json dosyanızı yükleyin. Dosya, 4'lü gruplar halinde düz bir dizi olmalıdır: ["summary", "group", "date", "timeRange", ...]</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />

          <button
            type="submit"
            disabled={submitting || !file}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
          >
            {submitting ? 'Yükleniyor…' : 'Yükle'}
          </button>
        </form>

        {message && (
          <div className="mt-4 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
