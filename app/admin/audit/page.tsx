import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Denetim Kaydı (Audit Log)',
};

export default async function AuditLogPage() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 200, // Son 200 kayıt
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          📋 Denetim Kaydı (Audit Log)
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Admin işlemlerinin geçmişi ve hesap verebilirlik
        </p>
      </div>

      {/* İstatistik Kartı */}
      <div className="mb-6">
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Toplam Kayıt</p>
              <p className="text-2xl font-bold text-white">{auditLogs.length}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Audit Log Tablosu */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                  Tarih & Saat
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                  İşlemi Yapan Admin
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                  Eylem
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                  Detaylar
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                  Etkilenen ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-5xl mb-3">📋</span>
                      <p className="text-slate-400 text-lg font-medium">
                        Henüz denetim kaydı yok
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        Admin işlemleri burada görünecek
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log: any) => {
                  // Action'a göre renk ve emoji
                  const getActionStyle = (action: string) => {
                    if (action.includes('DELETE') || action.includes('BANNED')) {
                      return { emoji: '🚫', color: 'text-red-400', bg: 'bg-red-500/20' };
                    } else if (action.includes('ACTIVATED') || action.includes('GENERATED')) {
                      return { emoji: '✅', color: 'text-green-400', bg: 'bg-green-500/20' };
                    } else if (action.includes('MONEY') || action.includes('PAYMENT')) {
                      return { emoji: '💰', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
                    } else if (action.includes('UPDATE') || action.includes('MODIFIED')) {
                      return { emoji: '✏️', color: 'text-blue-400', bg: 'bg-blue-500/20' };
                    }
                    return { emoji: '📝', color: 'text-slate-400', bg: 'bg-slate-500/20' };
                  };

                  const style = getActionStyle(log.action);

                  return (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-300">
                        <div>
                          <p className="font-medium text-white">
                            {new Date(log.createdAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <div>
                          <p className="font-medium text-white">
                            {log.admin.name || 'İsimsiz Admin'}
                          </p>
                          <p className="text-xs text-slate-400">{log.admin.email}</p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.color}`}
                        >
                          <span>{style.emoji}</span>
                          <span>{log.action}</span>
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-300 max-w-xs">
                        <p className="line-clamp-2">{log.details || '-'}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-400 font-mono">
                        {log.entityId ? (
                          <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bilgilendirme Notu */}
      <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="text-white font-semibold mb-1">Denetim Kaydı Hakkında</h3>
            <p className="text-slate-400 text-sm">
              Bu sayfa, admin kullanıcılarının gerçekleştirdiği kritik işlemleri kaydeder.
              Tüm kullanıcı silme, banlama, aktivasyon ve finansal işlemler otomatik olarak
              loglenir. Bu sayede hesap verebilirlik ve güvenlik sağlanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
