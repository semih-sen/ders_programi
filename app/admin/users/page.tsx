import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BanButton, DeleteButton, RoleButton } from './UserActions';
import SearchInput from './SearchInput';
import { manuallyActivateUser } from './actions';

export const metadata = {
  title: 'Kullanıcı Yönetimi',
};

interface UsersPageProps {
  searchParams?: {
    query?: string;
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const query = searchParams?.query || '';

  const users = await prisma.user.findMany({
    where: query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActivated: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Kullanıcı Yönetimi</h1>
        <p className="text-sm sm:text-base text-slate-400">Tüm kullanıcıları görüntüle ve yönet</p>
      </div>

      {/* Arama Çubuğu */}
      <div className="mb-6">
        <SearchInput />
      </div>

      {/* Kullanıcı Sayısı */}
      <div className="mb-4">
        <p className="text-slate-400 text-sm">
          {query ? (
            <>
              <span className="text-white font-semibold">{users.length}</span> kullanıcı bulundu
              <span className="text-slate-500 mx-2">•</span>
              Arama: "<span className="text-blue-400">{query}</span>"
            </>
          ) : (
            <>Toplam <span className="text-white font-semibold">{users.length}</span> kullanıcı</>
          )}
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">İsim</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Email</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Rol</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Aktif Mi?</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Yasaklı Mı?</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-slate-400 text-lg font-medium">Kullanıcı bulunamadı</p>
                      <p className="text-slate-500 text-sm mt-1">Arama kriterlerinizi değiştirmeyi deneyin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user: typeof users[0]) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">
                      <Link href={`/admin/users/${user.id}`} className="hover:underline hover:text-blue-300">
                        {user.name || 'İsimsiz'}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-300">
                      <Link href={`/admin/users/${user.id}`} className="hover:underline hover:text-blue-300">
                        {user.email}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-slate-600/50 text-slate-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {user.isActivated ? <span className="text-green-400">✓</span> : <span className="text-slate-500">✗</span>}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {user.isBanned ? (
                        <span className="text-red-400 font-semibold" title={user.banReason || 'Sebep belirtilmemiş'}>
                          Evet
                        </span>
                      ) : (
                        <span className="text-slate-500">Hayır</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {!user.isActivated && (
                          <form
                            action={async () => {
                              'use server';
                              await manuallyActivateUser(user.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-2 sm:px-3 py-1 rounded text-xs font-semibold transition-colors bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              title="Bu kullanıcıyı manuel olarak aktifleştir"
                            >
                              Manuel Aktifleştir
                            </button>
                          </form>
                        )}
                        <BanButton userId={user.id} isBanned={user.isBanned} currentBanReason={user.banReason} />
                        <RoleButton userId={user.id} currentRole={user.role} />
                        <DeleteButton userId={user.id} />
                      </div>
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