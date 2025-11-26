import { getTransactionById } from '../actions';
import TransactionDetailClient from './TransactionDetailClient';
import { notFound } from 'next/navigation';

interface TransactionDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'İşlem Detayı',
};

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  try {
    const transaction = await getTransactionById(params.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <TransactionDetailClient transaction={transaction} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching transaction:', error);
    notFound();
  }
}
