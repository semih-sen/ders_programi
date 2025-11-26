'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Users, ArrowLeft, Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { deleteTransaction, toggleTransactionStatus } from '../actions';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DISTRIBUTION';
  status: 'COMPLETED' | 'PENDING';
  category: string;
  description: string | null;
  date: Date;
  createdAt: Date;
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    paymentStatus: string;
  } | null;
  account: {
    id: string;
    name: string;
    type: string;
    balance: number;
  };
  relatedAccountId?: string | null;
  relatedAccount?: {
    id: string;
    name: string;
    type: string;
    balance: number;
  } | null;
}

interface TransactionDetailClientProps {
  transaction: Transaction;
}

export default function TransactionDetailClient({ transaction }: TransactionDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isPending = transaction.status === 'PENDING';

  // Icon ve renk seçimi
  const getTypeConfig = () => {
    switch (transaction.type) {
      case 'INCOME':
        return {
          icon: ArrowDownLeft,
          bgColor: 'bg-green-500/10',
          iconColor: 'text-green-500',
          amountColor: 'text-green-500',
          borderColor: 'border-green-500/30',
          label: 'Gelir',
          prefix: '+',
        };
      case 'EXPENSE':
        return {
          icon: ArrowUpRight,
          bgColor: 'bg-red-500/10',
          iconColor: 'text-red-500',
          amountColor: 'text-red-500',
          borderColor: 'border-red-500/30',
          label: 'Gider',
          prefix: '-',
        };
      case 'TRANSFER':
        return {
          icon: ArrowRightLeft,
          bgColor: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          amountColor: 'text-blue-500',
          borderColor: 'border-blue-500/30',
          label: 'Transfer',
          prefix: '',
        };
      case 'DISTRIBUTION':
        return {
          icon: Users,
          bgColor: 'bg-purple-500/10',
          iconColor: 'text-purple-500',
          amountColor: 'text-purple-500',
          borderColor: 'border-purple-500/30',
          label: 'Kâr Dağıtımı',
          prefix: '-',
        };
      default:
        return {
          icon: ArrowDownLeft,
          bgColor: 'bg-gray-500/10',
          iconColor: 'text-gray-500',
          amountColor: 'text-gray-500',
          borderColor: 'border-gray-500/30',
          label: 'Diğer',
          prefix: '',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  // Tarih formatla
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Tutar formatla
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Silme işlemi
  const handleDelete = async () => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteTransaction(transaction.id);
    
    if (result.success) {
      router.push('/admin/finance');
      router.refresh();
    } else {
      alert(result.error || 'Silme işlemi başarısız oldu.');
      setIsDeleting(false);
    }
  };

  // Durum değiştirme
  const handleToggleStatus = async () => {
    if (!confirm(`Bu işlemin durumunu "${isPending ? 'Tamamlandı' : 'Bekliyor'}" olarak değiştirmek istediğinizden emin misiniz?`)) {
      return;
    }

    setIsToggling(true);
    const result = await toggleTransactionStatus(transaction.id);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Durum değiştirme başarısız oldu.');
    }
    setIsToggling(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/admin/finance"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>Finans Modülüne Dön</span>
      </Link>

      {/* Main Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        {/* Header with Icon and Amount */}
        <div className={`${config.bgColor} ${config.borderColor} border-b-2 p-6 sm:p-8`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`${config.bgColor} ${config.iconColor} p-4 rounded-xl border ${config.borderColor}`}>
                <Icon size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${config.iconColor} text-sm font-semibold uppercase`}>
                    {config.label}
                  </span>
                  {isPending && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                      Bekliyor
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {transaction.category}
                </h1>
              </div>
            </div>
            <div className={`text-right ${config.amountColor} text-3xl sm:text-4xl font-bold`}>
              {config.prefix}{formatAmount(transaction.amount)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">İşlem Tarihi</h3>
              <p className="text-white text-lg">
                {formatDate(transaction.date)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Kayıt Tarihi</h3>
              <p className="text-white text-lg">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>

          {/* Account Info */}
          {transaction.type !== 'TRANSFER' ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Hesap</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-white font-semibold text-lg">{transaction.account.name}</p>
                <p className="text-slate-400 text-sm mt-1">
                  Tür: {transaction.account.type} • Mevcut Bakiye: {formatAmount(transaction.account.balance)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Kaynak Hesap</h3>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-white font-semibold">{transaction.account.name}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {formatAmount(transaction.account.balance)}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Hedef Hesap</h3>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-white font-semibold">{transaction.relatedAccount?.name || 'Bilinmiyor'}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {transaction.relatedAccount ? formatAmount(transaction.relatedAccount.balance) : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Info (if exists) */}
          {transaction.user && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">İlgili Kullanıcı</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-white font-semibold text-lg">{transaction.user.name || 'İsimsiz'}</p>
                <p className="text-slate-400 text-sm mt-1">{transaction.user.email}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Ödeme Durumu: 
                  <span className={`ml-2 px-2 py-1 rounded ${
                    transaction.user.paymentStatus === 'PAID' 
                      ? 'bg-green-500/20 text-green-400' 
                      : transaction.user.paymentStatus === 'FREE'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {transaction.user.paymentStatus}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {transaction.description && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Açıklama</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-white">{transaction.description}</p>
              </div>
            </div>
          )}

          {/* Status Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Durum</h3>
            <div className={`rounded-lg p-4 ${
              isPending ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {isPending ? (
                  <>
                    <ToggleLeft className="text-amber-400" size={24} />
                    <div>
                      <p className="text-amber-400 font-semibold">Bekliyor</p>
                      <p className="text-amber-300/70 text-sm">Bu işlem henüz kasa bakiyesini etkilemiyor</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ToggleRight className="text-emerald-400" size={24} />
                    <div>
                      <p className="text-emerald-400 font-semibold">Tamamlandı</p>
                      <p className="text-emerald-300/70 text-sm">Bu işlem kasa bakiyesine yansıtıldı</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 sm:p-8 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
          {/* Toggle Status (only for non-transfer transactions) */}
          {transaction.type !== 'TRANSFER' && (
            <button
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isPending
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isPending ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {isToggling 
                ? 'İşleniyor...' 
                : isPending 
                  ? 'Tamamlandı Olarak İşaretle' 
                  : 'Bekliyor Olarak İşaretle'
              }
            </button>
          )}

          {/* Edit Button - Placeholder for future modal */}
          <button
            onClick={() => alert('Düzenleme özelliği yakında eklenecek!')}
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Edit size={20} />
            Düzenle
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            {isDeleting ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="mt-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
        <p className="text-sm text-slate-400">
          <span className="font-semibold">İşlem ID:</span> {transaction.id}
        </p>
      </div>
    </div>
  );
}
