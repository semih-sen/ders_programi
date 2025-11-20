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
  date?: Date | string;
  status?: 'COMPLETED' | 'PENDING';
}

/**
 * Yeni finansal işlem ekler
 * Eğer işlem bir gelir ve kullanıcı seçilmişse, kullanıcının ödeme durumunu PAID yapar
 * Status COMPLETED ise kasayı etkiler, PENDING ise sadece kayıt oluşturur
 */
export async function addTransaction(data: AddTransactionData) {
  await checkAdmin();

  try {
    const { amount, type, category, description, userId, accountId, date, status = 'COMPLETED' } = data;

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
          status: status as any,
          category: category.trim(),
          description: description?.trim() || null,
          userId: userId || null,
          accountId,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Bakiye güncelle - Sadece COMPLETED durumundaki işlemler kasayı etkiler
      if (status === 'COMPLETED') {
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
      }

      return transaction;
    });

    // Audit log kaydı
    const logDetails = type === 'INCOME' 
      ? `Gelir eklendi: ${amount} TL - ${category} (${status})` 
      : type === 'EXPENSE'
      ? `Gider eklendi: ${amount} TL - ${category} (${status})`
      : `Kâr dağıtımı: ${amount} TL - ${category} (${status})`;
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
    const { amount, type, category, description, userId, accountId, date, status } = data;

    // Mevcut işlemi getir
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existingTransaction) {
      return { error: 'İşlem bulunamadı.' };
    }

    // Eğer tutar, hesap veya durum değişiyorsa bakiye güncellemesi gerekir
    const amountChanged = amount !== undefined && amount !== existingTransaction.amount;
    const accountChanged = accountId !== undefined && accountId !== existingTransaction.accountId;
    const statusChanged = status !== undefined && status !== existingTransaction.status;

    await prisma.$transaction(async (tx: any) => {
      // Eski bakiyeyi geri al (sadece COMPLETED işlemler kasayı etkiliyordu)
      if ((amountChanged || accountChanged || statusChanged) && existingTransaction.status === 'COMPLETED') {
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
          ...(status !== undefined && { status: status as any }),
          ...(category !== undefined && { category: category.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(userId !== undefined && { userId: userId || null }),
          ...(accountId !== undefined && { accountId }),
          ...(date !== undefined && { date: new Date(date) }),
        },
      });

      // Yeni bakiyeyi uygula (sadece COMPLETED işlemler kasayı etkiler)
      const newStatus = status ?? existingTransaction.status;
      if ((amountChanged || accountChanged || statusChanged) && newStatus === 'COMPLETED') {
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
 * Eğer işlem COMPLETED durumundaysa, bakiyeyi geri alır
 */
export async function deleteTransaction(id: string) {
  await checkAdmin();

  try {
    // İşlemi getir
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return { error: 'İşlem bulunamadı.' };
    }

    await prisma.$transaction(async (tx: any) => {
      // İşlemi sil
      await tx.transaction.delete({
        where: { id },
      });

      // Eğer COMPLETED işlemse, bakiyeyi geri al
      if (transaction.status === 'COMPLETED' && transaction.type !== 'TRANSFER') {
        const sign = transaction.type === 'INCOME' ? -1 : 1;
        await tx.financialAccount.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: sign * transaction.amount } },
        });
      }
    });

    await logAdminAction('TRANSACTION_DELETED', `İşlem silindi: ${transaction.category}`, id);
    revalidatePath('/admin/finance');
    return { success: 'İşlem başarıyla silindi.' };
  } catch (error) {
    console.error('İşlem silme hatası:', error);
    return { error: 'İşlem silinirken bir hata oluştu.' };
  }
}

