import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import fs from 'node:fs';
import path from 'node:path';

// --- HELPER FUNCTIONS ---
// Helper to find the dynamic date key (e.g., "...LİSTESİ")
const findDateKey = (obj: any): string | null => {
  return Object.keys(obj).find(k => k.includes('LİSTESİ')) || null;
};

// Helper to map group number (1, 2, 3) to full group name
const mapGroupNumberToName = (num: number): string => {
  const groupMap: { [key: number]: string } = {
    1: "Anatomi - A (1,2,3)",
    2: "Anatomi - B (4,5,6)",
    3: "Anatomi - C (7,8,9)"
    // Add more groups if they exist
  };
  return groupMap[num] || `Bilinmeyen Grup (${num})`;
};

// Helper to parse Turkish date (e.g., "9 Eylül 2025 Salı")
const parseTurkishDate = (dateStr: string, timeStr: string): string | null => {
  const monthMap: { [key: string]: string } = {
    'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
    'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
  };
  const cleanedDateStr = dateStr.replace('.', '').replace('Salı', '').replace('Pazartesi', '').replace('Çarşamba', '').replace('Perşembe', '').replace('Cuma', '').trim();
  const parts = cleanedDateStr.split(' ');
  if (parts.length < 3) return null; 
  const day = parts[0].padStart(2, '0');
  const month = monthMap[parts[1]];
  const year = parts[2];
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}T${timeStr}:00`;
};

// --- API HANDLER ---
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
    const rawJsonData: any[] = JSON.parse(fileContent);

    // 3. Parsing Logic: "State Machine" for 3-row pattern
    const structuredData: any[] = [];
    let currentSharedDate: string | null = null;

    for (const row of rawJsonData) {
      // Check if this row *also* contains a new date
      const dateKey = findDateKey(row);
      if (dateKey) {
        currentSharedDate = row[dateKey];
      }

      // Now process the time and group (which might be in the same row or a following row)
      const timeRangeStr = row.Column3;
      const groupNum = row.Column4;

      if (!timeRangeStr || !groupNum || !currentSharedDate) {
        // This row is incomplete (e.g., just a header), or we haven't found a date yet.
        continue;
      }

      const [startTime, endTime] = timeRangeStr.split('-');
      if (!startTime || !endTime) continue;

      const startISO = parseTurkishDate(currentSharedDate, startTime);
      const endISO = parseTurkishDate(currentSharedDate, endTime);
      const groupName = mapGroupNumberToName(groupNum);

      if (startISO && endISO) {
        structuredData.push({
          summary: `Anatomi Diseksiyonu (${groupName})`,
          group: groupName,
          location: 'Anatomi Diseksiyon Salonu',
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
