# Turkish Type Designers Index

**Türkiye menşeli yazı tasarımcıları ve bağımsız yazıevleri için yaşayan, açık ve editoryal bir dijital dizin.**

Bu proje, [Türkçe Tipografi Topluluğu](https://tipografitoplulugu.github.io/bulten-arsivi/) tarafından Türkiye'den yazı tasarımcılarını, bağımsız yazıevlerini (type foundries) ve özgün yazı tasarımı üretimlerini belgelemek, görünür kılmak ve tipografi araştırmacılarına derli toplu bir başvuru kaynağı sunmak amacıyla hazırlanmıştır.

- **Canlı Site:** [https://tipografitoplulugu.github.io/turkish-type-index/](https://tipografitoplulugu.github.io/turkish-type-index/)
- **Veri Kaynağı:** [Dropmark — Yazı Tasarımcıları ve Yazıevleri (Türkiye)](https://tipografi.dropmark.com/1262690)
- **Kardeş Proje:** [Tipografi Bülteni Arşivi](https://tipografitoplulugu.github.io/bulten-arsivi/)

---

## Görsel Kimlik ve Tasarım Yaklaşımı

Sitenin görsel dili, arayüzü ve tipografisi, **Tipografi Bülteni Arşivi** ile birebir aynı tasarım ailesinden ve tasarım sisteminden türetilmiştir:

- **Minimalist & Editoryal:** Gereksiz dekorasyonlardan, ağır gölgelerden ve dikkat dağıtıcı öğelerden arındırılmış, tipografi odaklı sayfa mimarisi.
- **Tipografik Aile:**
  - Başlıklar: **Instrument Serif**
  - Gövde ve arayüz: **Inter**
  - Üst başlıklar, etiketler ve teknik detaylar: **DM Mono**
- **Renk Paleti & Koyu Mod Desteği:**
  - Açık mod: Kırık beyaz kağıt zemini (`#F7F8F5`), sıcak beyaz yüzey (`#FFFFFF`), derin mürekkep (`#161811`), yumuşak yeşil vurgu (`#D5FD42`).
  - Koyu mod: Gece zemini (`#121212`), koyu yüzey (`#1B1B1B`), açık mürekkep (`#F5F5F0`). Sistem teması ve kullanıcı tercihiyle anında uyumlu, sıfır FOUC (Flash of Unstyled Content).
- **Esnek Görünüm:**
  - **Kart Görünümü:** Görsel önizlemeli editoryal kart ızgarası.
  - **Liste Görünümü:** Hızlı tarama ve dizin araştırması için kompakt editoryal liste.

---

## Özellikler

1. **Canlı Arama & Türkçe Karakter Duyarlılığı:**
   - İsim, stüdyo, yazıevi veya platform üzerinden anlık arama.
   - Türkçe karakter normalizasyonu (`ı/i`, `ö/o`, `ü/u`, `ç/c`, `ğ/g`, `ş/s`) sayesinde eksik veya farklı klavye girdilerinde dahi kusursuz eşleşme.
   - Arama terimlerinin metin içinde anlık vurgulanması (`<mark class="search-hit">`).

2. **Kategori Filtreleme & Dinamik Sayaçlar:**
   - *Yazı Tasarımcıları (Type Designers)* ve *Yazıevleri (Type Foundries)* filtreleri.
   - İstatistikler veri dosyasından dinamik olarak hesaplanır.

3. **Alfabetik Sıralama:**
   - Türkçe alfabesine (`Intl.Collator('tr')`) tam uyumlu A → Z ve Z → A sıralama.
   - Orijinal Dropmark dizin sırasına tek tıkla dönüş.

4. **URL Senkronizasyonu:**
   - Arama sorguları ve kategori filtreleri URL parametreleriyle (`?q=...&category=...`) otomatik senkronize edilir; filtreli görünümler doğrudan paylaşılabilir.

5. **Performans & Güvenilirlik:**
   - Sıfır ağır bağımlılık, saf HTML5, modern CSS ve vanilya JavaScript.
   - Görsel önizlemeleri yerel depolanır, eksik görsellerde tipografik monogram yedekleme devreye girer.
   - Dış bağlantılar güvenli biçimde (`target="_blank" rel="noopener noreferrer"`) yeni sekmede açılır.

---

## Dizin Veri Yapısı (`data/index.json`)

Tüm kayıtlar `data/index.json` dosyası içerisinde düzenli bir yapıda tutulur. Yeni bir tasarımcı veya yazıevi eklemek için bu dosyaya yeni bir nesne eklemek yeterlidir:

```json
{
  "id": "45-yeni-tasarimci",
  "index": 45,
  "name": "Tasarımcı Adı",
  "designer": "Tasarımcı Adı",
  "studio": "Yazıevi Adı (varsa)",
  "categories": ["designer", "foundry"],
  "category_labels": ["Yazı Tasarımcısı", "Yazıevi"],
  "link": "https://ornek-yazi-tasarimci.com",
  "domain": "ornek-yazi-tasarimci.com",
  "platform": "Web Sitesi",
  "description": "Kısa açıklama metni (varsa)",
  "image": "assets/thumbnails/item_45.jpg"
}
```

---

## Yerel Geliştirme ve Önizleme

Herhangi bir sunucu veya statik sunucu aracıyla doğrudan çalıştırılabilir:

```bash
# Python ile yerel sunucu başlatma
python3 -m http.server 8000
```

Ardından tarayıcınızdan `http://localhost:8000` adresine gidin.

---

## GitHub Pages Yayın Kurulumu

Proje, GitHub Pages için statik olarak tamamen hazırdır:

1. Repository ayarlarından (**Settings** > **Pages**) gidin.
2. **Build and deployment** > **Source** bölümünü `Deploy from a branch` olarak seçin.
3. Branch olarak `main` ve klasör olarak `/ (root)` seçin.
4. Kaydettikten sonra site birkaç saniye içinde `https://tipografitoplulugu.github.io/turkish-type-index/` adresinde canlıya geçer.

---

## Katkıda Bulunma

Dizinde eksik olan veya güncellenmesi gereken bir Türk yazı tasarımcısı veya bağımsız yazıevi olduğunu düşünüyorsanız:

1. [Dropmark Koleksiyonu](https://tipografi.dropmark.com/1262690) üzerinden öneri bırakabilir,
2. Veya bir GitHub Issue / Pull Request açarak `data/index.json` dosyasına katkıda bulunabilirsiniz.

---

## Lisans ve Telif

İçerik ve derleme © [Türkçe Tipografi Topluluğu](https://tipografitoplulugu.github.io/bulten-arsivi/).
Yazıtipleri ve portfolyolar ilgili tasarımcıların ve yazıevlerinin mülkiyetindedir.
