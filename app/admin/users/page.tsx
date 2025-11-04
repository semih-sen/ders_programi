import { prisma } from '@/lib/prisma';
import { BanButton, DeleteButton, RoleButton } from './UserActions';

export const metadata = {
  title: 'Kullanıcı Yönetimi',
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActivated: true,
      isBanned: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Kullanıcı Yönetimi</h1>
        <p className="text-sm sm:text-base text-slate-400">Tüm kullanıcıları görüntüle ve yönet</p>
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
              {users.map((user: typeof users[0]) => (
                <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">{user.name || 'İsimsiz'}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-300">{user.email}</td>
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
                    {user.isBanned ? <span className="text-red-400">Evet</span> : <span className="text-slate-500">Hayır</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <BanButton userId={user.id} isBanned={user.isBanned} />
                      <RoleButton userId={user.id} currentRole={user.role} />
                      <DeleteButton userId={user.id} />
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