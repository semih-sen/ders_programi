'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

interface BulkJsonImportProps {
  onImport: (data: any[]) => void;
  sampleStructure?: Record<string, any>;
}

// Varsayılan placeholder JSON şeması
const DEFAULT_PLACEHOLDER = `[
  {
    "tarih": "08-09-2025",
    "grup": "A",
    "dilim": "KAN LENFOİD 1",
    "ders": "Fizyoloji",
    "yer": "Fizyoloji Pratik Salonu",
    "bilgi": "Konu başlıkları ve detaylar buraya...",
    "baslangic": "08:30",
    "bitis": "10:20"
  }
]`;

export default function BulkJsonImport({ onImport, sampleStructure }: BulkJsonImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Örnek veri yapısını oluştur (ID olmadan)
  const generateSampleJson = () => {
    if (!sampleStructure) return DEFAULT_PLACEHOLDER;
    
    const sample = { ...sampleStructure };
    delete sample.id; // ID'yi örnekten çıkar
    
    return JSON.stringify([sample, sample], null, 2);
  };

  // Modalı aç
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setJsonInput('');
    setError(null);
  };

  // Modalı kapat
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setJsonInput('');
    setError(null);
  };

  // JSON validasyonu ve import işlemi
  const handleValidateAndImport = () => {
    setIsValidating(true);
    setError(null);

    try {
      // Boş input kontrolü
      if (!jsonInput.trim()) {
        throw new Error('Lütfen JSON verisi giriniz.');
      }

      // JSON parse
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseError) {
        throw new Error('Geçersiz JSON formatı. Lütfen JSON yapısını kontrol edin.');
      }

      // Array kontrolü - tek objeyse array'e çevir
      if (!Array.isArray(parsedData)) {
        if (typeof parsedData === 'object' && parsedData !== null) {
          parsedData = [parsedData];
        } else {
          throw new Error('JSON verisi bir obje veya obje dizisi olmalıdır.');
        }
      }

      // Boş array kontrolü
      if (parsedData.length === 0) {
        throw new Error('JSON dizisi en az bir öğe içermelidir.');
      }

      // Her öğenin obje olduğunu kontrol et
      const invalidItems = parsedData.filter((item: any) => typeof item !== 'object' || item === null);
      if (invalidItems.length > 0) {
        throw new Error('JSON dizisindeki tüm öğeler obje olmalıdır.');
      }

      // Otomatik UUID ataması - her objeye benzersiz ID ekle
      const dataWithIds = parsedData.map((item: any) => {
        // Eğer id varsa çıkar, yenisi atanacak
        const { id, ...itemWithoutId } = item;
        return {
          ...itemWithoutId,
          id: crypto.randomUUID(), // Otomatik UUID oluştur
        };
      });

      // Başarılı - import işlemini tetikle (UUID'li data ile)
      onImport(dataWithIds);
      
      // Modal'ı kapat
      handleCloseModal();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <>
      {/* Toplu JSON Ekle Butonu */}
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Toplu JSON Ekle
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Başlık */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Toplu Veri Ekleme (JSON Import)</h2>
                <p className="text-sm text-slate-400">
                  Ham JSON verisi yapıştırarak mevcut listeye toplu kayıt ekleyin
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isValidating}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal İçerik */}
            <div className="p-6">
              {/* Örnek Yapı */}
              {sampleStructure && (
                <div className="mb-4 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 mb-1">
                        📋 Örnek Veri Yapısı
                      </h3>
                      <p className="text-xs text-slate-500">
                        Aşağıdaki formatta JSON verisi girin (id alanı otomatik oluşturulur)
                      </p>
                    </div>
                    <button
                      onClick={() => setJsonInput(generateSampleJson())}
                      className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    >
                      Örneği Kopyala
                    </button>
                  </div>
                  <pre className="text-xs text-slate-400 overflow-x-auto">
                    {generateSampleJson()}
                  </pre>
                </div>
              )}

              {/* JSON Input - Code Editor */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  JSON Verisi
                  <span className="text-slate-500 font-normal ml-2">(Array veya tek obje - ID otomatik atanır)</span>
                </label>
                <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                  <Editor
                    value={jsonInput}
                    onValueChange={(code) => {
                      setJsonInput(code);
                      setError(null);
                    }}
                    highlight={(code) => {
                      try {
                        return Prism.highlight(code, Prism.languages.json, 'json');
                      } catch {
                        return code;
                      }
                    }}
                    disabled={isValidating}
                    placeholder={DEFAULT_PLACEHOLDER}
                    padding={16}
                    style={{
                      fontFamily: '"Fira Code", "Fira Mono", monospace',
                      fontSize: 13,
                      minHeight: '320px',
                      maxHeight: '500px',
                      overflowY: 'auto',
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      caretColor: '#a78bfa',
                      lineHeight: '1.6',
                    }}
                    textareaClassName="focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  💡 Syntax highlighting aktif • ID alanlarını yazmayın, otomatik oluşturulur
                </p>
              </div>

              {/* Hata Mesajı */}
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-1">Validasyon Hatası</h4>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Bilgi Notu */}
              <div className="mb-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-300">
                    <strong className="font-semibold">Kullanım Notları:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-blue-300/90">
                      <li><strong>ID otomatik:</strong> Her kayda benzersiz UUID atanır, id alanı eklemeyin</li>
                      <li><strong>Format:</strong> Tek obje veya obje dizisi [&#123;...&#125;] girebilirsiniz</li>
                      <li><strong>Ekleme modu:</strong> Veriler mevcut listeye eklenir (üzerine yazmaz)</li>
                      <li><strong>Validation:</strong> JSON syntax hataları otomatik tespit edilir</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Modal Butonlar */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isValidating}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleValidateAndImport}
                  disabled={isValidating || !jsonInput.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isValidating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Doğrula ve Ekle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
