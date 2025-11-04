import { prisma } from '@/lib/prisma';
import { createLicenseKey, deleteLicenseKey, revokeLicense } from '../actions';

export const metadata = {
  title: 'Lisans Yönetimi',
};

export default async function LicensesPage() {
  const keys = await prisma.licenseKey.findMany({
    include: {
      activatedByUser: {
        select: { email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Lisans Yönetimi</h1>
        <p className="text-sm sm:text-base text-slate-400">Lisans anahtarlarını oluştur ve yönet</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Yeni Lisans Anahtarı Oluştur</h2>
        <form action={createLicenseKey as any}>
          <button type="submit" className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Anahtar Oluştur
          </button>
        </form>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Lisans Kodu</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Oluşturulma Tarihi</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Kullanıldı Mı?</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Kullanan Email</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {keys.map((key: typeof keys[0]) => (
                <tr key={key.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <code className="text-blue-400 font-mono text-xs sm:text-sm bg-slate-900 px-2 py-1 rounded break-all">{key.id}</code>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-300">{new Date(key.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base">
                    {key.isUsed ? <span className="text-green-400">Evet</span> : <span className="text-slate-500">Hayır</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-300">{key.activatedByUser?.email || '-'}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex gap-1 sm:gap-2">
                      {!key.isUsed && (
                        <form action={deleteLicenseKey.bind(null, key.id) as any}>
                          <button type="submit" className="text-xs sm:text-sm text-red-400 hover:text-red-300">Sil</button>
                        </form>
                      )}
                      {key.isUsed && key.activatedByUserId && (
                        <form action={revokeLicense.bind(null, key.id, key.activatedByUserId) as any}>
                          <button type="submit" className="text-xs sm:text-sm text-orange-400 hover:text-orange-300">İptal Et</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}