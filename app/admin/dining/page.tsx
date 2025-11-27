import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DiningClient from './DiningClient';

export const metadata = {
  title: 'Admin - Yemekhane Menüleri',
  description: 'Üniversite yemekhane menülerini yönet',
};

export default async function DiningPage() {
  const session = await getServerSession(authOptions);

  // Güvenlik kontrolü
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🍽️ Yemekhane Menüleri
          </h1>
          <p className="text-slate-400">
            İstanbul Üniversitesi yemekhane menülerini otomatik olarak çekin ve yönetin
          </p>
        </div>

        {/* İçerik - Client Component */}
        <DiningClient />

        {/* Geri Dön Linki */}
        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Admin Paneline Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
