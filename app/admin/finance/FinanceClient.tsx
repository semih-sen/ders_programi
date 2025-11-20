 'use client';

import { useState, useEffect } from 'react';
import { addTransaction, updateTransaction, deleteTransaction, searchUsers, transferFunds, toggleTransactionStatus, getMonthlyBalanceSheet } from './actions';
import { useRouter } from 'next/navigation';

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
}

interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryBreakdown: Record<string, number>;
  transactions: Transaction[];
  accounts: { id: string; name: string; type: string; balance: number }[];
}

export default function FinancePage({ stats }: { stats: FinancialStats }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDistribution, setIsDistribution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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

  // Aylık rapor yükle
  useEffect(() => {
    if (showMonthlyReport) {
      loadMonthlyReport();
    }
  }, [showMonthlyReport, selectedYear]);

  const loadMonthlyReport = async () => {
    setIsLoading(true);
    try {
      const data = await getMonthlyBalanceSheet(selectedYear);
      setMonthlyData(data);
    } catch (error) {
      console.error('Aylık rapor yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              💰 Finans & Kasa Yönetimi
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Gelir ve gider takibi, vadeli işlemler, aylık raporlama
            </p>
          </div>
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
            <button
              onClick={() => setShowMonthlyReport(!showMonthlyReport)}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
            >
              📊 {showMonthlyReport ? 'Raporu Gizle' : 'Aylık Rapor'}
            </button>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Toplam Gelir */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-400 font-semibold">Toplam Gelir</h3>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-white">
            ₺{stats.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Toplam Gider */}
        <div className="bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-sm rounded-xl border border-red-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-400 font-semibold">Toplam Gider</h3>
            <span className="text-2xl">📉</span>
          </div>
          <p className="text-3xl font-bold text-white">
            ₺{stats.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Net Kasa */}
        <div className={`bg-gradient-to-br ${
          stats.netBalance >= 0 
            ? 'from-blue-500/20 to-cyan-600/20 border-blue-500/30' 
            : 'from-amber-500/20 to-yellow-600/20 border-amber-500/30'
        } backdrop-blur-sm rounded-xl border p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={stats.netBalance >= 0 ? 'text-blue-400' : 'text-amber-400'}>
              Net Kasa Durumu
            </h3>
            <span className="text-2xl">💼</span>
          </div>
          <p className="text-3xl font-bold text-white">
            ₺{stats.netBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Aylık Bilanço Raporu */}
      {showMonthlyReport && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden mb-8">
          <div className="p-4 sm:p-6 border-b border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">📊 Aylık Bilanço Raporu</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Tüm aylar için gelir, gider, borç ve alacak özeti
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300">Yıl:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-slate-400 mt-4">Yükleniyor...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Ay</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-green-400 uppercase">Gerçekleşen Gelir</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-red-400 uppercase">Gerçekleşen Gider</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-blue-400 uppercase">Net (Gelir-Gider)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-amber-400 uppercase">Bekleyen Alacak</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-orange-400 uppercase">Bekleyen Borç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {monthlyData.map((data) => {
                      const net = data.income - data.expense;
                      return (
                        <tr key={data.month} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            {data.monthName}
                          </td>
                          <td className="px-4 py-3 text-right text-green-400 font-semibold">
                            ₺{data.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-red-400 font-semibold">
                            ₺{data.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${net >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                            {net >= 0 ? '+' : ''}₺{net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400 font-semibold">
                            ₺{data.receivables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-400 font-semibold">
                            ₺{data.payables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-900/50 font-bold">
                      <td className="px-4 py-4 text-white">TOPLAM</td>
                      <td className="px-4 py-4 text-right text-green-400">
                        ₺{monthlyData.reduce((sum, d) => sum + d.income, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right text-red-400">
                        ₺{monthlyData.reduce((sum, d) => sum + d.expense, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right text-blue-400">
                        ₺{monthlyData.reduce((sum, d) => sum + (d.income - d.expense), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right text-amber-400">
                        ₺{monthlyData.reduce((sum, d) => sum + d.receivables, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right text-orange-400">
                        ₺{monthlyData.reduce((sum, d) => sum + d.payables, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* İşlem Geçmişi Tablosu */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">İşlem Geçmişi</h2>
          <p className="text-sm text-slate-400 mt-1">
            Toplam {stats.transactions.length} işlem
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tarih</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tür</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Durum</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Hesap</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Kategori</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Açıklama</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Kullanıcı</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Tutar</th>
                <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-slate-400 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {stats.transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-5xl mb-3">📊</span>
                      <p className="text-slate-400 text-lg font-medium">Henüz işlem kaydı yok</p>
                      <p className="text-slate-500 text-sm mt-1">İlk işleminizi ekleyerek başlayın</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stats.transactions.map((transaction) => {
                  const isPending = transaction.status === 'PENDING';
                  const rowClass = isPending ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-700/30';
                  
                  return (
                  <tr key={transaction.id} className={`${rowClass} transition-colors`}>
                    <td className="px-4 sm:px-6 py-3 text-sm text-slate-300">
                      {new Date(transaction.date).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {transaction.type === 'INCOME' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">📈 Gelir</span>
                      )}
                      {transaction.type === 'EXPENSE' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">📉 Gider</span>
                      )}
                      {transaction.type === 'DISTRIBUTION' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">🏷 Kâr Dağıtımı</span>
                      )}
                      {transaction.type === 'TRANSFER' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">↔ Virman</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {transaction.type === 'TRANSFER' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400">-</span>
                      ) : isPending ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">⏳ Bekliyor</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">✓ Tamamlandı</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-white font-medium">{transaction.account?.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-white font-medium">
                      {transaction.category}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-slate-300">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-slate-300">
                      {transaction.user ? (
                        <div>
                          <p className="font-medium text-white">{transaction.user.name}</p>
                          <p className="text-xs text-slate-400">{transaction.user.email}</p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={`px-4 sm:px-6 py-3 text-right text-base font-bold ${
                      transaction.type === 'INCOME' ? 'text-green-400' : transaction.type === 'EXPENSE' || transaction.type === 'DISTRIBUTION' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' || transaction.type === 'DISTRIBUTION' ? '-' : ''}
                      ₺{transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-center">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {transaction.type !== 'TRANSFER' && (
                          <button
                            onClick={() => handleToggleStatus(transaction.id)}
                            className={`px-3 py-1 rounded hover:opacity-80 text-xs font-semibold transition-colors ${
                              isPending ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}
                            title="Durumu Değiştir"
                          >
                            {isPending ? '✓ Tamamla' : '⏳ Beklet'}
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-xs font-semibold transition-colors"
                          title="Düzenle"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs font-semibold transition-colors"
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
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
                  {stats.accounts.map((acc) => (
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
                  {stats.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} — ₺{acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hedef Hesap *</label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option value="">Seçiniz...</option>
                  {stats.accounts.map((acc) => (
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
    </div>
  );
}
