import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDeviceType } from '@/lib/logger';
import AnalyticsCharts from './components/AnalyticsCharts';
import Link from 'next/link';

export const metadata = {
  title: 'Analytics Dashboard - Sirkadiyen Admin',
  description: 'User activity analytics and insights',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch logs from the last 7 days
  const logs = await prisma.activityLog.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  // Aggregate daily traffic
  const dailyTrafficMap = new Map<string, number>();
  const actionCountMap = new Map<string, number>();
  const deviceCountMap = new Map<string, number>();

  logs.forEach((log: any) => {
    // Daily traffic
    const dateKey = log.createdAt.toISOString().split('T')[0];
    dailyTrafficMap.set(dateKey, (dailyTrafficMap.get(dateKey) || 0) + 1);

    // Action counts
    actionCountMap.set(log.action, (actionCountMap.get(log.action) || 0) + 1);

    // Device counts
    const device = getDeviceType(log.userAgent);
    deviceCountMap.set(device, (deviceCountMap.get(device) || 0) + 1);
  });

  // Convert maps to arrays for charts
  const dailyTraffic = Array.from(dailyTrafficMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topActions = Array.from(actionCountMap.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 actions

  const deviceDistribution = Array.from(deviceCountMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  // Get recent logs (last 20)
  const recentLogs = logs.slice(0, 20);

  // Calculate summary stats
  const totalLogs = logs.length;
  const uniqueUsers = new Set(logs.filter((l: any) => l.userId).map((l: any) => l.userId)).size;
  const guestVisits = logs.filter((l: any) => !l.userId).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                📊 Analytics Dashboard
              </h1>
              <p className="text-slate-400">
                Kullanıcı aktivitelerini izleyin ve analiz edin
              </p>
            </div>
            <Link
              href="/admin/analytics/logs"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Detaylı Loglar
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Toplam Aktivite</p>
                <p className="text-2xl font-bold text-white">{totalLogs.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Son 7 gün</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Aktif Kullanıcı</p>
                <p className="text-2xl font-bold text-white">{uniqueUsers.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Benzersiz kullanıcı</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Misafir Ziyaret</p>
                <p className="text-2xl font-bold text-white">{guestVisits.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Giriş yapmayan</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Ortalama/Gün</p>
                <p className="text-2xl font-bold text-white">{Math.round(totalLogs / 7).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Günlük aktivite</p>
          </div>
        </div>

        {/* Charts */}
        <AnalyticsCharts
          dailyTraffic={dailyTraffic}
          topActions={topActions}
          deviceDistribution={deviceDistribution}
        />

        {/* Recent Logs */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">🕐 Son Aktiviteler</h3>
            <Link
              href="/admin/analytics/logs"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Tümünü Gör →
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Tarih/Saat</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Kullanıcı</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Eylem</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Detay</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">IP</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {new Date(log.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          {log.user.email}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Misafir</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
