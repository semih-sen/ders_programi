import { prisma } from '@/lib/prisma';
import DailyRefreshTrigger from './DailyRefreshTrigger';
import SystemMonitor from './components/SystemMonitor';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Yönetici ana paneli',
};

export default async function AdminDashboard() {
  const [totalUsers, activatedUsers, totalKeys, usedKeys] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActivated: true } }),
    prisma.licenseKey.count(),
    prisma.licenseKey.count({ where: { isUsed: true } }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-400">Sistem istatistikleri ve özet bilgiler</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard title="Toplam Kullanıcı" value={totalUsers} icon="👥" color="blue" />
        <StatCard title="Aktif Kullanıcı" value={activatedUsers} icon="✅" color="green" />
        <StatCard title="Toplam Lisans" value={totalKeys} icon="🔑" color="purple" />
        <StatCard title="Kullanılan Lisans" value={usedKeys} icon="🎯" color="orange" />
      </div>

      {/* System Monitor - Real-time server health */}
      <div className="mb-6 sm:mb-8">
        <SystemMonitor />
      </div>

      {/* Emergency: Manual Daily Refresh Trigger */}
      <div className="mb-6 sm:mb-8">
        <DailyRefreshTrigger />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <QuickLink href="/admin/users" title="Kullanıcı Yönetimi" description="Kullanıcıları görüntüle ve yönet" icon="users" color="blue" />
          <QuickLink href="/admin/licenses" title="Lisans Yönetimi" description="Lisans anahtarlarını yönet" icon="key" color="purple" />
          <QuickLink href="/admin/finance" title="Finans Yönetimi" description="Gelir, gider ve kasa takibi" icon="finance" color="green" />
          <QuickLink href="/admin/finance/accounts" title="Kasa Yönetimi" description="Kasa ve hesap ekle/düzenle" icon="wallet" color="orange" />
          <QuickLink href="/admin/dining" title="Yemekhane Menüleri" description="Üniversite menülerini yönet" icon="dining" color="yellow" />
          <QuickLink href="/admin/data-files" title="Veri Dosyaları" description="JSON dosyalarını yönet" icon="file" color="cyan" />
          <QuickLink href="/admin/bulk-events" title="Toplu Etkinlik" description="Seçili kullanıcılara takvim etkinliği gönder" icon="audit" color="red" />
          <QuickLink href="/admin/bulk-ban" title="Toplu Ban" description="Seçili kullanıcıları hızlıca banla" icon="audit" color="red" />
          <QuickLink href="/admin/audit" title="Denetim Günlüğü" description="Sistem aktivitelerini görüntüle" icon="audit" color="red" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colors = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  };
  const c = colors[color as keyof typeof colors];
  
  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border ${c.border}`}>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${c.bg} rounded-lg flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4`}>{icon}</div>
      <p className="text-slate-400 text-xs sm:text-sm mb-1">{title}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

function QuickLink({ href, title, description, icon, color }: { href: string; title: string; description: string; icon: string; color: string }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', hover: 'group-hover:bg-blue-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', hover: 'group-hover:bg-purple-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', hover: 'group-hover:bg-green-500/30' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', hover: 'group-hover:bg-orange-500/30' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', hover: 'group-hover:bg-yellow-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', hover: 'group-hover:bg-cyan-500/30' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', hover: 'group-hover:bg-red-500/30' },
  };
  const c = colorClasses[color as keyof typeof colorClasses];
  
  const icons = {
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    key: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
    finance: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    dining: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    file: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    audit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  };
  
  return (
    <a href={href} className="flex items-center p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all group border border-slate-600/50 hover:border-slate-500/50 hover:shadow-lg">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${c.bg} ${c.hover} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 transition-all`}>
        <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[icon as keyof typeof icons]}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white font-semibold text-base sm:text-lg truncate mb-1">{title}</p>
        <p className="text-slate-400 text-xs sm:text-sm truncate">{description}</p>
      </div>
      <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}