#!/usr/bin/env python3
"""
Yazı Tasarımcıları ve Yazıevleri
Yeni Kayıt Ekleme Sihirbazı ve Veri Denetleyicisi (add.py)

Kullanım:
    python3 add.py                      # Yeni kayıt ekleme sihirbazı
    python3 add.py --check              # data/index.json şema ve tutarlılık denetimi
    python3 add.py --update-jsonld      # index.html Schema.org JSON-LD bloğunu güncelle
    python3 add.py --optimize-thumbnails # Mevcut küçük resimleri (thumbnails) sıkıştır ve boyutlandır
"""

import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from urllib.parse import urlparse
import urllib.request

try:
    from PIL import Image, ImageOps
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

DATA_FILE = "data/index.json"
THUMBNAILS_DIR = "assets/thumbnails"
MAX_IMAGE_WIDTH = 1000
MAX_IMAGE_HEIGHT = 1500
IMAGE_JPEG_QUALITY = 82


def get_clean_domain(url):
    try:
        return urlparse(url).netloc.replace("www.", "").lower()
    except Exception:
        return ""


def normalize_url(url):
    """URL'yi karşılaştırma için normalize eder (protokol ve www temizlenir, sondaki eğik çizgi kaldırılır)."""
    if not url:
        return ""
    try:
        p = urlparse(url.lower().strip())
        netloc = p.netloc.replace("www.", "")
        path = p.path.rstrip("/")
        return f"{netloc}{path}"
    except Exception:
        return url.lower().strip().rstrip("/")


def detect_platform(url):
    domain = get_clean_domain(url)
    if "myfonts.com" in domain:
        return "MyFonts"
    elif "behance.net" in domain:
        return "Behance"
    elif "creativemarket.com" in domain:
        return "Creative Market"
    elif "fonts.google.com" in domain:
        return "Google Fonts"
    elif "gmk.org.tr" in domain:
        return "GMK Sergi"
    return "Web Sitesi"


