import { listFinancialAccounts, createFinancialAccount } from './actions';
import Link from 'next/link';

export const metadata = {
  title: 'Kasa/Hesap Yönetimi',
};

export default async function AccountsPage() {
  const accounts = await listFinancialAccounts();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">🏦 Kasa/Hesaplar</h1>
          <p className="text-sm sm:text-base text-slate-400">Hesapları tanımlayın ve bakiyeleri takip edin</p>
        </div>
        <Link href="/admin/finance" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
          ← Finans Paneli
        </Link>
      </div>

      {/* Yeni Hesap Oluştur */}
      <NewAccountForm />

      {/* Hesap Listesi */}
      <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Mevcut Hesaplar</h2>
          <p className="text-sm text-slate-400 mt-1">Toplam {accounts.length} hesap</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Ad</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tür</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400">Henüz hesap oluşturulmamış.</td>
                </tr>
              ) : (
                accounts.map((acc: any) => (
                  <tr key={acc.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 text-sm text-white font-medium">{acc.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-slate-300">{acc.type}</td>
                    <td className="px-4 sm:px-6 py-3 text-right text-base font-bold text-blue-400">
                      ₺{acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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

// Client component for form
function NewAccountForm() {
  // Use a Client Boundary
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Yeni Hesap Oluştur</h2>
      <form action={async (formData: FormData) => {
        'use server';
        const name = String(formData.get('name') || '').trim();
        const type = String(formData.get('type') || '').trim();
        await createFinancialAccount(name, type);
      }} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Hesap Adı</label>
          <input name="name" required placeholder="Örn: Nakit Kasa" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tür</label>
          <select name="type" required className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seçiniz...</option>
            <option value="CASH">CASH</option>
            <option value="BANK">BANK</option>
            <option value="PERSONAL">PERSONAL</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all">
            Hesap Oluştur
          </button>
          <Link href="/admin/finance" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            Finans Paneli
          </Link>
        </div>
      </form>
    </div>
  );
}
