import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BanButton, DeleteButton, RoleButton, PaymentStatusButton } from './UserActions';
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
      adminNotes: true,
      paymentStatus: true,
      accounts: {
        select: {
          scope: true,
        },
      },
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
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Ödeme Durumu</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Yasaklı Mı?</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Takvim İzni</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 sm:px-6 py-12 text-center">
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
                users.map((user: typeof users[0]) => {
                  // Takvim izni kontrolü
                  const scope = user.accounts?.[0]?.scope || "";
                  const hasCalendarPermission = scope.includes("calendar.events.owned") || scope.includes("calendar");

                  return (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/users/${user.id}`} className="hover:underline hover:text-blue-300">
                            {user.name || 'İsimsiz'}
                          </Link>
                          {user.adminNotes && (
                            <span 
                              className="inline-flex items-center justify-center w-5 h-5 bg-amber-500/20 text-amber-400 rounded-full"
                              title="Admin notu mevcut"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </span>
                          )}
                        </div>
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
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          user.paymentStatus === 'PAID' 
                            ? 'bg-green-500/20 text-green-400' 
                            : user.paymentStatus === 'FREE'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-600/50 text-slate-300'
                        }`}>
                          {user.paymentStatus === 'PAID' ? '✓ Ödendi' : user.paymentStatus === 'FREE' ? '🎁 Ücretsiz' : '⏳ Ödenmedi'}
                        </span>
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
                        {hasCalendarPermission ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Tamam</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Eksik!</span>
                          </span>
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
                          <PaymentStatusButton userId={user.id} currentStatus={user.paymentStatus} />
                          <BanButton userId={user.id} isBanned={user.isBanned} currentBanReason={user.banReason} />
                          <RoleButton userId={user.id} currentRole={user.role} />
                          <DeleteButton userId={user.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}