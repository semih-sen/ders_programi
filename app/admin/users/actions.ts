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

/**
 * Kullanıcıyı banlar (yasaklar)
 * @param formData - userId ve banReason içerir
 */
export async function banUser(formData: FormData) {
  await checkAdmin();
  
  const userId = formData.get('userId') as string;
  const banReason = formData.get('banReason') as string;

  if (!userId) {
    throw new Error('Kullanıcı ID gerekli');
  }

  if (!banReason || banReason.trim() === '') {
    throw new Error('Ban sebebi belirtilmeli');
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
      isBanned: true,
      banReason: banReason.trim(),
    },
  });
  
  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Kullanıcının banını kaldırır
 * @param userId - Banı kaldırılacak kullanıcının ID'si
 */
export async function unbanUser(userId: string) {
  await checkAdmin();
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
      isBanned: false,
      banReason: null,
    },
  });
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  await checkAdmin();
  
  await prisma.user.delete({
    where: { id: userId },
  });
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function toggleUserRole(userId: string, currentRole: 'ADMIN' | 'USER') {
  await checkAdmin();
  
  const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  
  revalidatePath('/admin/users');
  return { success: true };
}
