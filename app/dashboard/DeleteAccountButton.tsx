'use client';

import { useState } from 'react';
import { deleteAccount } from './actions';

export default function DeleteAccountButton() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAccount();

      if (result.success) {
        // Başarılı silme - çıkış sayfasına yönlendir
        window.location.href = '/api/auth/signout';
      } else {
        setError(result.error || 'Hesap silinirken bir hata oluştu.');
        setIsDeleting(false);
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmDialog(true)}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
      >
        🗑️ Hesabımı Sil
      </button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Hesabı Sil</h3>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Hesabınızı silmek üzeresiniz. Bu işlem geri alınamaz!
              </p>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-semibold text-sm mb-2">⚠️ Silinecek Veriler:</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Tüm hesap bilgileriniz</li>
                  <li>• Ders tercihleri ve ayarlarınız</li>
                  <li>• Google Takvim erişim izniniz (revoke edilecek)</li>
                  <li>• Kullanmış olduğunuz lisans anahtarı</li>
                </ul>
              </div>

              <p className="text-slate-400 text-sm mt-4">
                <strong className="text-white">Not:</strong> Google Takviminizdeki mevcut etkinlikler silinmeyecektir. 
                Bunları manuel olarak silebilirsiniz.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
