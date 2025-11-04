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

export async function toggleUserBan(userId: string, isBanned: boolean) {
  await checkAdmin();
  
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: !isBanned },
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