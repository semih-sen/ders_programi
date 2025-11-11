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


async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}




export async function revokeLicense(keyId: string, userId: string) {
  await checkAdmin();
  await prisma.$transaction([
    prisma.licenseKey.update({
      where: { id: keyId },
      data: { isUsed: false, activatedByUserId: null },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { isActivated: false },
    }),
  ]);
  revalidatePath('/admin');
  revalidatePath('/admin/licenses');
  return { success: true };
}

/**
 * Trigger Daily Refresh workflow in n8n manually
 * This normally runs via CRON at 05:00 every day
 * Only accessible to ADMIN users
 */
export async function triggerDailyRefresh() {
  // Security check: ensure user is admin
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Yetkisiz erişim. Sadece yöneticiler bu işlemi yapabilir.' };
  }

  try {
    const webhookUrl = process.env.N8N_DAILY_REFRESH_WEBHOOK_URL;
    const apiKey = process.env.N8N_INTERNAL_API_KEY;

    // Validate environment variables
    if (!webhookUrl || !apiKey) {
      console.error('❌ Missing environment variables: N8N_DAILY_REFRESH_WEBHOOK_URL or N8N_INTERNAL_API_KEY');
      return { error: 'Sunucu yapılandırması eksik. Lütfen sistem yöneticisine başvurun.' };
    }

    console.log('🔄 Triggering daily refresh workflow manually...');

    // Make POST request to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        triggeredBy: 'AdminPanel_ManualButton',
        triggeredAt: new Date().toISOString(),
        adminEmail: session.user.email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n workflow trigger failed:', response.status, errorText);
      return { error: `İş akışı tetiklenemedi (HTTP ${response.status}). Lütfen n8n bağlantısını kontrol edin.` };
    }

    const result = await response.json();
    console.log('✅ Daily refresh workflow triggered successfully:', result);

    return { success: 'Günlük eşitleme başarıyla tetiklendi! Tüm aktif kullanıcıların takvimleri yenilenecek.' };
  } catch (error) {
    console.error('❌ Error triggering daily refresh:', error);
    return { error: 'İş akışı tetiklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' };
  }
}
