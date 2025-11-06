# Jenerik Dosya Yükleme Sistemi - API Dökümanı

## 📋 Genel Bakış

Admin panelinde artık tek bir sistem üzerinden tüm dönem ve dosya türleri için JSON dosyaları yüklenebilir. Bu dosyalar düzenli bir klasör yapısında saklanır ve n8n tarafından API üzerinden erişilebilir.

---

## 🗂️ Klasör Yapısı

Yüklenen dosyalar şu formatta saklanır:

```
private-data/
├── donem-1/
│   ├── anatomy.json
│   ├── practical.json
│   ├── amfi.json
│   └── main-program.json
├── donem-2/
│   ├── anatomy.json
│   ├── practical.json
│   └── ...
├── donem-3/
└── ...
```

---

## 🚀 Admin Paneli Kullanımı

### Dosya Yükleme Sayfası: `/admin/data-upload`

1. **Dönem Seçimi**: Hangi dönem için dosya yükleneceğini seçin (1-6)
2. **Dosya Türü Seçimi**: 
   - `anatomy` → Anatomi Grup Listesi
   - `practical` → Uygulama (Pratik) Grup Listesi
   - `amfi` → Haftalık Amfi Programı
   - `main-program` → Ana Teorik Ders Programı
3. **JSON Dosyası Seçin**: `.json` uzantılı dosyanızı yükleyin
4. **Yükle** butonuna tıklayın

**Not**: Aynı dönem ve tür için yeni dosya yüklerseniz, eski dosya otomatik olarak üzerine yazılır.

---

## 🔌 API Kullanımı (n8n için)

### 1️⃣ Dosya Yükleme API (Admin)

**Endpoint**: `POST /api/admin/upload-file`

**Güvenlik**: NextAuth session gereklidir (ADMIN rolü)

**Form Data**:
```javascript
{
  file: File,           // JSON dosyası
  grade: "2",          // Dönem numarası (string)
  fileType: "anatomy"  // Dosya türü
}
```

**Örnek Yanıt (Başarılı)**:
```json
{
  "success": true,
  "message": "Dosya başarıyla kaydedildi: donem-2/anatomy.json",
  "path": "donem-2/anatomy.json"
}
```

**Örnek Yanıt (Hata)**:
```json
{
  "error": "Sadece JSON dosyaları yüklenebilir."
}
```

---

### 2️⃣ Dosya Çekme API (n8n)

**Endpoint**: `GET /api/internal/get-data-file`

**Güvenlik**: Bearer token gereklidir

```
Authorization: Bearer ${process.env.N8N_INTERNAL_API_KEY}
```

**Query Parametreleri**:
- `grade` (zorunlu): Dönem numarası (örn: "2")
- `type` (zorunlu): Dosya türü (örn: "anatomy")

**Örnek n8n HTTP Request**:

```javascript
// URL
https://your-domain.com/api/internal/get-data-file?grade=2&type=anatomy

// Headers
{
  "Authorization": "Bearer {{$env.N8N_INTERNAL_API_KEY}}"
}

// Method: GET
```

**Örnek Yanıt (Başarılı)**:
```json
{
  "success": true,
  "data": [
    {
      "summary": "Anatomi Grup 1",
      "group": "A1",
      "date": "2024-01-15",
      "timeRange": "09:00-12:00"
    }
  ],
  "metadata": {
    "grade": "2",
    "type": "anatomy",
    "path": "donem-2/anatomy.json"
  }
}
```

**Örnek Yanıt (Dosya Bulunamadı)**:
```json
{
  "error": "Belirtilen dönem veya tür için dosya bulunamadı.",
  "requested": {
    "grade": "2",
    "type": "anatomy",
    "path": "donem-2/anatomy.json"
  }
}
```

---

## 📊 Desteklenen Dosya Türleri

| Value | Açıklama |
|-------|----------|
| `anatomy` | Anatomi Grup Listesi |
| `practical` | Uygulama (Pratik) Grup Listesi |
| `amfi` | Haftalık Amfi Programı |
| `main-program` | Ana Teorik Ders Programı |

---

## 🔐 Güvenlik

### Admin Panel API
- NextAuth session kontrolü yapılır
- Sadece `ADMIN` rolündeki kullanıcılar erişebilir
- Session yoksa veya rol uygun değilse `401 Unauthorized` döner

### n8n Data API
- Bearer token ile korunur
- Token `.env` dosyasındaki `N8N_INTERNAL_API_KEY` ile eşleşmelidir
- Token yoksa veya yanlışsa `401 Unauthorized` döner

---

## 🧪 Test Örnekleri

### cURL ile Test (n8n API)

```bash
# Anatomi dosyası çekme
curl -X GET "https://your-domain.com/api/internal/get-data-file?grade=2&type=anatomy" \
  -H "Authorization: Bearer YOUR_N8N_INTERNAL_API_KEY"

# Pratik dosyası çekme
curl -X GET "https://your-domain.com/api/internal/get-data-file?grade=3&type=practical" \
  -H "Authorization: Bearer YOUR_N8N_INTERNAL_API_KEY"
```

### Postman ile Test

1. **Method**: GET
2. **URL**: `https://your-domain.com/api/internal/get-data-file?grade=2&type=anatomy`
3. **Headers**:
   - Key: `Authorization`
   - Value: `Bearer YOUR_N8N_INTERNAL_API_KEY`

---

## 🆕 Eski Sistemden Geçiş

### Eski API'ler (Kullanımdan Kaldırılacak)
- ❌ `/api/admin/upload-anatomi` → ✅ `/api/admin/upload-file`
- ❌ `/api/internal/get-anatomi-json` → ✅ `/api/internal/get-data-file`

### Geçiş Adımları
1. Admin panelinden eski dosyaları yeni sistemle tekrar yükleyin
2. n8n workflow'larını yeni endpoint'leri kullanacak şekilde güncelleyin
3. Eski endpoint'leri tamamen devre dışı bırakın

---

## 📝 JSON Dosya Formatı Örnekleri

### Anatomi Grup Listesi
```json
[
  "Hafta 1 - Konu 1",
  "Grup A1",
  "2024-01-15",
  "09:00-12:00",
  "Hafta 2 - Konu 2",
  "Grup A2",
  "2024-01-22",
  "09:00-12:00"
]
```

### Pratik Grup Listesi
```json
[
  {
    "group": "P1",
    "topic": "Laboratuvar Çalışması",
    "date": "2024-01-16",
    "time": "14:00-17:00"
  }
]
```

---

## 🐛 Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Eksik veya geçersiz parametreler |
| 401 | Yetkisiz erişim (token veya session hatası) |
| 404 | Dosya bulunamadı |
| 500 | Sunucu hatası |

---

## 📞 Destek

Sorun yaşarsanız:
1. Dosya formatının doğru olduğundan emin olun (.json)
2. Dönem ve tür seçimlerini kontrol edin
3. n8n token'ının doğru olduğundan emin olun
4. Console'da hata loglarını kontrol edin

---

**Son Güncelleme**: Kasım 2025
