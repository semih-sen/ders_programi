import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { resetYearlySync, manuallyActivateUser } from '../actions';
import CalendarManager from './CalendarManager';

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Kullanıcı Detayı</h1>
        <p className="text-slate-400">{user.name || 'İsimsiz'} • {user.email}</p>
      </div>

      {/* Admin Notları Bölümü */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">Admin Notları</h2>
            <p className="text-slate-400 text-sm mb-4">Bu alana kullanıcı hakkında özel durumlar, ek bilgiler ve hatırlatmalar ekleyebilirsiniz.</p>
            <form
              action={async (formData: FormData) => {
                'use server';
                const { updateAdminNotes } = await import('../actions');
                const notes = formData.get('notes') as string;
                await updateAdminNotes(user.id, notes);
              }}
            >
              <textarea
                name="notes"
                defaultValue={user.adminNotes || ''}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
                placeholder="Örn: Yüz yüze kayıt yapıldı. Özel ders tercihlerinde değişiklik yapıldı..."
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">Bu notlar sadece adminler tarafından görülebilir</p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Notları Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Temel Bilgiler */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Temel Bilgiler</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-white truncate max-w-[60%]" title={user.email || ''}>{user.email || '—'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Rol:</span><span className="text-white">{user.role}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Aktif Mi?</span><span className={user.isActivated ? 'text-green-400' : 'text-slate-500'}>{user.isActivated ? 'Evet' : 'Hayır'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Yasaklı Mı?</span><span className={user.isBanned ? 'text-red-400' : 'text-slate-500'}>{user.isBanned ? 'Evet' : 'Hayır'}</span></li>
            {user.isBanned && (
              <li className="flex justify-between"><span className="text-slate-400">Yasak Sebebi:</span><span className="text-red-300 max-w-[60%] truncate" title={user.banReason || ''}>{user.banReason || '—'}</span></li>
            )}
            <li className="flex justify-between"><span className="text-slate-400">Oluşturulma:</span><span className="text-white">{new Date(user.createdAt).toLocaleString('tr-TR')}</span></li>
          </ul>
          {!user.isActivated && (
            <div className="mt-4">
              <form
                action={async () => {
                  'use server';
                  await manuallyActivateUser(user.id);
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Kullanıcıyı manuel olarak aktifleştir (yüz yüze kayıtlarda kullan)"
                >
                  Manuel Aktifleştir
                </button>
              </form>
              <p className="text-xs text-slate-400 mt-2">Bu işlem kullanıcıyı hemen aktifleştirir ve MAN- prefixli lisans anahtarı üretir.</p>
            </div>
          )}
        </div>

        {/* Onboarding Tercihleri */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Onboarding Tercihleri</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-400">Uygulama Grubu:</span><span className="text-white">{user.uygulamaGrubu || '—'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Anatomi Grubu:</span><span className="text-white">{user.anatomiGrubu || '—'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Yemekhane Ekli mi?</span><span className={user.yemekhaneEklensin ? 'text-green-400' : 'text-slate-500'}>{user.yemekhaneEklensin ? 'Evet' : 'Hayır'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Sınıf:</span><span className="text-white">{user.classYear ?? '—'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Dil:</span><span className="text-white">{user.language ?? '—'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Yıllık Eşitleme Yapıldı:</span><span className={user.hasYearlySynced ? 'text-green-400' : 'text-slate-500'}>{user.hasYearlySynced ? 'Evet' : 'Hayır'}</span></li>
          </ul>
          <div className="mt-4">
            <form
              action={async () => {
                'use server';
                await resetYearlySync(user.id);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!user.hasYearlySynced}
                title={!user.hasYearlySynced ? 'Zaten sıfırlanmış' : 'Kullanıcının yıllık eşitleme durumunu sıfırla'}
              >
                Eşitlemeyi Sıfırla
              </button>
            </form>
            <p className="text-xs text-slate-400 mt-2">Bu işlem kullanıcının dashboard'unda "YILLIK TAKVİMİ EŞİTLE" butonunu yeniden görünür yapar.</p>
          </div>
        </div>

        {/* Lisans & Hesap Bilgileri */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Lisans & Bağlantılar</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-400">Lisans Anahtarı:</span><span className="text-white">{user.activatedKey?.id || '—'}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Hesap Sayısı:</span><span className="text-white">{user.accounts.length}</span></li>
            {user.accounts.map((acc: any) => (
              <li key={acc.id} className="flex justify-between"><span className="text-slate-400">Sağlayıcı:</span><span className="text-white">{acc.provider}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Seçtiği Dersler Tablosu */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Seçtiği Dersler</h2>
          <p className="text-slate-400 text-sm mt-1">Kullanıcının abonelik tercihleri</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Ders Adı</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Takvime Ekle?</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Bildirim Al?</th>
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
                    <td className="px-4 py-3 text-sm">
                      {sub.addToCalendar ? <span className="text-green-400">✓</span> : <span className="text-slate-500">✗</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sub.notifications ? <span className="text-green-400">✓</span> : <span className="text-slate-500">✗</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Takvim Yönetimi */}
      <CalendarManager userId={user.id} />

      <div className="mt-8">
        <Link href="/admin/users" className="text-sm text-blue-400 hover:text-blue-300 underline">← Tüm kullanıcılara dön</Link>
      </div>
    </div>
  );
}
