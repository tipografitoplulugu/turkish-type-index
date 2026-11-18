# Yazı Tasarımcıları ve Yazıevleri — Türkiye

**Türkiye menşeli yazı tasarımcıları ve bağımsız yazıevleri için yaşayan, açık ve editoryal bir dijital dizin.**

Bu proje, [Türkçe Tipografi Topluluğu](https://tipografitoplulugu.github.io/bulten-arsivi/) tarafından Türkiye'den yazı tasarımcılarını, bağımsız yazıevlerini (type foundries) ve özgün yazı tasarımı üreticilerini belgelemek, görünür kılmak ve tipografi araştırmacılarına derli toplu bir başvuru kaynağı sunmak amacıyla hazırlanmıştır.

- **Canlı Site:** [https://tipografitoplulugu.github.io/turkish-type-index/](https://tipografitoplulugu.github.io/turkish-type-index/)
- **Kardeş Proje:** [Tipografi Bülteni Arşivi](https://tipografitoplulugu.github.io/bulten-arsivi/)

---

## Kayıt Ölçütleri ve Editoryal Tanımlar

Dizinde kavram kargaşasını önlemek adına "Yazıevi", "Yazı Tasarımcısı" ve "Marka" tanımları kesin editoryal ölçütlere bağlanmıştır:

1. **Yazıevi (`foundry`):**
   Yazı tipi üretimini ve yayınını birlikte yürüten, kurumsal kimliği tek bir kişinin adından bağımsız olan ve **en az iki kişiden** oluşan yapı. Üç koşulun üçü birden aranır:
   - (1) İki veya daha fazla kişi/ortak,
   - (2) Kişi adından bağımsız kurumsal kimlik,
   - (3) Ana faaliyetin yazı tipi üretimi ve yayını olması.
   *Dizindeki örnek:* **Element Type** (İbrahim Kaçtıoğlu ve Doğukan Karapınar).

2. **Yazı Tasarımcısı (`designer`):**
   Yazı tipi tasarlayan bağımsız kişi ya da tasarım stüdyoları; yazıevi ölçütlerini karşılamayan herkes bu kategoridedir. Bir kayıt aynı anda iki kategoriye birden giremez.

3. **Marka (`brand`):**
   Bir tasarımcının kendi çalışmalarını yayımlarken kullandığı ticari ad. Marka kaydın bir niteliğidir (alanıdır); bir kategori değildir ve kaydın türünü değiştirmez. Marka adı "Yazıevi" veya "Foundry" sözcüklerini içerse bile (ör. *Biliktü Yazıevi*, *I Dotless Yazıevi*, *Informal Type Foundry*) kayıt `designer` kalır ve marka adı kartta "Marka" satırı olarak gösterilir.
   *Dizindeki örnek:* **Ceyhun Birinci** (Markası: *Artegra Type*).

### Editörler İçin İki Soruluk Karar Rehberi

1. **Kayıtta ad-soyad dışında bir ticari ad kullanılıyor mu?**
   - *Evet:* O ad `brand` (Marka) alanına yazılır.
2. **Üç yazıevi koşulunun (2+ kişi, bağımsız kurumsal kimlik, tipografi odağı) üçü de sağlanıyor mu?**
   - *Evet:* Kayıt türü `foundry` seçilir ve ekip üyeleri `members` listesine girilir.
   - *Hayır:* Kayıt türü `designer` seçilir.

---

## Görsel Kimlik ve Tasarım Yaklaşımı

Site, **Tipografi Bülteni Arşivi** ile ortak bir marka katmanını paylaşırken, ürün katmanında belirgin bir "katalog ve vitrin" mimarisine sahiptir:

- **Marka Katmanı (Ortak):**
  - **Logo ve İsim:** Türkçe Tipografi Topluluğu kimliği.
  - **Tipografik Aile:** Başlıklar için **Instrument Serif**, gövde için **Inter**, etiketler ve sayaçlar için **DM Mono**.
  - **Renk Sistemi & Koyu Mod:** Kâğıt (`#F7F8F5`), mürekkep (`#161811`), kilitli tasarım token'ları ve iki site arasında senkronize koyu tema.
  - **Çizgi Dili:** 1px ince çizgiler (`--line`), sıfır gölge, 12px köşe yarıçapı.

- **Ürün Katmanı (Dizine Özgü — Katalog ve Vitrin Karakteri):**
  - **Geniş Sayfa Düzeni:** Arşivin 1120px dar okuma sütunu yerine **1320px** genişliğinde ferah vitrin düzeni.
  - **Kompakt Üst Bölüm (Künye):** İki satırlık dengeli Instrument Serif başlık ve açıklama; sağ tarafta "Yazı Tasarımcısı Ekle" aksiyonu ve dinamik "Son güncelleme" bilgisi.
  - **Yapışkan Araç Çubuğu:** Canlı arama, dinamik sayaçlı segmentli kategori kontrolü (`Tümü 44 / Yazı Tasarımcıları 43 / Yazıevleri 1`), sıralama ve "Vitrin | Liste" seçicisi.
  - **Kutusuz Vitrin Izgarası:** 3 sütunlu yerleşimde (1100px+), kâğıt zemin üzerinde duran 4:3 görsel vitrini (`object-fit: cover; object-position: top;`), Instrument Serif ad, tekil rozet ve hiyerarşik kimlik satırı (Ekip / Marka / Yazıevi).
  - **Yapışkan Harf İndeksi ve Hızlı Gezinme:** Alfabetik sıralamada sağ taraftaki dikey yapışkan harf indeksi klavye ve kaydırma senkronizasyonuyla doğrudan ilgili harf grubuna atlamayı sağlar.
  - **Yoğun Dizin Listesi:** Liste modunda her satır ~64px yüksekliğinde, iki satırlı esnek yapısıyla her ekranda sıfır taşmayla çalışan editoryal liste.
  - **Ölçülü Lime Kullanımı:** Vurgu rengi (`#D5FD42`) yalnızca birincil CTA düğmesinde, harf indeksindeki aktif göstergede, arama vurgularında ve yazıevi rozetinde kullanılır.

---

## Özellikler

1. **Canlı Arama & Türkçe Karakter Duyarlılığı:**
   - İsim, marka, ekip üyeleri, bağlı yazıevi, platform veya açıklama üzerinden anlık arama.
   - Türkçe karakter normalizasyonu (`ı/i`, `ö/o`, `ü/u`, `ç/c`, `ğ/g`, `ş/s`) sayesinde eksik veya farklı klavye girdilerinde dahi kusursuz eşleşme.
   - Eşleşen terimlerin metin içinde anlık vurgulanması (`<mark class="search-hit">`).

2. **Kategori Filtreleme & Dinamik Sayaçlar:**
   - *Yazı Tasarımcıları (Type Designers)* ve *Yazıevleri (Type Foundries)* filtreleri.
   - İstatistikler veri dosyasından dinamik olarak hesaplanır.

3. **Alfabetik Sıralama:**
   - Türkçe alfabesine (`Intl.Collator('tr')`) tam uyumlu A → Z ve Z → A sıralama.
   - Orijinal dizin sırasına tek tıkla dönüş.

4. **URL Senkronizasyonu:**
   - Arama sorguları ve kategori filtreleri URL parametreleriyle (`?q=...&category=...`) otomatik senkronize edilir; filtreli görünümler doğrudan paylaşılabilir.

5. **Performans & Erişilebilirlik:**
   - Sıfır ağır kütüphane bağımlılığı; saf HTML5, modern CSS ve vanilya JavaScript.
   - WCAG 2.1 AA uyumlu renk kontrastları, tam klavye erişilebilirliği (roving tabindex, atlama bağlantısı) ve ekran okuyucu uyumlu ARIA hiyerarşisi.

---

## Yeni Kayıt Ekleme ve Doğrulama Araçları

### 1. Terminal Sihirbazı ile (`add.py` — Önerilen)
Terminalde doğrudan çalıştırın:

```bash
python3 add.py
```

Sihirbaz adım adım türü (Yazı Tasarımcısı / Yazıevi), adı, markayı, bağlı yazıevini veya ekip üyelerini sorar; görseli otomatik indirip kaydeder ve `data/index.json` dosyasını günceller.

### 2. Şema ve Veri Tutarlılığı Denetimi (`add.py --check`)
Veri tabanının tüm kurallara uygunluğunu denetlemek için:

```bash
python3 add.py --check
```

Bu komut:
- `categories` tek elemanlılığını,
- Yazıevlerinde en az 2 ekip üyesi bulunmasını,
- Tasarımcılarda `members` alanının null olmasını,
- İsimlerde parantez bulunmamasını,
- Eski `studio` / `designer` alanlarının olmadığını,
- Sayaçların doğruluğunu satır satır denetler.

### 3. Web Formu ile (`ekle.html`)
Terminal kullanmak istemiyorsanız proje klasöründeki [ekle.html](file:///Users/muraterturk/Downloads/turkish-type-index/ekle.html) dosyasını tarayıcınızda açıp formu doldurabilir, canlı kart ve JSON önizlemesini inceleyerek güncel `data/index.json` dosyasını indirebilirsiniz.

### 4. JSON Veri Şeması
`data/index.json` dosyasındaki her kayıt şu şemaya uyar:

```json
{
  "id": "37-ceyhun-birinci",
  "index": 37,
  "name": "Ceyhun Birinci",
  "categories": ["designer"],
  "category_labels": ["Yazı Tasarımcısı"],
  "link": "https://www.behance.net/Artegra",
  "domain": "behance.net",
  "platform": "Behance",
  "description": "Artegra is a type foundry run by Turkish type designer Ceyhun Birinci...",
  "image": "assets/thumbnails/item_37.png",
  "dropmark_id": 30452987,
  "brand": "Artegra Type",
  "members": null,
  "affiliation": null
}
```

---

## Yerel Geliştirme ve Önizleme

```bash
python3 -m http.server 8089
```

Ardından tarayıcınızdan `http://localhost:8089` adresine gidin.

---

## Lisans ve Telif

İçerik ve derleme © [Türkçe Tipografi Topluluğu](https://tipografitoplulugu.github.io/bulten-arsivi/).
Yazıtipleri ve portfolyolar ilgili tasarımcıların ve yazıevlerinin mülkiyetindedir.
