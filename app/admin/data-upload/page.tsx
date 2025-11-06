'use client';

import { useState } from 'react';

export default function DataUploadPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('2');
  const [selectedType, setSelectedType] = useState<string>('anatomy');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fileTypeOptions = [
    { value: 'anatomy', label: 'Anatomi Grup Listesi' },
    { value: 'practical', label: 'Uygulama (Pratik) Grup Listesi' },
    { value: 'amfi', label: 'Haftalık Amfi Programı' },
    { value: 'main-program', label: 'Ana Teorik Ders Programı' },
  ];

  const gradeOptions = [
    { value: '1', label: 'Dönem 1' },
    { value: '2', label: 'Dönem 2' },
    { value: '3', label: 'Dönem 3' },
    { value: '4', label: 'Dönem 4' },
    { value: '5', label: 'Dönem 5' },
    { value: '6', label: 'Dönem 6' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!file) {
      setMessage('⚠️ Lütfen bir JSON dosyası seçin.');
      return;
    }

    if (!selectedGrade || !selectedType) {
      setMessage('⚠️ Lütfen dönem ve dosya türünü seçin.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('grade', selectedGrade);
      formData.append('fileType', selectedType);

      const res = await fetch('/api/admin/upload-file', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        setMessage(`❌ ${data?.error || 'Yükleme sırasında bir hata oluştu.'}`);
      } else {
        setMessage(`✅ ${data?.message || 'Dosya başarıyla yüklendi!'}`);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">🚀 Jenerik Veri Yükleme Merkezi</h1>
          <p className="text-slate-400 text-sm">
            Tüm JSON dosyalarını dönem ve türe göre yükleyin. 
            Dosyalar otomatik olarak <code className="text-blue-400 bg-slate-900/50 px-1 py-0.5 rounded">private-data/donem-X/</code> klasörüne kaydedilir.
          </p>
        </section>

        {/* Upload Form */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grade Selection */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-white mb-2">
                📚 Dönem Seçin
              </label>
              <select
                id="grade"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Selection */}
            <div>
              <label htmlFor="fileType" className="block text-sm font-medium text-white mb-2">
                📁 Dosya Türü Seçin
              </label>
              <select
                id="fileType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fileTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-white mb-2">
                📄 JSON Dosyası Seçin
              </label>
              <input
                id="file"
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-300 
                  file:mr-4 file:py-2 file:px-4 
                  file:rounded-lg file:border-0 
                  file:text-sm file:font-semibold 
                  file:bg-blue-600 file:text-white 
                  hover:file:bg-blue-700 
                  file:cursor-pointer
                  cursor-pointer"
              />
              <p className="mt-2 text-xs text-slate-500">
                Seçilen dosya: <span className="text-blue-400">{file ? file.name : 'Henüz dosya seçilmedi'}</span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              {submitting ? '⏳ Yükleniyor...' : '🚀 Dosyayı Yükle'}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.startsWith('✅') 
                ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Dosya Yapısı Bilgisi</span>
          </h2>
          <div className="space-y-2 text-sm text-slate-400">
            <p>• Dosyalar <code className="text-blue-400 bg-slate-900/50 px-1 py-0.5 rounded">private-data/donem-{'{'}grade{'}'}/{'{'}type{'}'}.json</code> formatında kaydedilir.</p>
            <p>• Örnek: Dönem 2 için Anatomi → <code className="text-green-400 bg-slate-900/50 px-1 py-0.5 rounded">private-data/donem-2/anatomy.json</code></p>
            <p>• n8n bu dosyalara <code className="text-purple-400 bg-slate-900/50 px-1 py-0.5 rounded">/api/internal/get-data-file?grade=2&type=anatomy</code> üzerinden erişebilir.</p>
            <p>• Aynı dönem ve tür için yeni dosya yüklerseniz, eski dosya üzerine yazılır.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
