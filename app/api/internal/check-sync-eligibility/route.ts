import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Rate Limiting API for Daily Sync
 * 
 * n8n otomasyonu, günlük senkronizasyonu başlatmadan önce bu endpoint'i çağırır.
 * Eğer son 15 dakika içinde bir senkronizasyon başlatılmışsa, izin verilmez.
 * 
 * Bu sayede Google Drive'daki dosyalar peş peşe değişse bile,
 * gereksiz yere art arda senkronizasyon çalıştırılmaz.
 */

const COOLDOWN_MINUTES = 15; // Soğuma süresi (dakika)
const SYNC_KEY = 'LAST_SYNC_START'; // SystemSetting anahtarı

export async function POST(req: NextRequest) {
  try {
    // Güvenlik Kontrolü: N8N_INTERNAL_API_KEY
    const authHeader = req.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;

    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Şu anki zaman
    const now = new Date();

    // Son senkronizasyon zamanını veritabanından çek
    const lastSyncRecord = await prisma.systemSetting.findUnique({
      where: { key: SYNC_KEY },
    });

    // İlk kez çalışıyorsa (kayıt yoksa) - İZİN VER
    if (!lastSyncRecord) {
      // Yeni kayıt oluştur
      await prisma.systemSetting.create({
        data: {
          key: SYNC_KEY,
          value: now.toISOString(),
        },
      });

      return NextResponse.json({
        allowed: true,
        message: 'Senkronizasyon başlatılıyor... (İlk kez)',
        lastSync: null,
        cooldownRemaining: 0,
      });
    }

    // Kayıt varsa - Zaman farkını hesapla
    const lastSyncTime = new Date(lastSyncRecord.value);
    const timeDiffMs = now.getTime() - lastSyncTime.getTime();
    const timeDiffMinutes = Math.floor(timeDiffMs / 1000 / 60);

    // 15 dakikadan az ise - REDDET
    if (timeDiffMinutes < COOLDOWN_MINUTES) {
      const remainingMinutes = COOLDOWN_MINUTES - timeDiffMinutes;
      
      return NextResponse.json({
        allowed: false,
        message: `Sistem soğuma sürecinde. Lütfen ${remainingMinutes} dakika bekleyin.`,
        lastSync: lastSyncTime.toISOString(),
        cooldownRemaining: remainingMinutes,
      });
    }

    // 15 dakika geçmişse - İZİN VER ve sayacı sıfırla
    await prisma.systemSetting.update({
      where: { key: SYNC_KEY },
      data: { value: now.toISOString() },
    });

    return NextResponse.json({
      allowed: true,
      message: 'Senkronizasyon başlatılıyor...',
      lastSync: lastSyncTime.toISOString(),
      cooldownRemaining: 0,
    });

  } catch (error: any) {
    console.error('❌ check-sync-eligibility error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
