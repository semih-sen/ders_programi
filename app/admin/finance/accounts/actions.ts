'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/audit';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function listFinancialAccounts() {
  await checkAdmin();
  const accounts = await prisma.financialAccount.findMany({
    orderBy: { name: 'asc' },
  });
  return accounts;
}

export async function createFinancialAccount(name: string, type: string) {
  await checkAdmin();
  if (!name || !type) {
    return { error: 'Hesap adı ve türü zorunludur.' };
  }

  try {
    const account = await prisma.financialAccount.create({
      data: {
        name: name.trim(),
        type: type.trim().toUpperCase(),
      },
    });

    await logAdminAction(
      'FINANCIAL_ACCOUNT_CREATED',
      `Yeni hesap oluşturuldu: ${account.name} (${account.type})`,
      account.id
    );

    revalidatePath('/admin/finance/accounts');
    revalidatePath('/admin/finance');
    return { success: 'Hesap oluşturuldu.' };
  } catch (e) {
    console.error('Hesap oluşturma hatası:', e);
    return { error: 'Hesap oluşturulurken bir hata oluştu.' };
  }
}
