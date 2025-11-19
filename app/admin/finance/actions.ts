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

interface AddTransactionData {
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'DISTRIBUTION';
  category: string;
  description?: string;
  userId?: string;
  accountId: string;
}

/**
 * Yeni finansal işlem ekler
 * Eğer işlem bir gelir ve kullanıcı seçilmişse, kullanıcının ödeme durumunu PAID yapar
 */
export async function addTransaction(data: AddTransactionData) {
  await checkAdmin();

  try {
    const { amount, type, category, description, userId, accountId } = data;

    if (!amount || amount <= 0) {
      return { error: 'Geçerli bir tutar giriniz.' };
    }

    if (!category || category.trim() === '') {
      return { error: 'Kategori belirtilmeli.' };
    }
    if (!accountId) {
      return { error: 'Hangi hesaba ait olduğunu seçiniz.' };
    }

  const result = await prisma.$transaction(async (tx: any) => {
      // Transaction oluştur
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: type as any,
          category: category.trim(),
          description: description?.trim() || null,
          userId: userId || null,
          accountId,
        },
      });

      // Bakiye güncelle
      const sign = type === 'INCOME' ? 1 : -1; // DISTRIBUTION -> -1, EXPENSE -> -1
      await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: { increment: sign * amount } },
      });

      // Eğer bu bir gelir ve kullanıcı belirtilmişse, ödeme durumunu güncelle
      if (type === 'INCOME' && userId) {
        await tx.user.update({
          where: { id: userId },
          data: { paymentStatus: 'PAID' },
        });
      }

      return transaction;
    });

    // Audit log kaydı
    const logDetails = type === 'INCOME' 
      ? `Gelir eklendi: ${amount} TL - ${category}` 
      : type === 'EXPENSE'
      ? `Gider eklendi: ${amount} TL - ${category}`
      : `Kâr dağıtımı: ${amount} TL - ${category}`;
    await logAdminAction(
      type === 'INCOME' ? 'MONEY_COLLECTED' : 'EXPENSE_ADDED',
      logDetails,
      result.id
    );

    revalidatePath('/admin/finance');
    revalidatePath('/admin/users');
    return { success: 'İşlem başarıyla eklendi.' };
  } catch (error) {
    console.error('İşlem ekleme hatası:', error);
    return { error: 'İşlem eklenirken bir hata oluştu.' };
  }
}

/**
 * Finansal işlemi günceller
 */
export async function updateTransaction(id: string, data: Partial<AddTransactionData>) {
  await checkAdmin();

  try {
    const { amount, type, category, description, userId, accountId } = data;

    // Mevcut işlemi getir
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existingTransaction) {
      return { error: 'İşlem bulunamadı.' };
    }

    // Eğer tutar veya hesap değişiyorsa bakiye güncellemesi gerekir
    const amountChanged = amount !== undefined && amount !== existingTransaction.amount;
    const accountChanged = accountId !== undefined && accountId !== existingTransaction.accountId;

    await prisma.$transaction(async (tx: any) => {
      // Eski bakiyeyi geri al
      if (amountChanged || accountChanged) {
        const oldSign = existingTransaction.type === 'INCOME' ? -1 : 1;
        await tx.financialAccount.update({
          where: { id: existingTransaction.accountId },
          data: { balance: { increment: oldSign * existingTransaction.amount } },
        });
      }

      // Transaction'ı güncelle
      await tx.transaction.update({
        where: { id },
        data: {
          ...(amount !== undefined && { amount }),
          ...(type !== undefined && { type: type as any }),
          ...(category !== undefined && { category: category.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(userId !== undefined && { userId: userId || null }),
          ...(accountId !== undefined && { accountId }),
        },
      });

      // Yeni bakiyeyi uygula
      if (amountChanged || accountChanged) {
        const newAmount = amount ?? existingTransaction.amount;
        const newType = type ?? existingTransaction.type;
        const newAccountId = accountId ?? existingTransaction.accountId;
        const newSign = newType === 'INCOME' ? 1 : -1;
        
        await tx.financialAccount.update({
          where: { id: newAccountId },
          data: { balance: { increment: newSign * newAmount } },
        });
      }
    });

    await logAdminAction('TRANSACTION_UPDATED', `İşlem güncellendi: ${category || existingTransaction.category}`, id);
    revalidatePath('/admin/finance');
    return { success: 'İşlem başarıyla güncellendi.' };
  } catch (error) {
    console.error('İşlem güncelleme hatası:', error);
    return { error: 'İşlem güncellenirken bir hata oluştu.' };
  }
}

/**
 * Finansal işlemi siler
 */
export async function deleteTransaction(id: string) {
  await checkAdmin();

  try {
    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath('/admin/finance');
    return { success: 'İşlem başarıyla silindi.' };
  } catch (error) {
    console.error('İşlem silme hatası:', error);
    return { error: 'İşlem silinirken bir hata oluştu.' };
  }
}

/**
 * Finansal istatistikleri hesaplar ve döner
 */
export async function getFinancialStats() {
  await checkAdmin();

  try {
    const [transactions, accounts] = await Promise.all([
      prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        account: {
          select: { id: true, name: true, type: true },
        },
      },
    }),
      prisma.financialAccount.findMany({ orderBy: { name: 'asc' } }),
    ]);

    // Toplam gelir
    const totalIncome = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Toplam gider
    const totalExpense = transactions
      .filter((t: any) => t.type === 'EXPENSE' || t.type === 'DISTRIBUTION')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Net kasa
    const netBalance = totalIncome - totalExpense;

    // Kategori bazlı dağılım
    const categoryBreakdown: Record<string, number> = {};
    transactions.forEach((t: any) => {
      if (t.type === 'TRANSFER') return; // Transferleri kategorizasyondan hariç tut
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = 0;
      }
      categoryBreakdown[t.category] += t.type === 'INCOME' ? t.amount : -t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      netBalance,
      categoryBreakdown,
      transactions,
      accounts,
    };
  } catch (error) {
    console.error('İstatistik hesaplama hatası:', error);
    throw error;
  }
}

