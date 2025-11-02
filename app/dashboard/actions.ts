'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import { Buffer } from 'node:buffer';

/**
 * Activate a user account with a license key
 */
export type ActivationState = {
  success?: boolean;
  message?: string;
  error?: string;
};

// Server action compatible with useFormState(prevState, formData)
export async function activateAccount(
  _prevState: ActivationState | undefined,
  formData: FormData
): Promise<ActivationState> {
  // Get the current session
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }

  const userId = session.user.id;
  const licenseKey = formData.get('licenseKey') as string;

  // Validate input
  if (!licenseKey || licenseKey.trim() === '') {
    return { error: 'Lütfen bir aktivasyon kodu girin.' };
  }

  try {
    // Find the license key
    const key = await prisma.licenseKey.findUnique({
      where: { id: licenseKey.trim() },
    });

    // Validate the key
    if (!key) {
      return { error: 'Geçersiz aktivasyon kodu.' };
    }

    if (key.isUsed) {
      return { error: 'Bu aktivasyon kodu daha önce kullanılmış.' };
    }

    // Activate the account in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Update the user to be activated
      await tx.user.update({
        where: { id: userId },
        data: { isActivated: true },
      });

      // Mark the license key as used and link it to the user
      await tx.licenseKey.update({
        where: { id: licenseKey.trim() },
        data: {
          isUsed: true,
          activatedByUserId: userId,
        },
      });
    });

    console.log('✅ Account activated:', userId, 'with key:', licenseKey);

    // Revalidate the dashboard page
    revalidatePath('/dashboard');

    return { success: true, message: 'Hesabınız başarıyla aktifleştirildi!' };
  } catch (error) {
    console.error('❌ Error activating account:', error);
    return { error: 'Hesap aktifleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.' };
  }
}

// ---------------------------------------------
// Test Drive: Trigger n8n Webhook (Server Action)
// ---------------------------------------------
export type WebhookState = {
  success?: boolean;
  message?: string;
};

export async function triggerTestWebhook(
  _prevState: WebhookState | undefined,
  _formData: FormData
): Promise<WebhookState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Yetkisiz erişim.' };
  }

  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_USER, N8N_WEBHOOK_PASS } = process.env;
  if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_USER || !N8N_WEBHOOK_PASS) {
    return { success: false, message: 'Sunucu yapılandırması eksik (n8n). Lütfen ortam değişkenlerini ayarlayın.' };
  }

  try {
    const basicAuth = Buffer.from(`${N8N_WEBHOOK_USER}:${N8N_WEBHOOK_PASS}`).toString('base64');

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: session.user.id, source: 'TestDriveButton' }),
      // You can add a timeout controller here if desired
      cache: 'no-store',
    });

    if (res.ok) {
      return { success: true, message: 'Webhook başarıyla tetiklendi!' };
    }

    return { success: false, message: 'N8N tetiklenirken hata oluştu.' };
  } catch (err) {
    console.error('❌ n8n webhook error:', err);
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' };
  }
}
