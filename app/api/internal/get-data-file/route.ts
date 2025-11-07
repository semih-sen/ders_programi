import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Güvenlik: Internal API Key kontrolü
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim.' },
        { status: 401 }
      );
    }

    // 2. Query parametrelerini al
    const grade = req.nextUrl.searchParams.get('grade');
    const type = req.nextUrl.searchParams.get('type');

    // 3. Parametre doğrulama
    if (!grade || !type) {
      return NextResponse.json(
        { error: 'grade ve type parametreleri zorunludur.' },
        { status: 400 }
      );
    }

    // 4. Dosya yolunu oluştur
    const filePath = path.join(
      '/home/ghrunner/cinnasium-data',
      'private-data',
      `donem-${grade}`,
      `${type}.json`
    );

    // 5. Dosyanın varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { 
          error: 'Belirtilen dönem veya tür için dosya bulunamadı.',
          requested: {
            grade,
            type,
            path: `donem-${grade}/${type}.json`
          }
        },
        { status: 404 }
      );
    }

    // 6. Dosyayı oku ve JSON olarak dön
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      data: jsonData,
      metadata: {
        grade,
        type,
        path: `donem-${grade}/${type}.json`
      }
    });

  } catch (error) {
    console.error('Dosya okuma hatası:', error);
    return NextResponse.json(
      { error: 'Dosya okunurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
