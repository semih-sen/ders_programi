'use client';

import { useState } from 'react';
import { deleteEntry, updateEntry } from '../../actions';

interface JsonEditorTableProps {
  data: any[];
  filePath: string;
}

export default function JsonEditorTable({ data, filePath }: JsonEditorTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tablo başlıklarını dinamik olarak oluştur
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  // Düzenleme modalını aç
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Modalı kapat
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  // Silme işlemi
  const handleDelete = async (itemId: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteEntry(filePath, itemId);
      if (result.success) {
        alert(result.message);
        // Sayfa otomatik yenilenecek (revalidatePath sayesinde)
        window.location.reload();
      } else {
        alert(result.error || 'Silme işlemi başarısız oldu.');
      }
    } catch (error) {
      alert('Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Güncelleme işlemi
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const { id, ...updatedData } = formData;
      const result = await updateEntry(filePath, editingItem.id, updatedData);
      
      if (result.success) {
        alert(result.message);
        handleCloseModal();
        // Sayfa otomatik yenilenecek (revalidatePath sayesinde)
        window.location.reload();
      } else {
        alert(result.error || 'Güncelleme işlemi başarısız oldu.');
      }
    } catch (error) {
      alert('Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form input değişikliği
  const handleInputChange = (key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Dosya Boş
        </h3>
        <p className="text-slate-400">
          Bu dosyada henüz hiç kayıt yok.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Tablo */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-700"
                  >
                    {header}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-700">
                  Eylemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.map((item, index) => (
                <tr
                  key={item.id || index}
                  className="hover:bg-slate-900/30 transition-colors"
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate"
                      title={String(item[header])}
                    >
                      {String(item[header] || '-')}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Düzenleme Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Başlık */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Kaydı Düzenle</h2>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal İçerik */}
            <form onSubmit={handleUpdate} className="p-6">
              <div className="space-y-4">
                {headers.map((header) => (
                  <div key={header}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {header}
                      {header === 'id' && (
                        <span className="ml-2 text-xs text-slate-500">(düzenlenemez)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData[header] || ''}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                      disabled={header === 'id' || isSubmitting}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>

              {/* Modal Butonlar */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
