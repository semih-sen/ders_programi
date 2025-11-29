'use client';

import { useEffect, useState } from 'react';

interface SystemStats {
  cpu: {
    loadAverage: {
      oneMin: number;
      fiveMin: number;
      fifteenMin: number;
    };
    coreCount: number;
    loadPercentage: number;
  };
  ram: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usedPercentage: number;
  };
  swap: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usedPercentage: number;
  };
  disk: {
    totalGB: string;
    usedGB: string;
    availableGB: string;
    usedPercentage: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: SystemStats;
  timestamp: string;
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }

      const data: ApiResponse = await response.json();
      setStats(data.data);
      setLastUpdate(new Date(data.timestamp));
      setError(null);
    } catch (err) {
      console.error('Error fetching system stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up interval to fetch every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-slate-400">Sistem bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-red-300 font-semibold">Sistem bilgileri alınamadı</p>
            <p className="text-red-400/70 text-sm">{error || 'Bilinmeyen hata'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine color based on usage percentage
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 80) return 'text-orange-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sistem İzleme</h2>
            <p className="text-sm text-slate-400">Anlık sunucu durumu</p>
          </div>
        </div>
        
        {/* Live indicator and uptime badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-slate-300 font-medium">Canlı</span>
          </div>
          <div className="px-3 py-1.5 bg-blue-500/20 rounded-full">
            <span className="text-xs text-blue-300 font-medium">⏱️ {stats.uptime.formatted}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* CPU Load */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="text-sm font-medium text-slate-300">CPU Load</span>
            </div>
            <span className={`text-lg font-bold ${getUsageTextColor(stats.cpu.loadPercentage)}`}>
              {stats.cpu.loadPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>1 Min:</span>
              <span className="font-mono text-slate-300">{stats.cpu.loadAverage.oneMin}</span>
            </div>
            <div className="flex justify-between">
              <span>5 Min:</span>
              <span className="font-mono text-slate-300">{stats.cpu.loadAverage.fiveMin}</span>
            </div>
            <div className="flex justify-between">
              <span>15 Min:</span>
              <span className="font-mono text-slate-300">{stats.cpu.loadAverage.fifteenMin}</span>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <span className="text-slate-500">Çekirdek: {stats.cpu.coreCount}</span>
            </div>
          </div>
        </div>

        {/* RAM Usage */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <span className="text-sm font-medium text-slate-300">RAM</span>
            </div>
            <span className={`text-lg font-bold ${getUsageTextColor(stats.ram.usedPercentage)}`}>
              {stats.ram.usedPercentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full ${getUsageColor(stats.ram.usedPercentage)} transition-all duration-500`}
                style={{ width: `${Math.min(stats.ram.usedPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Kullanılan:</span>
              <span className="font-mono text-slate-300">{stats.ram.usedGB.toFixed(2)} GB</span>
            </div>
            <div className="flex justify-between">
              <span>Boş:</span>
              <span className="font-mono text-slate-300">{stats.ram.freeGB.toFixed(2)} GB</span>
            </div>
            <div className="flex justify-between">
              <span>Toplam:</span>
              <span className="font-mono text-slate-300">{stats.ram.totalGB.toFixed(2)} GB</span>
            </div>
          </div>
        </div>

        {/* Swap Usage */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium text-slate-300">Swap</span>
            </div>
            <span className={`text-lg font-bold ${getUsageTextColor(stats.swap.usedPercentage)}`}>
              {stats.swap.totalGB > 0 ? `${stats.swap.usedPercentage.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          
          {/* Progress Bar */}
          {stats.swap.totalGB > 0 ? (
            <>
              <div className="mb-3">
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full ${getUsageColor(stats.swap.usedPercentage)} transition-all duration-500`}
                    style={{ width: `${Math.min(stats.swap.usedPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Kullanılan:</span>
                  <span className="font-mono text-slate-300">{stats.swap.usedGB.toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Boş:</span>
                  <span className="font-mono text-slate-300">{stats.swap.freeGB.toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam:</span>
                  <span className="font-mono text-slate-300">{stats.swap.totalGB.toFixed(2)} GB</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-slate-500 text-sm">
              Swap alanı mevcut değil
            </div>
          )}
        </div>

        {/* Disk Usage */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <span className="text-sm font-medium text-slate-300">Disk (/)</span>
            </div>
            <span className={`text-lg font-bold ${getUsageTextColor(stats.disk.usedPercentage)}`}>
              {stats.disk.usedPercentage}%
            </span>
          </div>
          
          {/* Circular Progress or Bar */}
          <div className="mb-3">
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full ${getUsageColor(stats.disk.usedPercentage)} transition-all duration-500`}
                style={{ width: `${Math.min(stats.disk.usedPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Kullanılan:</span>
              <span className="font-mono text-slate-300">{stats.disk.usedGB}</span>
            </div>
            <div className="flex justify-between">
              <span>Mevcut:</span>
              <span className="font-mono text-slate-300">{stats.disk.availableGB}</span>
            </div>
            <div className="flex justify-between">
              <span>Toplam:</span>
              <span className="font-mono text-slate-300">{stats.disk.totalGB}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}</span>
          <span>Her 5 saniyede otomatik yenilenir</span>
        </div>
      )}
    </div>
  );
}
