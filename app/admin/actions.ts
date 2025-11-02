'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

/**
 * Generate a new license key
 * Only accessible to ADMIN users
 */
export async function createLicenseKey() {
  // Security check: ensure user is admin
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Yetkisiz erişim. Sadece yöneticiler lisans anahtarı oluşturabilir.' };
  }

  try {
    // Generate unique code: TAK-XXXXXXXX
    const uniqueCode = `TAK-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    
    // Create the license key in database
    const licenseKey = await prisma.licenseKey.create({
      data: {
        id: uniqueCode,
      },
    });

    console.log('✅ License key created:', licenseKey.id);

    // Revalidate the admin page to show the new key
    revalidatePath('/admin');

    return { success: true, key: licenseKey.id };
  } catch (error) {
    console.error('❌ Error creating license key:', error);
    return { error: 'Lisans anahtarı oluşturulurken bir hata oluştu.' };
  }
}

/**
 * Delete a license key (optional feature)
 * Only accessible to ADMIN users
 */
export async function deleteLicenseKey(keyId: string) {
  // Security check: ensure user is admin
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Yetkisiz erişim.' };
  }

  try {
    // Check if key is already used
    const key = await prisma.licenseKey.findUnique({
      where: { id: keyId },
    });

    if (key?.isUsed) {
      return { error: 'Kullanılmış anahtarlar silinemez.' };
    }

    await prisma.licenseKey.delete({
      where: { id: keyId },
    });

    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting license key:', error);
    return { error: 'Anahtar silinirken bir hata oluştu.' };
  }
}
