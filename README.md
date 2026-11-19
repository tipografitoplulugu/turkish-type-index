# Yazı Tasarımcıları ve Yazıevleri — Türkiye

**Türkçe Tipografi Topluluğu** tarafından hazırlanan, Türkiye menşeli yazı tasarımcılarını, yazıevlerini ve özgün yazı tasarımı üreticilerini bir araya getiren açık dijital dizin.

- **Canlı Dizin:** [https://tipografitoplulugu.github.io/turkish-type-index/](https://tipografitoplulugu.github.io/turkish-type-index/)
- **İletişim & Katkı:** [tipografitoplulugu@gmail.com](mailto:tipografitoplulugu@gmail.com)

---

## Dahil Olma Ölçütleri

Dizine dahil edilecek kişi ve kurumların aşağıdaki temel ölçütleri karşılaması beklenir:

1. **Coğrafi ve Kültürel Bağ:** Türkiye menşeli olmak veya Türkiye tipografi ekosistemiyle doğrudan bağı bulunmak.
2. **Özgün Üretim:** Orijinal, erişilebilir ve yayınlanmış/satışta olan en az bir yazı tipi (typeface / font ailesi) çalışmasına sahip olmak.
3. **Doğrudan ve Geçerli Bağlantı:** Tasarımcının veya yazıevinin tipografi portfolyosuna, font satış platformuna (MyFonts, Creative Market, Google Fonts, Type Network vb.) ya da kişisel/kurumsal web sitesine doğrudan yönlendiren güncel ve çalışan bir bağlantı (tercihen HTTPS).
4. **Yazıevleri İçin Kurumsal Şart:** Yazıevi (*type foundry*) kategorisindeki kayıtların en az iki aktif tasarımcı/kurucu üye bilgisi içermesi zorunludur.
5. **Açık Standartlar ve Telif:** Üretilen yazı tiplerinin telif ve lisanslama standartlarına uygun, özgün tasarımlar olması gerekmektedir.

---

## Bozuk Bağlantı Bildirme ve İletişim

Dizine yeni kayıt önermek veya dizinde yer alan bağlantılardan herhangi birinin çalışmadığını, yönlendirme hatası verdiğini veya güncelliğini yitirdiğini fark ederseniz:

- **E-posta:** [tipografitoplulugu@gmail.com](mailto:tipografitoplulugu@gmail.com) adresine bildirebilirsiniz.
- **GitHub:** Proje deposu üzerinde doğrudan bir [Issue](https://github.com/tipografitoplulugu/turkish-type-index/issues) açabilir veya düzeltmeyi içeren bir [Pull Request](https://github.com/tipografitoplulugu/turkish-type-index/pulls) gönderebilirsiniz.

---

## Arşiv Notu (`archive/dropmark_raw.json`)

Bu dizinin ilk temeli, Türkçe Tipografi Topluluğu'nun Dropmark üzerindeki açık koleksiyonundan derlenmiştir. Özgün kaynak verisi `archive/dropmark_raw.json` dosyasında tarihsel referans olarak arşivlenmiştir.

> [!NOTE]
> `archive/dropmark_raw.json` dosyası geçmiş Dropmark dışa aktarımı olduğundan içerisinde topluluk e-posta adresi ve imzalı (süreli) CDN URL'leri barındırmaktadır. Üretim ortamında (`index.html`, `app.js`) doğrudan kullanılmaz; üretim verisi `data/index.json` üzerinden sunulur.

---

## Sürekli Entegrasyon (CI)

Projede GitHub Actions (`.github/workflows/check.yml`) yapılandırılmıştır. `main` dalına yapılan her `push` ve açılan her `pull_request` işleminde Python ortamı kurularak `python3 add.py --check` çalıştırılır ve veri bütünlüğü otomatik olarak denetlenir.
