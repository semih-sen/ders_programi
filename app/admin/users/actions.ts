'use server';

import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { logAdminAction } from '@/lib/audit';

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
  
  // Audit log kaydı
  await logAdminAction('USER_BANNED', `Sebep: ${banReason.trim()}`, userId);
  
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
    // 1. Önce kullanıcının takvimini temizle
    try {
      const wipeResult = await wipeUserCalendar(userId);
      if (wipeResult.error) {
        console.warn('Takvim temizleme hatası (devam ediliyor):', wipeResult.error);
      } else if (wipeResult.success) {
        console.log(`Takvim temizlendi: ${wipeResult.deleted} etkinlik silindi.`);
      }
    } catch (calendarError) {
      console.warn('Takvim temizleme hatası (devam ediliyor):', calendarError);
    }

    // 2. Account kaydını bul
    const account = await prisma.account.findFirst({ where: { userId: userId } });
    if (account && account.refresh_token) {
      // 3. Token'ı deşifre et
      const decryptedToken = decrypt(account.refresh_token);
      if (decryptedToken) {
        // 4. Google revoke endpoint'ine isteği gönder
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
    // 5. Kullanıcıyı sil
    await prisma.user.delete({ where: { id: userId } });
    
    // Audit log kaydı
    await logAdminAction('USER_DELETED', 'Kullanıcı silindi.', userId);
    
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
 * Kullanıcının ödeme durumunu günceller
 */
export async function updatePaymentStatus(userId: string, status: 'UNPAID' | 'PAID' | 'FREE') {
  await checkAdmin();

  if (!userId) {
    return { error: 'Kullanıcı ID gerekli.' };
  }

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

  // Audit log kaydı
  await logAdminAction('USER_ACTIVATED_MANUAL', 'Manuel aktivasyon.', userId);

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

/**
 * Kullanıcının takvimindeki etkinlikleri belirli bir ay için getirir
 * @param userId - Kullanıcı ID
 * @param month - Ay (1-12)
 * @param year - Yıl
 */
export async function fetchUserCalendarEvents(userId: string, month: number, year: number) {
  await checkAdmin();

  if (!userId) {
    return { error: 'Kullanıcı ID gerekli.' };
  }

  try {
    const { getAccessToken, listSirkadiyenEvents } = await import('@/lib/google-calendar');

    // Ay başlangıç ve bitiş tarihlerini hesapla
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    // Access token al
    const accessToken = await getAccessToken(userId);

    // Sirkadiyen etkinliklerini listele
    const events = await listSirkadiyenEvents(accessToken, timeMin, timeMax);

    return { 
      success: true, 
      events,
      count: events.length 
    };
  } catch (error: any) {
    console.error('Takvim etkinlikleri getirme hatası:', error);
    return { 
      error: error.message || 'Takvim etkinlikleri getirilirken bir hata oluştu.' 
    };
  }
}

/**
 * Kullanıcının takvimindeki tüm Sirkadiyen etkinliklerini siler
 * @param userId - Kullanıcı ID
 */
export async function wipeUserCalendar(userId: string) {
  await checkAdmin();

  if (!userId) {
    return { error: 'Kullanıcı ID gerekli.' };
  }

  try {
    const { getAccessToken, listSirkadiyenEvents, batchDeleteEvents } = await import('@/lib/google-calendar');

    // Geniş bir tarih aralığı belirle (son 1 yıl + gelecek 1 yıl)
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const timeMin = oneYearAgo.toISOString();
    const timeMax = oneYearLater.toISOString();

    // Access token al
    const accessToken = await getAccessToken(userId);

    // Tüm Sirkadiyen etkinliklerini getir
    const events = await listSirkadiyenEvents(accessToken, timeMin, timeMax);

    if (events.length === 0) {
      return { 
        success: true, 
        message: 'Silinecek etkinlik bulunamadı.',
        deleted: 0 
      };
    }

    // Etkinlik ID'lerini topla
    const eventIds = events.map(e => e.id);

    // Batch silme işlemini yap
    const result = await batchDeleteEvents(accessToken, eventIds);

    // Audit log kaydı
    await logAdminAction(
      'CALENDAR_WIPED', 
      `${result.success} etkinlik silindi, ${result.failed} başarısız.`,
      userId
    );

    revalidatePath(`/admin/users/${userId}`);

    return { 
      success: true, 
      message: `Takvim temizlendi. ${result.success} etkinlik silindi.`,
      deleted: result.success,
      failed: result.failed
    };
  } catch (error: any) {
    console.error('Takvim silme hatası:', error);
    return { 
      error: error.message || 'Takvim silinirken bir hata oluştu.' 
    };
  }
}

/**
 * Kullanıcının Google Takvimine manuel, tek seferlik bir uyarı / etkinlik ekler.
 * @param userId - Etkinliğin ekleneceği kullanıcı
 * @param eventData - Etkinlik verileri (başlık, açıklama, tarih (YYYY-MM-DD), colorId)
 */
export async function sendManualEvent(
  userId: string,
  eventData: { title: string; description: string; date: string; colorId: string }
) {
  await checkAdmin();

  if (!userId) {
    return { error: 'Kullanıcı ID gerekli.' } as const;
  }
  if (!eventData?.title || !eventData?.date) {
    return { error: 'Etkinlik başlığı ve tarihi zorunludur.' } as const;
  }

  try {
    const account = await prisma.account.findFirst({
      where: { userId, provider: 'google' },
      select: { refresh_token: true },
    });

    if (!account?.refresh_token) {
      return { error: 'Kullanıcının Google hesabı veya refresh token bulunamadı.' } as const;
    }

    // Refresh token'ı deşifre et
    const decrypted = decrypt(account.refresh_token);
    if (!decrypted) {
      return { error: 'Refresh token deşifre edilemedi.' } as const;
    }

    // Yeni access token al
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: decrypted,
        grant_type: 'refresh_token',
      }),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error('Manual event token error:', t);
      return { error: 'Access token alınamadı.' } as const;
    }
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    // Etkinlik isteği
    const eventBody = {
      summary: eventData.title,
      description: eventData.description || '',
      start: { date: eventData.date }, // Tüm gün etkinlik
      end: { date: eventData.date },
      colorId: eventData.colorId || '11', // Varsayılan kırmızı
      transparency: 'transparent',
    };

    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!createRes.ok) {
      const errTxt = await createRes.text();
      console.error('Manual event create error:', errTxt);
      return { error: 'Etkinlik oluşturulamadı.' } as const;
    }

    // Audit log
    await logAdminAction(
      'MANUAL_EVENT_SENT',
      `Başlık: ${eventData.title} • Tarih: ${eventData.date}`,
      userId
    );

    // Kullanıcı detay sayfasını yeniden doğrula
    revalidatePath(`/admin/users/${userId}`);
    return { success: 'Etkinlik başarıyla eklendi.' } as const;
  } catch (error: any) {
    console.error('Manual event error:', error);
    return { error: error.message || 'Etkinlik gönderilirken hata oluştu.' } as const;
  }
}

