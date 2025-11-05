import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import fs from 'node:fs';
import path from 'node:path';

// --- HELPER FUNCTIONS ---
// Helper to parse Turkish date to YYYY-MM-DD format (e.g., "2 Eylül 2025 Salı" -> "2025-09-02")
const parseTurkishDate = (dateStr: string): string | null => {
  const monthMap: { [key: string]: string } = {
    'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
    'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
  };
  
  // Remove day names (Pazartesi, Salı, etc.) and clean up
  const cleanedDateStr = dateStr
    .replace(/Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar/g, '')
    .replace('.', '')
    .trim();
  
  const parts = cleanedDateStr.split(' ');
  if (parts.length < 3) return null;
  
  const day = parts[0].padStart(2, '0');
  const month = monthMap[parts[1]];
  const year = parts[2];
  
  if (!day || !month || !year) return null;
  
  return `${year}-${month}-${day}`;
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

    // 3. Parsing Logic: Simple iteration - each row has complete info
    const structuredData: any[] = [];

    for (const item of rawJsonData) {
      // Her satırdan gerekli bilgileri al
      const dateStr = item.tarih;        // e.g., "2 Eylül 2025 Salı"
      const timeRangeStr = item.saat;    // e.g., "13:30-14:20"
      const groupNum = item.grup;        // e.g., 1, 2, or 3
         

      // Validation: Skip if ANY required field is missing
      if (!dateStr || !timeRangeStr || !groupNum ) {
        console.warn('Eksik veri, satır atlanıyor:', item);
        continue;
      }

      // Date Formatting: Convert Turkish date to YYYY-MM-DD format
      const isoDate = parseTurkishDate(dateStr);
      if (!isoDate) {
        console.warn('Geçersiz tarih formatı, satır atlanıyor:', dateStr);
        continue;
      }

      // Time Parsing: Split "13:30-14:20" into start and end times
      const [startTime, endTime] = timeRangeStr.split('-');
      if (!startTime || !endTime) {
        console.warn('Geçersiz saat formatı, satır atlanıyor:', timeRangeStr);
        continue;
      }

      // n8n için temiz obje oluştur
      structuredData.push({
        date: isoDate,                    // e.g., "2025-09-02"
        startTime: startTime.trim(),      // e.g., "13:30"
        endTime: endTime.trim(),          // e.g., "14:20"
        group: groupNum,                  // Raw number: 1, 2, or 3          // e.g., "DİSEKSİYON (1/13)"
        location: 'Anatomi Diseksiyon Salonu'  // Sabit yer
      });
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