/**
 * Finansal istatistikleri hesaplar ve döner
 * Sadece COMPLETED işlemler toplam hesaplamaya dahil edilir
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

    // Toplam gelir - Sadece COMPLETED işlemler
    const totalIncome = transactions
      .filter((t: any) => t.type === 'INCOME' && t.status === 'COMPLETED')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Toplam gider - Sadece COMPLETED işlemler
    const totalExpense = transactions
      .filter((t: any) => (t.type === 'EXPENSE' || t.type === 'DISTRIBUTION') && t.status === 'COMPLETED')
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
 * Dönem Bazlı Finans Raporu
 * Belirtilen tarih aralığı için detaylı finansal rapor oluşturur
 */
export async function getFinanceReport(startDate: Date, endDate: Date) {
  await checkAdmin();

  try {
    // Hesapları getir
    const accounts = await prisma.financialAccount.findMany({ 
      orderBy: { name: 'asc' } 
    });

    // 1. DEVREDEN VARLIK (Opening Balance)
    // Dönem başından önceki tüm COMPLETED işlemlerin net bakiyesi
    const openingBalanceData = await prisma.transaction.aggregate({
      where: {
        date: { lt: startDate },
        status: 'COMPLETED',
        type: { not: 'TRANSFER' },
      },
      _sum: {
        amount: true,
      },
    });

    // Devreden varlık hesabı için gelir ve gideri ayırarak hesaplayalım
    const openingTransactions = await prisma.transaction.findMany({
      where: {
        date: { lt: startDate },
        status: 'COMPLETED',
        type: { not: 'TRANSFER' },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    let openingBalance = 0;
    openingTransactions.forEach((t: any) => {
      if (t.type === 'INCOME') {
        openingBalance += t.amount;
      } else if (t.type === 'EXPENSE' || t.type === 'DISTRIBUTION') {
        openingBalance -= t.amount;
      }
    });

    // 2. DÖNEM İÇİ İŞLEMLER
    const periodTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: { not: 'TRANSFER' },
      },
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
    });

    // 3. DÖNEM GELİRLERİ
    const periodIncomeCompleted = periodTransactions
      .filter((t: any) => t.type === 'INCOME' && t.status === 'COMPLETED')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const periodIncomePending = periodTransactions
      .filter((t: any) => t.type === 'INCOME' && t.status === 'PENDING')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // 4. DÖNEM GİDERLERİ
    const periodExpenseCompleted = periodTransactions
      .filter((t: any) => (t.type === 'EXPENSE' || t.type === 'DISTRIBUTION') && t.status === 'COMPLETED')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const periodExpensePending = periodTransactions
      .filter((t: any) => (t.type === 'EXPENSE' || t.type === 'DISTRIBUTION') && t.status === 'PENDING')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // 5. HESAPLAMALAR
    const netChange = periodIncomeCompleted - periodExpenseCompleted; // Dönem net farkı (sadece gerçekleşenler)
    const currentBalance = openingBalance + netChange; // Bugünkü kasa (gerçekleşen işlemler)
    const projectedClosing = currentBalance + periodIncomePending - periodExpensePending; // Tahmini dönem sonu

    // 6. KATEGORİ BAZLI DAĞILIM (Dönem içi)
    const categoryBreakdown: Record<string, number> = {};
    periodTransactions.forEach((t: any) => {
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = 0;
      }
      const amount = t.status === 'COMPLETED' ? t.amount : 0; // Sadece tamamlananları kategori dağılımına dahil et
      categoryBreakdown[t.category] += t.type === 'INCOME' ? amount : -amount;
    });

    return {
      // Devreden varlık
      openingBalance,
      
      // Dönem gelirleri
      periodIncome: {
        completed: periodIncomeCompleted,
        pending: periodIncomePending,
        total: periodIncomeCompleted + periodIncomePending,
      },
      
      // Dönem giderleri
      periodExpense: {
        completed: periodExpenseCompleted,
        pending: periodExpensePending,
        total: periodExpenseCompleted + periodExpensePending,
      },
      
      // Net değişim ve bakiyeler
      netChange,
      currentBalance,
      projectedClosing,
      
      // İşlemler ve hesaplar
      transactions: periodTransactions,
      accounts,
      
      // Kategori dağılımı
      categoryBreakdown,
    };
  } catch (error) {
    console.error('Dönem raporu hesaplama hatası:', error);
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

/**
 * İşlem durumunu değiştirir: PENDING <-> COMPLETED
 * Durum değiştiğinde bakiye de buna göre güncellenir
 */
export async function toggleTransactionStatus(id: string) {
  await checkAdmin();

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!transaction) {
      return { error: 'İşlem bulunamadı.' };
    }

    // Transfer işlemlerinin durumu değiştirilemez
    if (transaction.type === 'TRANSFER') {
      return { error: 'Transfer işlemlerinin durumu değiştirilemez.' };
    }

    const newStatus = transaction.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    await prisma.$transaction(async (tx: any) => {
      // Durumu güncelle
      await tx.transaction.update({
        where: { id },
        data: { status: newStatus as any },
      });

      // Bakiye güncellemesi
      const sign = transaction.type === 'INCOME' ? 1 : -1;
      const balanceChange = newStatus === 'COMPLETED' 
        ? sign * transaction.amount  // PENDING -> COMPLETED: Kasaya ekle/çıkar
        : -sign * transaction.amount; // COMPLETED -> PENDING: Kasadan geri al

      await tx.financialAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });

      // Eğer gelir işlemi COMPLETED'a çevriliyorsa ve kullanıcı varsa, ödeme durumunu güncelle
      if (transaction.type === 'INCOME' && transaction.userId && newStatus === 'COMPLETED') {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { paymentStatus: 'PAID' },
        });
      }
    });

    await logAdminAction(
      'TRANSACTION_STATUS_CHANGED',
      `İşlem durumu değiştirildi: ${transaction.category} - ${transaction.status} -> ${newStatus}`,
      id
    );

    revalidatePath('/admin/finance');
    return { success: `İşlem durumu ${newStatus === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'} olarak güncellendi.` };
  } catch (error) {
    console.error('Durum değiştirme hatası:', error);
    return { error: 'Durum değiştirilirken bir hata oluştu.' };
  }
}

