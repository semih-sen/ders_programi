import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import mammoth from 'mammoth';
import { load } from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

// Helper to parse Turkish date (e.g., "2 Eylül 2025")
const parseTurkishDate = (dateStr: string, timeStr: string): string | null => {
  const monthMap: { [key: string]: string } = {
    'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
    'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
  };

  const parts = dateStr.split(' ').filter(Boolean);
  if (parts.length < 3) return null; // e.g., "2", "Eylül", "2025"

  const day = parts[0].padStart(2, '0');
  const month = monthMap[parts[1]];
  const year = parts[2];

  if (!day || !month || !year) return null;

  const t = timeStr.trim();
  // Normalize possible time formats like "13:30" or "13.30"
  const hhmm = t.replace('.', ':');
  return `${year}-${month}-${day}T${hhmm}:00`;
};

export async function POST(request: Request) {
  try {
    // 1. Security: Check for Admin session
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    // 2. File Handling
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Parsing Logic: Mammoth (docx -> HTML)
    const { value: html } = await mammoth.convertToHtml({ buffer });

    // 4. Parsing Logic: Cheerio (HTML -> JSON)
    const $ = load(html);
    const jsonData: any[] = [];

    // Find the first table in the document
    $('table').first().find('tr').each((i, row) => {
      if (i === 0) return; // Skip header row

      const cells = $(row).find('td, th');
      if (cells.length >= 4) {
        const diseksiyon = $(cells[0]).text().trim();
        const grup = $(cells[1]).text().trim();
        const tarih = $(cells[2]).text().trim();
        const saat = $(cells[3]).text().trim();

        // Extract start and end times (e.g., "13:30-16:20")
        const [startTimeRaw, endTimeRaw] = saat.split('-').map(s => s?.trim());
        if (!startTimeRaw || !endTimeRaw) return; // Skip row if time is invalid

        const startISO = parseTurkishDate(tarih, startTimeRaw);
        const endISO = parseTurkishDate(tarih, endTimeRaw);

        if (startISO && endISO) {
          jsonData.push({
            summary: diseksiyon,
            group: grup,
            location: 'Anatomi Diseksiyon Salonu', // Default location
            start: { dateTime: startISO, timeZone: 'Europe/Istanbul' },
            end: { dateTime: endISO, timeZone: 'Europe/Istanbul' }
          });
        }
      }
    });

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'Dosyadan veri okunamadı. Dosya formatı bozuk olabilir.' }, { status: 400 });
    }

    // 5. Saving the JSON
    const saveDir = path.join(process.cwd(), 'private-data'); // Use a persistent dir
    const savePath = path.join(saveDir, 'anatomi-gruplari.json');

    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    fs.writeFileSync(savePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json({ success: true, message: `Anatomi programı başarıyla güncellendi. ${jsonData.length} ders işlendi.` });

  } catch (error) {
    console.error('Anatomi Upload Error:', error);
    return NextResponse.json({ error: 'Dosya işlenirken sunucu hatası oluştu.' }, { status: 500 });
  }
}
