'use server';

import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

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
  try {
    // 1. Account kaydını bul
    const account = await prisma.account.findFirst({ where: { userId: userId } });
    if (account && account.refresh_token) {
      // 2. Token'ı deşifre et
      const decryptedToken = decrypt(account.refresh_token);
      if (decryptedToken) {
        // 3. Google revoke endpoint'ine isteği gönder
        try {
          const res = await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `token=${encodeURIComponent(decryptedToken)}`,
          });
          if (!res.ok && res.status !== 400) {
            // 400: token already revoked, hata değildir
            console.error('Google revoke error:', await res.text());
          } else if (res.status === 400) {
            // Token zaten iptal edilmiş olabilir
            console.log('Google revoke: token already revoked or invalid');
          }
        } catch (revokeErr) {
          console.error('Google revoke fetch error:', revokeErr);
        }
      }
    }
    // 4. Kullanıcıyı sil
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin/users');
    return { success: 'Kullanıcı ve Google erişim anahtarı başarıyla silindi.' };
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return { error: 'Kullanıcı silinirken bir hata oluştu.' };
  }
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

/**
 * Bir kullanıcının yıllık eşitleme durumunu (hasYearlySynced) sıfırlar.
 * Böylece kullanıcı dashboard'unda yeniden yıllık takvimi eşitleme işlemini başlatabilir.
 */
export async function resetYearlySync(userId: string) {
  await checkAdmin();

  if (!userId) {
    throw new Error('Kullanıcı ID gerekli');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { hasYearlySynced: false },
  });

  // İlgili kullanıcı detay sayfasını ve dashboard'u yeniden doğrula
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/dashboard');

  return { success: true, message: 'Yıllık eşitleme durumu sıfırlandı.' };
}

/**
 * Manuel Kullanıcı Aktifleştirme
 * - Admin, yüz yüze kayıtlar için kullanıcıyı manuel olarak aktifleştirir
 * - Yeni bir lisans anahtarı üretir ve kullanıcıya bağlar
 */
export async function manuallyActivateUser(userId: string) {
  await checkAdmin();

  if (!userId) {
    return { error: 'Kullanıcı ID gerekli.' } as const;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActivated: true },
  });

  if (!user) {
    return { error: 'Kullanıcı bulunamadı.' } as const;
  }

  if (user.isActivated) {
    return { error: 'Kullanıcı zaten aktif.' } as const;
  }

  // MAN- prefix ile yeni lisans anahtarı üret
  const newKeyId = `MAN-${randomUUID().toUpperCase().split('-')[0]}`;

  // Kullanıcıyı aktifleştirme ve lisans anahtarı oluşturmayı atomik işle
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isActivated: true,
        // İsteğe bağlı: Kullanıcı -> Lisans ilişkisi mevcutsa buradan bağlanabilir
        // activatedKey: { connect: { id: newKeyId } },
      },
    }),
    prisma.licenseKey.create({
      data: {
        id: newKeyId,
        isUsed: true,
        activatedByUserId: userId,
      },
    }),
  ]);

  // List ve detay sayfalarını yeniden doğrula
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);

  return { success: 'Kullanıcı manuel olarak aktifleştirildi.' } as const;
}

/**
 * Kullanıcı için admin notunu günceller
 * @param userId - Kullanıcı ID
 * @param notes - Admin notları
 */
export async function updateAdminNotes(userId: string, notes: string) {
  await checkAdmin();

  if (!userId) {
    throw new Error('Kullanıcı ID gerekli');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { 
      adminNotes: notes.trim() === '' ? null : notes.trim(),
    },
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  
  return { success: true };
}
