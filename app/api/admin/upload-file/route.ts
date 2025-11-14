import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // 1. Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gereklidir.' },
        { status: 401 }
      );
    }

    // 2. Form verilerini al
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const grade = formData.get('grade') as string;
    const fileType = formData.get('fileType') as string;

    // 3. Doğrulama
    if (!file) {
      return NextResponse.json(
        { error: 'Lütfen bir dosya seçin.' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Sadece JSON dosyaları yüklenebilir.' },
        { status: 400 }
      );
    }

    if (!grade || !fileType) {
      return NextResponse.json(
        { error: 'Dönem ve dosya türü bilgileri eksik.' },
        { status: 400 }
      );
    }

    // 4. Dosya içeriğini oku ve JSON kontrolü yap
    const fileContent = await file.text();
    let rawJsonData;
    
    try {
      rawJsonData = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'Geçersiz JSON formatı. Lütfen dosyanızı kontrol edin.' },
        { status: 400 }
      );
    }

    // 4.5. Her bir item'a eşsiz ID ekle
    let structuredData;
    if (Array.isArray(rawJsonData)) {
      structuredData = rawJsonData.map(item => ({
        id: randomUUID(),
        ...item
      }));
    } else {
      structuredData = rawJsonData;
    }

    // 5. Depolama klasör yapısını oluştur
    const baseDir = path.join('/home/ghrunner/sirkadiyen-data', 'private-data');
    const gradeDir = path.join(baseDir, `donem-${grade}`);
    
    // Klasörler yoksa oluştur
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    if (!fs.existsSync(gradeDir)) {
      fs.mkdirSync(gradeDir, { recursive: true });
    }

    // 6. Dosyayı kaydet
    const filePath = path.join(gradeDir, `${fileType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(structuredData, null, 2), 'utf-8');

    // 7. Başarılı yanıt
    return NextResponse.json({
      success: true,
      message: `Dosya başarıyla kaydedildi: donem-${grade}/${fileType}.json`,
      path: `donem-${grade}/${fileType}.json`
    });

  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