def slugify(text):
    tr_map = {
        "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
        "ş": "s", "Ş": "s", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c"
    }
    for tr_char, en_char in tr_map.items():
        text = text.replace(tr_char, en_char)
    text = text.lower().strip()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def optimize_and_save_image(raw_bytes, target_path_no_ext, preferred_ext="jpg"):
    """
    Görsel baytlarını Pillow ile okur, maksimum genişliğe göre oranlı küçültür,
    EXIF oryantasyonunu düzeltir ve sıkıştırarak kaydeder.
    Pillow mevcut değilse macOS sips komutuna başvurur veya doğrudan baytları yazar.
    Dönen değer: kaydedilen dosya yolu (örn. 'assets/thumbnails/item_01.jpg')
    """
    if not raw_bytes:
        return None

    # 1. Pillow mevcutsa tam optimizasyon
    if HAS_PILLOW:
        try:
            img = Image.open(io.BytesIO(raw_bytes))

            # EXIF oryantasyonu düzelt (telefon fotoğraflarındaki ters/yan dönmeyi engeller)
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # Genişlik sınırlandırması (oranı koruyarak küçült)
            if img.width > MAX_IMAGE_WIDTH:
                ratio = MAX_IMAGE_WIDTH / float(img.width)
                new_height = max(1, int(round(img.height * ratio)))
                resample_filter = getattr(Image, "Resampling", Image).LANCZOS
                img = img.resize((MAX_IMAGE_WIDTH, new_height), resample_filter)

            # Aşırı dikey görseller (tam sayfa ekran görüntüleri) için üst bölümü koruyarak sınırla
            if img.height > MAX_IMAGE_HEIGHT:
                img = img.crop((0, 0, img.width, MAX_IMAGE_HEIGHT))

            # Şeffaflık kanalı kontrolü
            has_alpha = False
            if img.mode in ("RGBA", "LA"):
                alpha = img.split()[-1]
                has_alpha = alpha.getextrema()[0] < 255
            elif img.mode == "P" and "transparency" in img.info:
                has_alpha = True

            orig_ext = (preferred_ext or "").lower().strip(".")
            if has_alpha or orig_ext == "png":
                out_ext = "png"
                out_path = f"{target_path_no_ext}.png"
                img.save(out_path, format="PNG", optimize=True)
            else:
                out_ext = "jpg"
                out_path = f"{target_path_no_ext}.jpg"
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.save(out_path, format="JPEG", quality=IMAGE_JPEG_QUALITY, optimize=True)

            # Farklı uzantıda eski bir dosya varsa temizle
            alt_ext = "png" if out_ext == "jpg" else "jpg"
            alt_path = f"{target_path_no_ext}.{alt_ext}"
            if os.path.exists(alt_path) and alt_path != out_path:
                try:
                    os.remove(alt_path)
                except OSError:
                    pass

            return out_path
        except Exception as e:
            print(f"  ⚠ Pillow ile görsel optimize edilirken uyarı ({e}), alternatif yönteme geçiliyor.")

    # 2. macOS sips aracı fallback'i
    sips_bin = shutil.which("sips")
    clean_ext = (preferred_ext or "jpg").lower().strip(".")
    if clean_ext not in ["jpg", "jpeg", "png"]:
        clean_ext = "jpg"
    out_path = f"{target_path_no_ext}.{clean_ext}"

    if sips_bin:
        try:
            with open(out_path, "wb") as f:
                f.write(raw_bytes)
            subprocess.run([sips_bin, "--resampleWidth", str(MAX_IMAGE_WIDTH), out_path],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            if clean_ext in ["jpg", "jpeg"]:
                subprocess.run([sips_bin, "-s", "formatOptions", str(IMAGE_JPEG_QUALITY), out_path],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            return out_path
        except Exception:
            pass

    # 3. Doğrudan yazma fallback'i
    with open(out_path, "wb") as f:
        f.write(raw_bytes)
    return out_path


def download_or_copy_image(source, target_index):
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)
    if not source:
        return None

    target_base = f"{THUMBNAILS_DIR}/item_{target_index:02d}"

    # URL mi yoksa yerel dosya yolu mu?
    if source.startswith("http://") or source.startswith("https://"):
        try:
            print(f"  → Görsel indiriliyor: {source}")
            headers = {"User-Agent": "Mozilla/5.0"}
            req = urllib.request.Request(source, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read()
                content_type = resp.headers.get_content_type()
                preferred_ext = "png" if "png" in content_type else "jpg"
                filename = optimize_and_save_image(content, target_base, preferred_ext=preferred_ext)
                if filename:
                    size_kb = os.path.getsize(filename) / 1024
                    print(f"  ✓ Görsel optimize edilerek kaydedildi: {filename} ({size_kb:.1f} KB)")
                    return filename
                return None
        except Exception as e:
            print(f"  ⚠ Görsel indirilemedi ({e}), boş geçilecek.")
            return None
    elif os.path.isfile(source):
        try:
            ext = os.path.splitext(source)[1].lstrip(".").lower() or "jpg"
            with open(source, "rb") as src_f:
                content = src_f.read()
            filename = optimize_and_save_image(content, target_base, preferred_ext=ext)
            if filename:
                size_kb = os.path.getsize(filename) / 1024
                print(f"  ✓ Yerel görsel optimize edilerek kaydedildi: {filename} ({size_kb:.1f} KB)")
                return filename
            return None
        except Exception as e:
            print(f"  ⚠ Görsel kopyalanamadı ({e}), boş geçilecek.")
            return None
    return None


def generate_jsonld(data):
    """Schema.org uyumlu JSON-LD grafiğini üretir."""
    base_url = "https://tipografitoplulugu.github.io/turkish-type-index/"
    items = data.get("items", [])
    list_elements = []
    for idx, item in enumerate(items, 1):
        is_foundry = "foundry" in item.get("categories", [])
        schema_item = {
            "@type": "Organization" if is_foundry else "Person",
            "name": item["name"],
            "url": item.get("link", base_url)
        }
        if item.get("image"):
            img = item["image"]
            schema_item["image"] = base_url + img.lstrip("/") if not img.startswith("http") else img
        if is_foundry:
            if item.get("members"):
                schema_item["member"] = [{"@type": "Person", "name": m} for m in item["members"]]
        else:
            schema_item["jobTitle"] = "Yazı Tasarımcısı"
            if item.get("brand"):
                schema_item["brand"] = {"@type": "Brand", "name": item["brand"]}
            if item.get("affiliation"):
                schema_item["worksFor"] = {"@type": "Organization", "name": item["affiliation"]}
        list_elements.append({
            "@type": "ListItem",
            "position": idx,
            "item": schema_item
        })

    graph = [
        {
            "@type": "WebSite",
            "@id": base_url + "#website",
            "url": base_url,
            "name": data.get("title", "Yazı Tasarımcıları ve Yazıevleri"),
            "description": data.get("subtitle", ""),
            "inLanguage": "tr",
            "publisher": {
                "@type": "Organization",
                "@id": "https://tipografitoplulugu.github.io/#organization",
                "name": "Türkçe Tipografi Topluluğu",
                "url": "https://tipografitoplulugu.github.io/bulten-arsivi/",
                "logo": {
                    "@type": "ImageObject",
                    "url": base_url + "logo.png"
                }
            }
        },
        {
            "@type": "CollectionPage",
            "@id": base_url + "#webpage",
            "url": base_url,
            "name": f"{data.get('title', 'Yazı Tasarımcıları ve Yazıevleri')} — Türkçe Tipografi Topluluğu",
            "description": data.get("subtitle", ""),
            "isPartOf": {"@id": base_url + "#website"},
            "about": {"@type": "Thing", "name": "Tipografi ve Yazı Tasarımı"},
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": len(list_elements),
                "itemListElement": list_elements
            }
        }
    ]

    return {
        "@context": "https://schema.org",
        "@graph": graph
    }


MONTHS_TR = {
    1: "Ocak", 2: "Şubat", 3: "Mart", 4: "Nisan", 5: "Mayıs", 6: "Haziran",
    7: "Temmuz", 8: "Ağustos", 9: "Eylül", 10: "Ekim", 11: "Kasım", 12: "Aralık"
}


def format_turkish_date(date_str):
    if not date_str:
        return ""
    try:
        parts = date_str.strip().split("-")
        year = int(parts[0])
        month = int(parts[1])
        day = int(parts[2])
        return f"{day} {MONTHS_TR.get(month, '')} {year}"
    except Exception:
        return date_str


def generate_noscript_block(data):
    items = data.get("items", [])
    lines = [
        '            <!-- NOSCRIPT:START -->',
        '            <div class="noscript-content" style="margin-bottom: 2rem; padding: 1.25rem 1.5rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface);">',
        '              <p style="margin: 0 0 .5rem; font-weight: 600; font-size: 1.05rem; color: var(--ink);">Bu dizin JavaScript gerektirir.</p>',
        '              <p style="margin: 0 0 1.25rem; font-size: .88rem; color: var(--muted); line-height: 1.6;">Arama, filtreleme ve interaktif vitrin/liste görünümü için lütfen tarayıcınızda JavaScript\'i etkinleştirin. Aşağıda dizindeki tüm yazı tasarımcıları ve yazıevlerinin bağlantı listesi yer almaktadır:</p>',
        '              <ul class="noscript-list" style="margin: 0; padding-left: 1.25rem; line-height: 1.85; font-size: .95rem;">'
    ]
    for it in sorted(items, key=lambda x: x.get("name", "").lower()):
        name = html.escape(it.get("name", ""))
        link = html.escape(it.get("link", ""))
        label = html.escape((it.get("category_labels") or [""])[0])
        suffix = f' — <span style="color: var(--muted); font-size: .85rem;">{label}</span>' if label else ""
        lines.append(f'                <li><a href="{link}" target="_blank" rel="noopener noreferrer">{name}</a>{suffix}</li>')
    lines.append('              </ul>')
    lines.append('            </div>')
    lines.append('            <!-- NOSCRIPT:END -->')
    return "\n".join(lines)


def update_index_html_noscript(html_content, data):
    noscript_block = generate_noscript_block(data)
    pattern = re.compile(r'([ \t]*)<!-- NOSCRIPT:START -->.*?<!-- NOSCRIPT:END -->', re.DOTALL)
    if pattern.search(html_content):
        return pattern.sub(lambda _: noscript_block, html_content)
    else:
        target = '<div class="directory-container view-grid" id="directory-list"'
        wrapped = f'<noscript>\n{noscript_block}\n          </noscript>\n          '
        if target in html_content:
            return html_content.replace(target, wrapped + target)
        return html_content


def update_index_html_updated_at(html_content, data):
    updated_at_raw = data.get("updated_at", "")
    if not updated_at_raw:
        return html_content
    date_formatted = format_turkish_date(updated_at_raw)
    pattern = re.compile(r'(<div class="hero-updated-at" id="hero-updated-at">)(.*?)(</div>)')
    if pattern.search(html_content):
        return pattern.sub(lambda m: f"{m.group(1)}Son güncelleme: {date_formatted}{m.group(3)}", html_content)
    return html_content


def update_sitemap_lastmod(data):
    if not os.path.exists("sitemap.xml"):
        return
    updated_at_raw = data.get("updated_at", "")
    if not updated_at_raw:
        return
    with open("sitemap.xml", "r", encoding="utf-8") as f:
        sitemap_content = f.read()
    pattern = re.compile(r'(<lastmod>)(.*?)(</lastmod>)')
    if pattern.search(sitemap_content):
        new_content = pattern.sub(lambda m: f"{m.group(1)}{updated_at_raw}{m.group(3)}", sitemap_content)
        with open("sitemap.xml", "w", encoding="utf-8") as f:
            f.write(new_content)


def update_index_html_jsonld(data=None):
    """data/index.json verisini index.html içindeki Schema.org JSON-LD bloğuna senkronize eder."""
    if data is None:
        if not os.path.exists(DATA_FILE):
            print(f"HATA: {DATA_FILE} dosyası bulunamadı!")
            sys.exit(1)
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

    if not os.path.exists("index.html"):
        return

    jsonld_doc = generate_jsonld(data)
    jsonld_str = json.dumps(jsonld_doc, ensure_ascii=False, indent=2)
    # JSON-LD metnindeki "</" dizilerini "<\/" olarak kaçışla (script tag kapatma veya XSS hatalarını önler)
    jsonld_str = jsonld_str.replace("</", "<\\/")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    pattern = re.compile(
        r'(<script type="application/ld\+json" id="schema-jsonld">)(.*?)(</script>)',
        re.DOTALL
    )

    if pattern.search(html):
        # Şablon sorunlarını ve kaçış karakteri bozulmalarını önlemek için lambda kullanılır
        new_html = pattern.sub(lambda m: f"{m.group(1)}\n{jsonld_str}\n  {m.group(3)}", html)
    else:
        target = '  <!-- Preconnect Fonts -->'
        block = f'  <!-- Schema.org Structured Data (JSON-LD) -->\n  <script type="application/ld+json" id="schema-jsonld">\n{jsonld_str}\n  </script>\n\n'
        if target in html:
            new_html = html.replace(target, block + target)
        else:
            new_html = html.replace('</head>', f'{block}</head>')

    # Noscript listesi senkronizasyonu
    new_html = update_index_html_noscript(new_html, data)

    # Son güncelleme tarihi senkronizasyonu
    new_html = update_index_html_updated_at(new_html, data)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_html)

    # sitemap.xml lastmod senkronizasyonu
    update_sitemap_lastmod(data)


