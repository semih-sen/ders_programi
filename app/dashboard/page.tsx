import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ActivationForm from './ActivationForm';
import OnboardingForm from './OnboardingForm';
import TestDriveForm from './TestDriveForm';

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

  // STEP 1: If user is NOT activated, show activation form
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

  // STEP 2: If user IS activated but has NOT completed onboarding, show onboarding form
  if (user.isActivated && !user.hasCompletedOnboarding) {
    // Fetch all available courses
    const courses = await prisma.course.findMany({
      orderBy: { name: 'asc' },
    });

    return <OnboardingForm courses={courses} />;
  }

  // STEP 3: If user IS activated AND has completed onboarding, show main application
  // Fetch user's preferences and subscriptions
  const userPreferences = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      uygulamaGrubu: true,
      anatomiGrubu: true,
      yemekhaneEklensin: true,
      classYear: true,
      language: true,
      courseSubscriptions: {
        include: {
          course: true,
        },
      },
    },
  });

  const subscribedCourses = userPreferences?.courseSubscriptions || [];
  const calendarCourses = subscribedCourses.filter((sub: any) => sub.addToCalendar);
  const notificationCourses = subscribedCourses.filter((sub: any) => sub.notifications);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Hoş Geldiniz, {user.name || 'Kullanıcı'}! 👋
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Hesabınız aktif. Ders programınızı yönetmeye başlayabilirsiniz.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Active Status */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Durum</p>
                <p className="text-lg font-bold text-green-400">Aktif</p>
              </div>
            </div>
          </div>

          {/* Application Group */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-400">{userPreferences?.uygulamaGrubu || '?'}</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Uygulama Grubu</p>
                <p className="text-lg font-bold text-white">Grup {userPreferences?.uygulamaGrubu || 'Belirlenmedi'}</p>
              </div>
            </div>
          </div>

          {/* Subscribed Courses */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Takip Edilen Dersler</p>
                <p className="text-lg font-bold text-white">{calendarCourses.length} Ders</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Bildirimler</p>
                <p className="text-lg font-bold text-white">{notificationCourses.length} Ders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Preferences Summary */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tercihlerim</h2>
              <p className="text-slate-400 text-sm">Mevcut ayarlarınız ve ders seçimleriniz</p>
            </div>
            <a
              href="/dashboard?reselect=true"
              onClick={(e) => {
                e.preventDefault();
                if (confirm('Tercihlerinizi yeniden düzenlemek ister misiniz? Mevcut ayarlarınız kaybolacak.')) {
                  // Reset onboarding status
                  fetch('/api/reset-onboarding', { method: 'POST' })
                    .then(() => window.location.reload());
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
            >
              🔄 Yeniden Düzenle
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Temel Ayarlar</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Uygulama Grubu:</span>
                <span className="font-semibold text-white">{userPreferences?.uygulamaGrubu || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Anatomi Grubu:</span>
                <span className="font-semibold text-white">{userPreferences?.anatomiGrubu || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Dönem:</span>
                <span className="font-semibold text-white">{userPreferences?.classYear ? `Dönem ${userPreferences.classYear}` : '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Dil:</span>
                <span className="font-semibold text-white">{userPreferences?.language || 'TR'}</span>
              </div>
            </div>

            {/* Calendar Courses */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Takvime Eklenen Dersler ({calendarCourses.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {calendarCourses.length > 0 ? (
                  calendarCourses.map((sub: any) => (
                    <div key={sub.courseId} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">{sub.course.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">Ders seçilmedi</p>
                )}
              </div>
            </div>

            {/* Notification Courses */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Bildirim Aktif Dersler ({notificationCourses.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notificationCourses.length > 0 ? (
                  notificationCourses.map((sub: any) => (
                    <div key={sub.courseId} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-slate-300">{sub.course.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">Bildirim yok</p>
                )}
              </div>
            </div>
          </div>

          {/* Cafeteria Setting */}
          {userPreferences?.yemekhaneEklensin && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold">🍽️ Yemekhane listesi takvime ekleniyor</span>
              </div>
            </div>
          )}
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
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((group) => (
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
              {/* Test Drive Button (n8n webhook) */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Test Sürüşü</h4>
                <TestDriveForm />
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
