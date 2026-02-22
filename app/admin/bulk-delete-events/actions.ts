'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import { getAccessToken, listSirkadiyenEvents, batchDeleteEvents } from '@/lib/google-calendar';
import { logAdminAction } from '@/lib/audit';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function deleteSirkadiyenEventsBulk(userIds: string[], month: number, year: number) {
  const session = await checkAdmin();

  const uniqueIds = Array.from(new Set(userIds || []));
  if (uniqueIds.length === 0) {
    return { success: false, error: 'Kullanıcı seçilmedi.', successUsers: 0, deletedEvents: 0, failedUsers: 0 } as const;
  }

  if (!month || month < 1 || month > 12 || !year || year < 2000) {
    return { success: false, error: 'Ay ve yıl geçerli olmalıdır.', successUsers: 0, deletedEvents: 0, failedUsers: 0 } as const;
  }

  const timeMin = new Date(year, month - 1, 1).toISOString();
  const timeMax = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const perUserResults = await Promise.allSettled(
    uniqueIds.map(async (userId) => {
      try {
        const accessToken = await getAccessToken(userId);
        const events = await listSirkadiyenEvents(accessToken, timeMin, timeMax);
        const eventIds = events.map((e) => e.id);

        if (eventIds.length === 0) {
          return { userId, deleted: 0, failed: 0 } as const;
        }

        const { success, failed } = await batchDeleteEvents(accessToken, eventIds);
        return { userId, deleted: success, failed } as const;
      } catch (error: any) {
        console.error('Bulk delete error for user', userId, error);
        throw new Error(error?.message || 'Bilinmeyen hata');
      }
    })
  );

  let successUsers = 0;
  let failedUsers = 0;
  let deletedEvents = 0;

  perUserResults.forEach((r) => {
    if (r.status === 'fulfilled') {
      successUsers += 1;
      deletedEvents += r.value.deleted;
    } else {
      failedUsers += 1;
    }
  });

  await logAdminAction(
    'BULK_SIRKADIYEN_DELETE',
    `Ay ${month}/${year} için ${successUsers} kullanıcıda ${deletedEvents} etkinlik silindi, başarısız: ${failedUsers}.`,
    successUsers ? uniqueIds[0] : undefined
  );

  revalidatePath('/admin/bulk-delete-events');

  return { success: true, successUsers, deletedEvents, failedUsers } as const;
}