def run_check():
    """data/index.json dosyasını şema ve tutarlılık kurallarına göre doğrular."""
    if not os.path.exists(DATA_FILE):
        print(f"HATA: {DATA_FILE} dosyası bulunamadı!")
        sys.exit(1)

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"HATA: {DATA_FILE} JSON olarak okunamadı: {e}")
        sys.exit(1)

    items = data.get("items", [])
    total_count = data.get("total_count")
    designers_count = data.get("designers_count")
    foundries_count = data.get("foundries_count")

    errors = []

    # 1. Sayaç ve toplam denetimi
    actual_total = len(items)
    actual_designers = sum(1 for it in items if "designer" in it.get("categories", []))
    actual_foundries = sum(1 for it in items if "foundry" in it.get("categories", []))

    if total_count != actual_total:
        errors.append(f"top-level 'total_count' ({total_count}) ile kayıt sayısı ({actual_total}) eşleşmiyor.")
    if designers_count != actual_designers:
        errors.append(f"top-level 'designers_count' ({designers_count}) ile tasarımcı sayısı ({actual_designers}) eşleşmiyor.")
    if foundries_count != actual_foundries:
        errors.append(f"top-level 'foundries_count' ({foundries_count}) ile yazıevi sayısı ({actual_foundries}) eşleşmiyor.")
    if (designers_count + foundries_count) != total_count:
        errors.append(f"designers_count ({designers_count}) + foundries_count ({foundries_count}) != total_count ({total_count})")

    # 2. Tekillik (id ve index) denetimi
    seen_ids = set()
    duplicate_ids = set()
    seen_indices = set()
    duplicate_indices = set()

    for idx, item in enumerate(items, start=1):
        item_id = item.get("id")
        if item_id:
            if item_id in seen_ids:
                duplicate_ids.add(item_id)
            seen_ids.add(item_id)
        else:
            errors.append(f"[{idx}. kayıt] 'id' alanı eksik.")

        item_index = item.get("index")
        if item_index is not None:
            if item_index in seen_indices:
                duplicate_indices.add(item_index)
            seen_indices.add(item_index)
        else:
            errors.append(f"[{item_id or idx}. kayıt] 'index' alanı eksik.")

    if duplicate_ids:
        errors.append(f"Yinelenen id değerleri bulundu: {sorted(list(duplicate_ids))}")
    if duplicate_indices:
        errors.append(f"Yinelenen index değerleri bulundu: {sorted(list(duplicate_indices))}")

    # 3. Her kayıt için kural denetimleri
    for idx, item in enumerate(items, start=1):
        item_id = item.get("id", f"sira-{idx}")
        name = item.get("name", "")

        # (a) categories tek elemanlı mı?
        categories = item.get("categories")
        if not isinstance(categories, list) or len(categories) != 1 or categories[0] not in ["designer", "foundry"]:
            errors.append(f"[{item_id}] 'categories' tek elemanlı ('designer' veya 'foundry') olmalıdır. Mevcut: {categories}")

        # (b) category_labels uyumlu mu?
        labels = item.get("category_labels")
        if categories == ["foundry"] and labels != ["Yazıevi"]:
            errors.append(f"[{item_id}] Yazıevi için 'category_labels' ['Yazıevi'] olmalıdır. Mevcut: {labels}")
        if categories == ["designer"] and labels != ["Yazı Tasarımcısı"]:
            errors.append(f"[{item_id}] Yazı Tasarımcısı için 'category_labels' ['Yazı Tasarımcısı'] olmalıdır. Mevcut: {labels}")

        # (c) foundry ise members en az 2 mi?
        members = item.get("members")
        if categories == ["foundry"]:
            if not isinstance(members, list) or len(members) < 2:
                errors.append(f"[{item_id}] Yazıevi kaydında 'members' en az iki kişilik bir dizi olmalıdır. Mevcut: {members}")
        else:
            # (d) designer ise members null mu?
            if members is not None:
                errors.append(f"[{item_id}] Yazı Tasarımcısı kaydında 'members' null olmalıdır. Mevcut: {members}")

        # (e) name içinde parantez var mı?
        if "(" in name or ")" in name:
            errors.append(f"[{item_id}] 'name' içinde parantez bulunamaz: '{name}'")

        # (f) studio veya designer anahtarı var mı?
        if "studio" in item:
            errors.append(f"[{item_id}] Eski 'studio' anahtarı mevcut olmamalıdır.")
        if "designer" in item:
            errors.append(f"[{item_id}] Eski 'designer' anahtarı mevcut olmamalıdır.")

    # 4. index.html Schema.org (JSON-LD) denetimi
    if os.path.exists("index.html"):
        try:
            with open("index.html", "r", encoding="utf-8") as hf:
                html_content = hf.read()
            m = re.search(r'<script type="application/ld\+json" id="schema-jsonld">\s*(\{.*?\})\s*</script>', html_content, re.DOTALL)
            if not m:
                errors.append("index.html içinde <script type=\"application/ld+json\" id=\"schema-jsonld\"> bloğu bulunamadı.")
            else:
                schema_doc = json.loads(m.group(1))
                if schema_doc.get("@context") != "https://schema.org":
                    errors.append(f"index.html JSON-LD @context geçersiz: {schema_doc.get('@context')}")
                graph = schema_doc.get("@graph", [])
                collection_page = next((n for n in graph if n.get("@type") == "CollectionPage"), None)
                if not collection_page:
                    errors.append("index.html JSON-LD içinde CollectionPage düğümü bulunamadı.")
                else:
                    item_list = collection_page.get("mainEntity", {})
                    num_items = item_list.get("numberOfItems")
                    elements = item_list.get("itemListElement", [])
                    if num_items != actual_total or len(elements) != actual_total:
                        errors.append(f"index.html JSON-LD içindeki kayıt sayısı ({num_items}) ile index.json ({actual_total}) uyuşmuyor. 'python3 add.py --update-jsonld' çalıştırın.")
        except Exception as e:
            errors.append(f"index.html JSON-LD doğrulanırken hata oluştu: {e}")

    if errors:
        print(f"\n❌ DENETİM BAŞARISIZ: {len(errors)} hata bulundu:\n")
        for err in errors:
            print(f"  • {err}")
        print()
        sys.exit(1)
    else:
        print(f"\n✓ Tüm denetimler başarıyla geçti ({actual_total} kayıt doğrulandı: "
              f"{actual_designers} Tasarımcı, {actual_foundries} Yazıevi).")
        print(f"  • index.html Schema.org (JSON-LD) yapılandırılmış verisi doğrulandı ({actual_total} kayıt).\n")
        sys.exit(0)


