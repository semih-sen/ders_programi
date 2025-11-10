import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

/**
 * GET /api/internal/get-all-active-users
 * 
 * n8n "Günlük Tazeleme" (Daily Refresh) iş akışı için veri kaynağı.
 * Sistemdeki tüm aktif kullanıcıların listesini, tercihlerini ve
 * şifresi çözülmüş Google refresh_token'larını döndürür.
 * 
 * Güvenlik: N8N_INTERNAL_API_KEY ile korunur.
 */
export async function GET(request: NextRequest) {
  try {
    // Güvenlik Kontrolü: N8N_INTERNAL_API_KEY doğrulaması
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Veritabanı Sorgusu: Tüm aktif kullanıcıları çek
    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
        isActivated: true,
        hasCompletedOnboarding: true
      },
      include: {
        accounts: {
          select: {
            refresh_token: true
          }
        },
        courseSubscriptions: {
          include: {
            course: {
              select: { 
                name: true 
              }
            }
          }
        }
      }
    });

    // Veri İşleme: Her kullanıcı için temiz bir profil oluştur
    const processedUsers = [];

    for (const user of users) {
      try {
        // Token'ı Al ve Çöz
        const encryptedToken = user.accounts[0]?.refresh_token;
        
        if (!encryptedToken) {
          console.warn(`Kullanıcı ${user.id} (${user.email}) için refresh_token bulunamadı, atlanıyor...`);
          continue;
        }

        const decryptedToken = decrypt(encryptedToken);

        // Ders Tercihlerini Düzleştir
        const coursePreferences = user.courseSubscriptions.map((sub: any) => ({
          name: sub.course.name,
          addToCalendar: sub.addToCalendar,
          notifications: sub.notifications
        }));

        // n8n için Temiz Obje Oluştur
        const n8nProfile = {
          userId: user.id,
          email: user.email,
          hasYearlySynced: user.hasYearlySynced,
          classYear: user.classYear,
          decryptedToken: decryptedToken,
          uygulamaGrubu: user.uygulamaGrubu,
          anatomiGrubu: user.anatomiGrubu,
          yemekhaneEklensin: user.yemekhaneEklensin,
          coursePreferences: coursePreferences
        };

        processedUsers.push(n8nProfile);

      } catch (error) {
        // Bir kullanıcının token'ı bozuksa sadece logla, devam et
        console.error(
          `Kullanıcı ${user.id} (${user.email}) için token deşifre edilemedi:`,
          error
        );
        continue;
      }
    }

    // Başarılı Yanıt
    console.log(`Toplam ${processedUsers.length} aktif kullanıcı n8n'e gönderiliyor.`);
    
    return NextResponse.json(processedUsers);

  } catch (error) {
    console.error('get-all-active-users API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
