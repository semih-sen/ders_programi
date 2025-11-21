import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

/**
 * Google Calendar API yardımcı fonksiyonları
 * Admin paneli için kullanıcı takvim yönetimi
 */

/**
 * Kullanıcının refresh token'ını alıp Google'dan yeni access token üretir
 * @param userId - Kullanıcı ID'si
 * @returns Access token
 */
export async function getAccessToken(userId: string): Promise<string> {
  // Kullanıcının hesap bilgilerini al
  const account = await prisma.account.findFirst({
    where: {
      userId: userId,
      provider: 'google',
    },
    select: {
      refresh_token: true,
    },
  });

  if (!account?.refresh_token) {
    throw new Error('Kullanıcının Google hesabı veya refresh token bulunamadı');
  }

  // Token'ı deşifre et
  const decryptedToken = decrypt(account.refresh_token);
  if (!decryptedToken) {
    throw new Error('Refresh token deşifre edilemedi');
  }

  // Google'dan yeni access token al
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: decryptedToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google token refresh error:', errorText);
    throw new Error('Access token alınamadı');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Belirtilen tarih aralığındaki "Sirkadiyen" etkinliklerini listeler
 * @param accessToken - Google access token
 * @param timeMin - Başlangıç tarihi (ISO 8601)
 * @param timeMax - Bitiş tarihi (ISO 8601)
 * @returns Filtrelenmiş etkinlik listesi
 */
export async function listSirkadiyenEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  // Google Calendar API'den etkinlikleri çek
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('maxResults', '2500'); // Maksimum sonuç sayısı
  url.searchParams.set('singleEvents', 'true');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Calendar API error:', errorText);
    throw new Error('Takvim etkinlikleri alınamadı');
  }

  const data = await response.json();
  const items = data.items || [];

  // "Sirkadiyen" imzalı etkinlikleri filtrele
  // Description veya summary alanında "Sirkadiyen" geçenleri bul
  const sirkadiyenEvents = items.filter((event: any) => {
    const description = event.description || '';
    const summary = event.summary || '';
    
    // "Sirkadiyen" veya "sirkadiyen" içeren etkinlikleri filtrele
    return (
      description.toLowerCase().includes('sirkadiyen') ||
      summary.toLowerCase().includes('sirkadiyen') ||
      description.includes('🧬') || // Proje emoji imzası
      description.includes('Ders Programı') // Alternatif imza
    );
  });

  // Sadece gerekli alanları dön
  return sirkadiyenEvents.map((event: any) => ({
    id: event.id,
    summary: event.summary || 'İsimsiz Etkinlik',
    description: event.description || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
  }));
}

/**
 * Batch API kullanarak birden fazla etkinliği siler
 * @param accessToken - Google access token
 * @param eventIds - Silinecek etkinlik ID'leri
 */
export async function batchDeleteEvents(
  accessToken: string,
  eventIds: string[]
): Promise<{ success: number; failed: number }> {
  if (eventIds.length === 0) {
    return { success: 0, failed: 0 };
  }

  // Batch isteklerini 50'şer gruplara böl (Google limiti)
  const batchSize = 50;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < eventIds.length; i += batchSize) {
    const chunk = eventIds.slice(i, i + batchSize);
    const boundary = `batch_delete_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Multipart/mixed body oluştur
    const batchBody = chunk
      .map((eventId, index) => {
        return [
          `--${boundary}`,
          'Content-Type: application/http',
          `Content-ID: <item${index + 1}>`,
          '',
          `DELETE /calendar/v3/calendars/primary/events/${eventId}`,
          '',
        ].join('\r\n');
      })
      .join('\r\n');

    const finalBody = `${batchBody}\r\n--${boundary}--`;

    // Batch isteği gönder
    const response = await fetch('https://www.googleapis.com/batch/calendar/v3', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/mixed; boundary=${boundary}`,
        Authorization: `Bearer ${accessToken}`,
      },
      body: finalBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Batch delete error:', errorText);
      totalFailed += chunk.length;
      continue;
    }

    // Yanıtı parse et
    const responseText = await response.text();
    
    // Basit başarı/hata sayımı (her 200-299 arası başarılı)
    const successCount = (responseText.match(/HTTP\/\d\.\d 2\d{2}/g) || []).length;
    totalSuccess += successCount;
    totalFailed += chunk.length - successCount;
  }

  return { success: totalSuccess, failed: totalFailed };
}

// Type tanımlamaları
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
}
