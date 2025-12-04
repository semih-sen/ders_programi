import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: {
    place?: string;
    lecturer?: string;
    description?: string;
  };
}

/**
 * Google Calendar'dan kullanıcının etkinliklerini çeker
 */
export async function getUserCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return [];
    }

    // Kullanıcının Google hesap bilgilerini al
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        providerAccountId: true,
      },
    });

    if (!account?.access_token) {
      console.warn('Google access token bulunamadı');
      return [];
    }

    // OAuth2 client oluştur
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    });

    // Token yenilenme kontrolü
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Yeni token'ı kaydet
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: account.providerAccountId || '',
          },
        },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        },
      });

      oauth2Client.setCredentials(credentials);
    }

    // Calendar API çağrısı
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Önümüzdeki 30 günlük etkinlikleri çek
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(now.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // FullCalendar formatına dönüştür
    return events.map((event: any) => {
      const start = event.start?.dateTime || event.start?.date || '';
      const end = event.end?.dateTime || event.end?.date || '';
      
      // Ders bilgilerini location ve description'dan çıkar
      const location = event.location || '';
      const description = event.description || '';
      
      return {
        id: event.id || '',
        title: event.summary || 'Etkinlik',
        start,
        end,
        color: getColorByTitle(event.summary || ''),
        extendedProps: {
          place: location,
          lecturer: extractLecturer(description),
          description: description,
        },
      };
    });
  } catch (error) {
    console.error('Google Calendar events fetch error:', error);
    return [];
  }
}

// Ders adına göre renk döndür
function getColorByTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('anatomi')) return '#3b82f6';
  if (lowerTitle.includes('fizyoloji')) return '#8b5cf6';
  if (lowerTitle.includes('histoloji')) return '#ec4899';
  if (lowerTitle.includes('biyokimya')) return '#f59e0b';
  if (lowerTitle.includes('yemek')) return '#10b981';
  
  return '#6366f1';
}

// Description'dan hoca adını çıkar
function extractLecturer(description: string): string {
  // "Hoca: Dr. X" gibi pattern'leri ara
  const match = description.match(/hoca[:\s]+([^\n]+)/i);
  return match ? match[1].trim() : '-';
}