/**
 * Hesaplar arası virman/transfer
 */
export async function transferFunds(params: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}) {
  await checkAdmin();

  const { fromAccountId, toAccountId, amount, description } = params;
  if (!fromAccountId || !toAccountId) return { error: 'Kaynak ve hedef hesap seçilmelidir.' };
  if (fromAccountId === toAccountId) return { error: 'Kaynak ve hedef hesap farklı olmalıdır.' };
  if (!amount || amount <= 0) return { error: 'Geçerli bir tutar giriniz.' };

  try {
  await prisma.$transaction(async (tx: any) => {
      // Bakiye hareketleri
      await tx.financialAccount.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });
      await tx.financialAccount.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      // İşlem kayıtları (her iki hesap için TRANSFER olarak)
      await tx.transaction.create({
        data: {
          amount,
          type: 'TRANSFER' as any,
          category: 'Virman',
          description: description?.trim() || `Transfer: ${fromAccountId} -> ${toAccountId}`,
          accountId: fromAccountId,
          relatedAccountId: toAccountId,
        },
      });

      await tx.transaction.create({
        data: {
          amount,
          type: 'TRANSFER' as any,
          category: 'Virman',
          description: description?.trim() || `Transfer: ${fromAccountId} -> ${toAccountId}`,
          accountId: toAccountId,
          relatedAccountId: fromAccountId,
        },
      });
    });

    await logAdminAction('FUNDS_TRANSFERRED', `Virman: ${amount} TL`, `${fromAccountId}->${toAccountId}`);
    revalidatePath('/admin/finance');
    return { success: 'Transfer başarıyla tamamlandı.' };
  } catch (e) {
    console.error('Transfer hatası:', e);
    return { error: 'Transfer sırasında bir hata oluştu.' };
  }
}

/**
 * Kullanıcının ödeme durumunu günceller
 */
export async function updateUserPaymentStatus(userId: string, status: 'UNPAID' | 'PAID' | 'FREE') {
  await checkAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { paymentStatus: status },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    return { success: 'Ödeme durumu güncellendi.' };
  } catch (error) {
    console.error('Ödeme durumu güncelleme hatası:', error);
    return { error: 'Ödeme durumu güncellenirken bir hata oluştu.' };
  }
}

/**
 * Tüm kullanıcıları ödeme araması için getirir
 */
export async function searchUsers(query: string) {
  await checkAdmin();

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        paymentStatus: true,
      },
      take: 10,
    });

    return users;
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    return [];
  }
}
