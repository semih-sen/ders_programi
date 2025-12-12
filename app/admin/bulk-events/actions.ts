'use server';

import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { google } from 'googleapis';

export type EventData = {
  title: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  colorId?: string;
};

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function sendBulkCalendarEvent(userIds: string[], eventDetails: EventData) {
  await checkAdmin();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { successCount: 0, errorCount: 0, error: 'Kullanıcı listesi boş.' } as const;
  }
  if (!eventDetails.title || !eventDetails.start || !eventDetails.end) {
    return { successCount: 0, errorCount: 0, error: 'Başlık, başlangıç ve bitiş zorunludur.' } as const;
  }

  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const account = await prisma.account.findFirst({
        where: { userId, provider: 'google' },
        select: { refresh_token: true },
      });

      if (!account?.refresh_token) {
        throw new Error('Refresh token yok');
      }

      const refreshToken = decrypt(account.refresh_token);
      if (!refreshToken) {
        throw new Error('Token çözülemedi');
      }

      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'postmessage'
      );
      oAuth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: eventDetails.title,
          description: eventDetails.description || '',
          start: { dateTime: new Date(eventDetails.start).toISOString() },
          end: { dateTime: new Date(eventDetails.end).toISOString() },
          colorId: eventDetails.colorId || '11',
          transparency: 'transparent',
        },
      });

      return true;
    })
  );

  let successCount = 0;
  let errorCount = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') successCount++;
    else errorCount++;
  }

  return { successCount, errorCount } as const;
}
