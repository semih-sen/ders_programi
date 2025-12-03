import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/logger';
import ActivationForm from './ActivationForm';
import OnboardingForm from './OnboardingForm';
import ResetPreferencesButton from './ResetPreferencesButton';
import PermissionWarning from './PermissionWarning';
import DeleteAccountButton from './DeleteAccountButton';
import SyncCard from './components/SyncCard';
import DashboardCalendar from './components/Calendar';
import NextUp from './components/NextUp';

export const metadata = {
  title: 'Dashboard - Sirkadiyen',
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
  
  // Log page view
  await logActivity(user.id, 'PAGE_VIEW', '/dashboard');

  // --- YENİ BAN KONTROLÜ (GÖREV 3) - HER ŞEYDEN ÖNCE ---
  if (user.isBanned) {
    const reason = user.banReason || "Yönetici tarafından sebep belirtilmedi.";
    const encodedReason = encodeURIComponent(reason);
    redirect(`/banned?reason=${encodedReason}`);
  }
  // --- BAN KONTROLÜ SONU ---

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

          {/* Contact Info */}
          <div className="mt-4 bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                  Aktivasyon kodu sorunu mu yaşıyorsunuz? Yardım için bizimle iletişime geçin.
                </p>
                <a 
                  href="/iletisim"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  İletişim Bilgilerimiz
                </a>
              </div>
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
      hasYearlySynced: true,
      
      courseSubscriptions: {
        include: {
          course: true,
        },
      },
      accounts: {
        select: {
          scope: true,
        },
      },
    },
  });

  const subscribedCourses = userPreferences?.courseSubscriptions || [];
  const calendarCourses = subscribedCourses.filter((sub: any) => sub.addToCalendar);
  const notificationCourses = subscribedCourses.filter((sub: any) => sub.notifications);

  // Takvim izni kontrolü
  const scope = userPreferences?.accounts?.[0]?.scope || "";
  const hasCalendarPermission = scope.includes("calendar.events.owned") || scope.includes("calendar");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Takvim İzni Uyarısı */}
        <PermissionWarning hasCalendarPermission={hasCalendarPermission} />

        {/* Hero Section */}
        <section className="mb-8 sm:mb-10">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-900">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                {/* Left: Greeting */}
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Hoş geldin, {user.name || 'Kullanıcı'} 👋
                  </h1>
                  <p className="mt-2 text-slate-300 text-sm sm:text-base">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: 'long' })} • Başarmak için harika bir gün!
                  </p>
                </div>

                {/* Right: Status badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Üyelik Durumu */}
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${(user as any)?.isPaid ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {(user as any)?.isPaid ? 'PRO Üyelik' : 'Ücretsiz Plan'}
                  </span>
                  {/* Senkronizasyon Durumu */}
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Son eşitleme: {(user as any)?.lastSyncedAt ? new Date((user as any).lastSyncedAt).toLocaleString('tr-TR') : 'Henüz yok'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

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
            <ResetPreferencesButton />
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

        {/* Action Center + NextUp */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SyncCard hasYearlySynced={userPreferences?.hasYearlySynced || false} userEmail={user.email || ''} />
          </div>
          <div className="lg:col-span-1">
            <NextUp />
          </div>
        </div>

        {/* Embedded Calendar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-2 sm:p-4">
          <DashboardCalendar />
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

        {/* Account Settings Section */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">⚙️ Hesap Ayarları</h2>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Tehlikeli Alan</h3>
              <p className="text-slate-400 text-sm mb-4">
                Hesabınızı kalıcı olarak silmek isterseniz aşağıdaki butonu kullanabilirsiniz. 
                Bu işlem geri alınamaz ve tüm verileriniz silinecektir.
              </p>
              <DeleteAccountButton />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
