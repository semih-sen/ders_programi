'use client';

import { useState } from 'react';
import { fetchAndSaveMonthlyMenu, listAvailableMenus, getMonthlyMenu } from './actions';

interface Menu {
  year: number;
  month: number;
  fileName: string;
}

interface DailyMeal {
  date: string;
  meal: string;
  category: string;
}

export default function DiningClient() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableMenus, setAvailableMenus] = useState<Menu[]>([]);
  const [viewingMenu, setViewingMenu] = useState<DailyMeal[] | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Yıl seçenekleri (son 2 yıl + gelecek 1 yıl)
  const years = Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() - 1 + i);
  
  // Ay isimleri
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Verileri çek
  const handleFetchData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await fetchAndSaveMonthlyMenu(selectedYear, selectedMonth);

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'İşlem başarılı!' });
        // Mevcut menüleri güncelle
        loadAvailableMenus();
      } else {
        setMessage({ type: 'error', text: result.error || 'Bir hata oluştu.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'İstek sırasında beklenmeyen bir hata oluştu.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Mevcut menüleri yükle
  const loadAvailableMenus = async () => {
    try {
      const result = await listAvailableMenus();
      if (result.success && result.menus) {
        setAvailableMenus(result.menus);
      }
    } catch (error) {
      console.error('Menüler yüklenirken hata:', error);
    }
  };

  // Menü görüntüle
  const handleViewMenu = async (year: number, month: number) => {
    try {
      const result = await getMonthlyMenu(year, month);
      if (result.success && result.data) {
        setViewingMenu(result.data);
        setShowMenuModal(true);
      } else {
        setMessage({ type: 'error', text: result.error || 'Menü yüklenemedi.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Menü görüntülenirken hata oluştu.' });
    }
  };

  // Sayfa yüklendiğinde mevcut menüleri çek
  useState(() => {
    loadAvailableMenus();
  });

  return (
    <>
      {/* Veri Çekme Formu */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          📥 Otomatik Veri Çekme
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Yıl Seçici */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Yıl
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Ay Seçici */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ay
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mesaj */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                : 'bg-red-500/20 border border-red-500/50 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Buton */}
        <button
          onClick={handleFetchData}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Yükleniyor... Lütfen bekleyin (Bu işlem 10-20 saniye sürebilir)
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Üniversiteden Verileri Çek ve Kaydet
            </>
          )}
        </button>

        <p className="text-slate-400 text-sm mt-3">
          ⚠️ Bu işlem seçilen ayın tüm günleri için üniversite API'sine istek atacaktır.
          İşlem tamamlanana kadar lütfen sayfayı kapatmayın.
        </p>
      </div>

      {/* Kaydedilmiş Menüler */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            📋 Kaydedilmiş Menüler
          </h2>
          <button
            onClick={loadAvailableMenus}
            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Yenile
          </button>
        </div>

        {availableMenus.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-slate-400">
              Henüz kaydedilmiş menü yok. Yukarıdaki formu kullanarak veri çekin.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableMenus.map((menu) => (
              <div
                key={`${menu.year}-${menu.month}`}
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {monthNames[menu.month - 1]} {menu.year}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {menu.fileName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewMenu(menu.year, menu.month)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Görüntüle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menü Görüntüleme Modal */}
      {showMenuModal && viewingMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">
                Aylık Menü ({viewingMenu.length} gün)
              </h3>
              <button
                onClick={() => setShowMenuModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 space-y-4">
              {viewingMenu.map((day) => (
                <div
                  key={day.date}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-blue-400 font-semibold">
                      {new Date(day.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                      })}
                    </span>
                  </div>
                  <div className="text-slate-300 whitespace-pre-line">
                    {day.meal}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-700 p-4">
              <button
                onClick={() => setShowMenuModal(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