def optimize_all_thumbnails():
    """assets/thumbnails klasöründeki mevcut görselleri optimize eder ve index.json ile senkronize eder."""
    if not os.path.exists(DATA_FILE):
        print(f"HATA: {DATA_FILE} bulunamadı!")
        sys.exit(1)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("items", [])
    total_saved_bytes = 0
    updated_count = 0

    print("\n" + "=" * 60)
    print("  Görselleri Optimize Etme Aracı")
    print("=" * 60 + "\n")

    for item in items:
        img_path = item.get("image")
        if not img_path or not os.path.isfile(img_path):
            continue

        # Idempotency: genişliği <= MAX_IMAGE_WIDTH ve yüksekliği <= MAX_IMAGE_HEIGHT ise yeniden sıkıştırma; atla
        skip = False
        img_w, img_h = None, None
        if HAS_PILLOW:
            try:
                with Image.open(img_path) as im:
                    img_w, img_h = im.width, im.height
                    if img_w <= MAX_IMAGE_WIDTH and img_h <= MAX_IMAGE_HEIGHT:
                        skip = True
            except Exception:
                pass
        else:
            sips_bin = shutil.which("sips")
            if sips_bin:
                try:
                    res_w = subprocess.run([sips_bin, "-g", "pixelWidth", img_path],
                                           capture_output=True, text=True, check=False)
                    res_h = subprocess.run([sips_bin, "-g", "pixelHeight", img_path],
                                           capture_output=True, text=True, check=False)
                    mw = re.search(r'pixelWidth:\s*(\d+)', res_w.stdout)
                    mh = re.search(r'pixelHeight:\s*(\d+)', res_h.stdout)
                    if mw and mh:
                        img_w, img_h = int(mw.group(1)), int(mh.group(1))
                        if img_w <= MAX_IMAGE_WIDTH and img_h <= MAX_IMAGE_HEIGHT:
                            skip = True
                except Exception:
                    pass

        if skip:
            dim_str = f" ({img_w}x{img_h} px ≤ {MAX_IMAGE_WIDTH}x{MAX_IMAGE_HEIGHT})" if img_w and img_h else ""
            print(f"  • {os.path.basename(img_path)}: atlandı{dim_str}")
            continue

        orig_size = os.path.getsize(img_path)
        base_name, ext = os.path.splitext(img_path)
        preferred_ext = ext.lstrip(".").lower()

        with open(img_path, "rb") as f:
            raw_bytes = f.read()

        new_path = optimize_and_save_image(raw_bytes, base_name, preferred_ext=preferred_ext)
        if new_path and os.path.isfile(new_path):
            new_size = os.path.getsize(new_path)
            diff = orig_size - new_size
            total_saved_bytes += diff
            updated_count += 1
            if new_path != img_path:
                item["image"] = new_path
            print(f"  • {os.path.basename(img_path)}: {orig_size/1024:.1f} KB → {new_size/1024:.1f} KB")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    update_index_html_jsonld(data)

    print("\n" + "-" * 60)
    print(f"✓ {updated_count} görsel optimize edildi.")
    if total_saved_bytes > 0:
        print(f"  Toplam tasarruf: {total_saved_bytes / 1024:.1f} KB ({total_saved_bytes / (1024 * 1024):.2f} MB)")
    print("-" * 60 + "\n")


