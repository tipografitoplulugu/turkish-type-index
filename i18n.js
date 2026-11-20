(() => {
  "use strict";

  const LANGUAGE_STORAGE_KEY = "tipografi-index-language";

  const STRINGS = {
    tr: {
      "language.label": "Dil seçimi",
      "language.tr": "Türkçe seç",
      "language.en": "İngilizce seç",
      "logo.alt": "Türkçe Tipografi Topluluğu logosu",
      "skip.search": "Arama ve filtrelere geç",
      "skip.list": "Kayıt listesine geç",
      "home.label": "Ana sayfa",
      "header.links": "Yayın ve topluluk bağlantıları",
      "header.newsletter": "Bülten Arşivi",
      "theme.toLight": "Açık moda geç",
      "theme.toDark": "Koyu moda geç",
      "hero.eyebrow": "DİZİN",
      "page.title": "Yazı Tasarımcıları ve Yazıevleri",
      "page.description": "Türkiye’den yazı tasarımcılarını ve yazıevlerini bir araya getiren açık dizin.",
      "hero.suggest": "Kayıt Öner",
      "hero.suggestTitle": "Dizine yeni bir yazı tasarımcısı veya yazıevi önerin",
      "suggest.dialog.title": "Dizine yeni kayıt öner",
      "suggest.dialog.intro": "Önerinizi form üzerinden iletin. Gönder düğmesi, bilgileri e-posta taslağı olarak hazırlar.",
      "suggest.field.type": "Kayıt türü *",
      "suggest.field.name": "İsim veya yazıevi adı *",
      "suggest.field.url": "Web sitesi veya portfolyo bağlantısı *",
      "suggest.field.brand": "Marka adı (varsa)",
      "suggest.field.affiliation": "Bağlı olduğu yazıevi (varsa)",
      "suggest.field.members": "Üyeler *",
      "suggest.field.contact": "E-posta adresiniz (isteğe bağlı)",
      "suggest.field.notes": "Ek bilgi (isteğe bağlı)",
      "suggest.placeholder.name": "Örn: Ceyhun Birinci veya Element Type",
      "suggest.placeholder.url": "https://...",
      "suggest.placeholder.brand": "Örn: Artegra Type",
      "suggest.placeholder.affiliation": "Örn: Element Type",
      "suggest.placeholder.members": "Örn: İsim Soyisim, İsim Soyisim",
      "suggest.placeholder.contact": "ornek@eposta.com",
      "suggest.placeholder.notes": "Kayıtla ilgili eklemek istedikleriniz",
      "suggest.members.help": "Yazıevleri için en az iki üyeyi virgülle ayırarak yazın.",
      "suggest.email.note": "Gönder düğmesi e-posta uygulamanızda bir taslak açar. E-postayı orada gözden geçirip göndermeniz gerekir.",
      "suggest.submit": "Gönder",
      "suggest.cancel": "Vazgeç",
      "suggest.close": "Formu kapat",
      "suggest.validation.members": "Yazıevi önerileri için en az iki üye adı girin.",
      "suggest.mail.subject": "Dizin için yeni kayıt önerisi: {name}",
      "suggest.mail.intro": "Merhaba, dizine yeni bir kayıt önermek istiyorum.",
      "suggest.mail.type": "Kayıt türü",
      "suggest.mail.name": "İsim",
      "suggest.mail.url": "Web sitesi / portfolyo",
      "suggest.mail.brand": "Marka",
      "suggest.mail.affiliation": "Bağlı olduğu yazıevi",
      "suggest.mail.members": "Üyeler",
      "suggest.mail.contact": "İletişim e-postası",
      "suggest.mail.notes": "Ek bilgi",
      "hero.updatedAt": "Son güncelleme: {date}",
      "toolbar.label": "Dizin araçları",
      "search.placeholder": "İsim, marka veya yazıevi ara",
      "search.clear": "Aramayı temizle",
      "category.filters": "Kategori filtreleri",
      "category.all": "Tümü",
      "category.typePrefix": "Yazı ",
      "category.designers": "Tasarımcıları",
      "category.designersShort": "Tasarımcı",
      "category.foundries": "Yazıevleri",
      "category.foundriesShort": "Yazıevi",
      "category.designer": "Yazı Tasarımcısı",
      "category.foundry": "Yazıevi",
      "category.record": "KAYIT",
      "category.summary.record": "KAYIT",
      "category.summary.records": "KAYIT",
      "category.summary.designer": "YAZI TASARIMCISI",
      "category.summary.designers": "YAZI TASARIMCISI",
      "category.summary.foundry": "YAZIEVİ",
      "category.summary.foundries": "YAZIEVİ",
      "category.designerUpper": "YAZI TASARIMCISI",
      "category.foundryUpper": "YAZIEVİ",
      "sort.label": "Sıralama ölçütü",
      "sort.default": "Eklenme Sırası",
      "view.label": "Görünüm seçimi",
      "view.showcase": "Vitrin",
      "view.list": "Liste",
      "view.showcaseAria": "Vitrin görünümü",
      "view.listAria": "Liste görünümü",
      "summary.loading": "Yükleniyor...",
      "summary.all": "TOPLAM <strong>{count}</strong> KAYIT LİSTELENİYOR",
      "summary.category": "<strong>{count}</strong> {category} LİSTELENİYOR",
      "summary.search": "<strong>{query}</strong> ARAMASI İÇİN <strong>{count}</strong> {category} {verb}",
      "summary.searchEnglish": "<strong>{count}</strong> {resultLabel} for “<strong>{query}</strong>”",
      "summary.result": "result",
      "summary.results": "results",
      "summary.found": "BULUNDU",
      "summary.notFound": "BULUNAMADI",
      "letter.desktop": "Alfabetik harf indeksi",
      "letter.mobile": "Hızlı harf seçimi",
      "letter.jump": "{letter} harfine atla",
      "status.loadError": "Bağlantı hatası",
      "status.errorTitle": "Dizin Yüklenemedi",
      "status.errorDescription": "Dizin verileri yüklenirken bir sorun oluştu ({detail}). İnternet bağlantınızı kontrol edip yeniden deneyin.",
      "status.httpDetail": "HTTP {code}",
      "status.networkDetail": "ağ bağlantısı hatası",
      "status.retry": "Yeniden dene",
      "empty.title": "Kayıt Bulunamadı",
      "empty.queryAndCategory": "“{query}” araması ve seçili kategoriyle eşleşen herhangi bir kayıt bulunamadı.",
      "empty.query": "“{query}” aramasıyla eşleşen herhangi bir kayıt bulunamadı.",
      "empty.category": "Seçili kategoride eşleşen herhangi bir kayıt bulunamadı.",
      "empty.general": "Şu anda listelenecek kayıt bulunamadı.",
      "empty.resetBoth": "Arama ve filtreleri temizle",
      "empty.resetSearch": "Aramayı temizle",
      "empty.resetCategory": "Filtreyi temizle",
      "empty.resetAll": "Tümünü sıfırla",
      "badge.designer": "Yazı Tasarımcısı",
      "badge.foundry": "Yazıevi",
      "identity.team": "Ekip",
      "identity.brand": "Marka",
      "identity.foundry": "Yazıevi",
      "image.preview": "önizleme görseli",
      "image.list": "görseli",
      "link.newTab": " (yeni sekmede açılır)",
      "footer.label": "Alt bilgi",
      "footer.social": "Sosyal medya bağlantıları",
      "footer.archive": "Tipografi Bülteni Arşivi",
      "footer.contact": "Görüş, öneri ve düzeltme talepleri için bize ulaşın.",
      "footer.subscribe": "Bültene Abone Ol",
      "meta.title": "Yazı Tasarımcıları ve Yazıevleri — Türkçe Tipografi Topluluğu",
      "meta.description": "Türkiye’den yazı tasarımcılarını ve yazıevlerini bir araya getiren açık dizin.",
      "admin.pageTitle": "Yeni Kayıt Ekle — Yazı Tasarımcıları ve Yazıevleri",
      "admin.pageDescription": "Türkçe Tipografi Topluluğu yazı tasarımcıları ve yazıevleri dizinine yeni kayıt önerin.",
      "admin.back": "← Dizin Ana Sayfasına Dön",
      "admin.eyebrow": "YÖNETİM & KATKI",
      "admin.title": "Yeni Kayıt Ekle",
      "admin.intro": "Dizine yeni bir yazı tasarımcısı veya bağımsız yazıevi eklemek için formu doldurun. Canlı önizlemeyi inceleyip güncellenmiş veri dosyasını tek tıkla indirebilirsiniz.",
      "admin.category.label": "Kayıt Türü *",
      "admin.category.designer": "Yazı Tasarımcısı (kişi veya stüdyo)",
      "admin.category.foundry": "Yazıevi (en az iki kişilik kurumsal yapı)",
      "admin.name.label": "İsim veya Yazıevi Adı *",
      "admin.name.placeholder": "Örn: Ceyhun Birinci veya Element Type",
      "admin.brand.label": "Marka Adı (varsa)",
      "admin.brand.placeholder": "Örn: Artegra Type, Biliktu Foundry",
      "admin.affiliation.label": "Bağlı Olduğu Yazıevi (varsa)",
      "admin.affiliation.placeholder": "Örn: Element Type",
      "admin.members.label": "Üyeler (virgülle ayırın, en az 2 kişi) *",
      "admin.members.placeholder": "Örn: İbrahim Kaçtıoğlu, Doğukan Karapınar",
      "admin.members.warning": "⚠ Tek kişilik bir çalışma markası yazıevi sayılmaz. Tür olarak Yazı Tasarımcısı seçip markayı marka alanına yazın.",
      "admin.link.label": "Web Sitesi veya Portfolyo Bağlantısı *",
      "admin.data.error": "data/index.json yüklenemedi. Sayfayı yerel sunucuyla açın (ör. python3 -m http.server); aksi halde mevcut kayıtlar silinebilir.",
      "admin.data.disabled": "data/index.json yüklenemediği için tam dosya indirme devre dışı bırakıldı.",
      "admin.download": "Güncel data/index.json Dosyasını İndir",
      "admin.copy": "Tekil Kayıt JSON'unu Kopyala",
      "admin.preview.card": "Canlı Kart Önizlemesi",
      "admin.preview.json": "Üretilen JSON Kaydı",
      "admin.preview.schemaNote": "Not: Veri dosyasındaki category_labels alanı, dizinle uyumluluk için Türkçe korunur.",
      "admin.validation.nameEmpty": "İsim veya yazıevi adı boş olamaz.",
      "admin.validation.nameDuplicate": "Bu isimde bir kayıt zaten mevcut: “{name}” (ID: {id}).",
      "admin.validation.members": "Yazıevi için en az 2 üye girilmesi zorunludur. Tek kişilik çalışmalar için tür olarak Yazı Tasarımcısı seçip markayı marka alanına yazın.",
      "admin.validation.linkEmpty": "Web sitesi veya portfolyo bağlantısı boş olamaz.",
      "admin.validation.linkInvalid": "Geçerli bir http:// veya https:// bağlantı adresi girin.",
      "admin.validation.linkDuplicate": "Bu bağlantı adresi zaten “{name}” kaydında kullanılıyor (ID: {id}).",
      "admin.notification.fixErrors": "⚠ Lütfen formdaki hataları düzelttikten sonra tekrar deneyin.",
      "admin.notification.copied": "✓ Tekil JSON kaydı panoya kopyalandı!",
      "admin.notification.copyFailed": "⚠ Panoya kopyalama başarısız oldu. Lütfen tarayıcı izinlerini kontrol edin.",
      "admin.notification.downloaded": "✓ 'index.json' indirildi! Dosyayı projedeki 'data/' klasörünün içine taşıyın. Ardından `python3 add.py --update-jsonld` ve `python3 add.py --check` komutlarını çalıştırın.",
      "admin.preview.name": "Örnek Tasarımcı",
      "admin.preview.member1": "Kurucu 1",
      "admin.preview.member2": "Kurucu 2",
      "platform.website": "Web Sitesi"
    },
    en: {
      "language.label": "Language selection",
      "language.tr": "Select Turkish",
      "language.en": "Select English",
      "logo.alt": "Türkçe Tipografi Topluluğu logo",
      "skip.search": "Skip to search and filters",
      "skip.list": "Skip to directory entries",
      "home.label": "Home",
      "header.links": "Publication and community links",
      "header.newsletter": "Newsletter archive",
      "theme.toLight": "Switch to light mode",
      "theme.toDark": "Switch to dark mode",
      "hero.eyebrow": "DIRECTORY",
      "page.title": "Type Designers & Type Foundries",
      "page.description": "An open directory bringing together type designers and type foundries from Türkiye.",
      "hero.suggest": "Suggest an Entry",
      "hero.suggestTitle": "Open the form to suggest a type designer or type foundry",
      "suggest.dialog.title": "Suggest a directory entry",
      "suggest.dialog.intro": "Send your suggestion through the form. The button prepares an email draft with your details.",
      "suggest.field.type": "Entry type *",
      "suggest.field.name": "Name or foundry name *",
      "suggest.field.url": "Website or portfolio URL *",
      "suggest.field.brand": "Brand name (optional)",
      "suggest.field.affiliation": "Affiliated foundry (optional)",
      "suggest.field.members": "Members *",
      "suggest.field.contact": "Your email address (optional)",
      "suggest.field.notes": "Additional information (optional)",
      "suggest.placeholder.name": "e.g. Ceyhun Birinci or Element Type",
      "suggest.placeholder.url": "https://...",
      "suggest.placeholder.brand": "e.g. Artegra Type",
      "suggest.placeholder.affiliation": "e.g. Element Type",
      "suggest.placeholder.members": "e.g. First Last, First Last",
      "suggest.placeholder.contact": "name@example.com",
      "suggest.placeholder.notes": "Anything else we should know about this entry",
      "suggest.members.help": "For type foundries, enter at least two member names separated by commas.",
      "suggest.email.note": "The button opens a draft in your email app. Review and send the email there.",
      "suggest.submit": "Send",
      "suggest.cancel": "Cancel",
      "suggest.close": "Close the form",
      "suggest.validation.members": "Enter at least two member names for a type foundry suggestion.",
      "suggest.mail.subject": "New directory entry suggestion: {name}",
      "suggest.mail.intro": "Hello, I would like to suggest a new directory entry.",
      "suggest.mail.type": "Entry type",
      "suggest.mail.name": "Name",
      "suggest.mail.url": "Website / portfolio",
      "suggest.mail.brand": "Brand",
      "suggest.mail.affiliation": "Affiliated foundry",
      "suggest.mail.members": "Members",
      "suggest.mail.contact": "Contact email",
      "suggest.mail.notes": "Additional information",
      "hero.updatedAt": "Last updated: {date}",
      "toolbar.label": "Directory tools",
      "search.placeholder": "Search names, brands, or foundries",
      "search.clear": "Clear search",
      "category.filters": "Category filters",
      "category.all": "All",
      "category.typePrefix": "Type ",
      "category.designers": "Designers",
      "category.designersShort": "Designers",
      "category.foundries": "Type Foundries",
      "category.foundriesShort": "Foundries",
      "category.designer": "Type Designer",
      "category.foundry": "Type Foundry",
      "category.record": "RECORD",
      "category.summary.record": "record",
      "category.summary.records": "records",
      "category.summary.designer": "type designer",
      "category.summary.designers": "type designers",
      "category.summary.foundry": "type foundry",
      "category.summary.foundries": "type foundries",
      "category.designerUpper": "TYPE DESIGNER",
      "category.foundryUpper": "TYPE FOUNDRY",
      "sort.label": "Sort by",
      "sort.default": "Date added",
      "view.label": "Choose a view",
      "view.showcase": "Showcase",
      "view.list": "List",
      "view.showcaseAria": "Showcase view",
      "view.listAria": "List view",
      "summary.loading": "Loading...",
      "summary.all": "<strong>{count}</strong> RECORDS LISTED",
      "summary.category": "<strong>{count}</strong> {category} LISTED",
      "summary.search": "<strong>{count}</strong> {category} {verb} for “<strong>{query}</strong>”",
      "summary.searchEnglish": "<strong>{count}</strong> {resultLabel} for “<strong>{query}</strong>”",
      "summary.result": "result",
      "summary.results": "results",
      "summary.found": "FOUND",
      "summary.notFound": "FOUND",
      "letter.desktop": "Alphabetical index",
      "letter.mobile": "Quick letter navigation",
      "letter.jump": "Jump to the letter {letter}",
      "status.loadError": "Connection error",
      "status.errorTitle": "Directory Could Not Be Loaded",
      "status.errorDescription": "Something went wrong while loading the directory ({detail}). Check your connection and try again.",
      "status.httpDetail": "HTTP {code}",
      "status.networkDetail": "a network error",
      "status.retry": "Try again",
      "empty.title": "No Entries Found",
      "empty.queryAndCategory": "No entries match the search for “{query}” and the selected category.",
      "empty.query": "No entries match the search for “{query}”.",
      "empty.category": "No entries match the selected category.",
      "empty.general": "There are no entries to display right now.",
      "empty.resetBoth": "Clear search and filters",
      "empty.resetSearch": "Clear search",
      "empty.resetCategory": "Clear filter",
      "empty.resetAll": "Reset all",
      "badge.designer": "Type Designer",
      "badge.foundry": "Type Foundry",
      "identity.team": "Team",
      "identity.brand": "Brand",
      "identity.foundry": "Foundry",
      "image.preview": "preview image",
      "image.list": "image",
      "link.newTab": " (opens in a new tab)",
      "footer.label": "Footer",
      "footer.social": "Social media links",
      "footer.archive": "Typography Newsletter Archive",
      "footer.contact": "Contact us with feedback, suggestions, or correction requests.",
      "footer.subscribe": "Subscribe to the newsletter",
      "meta.title": "Type Designers & Type Foundries — Türkçe Tipografi Topluluğu",
      "meta.description": "An open directory bringing together type designers and type foundries from Türkiye.",
      "admin.pageTitle": "Add a New Entry — Type Designers & Type Foundries",
      "admin.pageDescription": "Suggest an entry for the Türkçe Tipografi Topluluğu directory of type designers and type foundries.",
      "admin.back": "← Back to the directory",
      "admin.eyebrow": "CONTRIBUTE",
      "admin.title": "Add a New Entry",
      "admin.intro": "Use this form to suggest a type designer or independent type foundry. Review the live preview, then download the updated data file with one click.",
      "admin.category.label": "Entry type *",
      "admin.category.designer": "Type Designer (individual or studio)",
      "admin.category.foundry": "Type Foundry (organization with at least two members)",
      "admin.name.label": "Name or Foundry Name *",
      "admin.name.placeholder": "e.g. Ceyhun Birinci or Element Type",
      "admin.brand.label": "Brand Name (optional)",
      "admin.brand.placeholder": "e.g. Artegra Type, Biliktu Foundry",
      "admin.affiliation.label": "Affiliated Foundry (optional)",
      "admin.affiliation.placeholder": "e.g. Element Type",
      "admin.members.label": "Members (comma-separated, at least 2) *",
      "admin.members.placeholder": "e.g. İbrahim Kaçtıoğlu, Doğukan Karapınar",
      "admin.members.warning": "⚠ A solo practice does not qualify as a type foundry. Choose Type Designer and enter the brand in the Brand Name field.",
      "admin.link.label": "Website or Portfolio URL *",
      "admin.data.error": "Could not load data/index.json. Open this page through a local server (for example, python3 -m http.server); otherwise the existing entries could be lost.",
      "admin.data.disabled": "The full file download is disabled because data/index.json could not be loaded.",
      "admin.download": "Download Current data/index.json",
      "admin.copy": "Copy Entry JSON",
      "admin.preview.card": "Live Card Preview",
      "admin.preview.json": "Generated JSON Entry",
      "admin.preview.schemaNote": "Note: The category_labels values stay in Turkish to match the directory data format.",
      "admin.validation.nameEmpty": "Name or foundry name cannot be empty.",
      "admin.validation.nameDuplicate": "An entry with this name already exists: “{name}” (ID: {id}).",
      "admin.validation.members": "A type foundry must have at least two members. For a solo practice, choose Type Designer and enter the brand in the Brand Name field.",
      "admin.validation.linkEmpty": "Website or portfolio URL cannot be empty.",
      "admin.validation.linkInvalid": "Enter a valid http:// or https:// URL.",
      "admin.validation.linkDuplicate": "This URL is already used by “{name}” (ID: {id}).",
      "admin.notification.fixErrors": "⚠ Correct the form errors and try again.",
      "admin.notification.copied": "✓ Entry JSON copied to the clipboard.",
      "admin.notification.copyFailed": "⚠ Could not copy to the clipboard. Check your browser permissions and try again.",
      "admin.notification.downloaded": "✓ 'index.json' downloaded. Move it into the project's 'data/' folder, then run `python3 add.py --update-jsonld` and `python3 add.py --check`.",
      "admin.preview.name": "Sample Designer",
      "admin.preview.member1": "Founder 1",
      "admin.preview.member2": "Founder 2",
      "platform.website": "Website"
    }
  };

  function getLanguage() {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "tr";
    } catch (_) {
      return "tr";
    }
  }

  function t(key, language = getLanguage(), values = {}) {
    const template = (STRINGS[language] && STRINGS[language][key]) || STRINGS.tr[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
  }

  function setMeta(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("content", value);
  }

  function updateStructuredData(language) {
    const script = document.getElementById("schema-jsonld");
    if (!script) return;
    try {
      const data = JSON.parse(script.textContent);
      for (const item of data["@graph"] || []) {
        if (item["@type"] === "WebSite" || item["@type"] === "CollectionPage") {
          item.name = t("meta.title", language);
          item.description = t("meta.description", language);
          item.inLanguage = language;
        }
        if (item["@type"] === "CollectionPage" && item.mainEntity?.itemListElement) {
          for (const entry of item.mainEntity.itemListElement) {
            if (entry.item?.jobTitle) entry.item.jobTitle = t("category.designer", language);
          }
        }
      }
      script.textContent = JSON.stringify(data, null, 2);
    } catch (_) {
      // Leave the source structured data untouched if it is malformed.
    }
  }

  function updateMetadata(language) {
    const isAdminPage = /(?:^|\/)ekle\.html$/.test(window.location.pathname);
    document.title = t(isAdminPage ? "admin.pageTitle" : "meta.title", language);
    setMeta('meta[name="description"]', t(isAdminPage ? "admin.pageDescription" : "meta.description", language));
    if (!isAdminPage) {
      setMeta('meta[property="og:locale"]', language === "en" ? "en_US" : "tr_TR");
      setMeta('meta[property="og:title"]', t("meta.title", language));
      setMeta('meta[property="og:description"]', t("meta.description", language));
      setMeta('meta[name="twitter:title"]', t("meta.title", language));
      setMeta('meta[name="twitter:description"]', t("meta.description", language));
      updateStructuredData(language);
    }
  }

  function applyTranslations(root = document, language = getLanguage()) {
    root.querySelectorAll("[data-i18n]").forEach((element) => {
      const values = {};
      if (element.dataset.i18nDate) {
        const date = new Date(`${element.dataset.i18nDate}T00:00:00`);
        values.date = Number.isNaN(date.getTime())
          ? element.dataset.i18nDate
          : date.toLocaleDateString(language === "en" ? "en-GB" : "tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
      }
      element.textContent = t(element.dataset.i18n, language, values);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder, language));
    });
    root.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.setAttribute("title", t(element.dataset.i18nTitle, language));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel, language));
    });
    root.querySelectorAll("[data-i18n-alt]").forEach((element) => {
      element.setAttribute("alt", t(element.dataset.i18nAlt, language));
    });
    updateLanguageSwitchers(language);
  }

  function updateLanguageSwitchers(language) {
    document.querySelectorAll(".language-switcher").forEach((switcher) => {
      switcher.setAttribute("aria-label", t("language.label", language));
      switcher.querySelectorAll("[data-language-option]").forEach((button) => {
        const isActive = button.dataset.languageOption === language;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });
  }

  function setLanguage(language) {
    const nextLanguage = language === "en" ? "en" : "tr";
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (_) {
      // Language switching still works for this page when storage is unavailable.
    }
    document.documentElement.lang = nextLanguage;
    applyTranslations(document, nextLanguage);
    updateMetadata(nextLanguage);
    window.dispatchEvent(new CustomEvent("ttti:languagechange", { detail: { language: nextLanguage } }));
  }

  document.documentElement.lang = getLanguage();
  window.TTTI18N = Object.freeze({ getLanguage, t, setLanguage, applyTranslations });

  document.addEventListener("DOMContentLoaded", () => {
    const language = getLanguage();
    document.documentElement.lang = language;
    applyTranslations(document, language);
    updateMetadata(language);
    document.querySelectorAll("[data-language-option]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.languageOption));
    });
  });
})();
