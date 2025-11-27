'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import fs from 'fs';
import path from 'path';

interface MealResponse {
  success: boolean;
  meal?: string;
  category?: string;
}

interface DailyMeal {
  date: string;
  meal: string;
  category: string;
}

/**
 * Belirtilen ay için üniversite API'sinden yemek verilerini çeker ve kaydeder
 * @param year - Yıl (örn: 2024)
 * @param month - Ay (1-12)
 */
export async function fetchAndSaveMonthlyMenu(year: number, month: number) {
  try {
    // Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Bu işlem için admin yetkisi gereklidir.' };
    }

    // Giriş validasyonu
    if (year < 2020 || year > 2100) {
      return { success: false, error: 'Geçersiz yıl değeri.' };
    }
    if (month < 1 || month > 12) {
      return { success: false, error: 'Geçersiz ay değeri.' };
    }

    // Ayın gün sayısını hesapla
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const monthlyData: DailyMeal[] = [];
    let successCount = 0;
    let failCount = 0;

    // Her gün için API'yi sorgula
    for (let day = 1; day <= daysInMonth; day++) {
      // Tarihi YYYY-MM-DD formatında oluştur
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      try {
        // API'ye istek at
        const apiUrl = `https://sks.istanbul.edu.tr/meals-by-date?date=${dateStr}&category=lunch`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`${dateStr} için API hatası: ${response.status}`);
          failCount++;
          // Sunucuyu boğmamak için gecikme
          await new Promise(r => setTimeout(r, 200));
          continue;
        }

        const data: MealResponse = await response.json();

        if (data.success && data.meal) {
          // Veri temizleme: \r\n karakterlerini temizle
          let cleanMeal = data.meal
            .replace(/\\r\\n/g, '\n')  // JSON içindeki escaped \r\n
            .replace(/\r\n/g, '\n')     // Gerçek \r\n
            .replace(/\\n/g, '\n')      // Escaped \n
            .trim();

          // Birden fazla ardışık yeni satırı tek satıra indir
          cleanMeal = cleanMeal.replace(/\n{2,}/g, '\n');

          monthlyData.push({
            date: dateStr,
            meal: cleanMeal,
            category: data.category || 'lunch',
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`${dateStr} için hata:`, error);
        failCount++;
      }

      // Sunucuyu boğmamak için her istek arasında 200ms gecikme
      await new Promise(r => setTimeout(r, 200));
    }

    // Hiç veri çekilemedi mi kontrol et
    if (monthlyData.length === 0) {
      return { 
        success: false, 
        error: `${daysInMonth} günün hiçbirinden veri çekilemedi. API'ye erişim sorunlu olabilir.` 
      };
    }

    // Dosya yolunu oluştur
    const dataDir = path.join('/home/ghrunner/sirkadiyen-data', 'private-data', 'dining', String(year));
    
    // Klasörü oluştur (yoksa)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${month}.json`);

    // JSON dosyasını kaydet
    fs.writeFileSync(filePath, JSON.stringify(monthlyData, null, 2), 'utf-8');

    // n8n webhook'unu tetikle
    let webhookSuccess = false;
    let webhookError: string | null = null;

    try {
      const webhookUrl = 'https://n8n.sirkadiyen.com/webhook/yemekhane-senkronizasyon';
      const n8nUser = process.env.N8N_WEBHOOK_USER;
      const n8nPass = process.env.N8N_WEBHOOK_PASS;

      if (!n8nUser || !n8nPass) {
        console.error('n8n webhook credentials bulunamadı (.env.local)');
        webhookError = 'Webhook kimlik bilgileri eksik';
      } else {
        // Basic Auth için base64 encode
        const credentials = Buffer.from(`${n8nUser}:${n8nPass}`).toString('base64');

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year,
            month,
            filePath: `dining/${year}/${month}.json`,
            recordCount: successCount,
          }),
        });

        if (webhookResponse.ok) {
          webhookSuccess = true;
          console.log(`n8n webhook başarıyla tetiklendi: ${year}/${month}`);
        } else {
          webhookError = `HTTP ${webhookResponse.status}`;
          console.error(`n8n webhook hatası: ${webhookResponse.status} - ${await webhookResponse.text()}`);
        }
      }
    } catch (error) {
      webhookError = 'Bağlantı hatası';
      console.error('n8n webhook tetikleme hatası:', error);
    }

    // Sonuç mesajı oluştur
    let message = `${successCount} günlük veri başarıyla çekildi ve kaydedildi. (${failCount} gün başarısız)`;
    if (webhookSuccess) {
      message += ' Veri dağıtımı tetiklendi.';
    } else if (webhookError) {
      message += ` Uyarı: Veri dağıtımı tetiklenemedi (${webhookError}).`;
    }

    return { 
      success: true, 
      message,
      stats: {
        total: daysInMonth,
        success: successCount,
        failed: failCount,
      },
      webhookTriggered: webhookSuccess,
    };

  } catch (error) {
    console.error('fetchAndSaveMonthlyMenu hatası:', error);
    return { 
      success: false, 
      error: 'Veri çekme işlemi sırasında bir hata oluştu.' 
    };
  }
}

/**
 * Kaydedilmiş bir ayın yemek verilerini getirir
 * @param year - Yıl
 * @param month - Ay
 */
export async function getMonthlyMenu(year: number, month: number) {
  try {
    // Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Bu işlem için admin yetkisi gereklidir.' };
    }

    const filePath = path.join(
      '/home/ghrunner/sirkadiyen-data', 
      'private-data', 
      'dining', 
      String(year), 
      `${month}.json`
    );

    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        error: 'Bu ay için kaydedilmiş veri bulunamadı.' 
      };
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    return { 
      success: true, 
      data 
    };

  } catch (error) {
    console.error('getMonthlyMenu hatası:', error);
    return { 
      success: false, 
      error: 'Veri okuma işlemi sırasında bir hata oluştu.' 
    };
  }
}

/**
 * Kaydedilmiş tüm ay/yıl kombinasyonlarını listeler
 */
export async function listAvailableMenus() {
  try {
    // Güvenlik: Admin kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Bu işlem için admin yetkisi gereklidir.' };
    }

    const baseDir = path.join('/home/ghrunner/sirkadiyen-data', 'private-data', 'dining');
    
    if (!fs.existsSync(baseDir)) {
      return { success: true, menus: [] };
    }

    const menus: Array<{ year: number; month: number; fileName: string }> = [];
    const years = fs.readdirSync(baseDir);

    for (const yearStr of years) {
      const yearPath = path.join(baseDir, yearStr);
      
      if (fs.statSync(yearPath).isDirectory()) {
        const files = fs.readdirSync(yearPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const month = parseInt(file.replace('.json', ''));
            const year = parseInt(yearStr);
            
            if (!isNaN(month) && !isNaN(year)) {
              menus.push({ year, month, fileName: file });
            }
          }
        }
      }
    }

    // Yıl ve aya göre sırala
    menus.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return { success: true, menus };

  } catch (error) {
    console.error('listAvailableMenus hatası:', error);
    return { success: false, error: 'Liste oluşturulurken hata oluştu.' };
  }
}
