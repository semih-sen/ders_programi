'use client';

import { banUser, unbanUser, deleteUser, toggleUserRole, updatePaymentStatus } from './actions';
import { useTransition, useState } from 'react';

export function BanButton({ userId, isBanned, currentBanReason }: { userId: string; isBanned: boolean; currentBanReason?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Eğer kullanıcı banlıysa, direkt unban butonu göster
  if (isBanned) {
    return (
      <button
        onClick={() => startTransition(async () => {
          await unbanUser(userId);
        })}
        disabled={isPending}
        className="px-2 sm:px-3 py-1 rounded text-xs font-semibold transition-colors bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
        title={currentBanReason || 'Banlı'}
      >
        {isPending ? '...' : 'Banı Kaldır'}
      </button>
    );
  }

  // Kullanıcı banlı değilse, modal açan banla butonu göster
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        className="px-2 sm:px-3 py-1 rounded text-xs font-semibold transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
      >
        Banla
      </button>

      {/* Ban Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Başlık */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Kullanıcıyı Banla</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal İçerik */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!banReason.trim()) {
                  alert('Lütfen ban sebebi girin');
                  return;
                }
                startTransition(async () => {
                  const formData = new FormData();
                  formData.append('userId', userId);
                  formData.append('banReason', banReason);
                  await banUser(formData);
                  setIsModalOpen(false);
                  setBanReason('');
                });
              }}
              className="p-6"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ban Sebebi <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Kullanıcının neden banlandığını açıklayın..."
                  required
                  disabled={isPending}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 resize-none"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Bu mesaj kullanıcıya gösterilecektir.
                </p>
              </div>

              {/* Modal Butonlar */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setBanReason('');
                  }}
                  disabled={isPending}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !banReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Banlanıyor...
                    </>
                  ) : (
                    'Banla'
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

export function RoleButton({ userId, currentRole }: { userId: string; currentRole: 'ADMIN' | 'USER' }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button
      onClick={() => startTransition(async () => {
        await toggleUserRole(userId, currentRole);
      })}
      disabled={isPending}
      className="px-2 sm:px-3 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : (currentRole === 'ADMIN' ? 'USER Yap' : 'ADMIN Yap')}
    </button>
  );
}

export function DeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button
      onClick={() => {
        if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
          startTransition(async () => {
            await deleteUser(userId);
          });
        }
      }}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 p-1"
      title="Kullanıcıyı Sil"
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

export function PaymentStatusButton({ userId, currentStatus }: { userId: string; currentStatus: 'UNPAID' | 'PAID' | 'FREE' }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const statusOptions = [
    { value: 'UNPAID', label: '⏳ Ödenmedi', color: 'slate' },
    { value: 'PAID', label: '✓ Ödendi', color: 'green' },
    { value: 'FREE', label: '🎁 Ücretsiz', color: 'blue' },
  ];

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        className="px-2 sm:px-3 py-1 rounded text-xs font-semibold transition-colors bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50"
      >
        Ödeme Durumu
      </button>

      {/* Payment Status Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Başlık */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Ödeme Durumunu Değiştir</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal İçerik */}
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">
                Mevcut durum: <span className={`font-semibold ${
                  currentStatus === 'PAID' ? 'text-green-400' : currentStatus === 'FREE' ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {statusOptions.find(opt => opt.value === currentStatus)?.label}
                </span>
              </p>

              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (option.value !== currentStatus) {
                        startTransition(async () => {
                          await updatePaymentStatus(userId, option.value as 'UNPAID' | 'PAID' | 'FREE');
                          setIsModalOpen(false);
                        });
                      }
                    }}
                    disabled={isPending || option.value === currentStatus}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 ${
                      option.value === currentStatus
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : option.color === 'green'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : option.color === 'blue'
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* İptal Butonu */}
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
