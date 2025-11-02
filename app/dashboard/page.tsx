import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import ActivationForm from './ActivationForm';

export const metadata = {
  title: 'Dashboard - Cinnasium Takvimdâr',
  description: 'Kullanıcı kontrol paneli',
};

export default async function DashboardPage() {
  // Get the current session
  const session = await getServerSession(authOptions);

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const user = session.user;

  // If user is NOT activated, show activation form
  if (!user.isActivated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white text-2xl font-bold shadow-lg mb-4">
              🔒
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Hesabınızı Aktifleştirin
            </h1>
            <p className="text-slate-400">
              Devam etmek için bir aktivasyon kodu girmeniz gerekiyor
            </p>
          </div>

          {/* Activation Form */}
          <ActivationForm />

          {/* User Info */}
          <div className="mt-6 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center text-sm text-slate-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Oturum açan: <span className="ml-1 text-white font-medium">{user.email}</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If user IS activated, show main application
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Hoş Geldiniz, {user.name || 'Kullanıcı'}! 👋
          </h1>
          <p className="text-slate-400">
            Hesabınız aktif. Ders programınızı yönetmeye başlayabilirsiniz.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Hesabınız Aktif ✨
              </h3>
              <p className="text-green-300 text-sm">
                Tüm özelliklere erişiminiz var
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Application Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            📅 Ders Programı Yönetimi
          </h2>
          
          <div className="space-y-6">
            {/* Group Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Uygulama Grubunuzu Seçin
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['A', 'B', 'C', 'D', 'E', 'F'].map((group) => (
                  <button
                    key={group}
                    className="bg-slate-700/50 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-500 rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="text-3xl font-bold text-white mb-1">{group}</div>
                    <div className="text-xs text-slate-400">Grup {group}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Sync Section */}
            <div className="pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Google Takvim Senkronizasyonu
              </h3>
              <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-blue-400 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                  </svg>
                  <div>
                    <p className="text-white font-medium">Takvim bağlantısı aktif</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                  Senkronize Et
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Hızlı İşlemler
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button className="flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Ders Ekle</p>
                    <p className="text-slate-400 text-sm">Manuel ders ekleme</p>
                  </div>
                </button>

                <button className="flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Program Görüntüle</p>
                    <p className="text-slate-400 text-sm">Haftalık program</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Footer */}
        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            {user.email}
          </div>
          <a href="/api/auth/signout" className="text-red-400 hover:text-red-300 transition-colors">
            Çıkış Yap
          </a>
        </div>
      </div>
    </main>
  );
}