/**
 * Belirtilen yılın aylık bilançosunu döner
 * Her ay için: income, expense, payables, receivables
 */
export async function getMonthlyBalanceSheet(year: number) {
  await checkAdmin();

  try {
    // Yılın başlangıç ve bitiş tarihleri
    const startDate = new Date(year, 0, 1); // 1 Ocak
    const endDate = new Date(year + 1, 0, 1); // 1 Ocak (bir sonraki yıl)

    // Yılın tüm işlemlerini getir
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        type: {
          not: 'TRANSFER', // Transfer işlemlerini hariç tut
        },
      },
      orderBy: { date: 'asc' },
    });

    // 12 aylık veri yapısı oluştur
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthName: new Date(year, index, 1).toLocaleDateString('tr-TR', { month: 'long' }),
      income: 0,
      expense: 0,
      payables: 0,
      receivables: 0,
    }));

    // İşlemleri aylara göre kategorize et
    transactions.forEach((transaction: any) => {
      const month = new Date(transaction.date).getMonth(); // 0-11
      const isIncome = transaction.type === 'INCOME';
      const isExpense = transaction.type === 'EXPENSE' || transaction.type === 'DISTRIBUTION';

      if (transaction.status === 'COMPLETED') {
        if (isIncome) {
          monthlyData[month].income += transaction.amount;
        } else if (isExpense) {
          monthlyData[month].expense += transaction.amount;
        }
      } else if (transaction.status === 'PENDING') {
        if (isIncome) {
          monthlyData[month].receivables += transaction.amount;
        } else if (isExpense) {
          monthlyData[month].payables += transaction.amount;
        }
      }
    });

    return monthlyData;
  } catch (error) {
    console.error('Aylık bilanço hesaplama hatası:', error);
    throw error;
  }
}
