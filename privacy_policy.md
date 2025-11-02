# Cinnasium Takvimdâr Gizlilik Politikası

> Son Güncelleme: 1 Kasım 2025

Biz, Halil Semih Şen ve Abdullah Ceylan (İstanbul Tıp Fakültesi Dönem 2 öğrencileri), Cinnasium Takvimdâr hizmetini ("Hizmet") sizlere sunarken gizliliğinize ne kadar önem verdiğimizi açıkça belirtmek isteriz.

Bizim felsefemiz nettir: Sizin verilerinizde gözümüz yok. Bu hizmet, tamamen tıp fakültesi öğrencilerinin yaşadığı karmaşık ders programı sorununu çözmek için geliştirilmiş bir araçtır. Hiçbir verinizi, hizmetin çalışması için gereken teknik zorunluluklar dışında işlemeyecek, analiz etmeyecek veya paylaşmayacağız.

1. Hangi Verileri Topluyoruz?

Hizmetimizin çalışabilmesi için sizden minimum düzeyde bilgiye ihtiyaç duymaktayız:

    Kullanıcı Tarafından Sağlanan Bilgiler:

        Okul Numaranız: Fakültenin yayınladığı ana ders programından size ait dersleri filtrelemek için gereklidir.

        Uygulama Grubunuz (A, B, C...): Uygulama, laboratuvar ve diseksiyon derslerinizi doğru bir şekilde belirlemek için gereklidir.

    Google Tarafından Sağlanan Bilgiler (Google OAuth İzni):

        Hizmetimiz, Google Takviminize ders programınızı ekleyebilmek için sizden Google Takvim'inize erişim izni ister.

        Bu izin, sadece ders etkinlikleri oluşturma, güncelleme ve silme yetkisini kapsar.

2. Verilerinizi Nasıl Kullanıyoruz ve İşliyoruz?

Burada çok şeffaf olmak istiyoruz. "Veri işlememek" temel ilkemizdir. Yaptığımız tek "işlem", otomasyonun çalışması için zorunlu olan teknik adımlardır:

    Yetkilendirme: Google Takviminize sürekli ve otomatik erişim sağlayabilmek için Google'ın verdiği refresh_token (yenileme anahtarı) bilginizi şifrelenmiş olarak güvenli sunucularımızda saklarız. Bu anahtar olmadan, sizden her gün tekrar tekrar izin istememiz gerekirdi.

    Filtreleme: Sakladığımız Okul Numaranız ve Uygulama Grubunuz bilgisini, fakültenin yayınladığı genel program (CSV/Excel dosyası) ile karşılaştırmak için kullanırız.

    Takvime Ekleme: Bu filtreleme sonucu ortaya çıkan size özel ders listesini, sakladığımız Google yetki anahtarını kullanarak Google Takviminize otomatik olarak ekleriz. Programda bir değişiklik olursa, mevcut kayıtları günceller veya sileriz.

Neyi ASLA Yapmayız:

    Google Takviminizdeki mevcut diğer etkinliklerinizi, kişisel randevularınızı veya notlarınızı ASLA OKUMAYIZ, SAKLAMAYIZ veya ANALİZ ETMEYİZ.

    Size ait olan Okul Numarası, Grup Bilgisi veya Google Yetki Anahtarı bilgilerinizi ASLA üçüncü taraflarla (reklam şirketleri, veri analiz firmaları vb.) paylaşmayız.

    Verilerinizi size reklam göstermek, profilinizi çıkarmak veya hizmetin temel amacı dışında herhangi bir ticari faaliyet için kullanmayız.

3. Veri Güvenliği

Topladığımız bu minimum bilgiyi (Google refresh_token, okul no, grup bilgisi) endüstri standardı şifreleme yöntemleriyle korunan veritabanlarında saklıyoruz.

4. Hizmetin Sona Ermesi

Hizmeti kullanmayı bırakmak isterseniz, https://myaccount.google.com/permissions adresinden "Cinnasium Takvimdâr" uygulamasına verdiğiniz izni kaldırmanız yeterlidir. İzni kaldırdığınız anda sistemimiz artık takviminize erişemez ve otomasyon durur. Talebiniz üzerine tüm verilerinizi sistemimizden kalıcı olarak silebiliriz.

5. İletişim

Bu gizlilik politikasıyla ilgili herhangi bir sorunuz veya endişeniz olursa, bizimle doğrudan iletişime geçebilirsiniz.

    Proje Sahipleri: Halil Semih Şen & Abdullah Ceylan

    E-posta: destek@cinnasium.com (veya buraya istediğiniz bir mail adresini ekleyebilirsiniz)