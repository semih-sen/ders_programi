import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import fs from 'node:fs';
import path from 'node:path';

// Helper to parse Turkish date (e.g., "2 Eylül 2025")
const parseTurkishDate = (dateStr: string, timeStr: string): string | null => {
  const monthMap: { [key: string]: string } = {
    'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
    'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
  };
  // Remove potential ordinal dots (e.g., "2." -> "2")
  const cleanedDateStr = dateStr.replace('.', '');
  const parts = cleanedDateStr.split(' ');
  if (parts.length < 3) {
    console.warn(`Invalid date format, skipping: ${dateStr}`);
    return null; 
  }
  const day = parts[0].padStart(2, '0');
  const month = monthMap[parts[1]];
  const year = parts[2];
  if (!day || !month || !year) {
    console.warn(`Invalid date components, skipping: ${dateStr}`);
    return null;
  }
  return `${year}-${month}-${day}T${timeStr}:00`; // ISO 8601
};

export async function POST(request: Request) {
  try {
    // 1. Security: Check for Admin session
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    // 2. File Handling (JSON)
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file || file.type !== 'application/json') {
      return NextResponse.json({ error: 'Geçersiz dosya. Lütfen bir .json dosyası yükleyin.' }, { status: 400 });
    }

    const fileContent = await file.text();
    const flatArray: string[] = JSON.parse(fileContent);

    // 3. Parsing Logic: Convert Flat Array to Structured JSON
    // We parse the 4-element pattern: [summary, group, date, timeRange]
    const structuredData: any[] = [];
    if (flatArray.length % 4 !== 0) {
      return NextResponse.json({ error: 'JSON dosyası bozuk. Veri 4\'lü gruplar halinde olmalı.' }, { status: 400 });
    }

    for (let i = 0; i < flatArray.length; i += 4) {
      const summary = flatArray[i];
      const group = flatArray[i + 1];
      const dateStr = flatArray[i + 2];
      const timeRangeStr = flatArray[i + 3];

      const [startTime, endTime] = timeRangeStr.split('-');
      if (!summary || !group || !dateStr || !startTime || !endTime) {
        console.warn(`Skipping incomplete entry at index ${i}`);
        continue;
      }

      const startISO = parseTurkishDate(dateStr, startTime);
      const endISO = parseTurkishDate(dateStr, endTime);

      if (startISO && endISO) {
        structuredData.push({
          summary: summary.trim(),
          group: group.trim(),
          location: 'Anatomi Diseksiyon Salonu', // Default location
          start: { dateTime: startISO, timeZone: 'Europe/Istanbul' },
          end: { dateTime: endISO, timeZone: 'Europe/Istanbul' }
        });
      }
    }
    
    if (structuredData.length === 0) {
      return NextResponse.json({ error: 'Dosyadan geçerli ders verisi okunamadı.' }, { status: 400 });
    }

    // 4. Saving the *Structured* JSON
    const saveDir = path.join(process.cwd(), 'private-data');
    const savePath = path.join(saveDir, 'anatomi-gruplari.json');

    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    fs.writeFileSync(savePath, JSON.stringify(structuredData, null, 2));

    return NextResponse.json({ success: true, message: `Anatomi programı başarıyla güncellendi. ${structuredData.length} ders işlendi.` });

  } catch (error) {
    console.error('Anatomi JSON Upload Error:', error);
    return NextResponse.json({ error: 'Dosya işlenirken sunucu hatası oluştu. (JSON formatını kontrol edin)' }, { status: 500 });
  }
}
