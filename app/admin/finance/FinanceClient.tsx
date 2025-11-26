'use client';

import { useState, useEffect } from 'react';
import { addTransaction, updateTransaction, deleteTransaction, searchUsers, transferFunds, toggleTransactionStatus } from './actions';
import { useRouter } from 'next/navigation';
import TransactionCard from '@/app/components/finance/TransactionCard';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DISTRIBUTION';
  status: 'COMPLETED' | 'PENDING';
  category: string;
  description: string | null;
  date: Date;
  userId: string | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  account: {
    id: string;
    name: string;
    type: string;
  };
  relatedAccountId?: string | null;
  relatedAccount?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface FinanceClientProps {
  transactions: Transaction[];
  accounts: { id: string; name: string; type: string; balance: number }[];
  periodLabel: string;
}

export default function FinanceClient({ transactions, accounts, periodLabel }: FinanceClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDistribution, setIsDistribution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionStatus, setTransactionStatus] = useState<'COMPLETED' | 'PENDING'>('COMPLETED');
  // Transfer state
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Kullanıcı arama
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (userSearchQuery.length >= 2) {
        const results = await searchUsers(userSearchQuery);
        setSearchResults(results);
        setShowUserDropdown(true);
      } else {
        setSearchResults([]);
        setShowUserDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [userSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let result;
    if (editingTransaction) {
      // Güncelleme
      result = await updateTransaction(editingTransaction.id, {
        amount: parseFloat(amount),
        type: isDistribution ? 'DISTRIBUTION' : type,
        category,
        description: description || undefined,
        accountId,
        userId: selectedUserId || undefined,
        date: transactionDate,
        status: transactionStatus,
      });
    } else {
      // Yeni ekleme
      result = await addTransaction({
        amount: parseFloat(amount),
        type: isDistribution ? 'DISTRIBUTION' : type,
        category,
        description: description || undefined,
        accountId,
        userId: selectedUserId || undefined,
        date: transactionDate,
        status: transactionStatus,
      });
    }

    setIsLoading(false);

    if (result.success) {
      setIsModalOpen(false);
      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setAccountId('');
      setSelectedUserId('');
      setUserSearchQuery('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setTransactionStatus('COMPLETED');
      setIsDistribution(false);
      setEditingTransaction(null);
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAmount(transaction.amount.toString());
    setType(transaction.type === 'DISTRIBUTION' ? 'EXPENSE' : transaction.type as 'INCOME' | 'EXPENSE');
    setIsDistribution(transaction.type === 'DISTRIBUTION');
    setCategory(transaction.category);
    setDescription(transaction.description || '');
    setAccountId(transaction.account.id);
    setSelectedUserId(transaction.userId || '');
    setTransactionDate(new Date(transaction.date).toISOString().split('T')[0]);
    setTransactionStatus(transaction.status);
    if (transaction.user) {
      setUserSearchQuery(transaction.user.name || transaction.user.email || '');
    }
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Bu işlemin durumunu değiştirmek istediğinizden emin misiniz?')) {
      return;
    }
    setIsLoading(true);
    const result = await toggleTransactionStatus(id);
    setIsLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return;
    }

    const result = await deleteTransaction(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const selectUser = (user: any) => {
    setSelectedUserId(user.id);
    setUserSearchQuery(`${user.name || user.email}`);
    setShowUserDropdown(false);
  };

  const clearUser = () => {
    setSelectedUserId('');
    setUserSearchQuery('');
  };

  // Kategori önerileri
  const categoryOptions = (isDistribution ? 'DISTRIBUTION' : type) === 'INCOME' 
    ? ['Lisans Satışı', 'Bağış', 'Sponsorluk', 'Diğer']
    : isDistribution
    ? ['Kâr Payı']
    : ['Sunucu Kirası', 'Domain', 'Teknik Altyapı', 'Hayır İşi', 'Diğer'];

  return (
    <>
      {/* Aksiyon Butonları */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => { setIsDistribution(false); setType('INCOME'); setIsModalOpen(true); }}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            + Yeni İşlem Ekle
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg"
          >
            ↔ Virman / Transfer Yap
          </button>
          <button
            onClick={() => { setIsDistribution(true); setType('EXPENSE'); setCategory('Kâr Payı'); setIsModalOpen(true); }}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg"
          >
            ⬇ Kâr Dağıtımı
          </button>
        </div>
      </div>

      {/* İşlem Geçmişi - Kart Görünümü */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">İşlem Geçmişi - {periodLabel}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Dönem içinde {transactions.length} işlem
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">📊</span>
            <p className="text-slate-400 text-lg font-medium">Bu dönemde işlem kaydı yok</p>
            <p className="text-slate-500 text-sm mt-1">Yeni işlem ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>

      {/* Modal - Yeni İşlem Ekle */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingTransaction 
                  ? '✏️ İşlemi Düzenle' 
                  : isDistribution 
                    ? 'Kâr Dağıtımı Ekle' 
                    : 'Yeni İşlem Ekle'
                }
              </h2>
              <button
                onClick={() => { 
                  setIsModalOpen(false); 
                  setEditingTransaction(null); 
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tür */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  İşlem Türü *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsDistribution(false); setType('INCOME'); setCategory(''); }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      type === 'INCOME'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    📈 Gelir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsDistribution(false); setType('EXPENSE'); setCategory(''); }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      type === 'EXPENSE'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    📉 Gider
                  </button>
                </div>
                <div className="mt-3">
                  <button type="button" onClick={() => { setIsDistribution(true); setType('EXPENSE'); setCategory('Kâr Payı'); }} className={`px-3 py-1 rounded text-xs font-semibold ${isDistribution ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    Kâr Dağıtımı
                  </button>
                </div>
              </div>

              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  İşlem Tarihi *
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tutar */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Durum */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  İşlem Durumu *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTransactionStatus('COMPLETED')}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      transactionStatus === 'COMPLETED'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    ✓ Tamamlandı
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionStatus('PENDING')}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      transactionStatus === 'PENDING'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    ⏳ Bekliyor
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {transactionStatus === 'COMPLETED' 
                    ? '✓ Kasa bakiyesini etkiler (Ödendi/Tahsil Edildi)'
                    : '⏳ Kasa bakiyesini etkilemez (Borç/Alacak)'}
                </p>
              </div>

              {/* Hesap */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hangi Hesap? *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seçiniz...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) — ₺{acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seçiniz...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="veya özel kategori yazın"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="İşlem hakkında detaylar..."
                />
              </div>

              {/* Kullanıcı Seçimi (Sadece Gelir için) */}
              {type === 'INCOME' && !isDistribution && (
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    İlgili Kullanıcı (Opsiyonel)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Kullanıcı ara (isim veya e-posta)..."
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!selectedUserId}
                    />
                    {selectedUserId && (
                      <button
                        type="button"
                        onClick={clearUser}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                  {showUserDropdown && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-0"
                        >
                          <p className="text-white font-medium">{user.name || 'İsimsiz'}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { 
                    setIsModalOpen(false); 
                    setEditingTransaction(null); 
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
                  disabled={isLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (editingTransaction ? 'Güncelleniyor...' : 'Ekleniyor...') 
                    : (editingTransaction ? '💾 Güncelle' : '➕ Kaydet')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Transfer */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">Virman / Transfer Yap</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                const res = await transferFunds({
                  fromAccountId,
                  toAccountId,
                  amount: parseFloat(transferAmount),
                  description: transferDescription || undefined,
                });
                setIsLoading(false);
                if (res.success) {
                  setIsTransferModalOpen(false);
                  setFromAccountId('');
                  setToAccountId('');
                  setTransferAmount('');
                  setTransferDescription('');
                  router.refresh();
                } else {
                  alert(res.error);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kaynak Hesap *</label>
                <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option value="">Seçiniz...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} — ₺{acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hedef Hesap *</label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option value="">Seçiniz...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} — ₺{acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tutar (₺) *</label>
                <input type="number" min="0" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama (Opsiyonel)</label>
                <input type="text" value={transferDescription} onChange={(e) => setTransferDescription(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors" disabled={isLoading}>İptal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50" disabled={isLoading}>{isLoading ? 'Aktarılıyor...' : 'Transfer Et'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
