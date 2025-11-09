'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import { Buffer } from 'node:buffer';
import { z } from 'zod';

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
export type YearlySyncState = {
  success?: boolean;
  message?: string;
};

export async function triggerYearlySync(
  _prevState: YearlySyncState | undefined,
  _formData: FormData
): Promise<YearlySyncState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Yetkisiz erişim.' };
  }

  const userId = session.user.id;

  // Kullanıcının daha önce yıllık senkronizasyon yapıp yapmadığını kontrol et
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasYearlySynced: true },
  });

  if (user?.hasYearlySynced) {
    return { success: false, message: 'Yıllık senkronizasyon daha önce yapılmış. Tekrar yapılamaz.' };
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
      body: JSON.stringify({ userId, source: 'YearlyCalendarSync' }),
      cache: 'no-store',
    });

    if (res.ok) {
      // Senkronizasyon başarılı, kullanıcıyı işaretle
      await prisma.user.update({
        where: { id: userId },
        data: { hasYearlySynced: true },
      });

      revalidatePath('/dashboard');
      
      return { success: true, message: 'Yıllık senkronizasyon başarıyla başlatıldı!' };
    }

    return { success: false, message: 'Senkronizasyon tetiklenirken hata oluştu.' };
  } catch (err) {
    console.error('❌ Yearly sync error:', err);
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' };
  }
}

// ---------------------------------------------
// Onboarding: Save User Preferences (Server Action)
// ---------------------------------------------

// Zod schema for validation
const CoursePreferenceSchema = z.object({
  addToCalendar: z.boolean(),
  notifications: z.boolean(),
});

const OnboardingDataSchema = z.object({
  uygulamaGrubu: z.string().optional(),
  anatomiGrubu: z.string().optional(),
  yemekhaneEklensin: z.boolean().default(false),
  classYear: z.number().int().positive().optional(),
  language: z.enum(['TR', 'EN']).optional(),
  coursePreferences: z.record(z.string(), CoursePreferenceSchema),
});

export type OnboardingData = z.infer<typeof OnboardingDataSchema>;

export type OnboardingState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function saveOnboardingPreferences(
  data: OnboardingData
): Promise<OnboardingState> {
  try {
    // Validate the input data
    const validated = OnboardingDataSchema.parse(data);

    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
    }

    const userId = session.user.id;

    // Check if user is activated
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActivated: true, hasCompletedOnboarding: true },
    });

    if (!user?.isActivated) {
      return { error: 'Hesabınız aktif değil.' };
    }

    if (user.hasCompletedOnboarding) {
      return { error: 'Onboarding zaten tamamlanmış.' };
    }

    // Map course preferences to array format for createMany
    const coursePrefsData = Object.entries(validated.coursePreferences).map(
      ([courseId, prefs]) => ({
        userId,
        courseId,
        addToCalendar: (prefs as { addToCalendar: boolean; notifications: boolean }).addToCalendar,
        notifications: (prefs as { addToCalendar: boolean; notifications: boolean }).notifications,
      })
    );

    // Save everything in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Update user with onboarding data
      await tx.user.update({
        where: { id: userId },
        data: {
          hasCompletedOnboarding: true,
          uygulamaGrubu: validated.uygulamaGrubu,
          anatomiGrubu: validated.anatomiGrubu,
          yemekhaneEklensin: validated.yemekhaneEklensin,
          classYear: validated.classYear,
          language: validated.language,
        },
      });

      // Create course subscriptions
      if (coursePrefsData.length > 0) {
        await tx.userCourseSubscription.createMany({
          data: coursePrefsData,
        });
      }
    });

    console.log('✅ Onboarding completed for user:', userId);

    // Revalidate the dashboard page
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Tercihleriniz başarıyla kaydedildi!',
    };
  } catch (error) {
    console.error('❌ Error saving onboarding preferences:', error);
    
    if (error instanceof z.ZodError) {
      return {
        error: 'Geçersiz veri formatı. Lütfen tüm alanları kontrol edin.',
      };
    }

    return {
      error: 'Tercihler kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}