def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == "--check":
            run_check()
            return
        elif arg in ["--update-jsonld", "--jsonld"]:
            update_index_html_jsonld()
            print("✓ index.html Schema.org (JSON-LD) başarıyla güncellendi.")
            return
        elif arg in ["--optimize-thumbnails", "--optimize-images"]:
            optimize_all_thumbnails()
            return

    print("\n" + "=" * 60)
    print("  Yazı Tasarımcıları ve Yazıevleri — Yeni Kayıt Ekleme")
    print("=" * 60 + "\n")

    if not os.path.exists(DATA_FILE):
        print(f"Hata: {DATA_FILE} dosyası bulunamadı!")
        sys.exit(1)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("items", [])
    max_index = max((it.get("index", 0) for it in items), default=0)
    next_index = max_index + 1

    # 1. Tür Seçimi
    print("1. Kayıt Türü:")
    print("   [1] Yazı Tasarımcısı (kişi veya stüdyo)")
    print("   [2] Yazıevi (en az iki kişilik, kurumsal kimlikli yapı)")
    while True:
        type_choice = input("   Seçiminiz (1/2) [Varsayılan: 1]: ").strip() or "1"
        if type_choice in ["1", "2"]:
            break
        print("  Lütfen '1' veya '2' seçin.")

    is_foundry = (type_choice == "2")

    # 2. İsim
    while True:
        name = input("\n2. İsim / Stüdyo / Yazıevi Adı (parantezli marka yazmayın): ").strip()
        if not name:
            print("  Lütfen bir isim girin.")
            continue
        if "(" in name or ")" in name:
            print("  ⚠ İsim alanında parantez kullanamazsınız. Marka adını bir sonraki marka sorusuna yazın.")
            continue

        # Yinelenen isim kontrolü
        existing_name_match = next(
            (it for it in items if it.get("name", "").strip().lower() == name.lower()),
            None
        )
        if existing_name_match:
            print(f"  ⚠ Uyarı: '{existing_name_match['name']}' adında bir kayıt zaten mevcut (ID: {existing_name_match['id']}).")
            confirm = input("    Yine de devam etmek istiyor musunuz? (e/h) [Varsayılan: h]: ").strip().lower()
            if confirm not in ["e", "evet", "y", "yes"]:
                print("    Lütfen farklı bir isim girin.")
                continue
        break

    # 3. Türe Özel Alanlar
    brand = None
    members = None
    affiliation = None

    if is_foundry:
        categories = ["foundry"]
        category_labels = ["Yazıevi"]
        while True:
            members_raw = input("\n3. Üyeler (virgülle ayırın, en az iki kişi): ").strip()
            members_list = [m.strip() for m in members_raw.split(",") if m.strip()]
            if len(members_list) >= 2:
                members = members_list
                break
            print("  ⚠ Tek kişilik bir çalışma markası yazıevi sayılmaz. Tür olarak Yazı Tasarımcısı seçip markayı marka alanına yazın.")
    else:
        categories = ["designer"]
        category_labels = ["Yazı Tasarımcısı"]
        brand_raw = input("\n3. Marka adı (varsa, yoksa Enter): ").strip()
        brand = brand_raw if brand_raw else None

        affiliation_raw = input("   Bağlı olduğu yazıevi (varsa, yoksa Enter): ").strip()
        affiliation = affiliation_raw if affiliation_raw else None

    # 4. Web Sitesi / Bağlantı
    while True:
        link = input("\n4. Web Sitesi / Portfolyo URL: ").strip()
        if not link:
            print("  Lütfen bir bağlantı adresi girin.")
            continue
        if not link.startswith("http://") and not link.startswith("https://"):
            link = "https://" + link

        # Yinelenen link kontrolü (domain + path bazında)
        norm_new_link = normalize_url(link)
        existing_link_match = next(
            (it for it in items if normalize_url(it.get("link", "")) == norm_new_link),
            None
        )
        if existing_link_match:
            print(f"  ⚠ Uyarı: Bu bağlantı adresi ('{existing_link_match['link']}') zaten '{existing_link_match['name']}' kaydında mevcut (ID: {existing_link_match['id']}).")
            confirm = input("    Yine de devam etmek istiyor musunuz? (e/h) [Varsayılan: h]: ").strip().lower()
            if confirm not in ["e", "evet", "y", "yes"]:
                print("    Lütfen farklı bir bağlantı adresi girin.")
                continue
        break

    # 5. Görsel (isteğe bağlı)
    image_source = input("\n5. Görsel URL'si veya Yerel Dosya Yolu (isteğe bağlı, geçmek için Enter): ").strip()
    image_path = download_or_copy_image(image_source, next_index)

    # Otomatik Alanlar
    domain = get_clean_domain(link)
    platform = detect_platform(link)
    slug = slugify(name)
    item_id = f"{next_index:02d}-{slug}"

    new_item = {
        "id": item_id,
        "index": next_index,
        "name": name,
        "categories": categories,
        "category_labels": category_labels,
        "link": link,
        "domain": domain,
        "platform": platform,
        "image": image_path,
        "dropmark_id": None,
        "brand": brand,
        "members": members,
        "affiliation": affiliation
    }

    # Listeye ekle
    items.append(new_item)

    # İstatistikleri güncelle
    data["items"] = items
    data["total_count"] = len(items)
    data["designers_count"] = sum(1 for it in items if "designer" in it.get("categories", []))
    data["foundries_count"] = sum(1 for it in items if "foundry" in it.get("categories", []))
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # index.html Schema.org (JSON-LD) güncelle
    update_index_html_jsonld(data)

    print("\n" + "-" * 60)
    print(f"✓ Başarıyla eklendi: {name}")
    print(f"  • ID: {item_id}")
    print(f"  • Kategori: {', '.join(category_labels)}")
    if brand:
        print(f"  • Marka: {brand}")
    if members:
        print(f"  • Üyeler: {' · '.join(members)}")
    if affiliation:
        print(f"  • Bağlı Yazıevi: {affiliation}")
    print(f"  • Platform: {platform} ({domain})")
    print(f"  • Görsel: {image_path or 'Yok (Tipografik monogram gösterilecek)'}")
    print(f"  • Güncel Toplam: {data['total_count']} kayıt "
          f"({data['designers_count']} Tasarımcı, {data['foundries_count']} Yazıevi)")
    print("-" * 60)
    print("\nŞimdi GitHub Desktop'ı açıp tek tıkla 'Push origin' diyerek canlıya alabilirsiniz!\n")


if __name__ == "__main__":
    main()
