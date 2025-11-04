import { prisma } from '@/lib/prisma';

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

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <QuickLink href="/admin/users" title="Kullanıcı Yönetimi" description="Kullanıcıları görüntüle ve yönet" color="blue" />
          <QuickLink href="/admin/licenses" title="Lisans Yönetimi" description="Lisans anahtarlarını yönet" color="purple" />
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

function QuickLink({ href, title, description, color }: { href: string; title: string; description: string; color: string }) {
  return (
    <a href={href} className="flex items-center p-3 sm:p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color === 'blue' ? 'bg-blue-500/20' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0`}>
        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {color === 'blue' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          )}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-white font-semibold text-sm sm:text-base truncate">{title}</p>
        <p className="text-slate-400 text-xs sm:text-sm truncate">{description}</p>
      </div>
    </a>
  );
}