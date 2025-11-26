'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Users } from 'lucide-react';

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

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
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
          prefix: '+',
        };
      case 'EXPENSE':
        return {
          icon: ArrowUpRight,
          bgColor: 'bg-red-500/10',
          iconColor: 'text-red-500',
          amountColor: 'text-red-500',
          prefix: '-',
        };
      case 'TRANSFER':
        return {
          icon: ArrowRightLeft,
          bgColor: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          amountColor: 'text-blue-500',
          prefix: '',
        };
      case 'DISTRIBUTION':
        return {
          icon: Users,
          bgColor: 'bg-purple-500/10',
          iconColor: 'text-purple-500',
          amountColor: 'text-purple-500',
          prefix: '-',
        };
      default:
        return {
          icon: ArrowDownLeft,
          bgColor: 'bg-gray-500/10',
          iconColor: 'text-gray-500',
          amountColor: 'text-gray-500',
          prefix: '',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  // Başlık oluştur
  const getTitle = () => {
    if (transaction.type === 'INCOME') {
      return transaction.category || 'Gelir';
    }
    if (transaction.type === 'TRANSFER') {
      return `${transaction.account.name} → ${transaction.relatedAccount?.name || '?'}`;
    }
    if (transaction.type === 'EXPENSE') {
      return transaction.category || transaction.description || 'Gider';
    }
    if (transaction.type === 'DISTRIBUTION') {
      return 'Kâr Dağıtımı';
    }
    return transaction.category;
  };

  // Tarih formatla
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Tutar formatla
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Link 
      href={`/admin/finance/${transaction.id}`}
      className="block"
    >
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
        {/* Desktop Layout */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`${config.bgColor} ${config.iconColor} p-3 rounded-lg flex-shrink-0`}>
            <Icon size={24} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title & Status Badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-white truncate">
                {getTitle()}
              </h3>
              {isPending && (
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                  Bekliyor
                </span>
              )}
            </div>

            {/* Date */}
            <p className="text-sm text-slate-400 mb-2">
              {formatDate(transaction.date)}
            </p>

            {/* Extra Info */}
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              {/* Account Info */}
              {transaction.type !== 'TRANSFER' && (
                <span>Hesap: {transaction.account.name}</span>
              )}
              
              {/* User Info for License Sales */}
              {transaction.type === 'INCOME' && transaction.user && (
                <span className="text-blue-400">
                  👤 {transaction.user.name || transaction.user.email}
                </span>
              )}
              
              {/* Description */}
              {transaction.description && transaction.type !== 'TRANSFER' && (
                <span className="italic">{transaction.description}</span>
              )}
              
              {/* Transfer Note */}
              {transaction.type === 'TRANSFER' && transaction.description && (
                <span className="italic">{transaction.description}</span>
              )}
            </div>
          </div>

          {/* Amount - Right Side on Desktop, Below on Mobile */}
          <div className="flex-shrink-0">
            <div className={`text-xl md:text-2xl font-bold ${config.amountColor} text-right`}>
              {config.prefix}{formatAmount(transaction.amount)}
            </div>
          </div>
        </div>

        {/* Mobile Layout Adjustment - Amount below on very small screens */}
        <div className="sm:hidden mt-3 pt-3 border-t border-slate-700">
          <div className={`text-2xl font-bold ${config.amountColor} text-center`}>
            {config.prefix}{formatAmount(transaction.amount)}
          </div>
        </div>
      </div>
    </Link>
  );
}
