# 🚀 Jenerik Dosya Yükleme Sistemi - Kurulum Tamamlandı

## ✅ Yapılan Değişiklikler

### 1. Yeni API Endpoint'leri Oluşturuldu

#### 📤 Upload API: `/api/admin/upload-file/route.ts`
- **Görev**: Admin tarafından JSON dosyası yükleme
- **Güvenlik**: NextAuth ADMIN rolü kontrolü
- **Özellikler**:
  - Dönem ve dosya türü parametreleri
  - JSON format validasyonu
  - Otomatik klasör oluşturma
  - Düzenli klasör yapısı: `private-data/donem-{grade}/{fileType}.json`

#### 📥 Download API: `/api/internal/get-data-file/route.ts`
- **Görev**: n8n için veri çekme API'si
- **Güvenlik**: Bearer token (N8N_INTERNAL_API_KEY)
- **Özellikler**:
  - Query parametreleri: `grade` ve `type`
  - Dosya varlık kontrolü
  - Detaylı metadata yanıtı

### 2. Admin Paneli Güncellendi

#### 🎨 Data Upload Page: `/admin/data-upload/page.tsx`
- Eski `AnatomiUploadForm` kaldırıldı
- Jenerik form oluşturuldu
- **Yeni Özellikler**:
  - Dönem seçimi (1-6)
  - Dosya türü seçimi (anatomy, practical, amfi, main-program)
  - Modern UI/UX
  - Başarı/hata mesajları
  - Dosya bilgisi gösterimi

### 3. Güvenlik ve Yapılandırma

#### 🔒 .gitignore Güncellendi
- `private-data` klasörü eklendi
- Yüklenen dosyalar Git'e commit edilmeyecek

#### 📁 Klasör Yapısı Oluşturuldu
- `private-data/` ana klasörü
- Otomatik alt klasör oluşturma (API tarafından)
- README.md eklendi

### 4. Dokümantasyon

#### 📚 GENERIC_FILE_UPLOAD_API.md
- Tam API dokümantasyonu
- n8n entegrasyon örnekleri
- cURL ve Postman test komutları
- Hata kodları ve çözümleri

---

## 🎯 Kullanım Kılavuzu

### Admin Kullanımı

1. `/admin/data-upload` sayfasına gidin
2. Dönem seçin (1-6)
3. Dosya türünü seçin:
   - Anatomi Grup Listesi
   - Uygulama (Pratik) Grup Listesi
   - Haftalık Amfi Programı
   - Ana Teorik Ders Programı
4. JSON dosyanızı yükleyin
5. "Dosyayı Yükle" butonuna tıklayın

### n8n Entegrasyonu

```javascript
// HTTP Request Node
URL: https://your-domain.com/api/internal/get-data-file
Method: GET
Query Parameters:
  - grade: 2
  - type: anatomy
Headers:
  - Authorization: Bearer {{$env.N8N_INTERNAL_API_KEY}}
```

---

## 📊 Dosya Türleri

| Kod | Açıklama |
|-----|----------|
| `anatomy` | Anatomi Grup Listesi |
| `practical` | Uygulama (Pratik) Grup Listesi |
| `amfi` | Haftalık Amfi Programı |
| `main-program` | Ana Teorik Ders Programı |

---

## 🔐 Ortam Değişkenleri

Sistemi çalıştırmak için `.env` dosyanızda olması gerekenler:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# n8n API Key (internal communication)
N8N_INTERNAL_API_KEY=your-secure-key-here
```

---

## 🧪 Test Adımları

### 1. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

### 2. Admin Paneline Giriş Yapın
- URL: `http://localhost:3000/admin/data-upload`
- ADMIN rolünde bir kullanıcı ile giriş yapın

### 3. Test Dosyası Yükleyin
```json
// test-anatomy.json
[
  "Hafta 1 - Anatomi",
  "Grup A1",
  "2024-01-15",
  "09:00-12:00"
]
```

### 4. n8n API'yi Test Edin
```bash
curl -X GET "http://localhost:3000/api/internal/get-data-file?grade=2&type=anatomy" \
  -H "Authorization: Bearer YOUR_N8N_INTERNAL_API_KEY"
```

---

## 🔄 Eski Sistemden Geçiş

### Kaldırılabilir Dosyalar
- ❌ `/api/admin/upload-anatomi/route.ts` (artık kullanılmıyor)
- ❌ `/api/internal/get-anatomi-json/route.ts` (artık kullanılmıyor)
- ❌ `/admin/data-files/AnatomiUploadForm.tsx` (artık kullanılmıyor)

### Geçiş Checklist
- [ ] Eski API'leri kullanan n8n workflow'larını güncelleyin
- [ ] Eski dosyaları yeni sistemle tekrar yükleyin
- [ ] Test edin
- [ ] Eski API dosyalarını silin

---

## 📈 Avantajlar

✅ **Tek Sistem**: Her dosya türü için ayrı API yok
✅ **Ölçeklenebilir**: Yeni dosya türleri kolayca eklenebilir
✅ **Düzenli**: Klasör yapısı mantıklı ve yönetilebilir
✅ **Güvenli**: Çift katmanlı güvenlik (Admin + n8n)
✅ **Esnek**: Parametrelerle her veri çekilebilir

---

## 🐛 Sorun Giderme

### "Unauthorized" Hatası
- Admin session'ınızı kontrol edin
- n8n API key'inizin doğru olduğundan emin olun

### "Dosya Bulunamadı" Hatası
- Dosyanın yüklendiğinden emin olun
- Dönem ve tür parametrelerinin doğru olduğunu kontrol edin
- `private-data/donem-X/` klasörünü kontrol edin

### JSON Parse Hatası
- Dosyanızın valid JSON formatında olduğundan emin olun
- Online JSON validator kullanın

---

## 📞 İletişim

Sorularınız için: [GitHub Issues](https://github.com/your-repo/issues)

---

**Hazırlayan**: GitHub Copilot
**Tarih**: Kasım 2025
**Versiyon**: 1.0.0
