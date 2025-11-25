import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CalendarManager from './CalendarManager';
import {
  resetYearlySync,
  manuallyActivateUser,
  banUser,
  unbanUser,
  toggleUserRole,
  deleteUser,
  wipeUserCalendar,
  fetchUserCalendarEvents,
  updateNotificationSettings,
  updateCalendarReminders,
  forceYearlySync,
} from '../actions';
import ManualEventCard from '@/app/admin/users/[id]/ManualEventCard';
import CalendarToolsCard from '@/app/admin/users/[id]/CalendarToolsCard';

interface UserDetailPageProps {
  params: { id: string };
}

export const metadata = {
  title: 'Kullanıcı Detay',
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Auth & authorization check
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      accounts: true,
      activatedKey: true,
      courseSubscriptions: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Kullanıcı Bulunamadı</h1>
          <p className="text-slate-400 mb-6">İstenen kullanıcı kaydı mevcut değil veya silinmiş olabilir.</p>
          <Link href="/admin/users" className="text-blue-400 hover:text-blue-300 underline">← Kullanıcı listesine dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Kontrol Merkezi</h1>
        <p className="text-slate-400 flex flex-wrap gap-2 items-center">
          <span>{user.name || 'İsimsiz'}</span>
          <span className="text-slate-600">•</span>
          <span className="truncate max-w-[300px]" title={user.email}>{user.email}</span>
          <span className="text-slate-600">•</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-slate-600/50 text-slate-300'}`}>{user.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* LEFT COLUMN: USER INFO */}
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">{user.name || 'İsimsiz Kullanıcı'}</h2>
                <p className="text-sm text-slate-400 truncate max-w-[220px]" title={user.email}>{user.email}</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-slate-400">Rol</span><span className="text-white">{user.role}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Aktif</span><span className={user.isActivated ? 'text-green-400' : 'text-slate-500'}>{user.isActivated ? 'Evet' : 'Hayır'}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Yasaklı</span><span className={user.isBanned ? 'text-red-400' : 'text-slate-500'}>{user.isBanned ? 'Evet' : 'Hayır'}</span></li>
              {user.isBanned && (<li className="flex justify-between"><span className="text-slate-400">Ban Sebebi</span><span className="text-red-300 max-w-[60%] truncate" title={user.banReason || ''}>{user.banReason || '—'}</span></li>)}
              <li className="flex justify-between"><span className="text-slate-400">Oluşturulma</span><span className="text-white">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Sınıf (Dönem)</span><span className="text-white">{user.classYear ?? '—'}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Uygulama Grubu</span><span className="text-white">{user.uygulamaGrubu || '—'}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Anatomi Grubu</span><span className="text-white">{user.anatomiGrubu || '—'}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Yıllık Eşitleme</span><span className={user.hasYearlySynced ? 'text-green-400' : 'text-slate-500'}>{user.hasYearlySynced ? 'Yapıldı' : 'Yapılmadı'}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Lisans</span><span className="text-white">{user.activatedKey?.id || '—'}</span></li>
            </ul>
            {!user.isActivated && (
              <form
                action={async () => { 'use server'; await manuallyActivateUser(user.id); }}
                className="mt-5"
              >
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-green-400/40"
                >
                  Manuel Aktifleştir
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION GRID */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <QuickActionsCard user={user} />
          {/* Admin Notes */}
          <AdminNotesCard userId={user.id} existingNotes={user.adminNotes} />
          {/* Notification Settings */}
          <NotificationSettingsCard 
            userId={user.id} 
            notificationOffset={user.notificationOffset} 
            firstLessonOffset={user.firstLessonOffset} 
          />
          {/* Calendar Reminder Updater */}
          <CalendarReminderUpdaterCard userId={user.id} />
          {/* Manual Event Form */}
          <ManualEventCard userId={user.id} />
          {/* Calendar Tools (Fetch & Wipe) */}
          <CalendarToolsCard userId={user.id} />
        </div>
      </div>

      {/* Ders Abonelikleri */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Seçtiği Dersler</h2>
            <p className="text-slate-400 text-sm mt-1">Kullanıcının abonelik ve takvim tercihleri</p>
          </div>
          <span className="text-xs text-slate-500">{user.courseSubscriptions.length} ders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Ders Adı</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Takvim</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Bildirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {user.courseSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">Ders aboneliği bulunmuyor.</td>
                </tr>
              ) : (
                user.courseSubscriptions.map((sub: any) => (
                  <tr key={sub.courseId} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{sub.course?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm">{sub.addToCalendar ? <span className="text-green-400">✓</span> : <span className="text-slate-500">✗</span>}</td>
                    <td className="px-4 py-3 text-sm">{sub.notifications ? <span className="text-green-400">✓</span> : <span className="text-slate-500">✗</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gelişmiş Takvim Yönetimi (Mevcut component) */}
      <CalendarManager userId={user.id} />

      <div className="mt-10">
        <Link href="/admin/users" className="text-sm text-blue-400 hover:text-blue-300 underline">← Tüm kullanıcılara dön</Link>
      </div>
    </div>
  );
}

// SERVER COMPONENTS ONLY (client components extracted to separate files)
const QuickActionsCard = ({ user }: { user: any }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col">
    <h3 className="text-base font-semibold text-white mb-2">Hızlı İşlemler</h3>
    <p className="text-xs text-slate-500 mb-4">Kritik yönetim işlemleri (Ban, Rol, Sil, Eşitleme).</p>
    <div className="grid grid-cols-2 gap-3">
      {user.isBanned ? (
        <form action={async () => { 'use server'; await unbanUser(user.id); }}>
          <button type="submit" className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30">Ban Kaldır</button>
        </form>
      ) : (
        <form action={async (fd: FormData) => { 'use server'; fd.set('userId', user.id); fd.set('banReason', 'Manuel ban'); await banUser(fd); }}>
          <button type="submit" className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30">Banla</button>
        </form>
      )}
      <form action={async () => { 'use server'; await toggleUserRole(user.id, user.role); }}>
        <button type="submit" className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30">Rol Değiştir</button>
      </form>
      <form action={async () => { 'use server'; await resetYearlySync(user.id); }}>
        <button type="submit" disabled={!user.hasYearlySynced} className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 disabled:opacity-40 disabled:cursor-not-allowed">Yıllık Sync Sıfırla</button>
      </form>
      <form action={async () => { 'use server'; await wipeUserCalendar(user.id); }}>
        <button type="submit" className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30">Takvimi Temizle</button>
      </form>
      <form action={async () => { 'use server'; await forceYearlySync(user.id); }}>
        <button type="submit" className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30">Yıllık Eşitlemeyi Zorla</button>
      </form>
      <form action={async () => { 'use server'; await deleteUser(user.id); redirect('/admin/users'); }} className="col-span-2">
        <button type="submit" className="w-full px-3 py-2 text-xs font-semibold rounded-md bg-red-700/30 border border-red-600/40 text-red-300 hover:bg-red-700/50">Kullanıcıyı Sil</button>
      </form>
    </div>
  </div>
);

const AdminNotesCard = ({ userId, existingNotes }: { userId: string; existingNotes: string | null }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col">
    <h3 className="text-base font-semibold text-white mb-2">Admin Notları</h3>
    <p className="text-xs text-slate-500 mb-3">Bu notlar sadece adminler tarafından görülür.</p>
    <form
      action={async (formData: FormData) => {
        'use server';
        const { updateAdminNotes } = await import('../actions');
        const notes = formData.get('notes') as string;
        await updateAdminNotes(userId, notes);
      }}
      className="flex flex-col flex-1"
    >
      <textarea
        name="notes"
        defaultValue={existingNotes || ''}
        rows={5}
        className="w-full flex-1 px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        placeholder="Örn: Yüz yüze kayıt yapıldı..."
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-500 text-white shadow"
        >Kaydet</button>
      </div>
    </form>
  </div>
);

const NotificationSettingsCard = ({ 
  userId, 
  notificationOffset, 
  firstLessonOffset 
}: { 
  userId: string; 
  notificationOffset: number; 
  firstLessonOffset: number; 
}) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col">
    <h3 className="text-base font-semibold text-white mb-2">Bildirim Ayarları</h3>
    <p className="text-xs text-slate-500 mb-4">Takvim bildirim sürelerini özelleştirin.</p>
    <form
      action={async (formData: FormData) => {
        'use server';
        const standardOffset = parseInt(formData.get('notificationOffset') as string);
        const firstOffset = parseInt(formData.get('firstLessonOffset') as string);
        await updateNotificationSettings(userId, standardOffset, firstOffset);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="notificationOffset" className="block text-sm text-slate-300 mb-1">
          Standart Dersler (dakika)
        </label>
        <input
          type="number"
          id="notificationOffset"
          name="notificationOffset"
          defaultValue={notificationOffset}
          min="0"
          max="1440"
          className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>
      <div>
        <label htmlFor="firstLessonOffset" className="block text-sm text-slate-300 mb-1">
          Günün İlk Dersi (dakika)
        </label>
        <input
          type="number"
          id="firstLessonOffset"
          name="firstLessonOffset"
          defaultValue={firstLessonOffset}
          min="0"
          max="1440"
          className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow"
        >
          Kaydet
        </button>
      </div>
    </form>
  </div>
);

const CalendarReminderUpdaterCard = ({ userId }: { userId: string }) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col">
      <h3 className="text-base font-semibold text-white mb-2">Takvimdeki Bildirimleri Güncelle</h3>
      <p className="text-xs text-slate-500 mb-4">Seçilen aydaki tüm ders bildirimlerini ayarlara göre günceller.</p>
      <form
        action={async (formData: FormData) => {
          'use server';
          const month = parseInt(formData.get('month') as string);
          const year = parseInt(formData.get('year') as string);
          await updateCalendarReminders(userId, month, year);
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="month" className="block text-sm text-slate-300 mb-1">
              Ay
            </label>
            <select
              id="month"
              name="month"
              defaultValue={currentMonth}
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="1">Ocak</option>
              <option value="2">Şubat</option>
              <option value="3">Mart</option>
              <option value="4">Nisan</option>
              <option value="5">Mayıs</option>
              <option value="6">Haziran</option>
              <option value="7">Temmuz</option>
              <option value="8">Ağustos</option>
              <option value="9">Eylül</option>
              <option value="10">Ekim</option>
              <option value="11">Kasım</option>
              <option value="12">Aralık</option>
            </select>
          </div>
          <div>
            <label htmlFor="year" className="block text-sm text-slate-300 mb-1">
              Yıl
            </label>
            <input
              type="number"
              id="year"
              name="year"
              defaultValue={currentYear}
              min="2020"
              max="2030"
              className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow"
          >
            Güncelle
          </button>
        </div>
      </form>
    </div>
  );
};
