import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import LogsTableClient from './LogsTableClient';

export const metadata = {
  title: 'Activity Logs - Sirkadiyen Admin',
  description: 'Detailed user activity logs',
};

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all logs (you can add pagination later if needed)
  const logs = await prisma.activityLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 1000, // Limit to 1000 most recent logs for performance
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/analytics"
                className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri Dön
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                📋 Detaylı Aktivite Logları
              </h1>
              <p className="text-slate-400">
                Tüm kullanıcı aktivitelerini görüntüleyin ve arayın
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Toplam Log</p>
                <p className="text-2xl font-bold text-white">{logs.length.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Kayıtlı Kullanıcı</p>
                <p className="text-2xl font-bold text-white">
                  {logs.filter((l: any) => l.userId).length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Misafir</p>
                <p className="text-2xl font-bold text-white">
                  {logs.filter((l: any) => !l.userId).length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table with Client-side filtering */}
        <LogsTableClient initialLogs={logs} />
      </div>
    </main>
  );
}