/**
 * Kullanıcının takvimdeki bildirimlerini (reminders) günceller
 * Günün ilk dersine farklı, diğer derslere standart bildirim süresi uygular
 * @param userId - Kullanıcının ID'si
 * @param month - Ay (1-12)
 * @param year - Yıl
 */
export async function updateCalendarReminders(userId: string, month: number, year: number) {
  try {
    // Admin kontrolü
    await checkAdmin();

    // Kullanıcıyı ve bildirim tercihlerini al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationOffset: true,
        firstLessonOffset: true,
      },
    });

    if (!user) {
      return { error: 'Kullanıcı bulunamadı.' } as const;
    }

    // Google hesabını al
    const account = await prisma.account.findFirst({
      where: { userId },
      select: { refresh_token: true },
    });

    if (!account?.refresh_token) {
      return { error: 'Kullanıcının Google hesabı veya refresh token bulunamadı.' } as const;
    }

    // Refresh token'ı deşifre et
    const decrypted = decrypt(account.refresh_token);
    if (!decrypted) {
      return { error: 'Refresh token deşifre edilemedi.' } as const;
    }

    // Access token al
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: decrypted,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Token error:', errText);
      return { error: 'Access token alınamadı.' } as const;
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    // Ay için başlangıç ve bitiş tarihleri
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Google Calendar'dan etkinlikleri çek
    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarUrl.searchParams.set('timeMin', startDate.toISOString());
    calendarUrl.searchParams.set('timeMax', endDate.toISOString());
    calendarUrl.searchParams.set('singleEvents', 'true');
    calendarUrl.searchParams.set('orderBy', 'startTime');
    calendarUrl.searchParams.set('maxResults', '2500');

    const eventsRes = await fetch(calendarUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsRes.ok) {
      const errText = await eventsRes.text();
      console.error('Calendar events error:', errText);
      return { error: 'Takvim etkinlikleri alınamadı.' } as const;
    }

    const eventsData = await eventsRes.json();
    const allEvents = eventsData.items || [];

    // Ders etkinliklerini filtrele (description'da belirli anahtar kelimeler var)
    const lessonEvents = allEvents.filter((event: any) => {
      const desc = (event.description || '').toLowerCase();
      return desc.includes('sirkadiyen') || 
             desc.includes('dilim adı') || 
             desc.includes('uygulama detayları');
    });

    if (lessonEvents.length === 0) {
      return { error: 'Güncellenecek ders etkinliği bulunamadı.' } as const;
    }

    // Günün ilk dersini belirlemek için tarih takibi
    const processedDates = new Set<string>();
    const eventsToUpdate: Array<{ eventId: string; reminderMinutes: number }> = [];

    for (const event of lessonEvents) {
      // Etkinliğin tarihini al (YYYY-MM-DD)
      let eventDate: string;
      if (event.start?.dateTime) {
        eventDate = event.start.dateTime.split('T')[0];
      } else if (event.start?.date) {
        eventDate = event.start.date;
      } else {
        continue; // Tarih bilgisi yok, atla
      }

      // Bu günün ilk dersi mi kontrol et
      let reminderMinutes: number;
      if (!processedDates.has(eventDate)) {
        // İlk ders
        reminderMinutes = user.firstLessonOffset;
        processedDates.add(eventDate);
      } else {
        // Sonraki dersler
        reminderMinutes = user.notificationOffset;
      }

      eventsToUpdate.push({
        eventId: event.id,
        reminderMinutes,
      });
    }

    // Batch API ile güncelleme yap
    const boundary = `batch_${randomUUID()}`;
    let batchBody = '';

    for (const { eventId, reminderMinutes } of eventsToUpdate) {
      const patchBody = JSON.stringify({
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: reminderMinutes }],
        },
      });

      batchBody += `--${boundary}\r\n`;
      batchBody += `Content-Type: application/http\r\n\r\n`;
      batchBody += `PATCH /calendar/v3/calendars/primary/events/${eventId}\r\n`;
      batchBody += `Content-Type: application/json\r\n\r\n`;
      batchBody += `${patchBody}\r\n`;
    }
    batchBody += `--${boundary}--\r\n`;

    // Batch request gönder
    const batchRes = await fetch('https://www.googleapis.com/batch/calendar/v3', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/mixed; boundary=${boundary}`,
      },
      body: batchBody,
    });

    if (!batchRes.ok) {
      const errText = await batchRes.text();
      console.error('Batch update error:', errText);
      return { error: 'Toplu güncelleme başarısız oldu.' } as const;
    }

    // Audit log
    await logAdminAction(
      'CALENDAR_REMINDERS_UPDATED',
      `${month}/${year} ayı için ${eventsToUpdate.length} etkinlik güncellendi.`,
      userId
    );

    revalidatePath(`/admin/users/${userId}`);
    return { 
      success: true, 
      message: `${eventsToUpdate.length} adet dersin bildirimi güncellendi.` 
    } as const;

  } catch (error: any) {
    console.error('updateCalendarReminders error:', error);
    return { error: error.message || 'Bildirim güncellemesi sırasında hata oluştu.' } as const;
  }
}

/**
 * Kullanıcının bildirim ayarlarını günceller
 * @param userId - Kullanıcının ID'si
 * @param notificationOffset - Standart dersler için dakika
 * @param firstLessonOffset - İlk ders için dakika
 */
export async function updateNotificationSettings(
  userId: string, 
  notificationOffset: number, 
  firstLessonOffset: number
) {
  try {
    await checkAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationOffset,
        firstLessonOffset,
      },
    });

    await logAdminAction(
      'NOTIFICATION_SETTINGS_UPDATED',
      `Standart: ${notificationOffset}dk, İlk Ders: ${firstLessonOffset}dk`,
      userId
    );

    revalidatePath(`/admin/users/${userId}`);
    return { success: true } as const;
  } catch (error: any) {
    console.error('updateNotificationSettings error:', error);
    return { error: error.message || 'Ayarlar güncellenemedi.' } as const;
  }
}

/**
 * Kullanıcı adına Yıllık Eşitleme n8n iş akışını manuel olarak tetikler
 * Admin onarım aracı - Senkronizasyonu yarım kalan kullanıcılar için
 * @param userId - Yıllık eşitleme tetiklenecek kullanıcının ID'si
 */
export async function forceYearlySync(userId: string) {
  try {
    await checkAdmin();

    if (!userId) {
      return { error: 'Kullanıcı ID gerekli.' } as const;
    }

    // Çevre değişkenini kontrol et
    const webhookUrl = process.env.N8N_YEARLY_SYNC_WEBHOOK_URL;
    if (!webhookUrl) {
      return { error: 'N8N_YEARLY_SYNC_WEBHOOK_URL çevre değişkeni tanımlanmamış.' } as const;
    }

    const internalApiKey = process.env.N8N_INTERNAL_API_KEY;
    if (!internalApiKey) {
      return { error: 'N8N_INTERNAL_API_KEY çevre değişkeni tanımlanmamış.' } as const;
    }

    // n8n webhook'una POST isteği gönder
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${internalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        source: 'Admin_Force_Sync',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n yearly sync error:', errorText);
      return { error: `n8n webhook hatası: ${response.status} ${response.statusText}` } as const;
    }

    // İstek başarılı - Kullanıcının hasYearlySynced durumunu güncelle
    await prisma.user.update({
      where: { id: userId },
      data: { hasYearlySynced: true },
    });

    // Audit log kaydı
    await logAdminAction(
      'YEARLY_SYNC_FORCED',
      'Admin tarafından yıllık eşitleme manuel olarak tetiklendi.',
      userId
    );

    // Sayfayı yenile
    revalidatePath(`/admin/users/${userId}`);

    return { success: 'Yıllık eşitleme başarıyla tetiklendi.' } as const;
  } catch (error: any) {
    console.error('forceYearlySync error:', error);
    return { error: error.message || 'Yıllık eşitleme tetiklenirken hata oluştu.' } as const;
  }
}
