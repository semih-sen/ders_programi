'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Log {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    email: string | null;
    name: string | null;
  } | null;
}

interface LogsTableClientProps {
  initialLogs: Log[];
}

export default function LogsTableClient({ initialLogs }: LogsTableClientProps) {
  const [logs] = useState<Log[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(initialLogs.map((log) => log.action)));

  // Filter logs based on search and action filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-2">
              Arama
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Email, eylem, detay veya IP ile arayın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Action Filter */}
          <div className="w-full sm:w-64">
            <label htmlFor="actionFilter" className="block text-sm font-medium text-slate-300 mb-2">
              Eylem Filtresi
            </label>
            <select
              id="actionFilter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tümü</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-slate-400">
          {filteredLogs.length} / {logs.length} kayıt gösteriliyor
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Tarih/Saat</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Kullanıcı</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Eylem</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Detay</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">IP Adresi</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Cihaz</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-slate-300 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="max-w-xs truncate" title={log.user.email || ''}>
                            {log.user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Misafir</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium whitespace-nowrap">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400 max-w-md">
                      <div className="truncate" title={log.details || ''}>
                        {log.details || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 font-mono whitespace-nowrap">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      <span className="text-xs">
                        {log.userAgent ? (
                          <div className="max-w-xs truncate" title={log.userAgent}>
                            {log.userAgent.includes('Mobile') ? '📱' : '💻'}{' '}
                            {log.userAgent.split(' ')[0]}
                          </div>
                        ) : (
                          '-'
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
