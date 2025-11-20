# Finans Modülü Test & Kullanım Kılavuzu

## 🧪 Test Senaryoları

### 1. Varsayılan Sayfa (Mevcut Ay)
**URL:** `/admin/finance`
**Beklenen:**
- Kasım 2025 görüntülenir (mevcut ay)
- Devreden varlık: Kasım öncesi tüm işlemlerin toplamı
- Dönem içi: Sadece Kasım ayındaki işlemler
- Bugünkü kasa hesaplanır
- < ve > butonları çalışır

### 2. Belirli Bir Ay
**URL:** `/admin/finance?view=monthly&year=2025&month=10`
**Beklenen:**
- "Ekim 2025" başlığı
- Ekim ayına ait işlemler
- Devreden varlık: Ekim öncesi bakiye
- < Eylül, > Kasım navigasyonu

### 3. Çeyrek Yıllık Görünüm
**URL:** `/admin/finance?view=quarterly&year=2025&quarter=4`
**Beklenen:**
- "2025 4. Çeyrek" başlığı
- Ekim-Kasım-Aralık işlemleri
- 3 aylık toplam
- < Q3, > Q1 2026 navigasyonu

### 4. Özel Tarih Aralığı
**URL:** `/admin/finance?view=custom&from=2025-01-01&to=2025-12-31`
**Beklenen:**
- "2025-01-01 - 2025-12-31" başlığı
- Tüm yıl işlemleri
- < ve > butonları devre dışı
- Custom view'dan çıkmak için ayarlar menüsünden aylık/çeyrek seç

## 📝 Kullanım Senaryoları

### Yeni İşlem Ekleme
1. "Yeni İşlem Ekle" butonuna tıkla
2. Tür seç: Gelir / Gider
3. Tarih seç (dönem içi/dışı olabilir)
4. Durum seç: Tamamlandı / Bekliyor
5. Tutar ve kategori gir
6. Hesap seç
7. Kaydet

**Etki:**
- **Tamamlandı + Dönem İçi:** Bugünkü kasaya yansır
- **Bekliyor + Dönem İçi:** Alacak/Borç olarak gösterilir, devredecek varlığa dahil edilir
- **Dönem Dışı:** Görünmez ama devreden varlığı etkiler (eğer geçmiş tarihli ise)

### Dönem Arası Gezinme
1. **Aylık Görünüm:** Kasım → < → Ekim, > → Aralık
2. **Çeyrek Görünüm:** Q4 → < → Q3, > → Q1 2026
3. **Özel Aralık:** Prev/Next çalışmaz, yeni aralık seçmelisiniz

### İşlem Durumu Değiştirme
Bir işlemi "Bekliyor" → "Tamamlandı" ya da tersi yapınca:
- Bugünkü kasa güncellenir
- Alacak/Borç rakamları değişir
- Devredecek varlık yeniden hesaplanır

## 💡 Önemli Notlar

### Devreden Varlık Mantığı
```
Devreden Varlık = 
  (Dönem başından önceki tüm GELİRLER - COMPLETED) - 
  (Dönem başından önceki tüm GİDERLER - COMPLETED)
```

**Örnek:**
- Toplam gelir (Ocak-Ekim): 100,000 TL
- Toplam gider (Ocak-Ekim): 60,000 TL
- Kasım ayına devreden: 40,000 TL

### Bugünkü Kasa
```
Bugünkü Kasa = 
  Devreden Varlık + 
  (Dönem içi gelir - COMPLETED) - 
  (Dönem içi gider - COMPLETED)
```

**Örnek (Kasım için):**
- Devreden: 40,000 TL
- Kasım geliri (completed): 15,000 TL
- Kasım gideri (completed): 8,000 TL
- Bugünkü kasa: 40,000 + 15,000 - 8,000 = 47,000 TL

### Devredecek Varlık
```
Devredecek Varlık = 
  Bugünkü Kasa + 
  (Dönem içi alacaklar - PENDING) - 
  (Dönem içi borçlar - PENDING)
```

**Örnek:**
- Bugünkü kasa: 47,000 TL
- Kasım alacakları (pending): 5,000 TL
- Kasım borçları (pending): 2,000 TL
- Devredecek: 47,000 + 5,000 - 2,000 = 50,000 TL

## 🎨 UI Bileşenleri

### FinanceSummary (2 Satır, 6 Kart)
**Satır 1 - Varlık:**
1. Devreden Varlık (Gri)
2. Bugünkü Kasa (Yeşil/Kırmızı)
3. Devredecek Varlık (Mavi)

**Satır 2 - Performans:**
4. Gelirler (Yeşil) + Alt detay
5. Net Fark (Mavi/Kırmızı - Büyük)
6. Giderler (Kırmızı) + Alt detay

### PeriodSelector
- Ortada: Dönem adı
- Solda: < Önceki
- Sağda: > Sonraki
- En sağda: ⋮ Ayarlar menüsü

### İşlem Tablosu
- Başlık: "İşlem Geçmişi - {periodLabel}"
- Filtreleme: Otomatik (sadece dönem içi)
- İşlemler: Tarih, Tür, Durum, Hesap, Kategori, Açıklama, Kullanıcı, Tutar, İşlemler

## 🔧 Sorun Giderme

### "Bugünkü kasa yanlış gösteriyor"
- Kontrol 1: Geçmiş işlemlerin tümü COMPLETED olarak işaretlenmiş mi?
- Kontrol 2: Transfer işlemleri hariç tutulmuş mu?
- Kontrol 3: Tarihler doğru mu?

### "Dönem seçici çalışmıyor"
- Custom view'dayken prev/next devre dışı olmalı
- Aylık/Çeyrek view'a geçince çalışır

### "İşlemler görünmüyor"
- İşlemin tarihi dönem içinde mi?
- Sayfa yenilendi mi? (router.refresh())

## 📱 Responsive Davranış

- **Desktop:** 3 sütun grid, full width tablo
- **Tablet:** 2 veya 3 sütun, scroll edilebilir tablo
- **Mobile:** 1 sütun stack, horizontal scroll tablo

## 🚀 Performans İpuçları

1. **Büyük Tarih Aralıkları:** Custom view'da 1 yıldan fazla seçerseniz işlem sayısı artar
2. **Database Index:** `transactions.date` ve `transactions.status` indexli olmalı
3. **Pagination:** Gelecekte 100+ işlem için pagination eklenebilir
