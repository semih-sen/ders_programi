import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/logger';
import ActivationForm from './ActivationForm';
import OnboardingForm from './OnboardingForm';
import SyncStatusCard from './components/SyncStatusCard';
import MobileAppsCard from './components/MobileAppsCard';
import StatsCard from './components/StatsCard';
import QuickActionsCard from './components/QuickActionsCard';
import CoursesListCard from './components/CoursesListCard';

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
    },
  });

  const subscribedCourses = userPreferences?.courseSubscriptions || [];
  const calendarCourses = subscribedCourses.filter((sub: any) => sub.addToCalendar);

  // Get last synced time from user
  const lastSyncedAt = (user as any).lastSyncedAt || null;
  const syncStatus = (user as any).syncStatus || null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Hoş geldin, {user.name || 'Kullanıcı'} 👋
          </h1>
          <p className="text-slate-400">
            {new Date().toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Bento Grid Layout: 3 Columns (Desktop), 1 Column (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Senkronizasyon Merkezi (Hero Card - Col-span-2) */}
          <div className="md:col-span-2">
            <SyncStatusCard
              hasYearlySynced={userPreferences?.hasYearlySynced || false}
              syncStatus={syncStatus}
              lastSyncedAt={lastSyncedAt}
            />
          </div>

          {/* 2. Mobil Uygulamalar (Col-span-1) */}
          <div className="md:col-span-1">
            <MobileAppsCard />
          </div>

          {/* 3. İstatistikler (Col-span-1) */}
          <div className="md:col-span-1">
            <StatsCard
              courseCount={calendarCourses.length}
              classYear={userPreferences?.classYear}
              uygulamaGrubu={userPreferences?.uygulamaGrubu}
            />
          </div>

          {/* 4. Hızlı İşlemler/Ayarlar (Col-span-1) */}
          <div className="md:col-span-1">
            <QuickActionsCard />
          </div>

          {/* 5. Seçili Ders Listesi (Col-span-1) */}
          <div className="md:col-span-1">
            <CoursesListCard courses={calendarCourses} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-400 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <span>{user.email}</span>
          </div>
          <a 
            href="/api/auth/signout" 
            className="text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            Çıkış Yap
          </a>
        </div>
      </div>
    </main>
  );
}
