'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

/**
 * Admin işlemlerini denetim kaydına (audit log) ekler
 * @param action İşlem türü (örn: "USER_DELETED", "LICENSE_GENERATED")
 * @param details İşlem detayları
 * @param entityId Etkilenen nesnenin ID'si (opsiyonel)
 */
export async function logAdminAction(
  action: string,
  details: string,
  entityId?: string
): Promise<void> {
  try {
    const session = await getServerSession(authOptions);

    // Eğer oturum yoksa veya admin değilse sessizce başarısız ol
    if (!session?.user || session.user.role !== 'ADMIN') {
      return;
    }

    // Audit log kaydını oluştur
    await prisma.auditLog.create({
      data: {
        action,
        details,
        entityId: entityId || null,
        adminId: session.user.id,
      },
    });
  } catch (error) {
    // Loglama hatası sessizce işlenir, ana işlemi etkilemez
    console.error('Audit log kaydı oluşturulamadı:', error);
  }
}
