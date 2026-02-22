'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function banUsersBulk(userIds: string[], reason: string) {
  const session = await checkAdmin();

  const uniqueIds = Array.from(new Set(userIds || []));
  const sanitizedReason = (reason || '').trim();

  if (uniqueIds.length === 0) {
    return { successCount: 0, skippedCount: 0, error: 'Kullanıcı seçilmedi.' } as const;
  }

  if (!sanitizedReason) {
    return { successCount: 0, skippedCount: 0, error: 'Ban sebebi zorunludur.' } as const;
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, isBanned: true },
  });

  type UserRow = { id: string; isBanned: boolean };

  const alreadyBanned = (users as UserRow[]).filter((u) => u.isBanned).map((u) => u.id);
  const toBan = (users as UserRow[]).filter((u) => !u.isBanned).map((u) => u.id);

  if (toBan.length === 0) {
    return { successCount: 0, skippedCount: alreadyBanned.length, error: 'Seçili kullanıcıların hepsi zaten banlı.' } as const;
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: toBan } },
      data: {
        isBanned: true,
        banReason: sanitizedReason,
      },
    }),
    ...toBan.map((id: string) =>
      prisma.auditLog.create({
        data: {
          action: 'USER_BANNED_BULK',
          details: `Toplu ban: ${sanitizedReason}`,
          entityId: id,
          adminId: session.user.id,
        },
      })
    ),
  ]);

  revalidatePath('/admin/users');
  revalidatePath('/admin/bulk-ban');

  return {
    success: true,
    successCount: toBan.length,
    skippedCount: alreadyBanned.length,
  } as const;
}
