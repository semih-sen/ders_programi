import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // Security: Only ADMIN users can access admin routes
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden bg-slate-900/50 border-b border-slate-700 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">🔐 Admin</h2>
              <p className="text-slate-400 text-xs">Yönetim Paneli</p>
            </div>
            <details className="relative">
              <summary className="list-none cursor-pointer">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
              </summary>
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                <nav className="p-2">
                  <MobileNavLink href="/admin" icon={<DashboardIcon />}>
                    Panel
                  </MobileNavLink>
                  <MobileNavLink href="/admin/users" icon={<UsersIcon />}>
                    Kullanıcı Yönetimi
                  </MobileNavLink>
                  <MobileNavLink href="/admin/licenses" icon={<KeyIcon />}>
                    Lisans Yönetimi
                  </MobileNavLink>
                  <div className="border-t border-slate-700 mt-2 pt-2">
                    <div className="px-3 py-2 text-sm">
                      <p className="text-white font-medium truncate">{session.user.name || 'Admin'}</p>
                      <p className="text-slate-400 text-xs truncate">{session.user.email}</p>
                    </div>
                    <Link
                      href="/api/auth/signout"
                      className="block mx-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium transition-colors text-center"
                    >
                      Çıkış Yap
                    </Link>
                  </div>
                </nav>
              </div>
            </details>
          </div>
        </div>

        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:block w-64 min-h-screen bg-slate-900/50 border-r border-slate-700 backdrop-blur-sm">
          <div className="p-6">
            {/* Logo/Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">🔐 Admin</h2>
              <p className="text-slate-400 text-sm">Yönetim Paneli</p>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2">
              <NavLink href="/admin" icon={<DashboardIcon />}>
                Panel
              </NavLink>
              <NavLink href="/admin/users" icon={<UsersIcon />}>
                Kullanıcı Yönetimi
              </NavLink>
              <NavLink href="/admin/licenses" icon={<KeyIcon />}>
                Lisans Yönetimi
              </NavLink>
            </nav>

            {/* User Info */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <div className="flex items-center text-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {session.user.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{session.user.name || 'Admin'}</p>
                  <p className="text-slate-400 text-xs truncate">{session.user.email}</p>
                </div>
              </div>
              <Link
                href="/api/auth/signout"
                className="mt-4 block w-full text-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Çıkış Yap
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors group"
    >
      <span className="w-5 h-5 mr-3 text-slate-400 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function MobileNavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors group"
    >
      <span className="w-5 h-5 mr-3 text-slate-400 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="font-medium text-sm">{children}</span>
    </Link>
  );
}
