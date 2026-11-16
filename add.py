#!/usr/bin/env python3
"""
Yazı Tasarımcıları ve Yazıevleri — Türkiye
Yeni Kayıt Ekleme Sihirbazı (add.py)

Kullanım:
    python3 add.py
"""

import json
import os
import re
import sys
from datetime import datetime
from urllib.parse import urlparse
import urllib.request

DATA_FILE = "data/index.json"
THUMBNAILS_DIR = "assets/thumbnails"


def get_clean_domain(url):
    try:
        return urlparse(url).netloc.replace("www.", "").lower()
    except Exception:
        return ""


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


def download_or_copy_image(source, target_index):
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)
    if not source:
        return None

    # URL mi yoksa yerel dosya yolu mu?
    if source.startswith("http://") or source.startswith("https://"):
        try:
            print(f"  → Görsel indiriliyor: {source}")
            headers = {"User-Agent": "Mozilla/5.0"}
            req = urllib.request.Request(source, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read()
                content_type = resp.headers.get_content_type()
                ext = "png" if "png" in content_type else "jpg"
                filename = f"{THUMBNAILS_DIR}/item_{target_index:02d}.{ext}"
                with open(filename, "wb") as f:
                    f.write(content)
                print(f"  ✓ Görsel kaydedildi: {filename}")
                return filename
        except Exception as e:
            print(f"  ⚠ Görsel indirilemedi ({e}), boş geçilecek.")
            return None
    elif os.path.isfile(source):
        try:
            ext = os.path.splitext(source)[1].lstrip(".").lower() or "jpg"
            filename = f"{THUMBNAILS_DIR}/item_{target_index:02d}.{ext}"
            with open(source, "rb") as src_f, open(filename, "wb") as dst_f:
                dst_f.write(src_f.read())
            print(f"  ✓ Yerel görsel kopyalandı: {filename}")
            return filename
        except Exception as e:
            print(f"  ⚠ Görsel kopyalanamadı ({e}), boş geçilecek.")
            return None
    return None


def main():
    print("\n" + "=" * 60)
    print("  Yazı Tasarımcıları ve Yazıevleri — Yeni Kayıt Ekleme")
    print("=" * 60 + "\n")

    if not os.path.exists(DATA_FILE):
        print(f"Hata: {DATA_FILE} dosyası bulunamadı!")
        sys.exit(1)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("items", [])
    next_index = len(items) + 1

    # 1. İsim
    while True:
        name = input("1. İsim / Stüdyo Adı: ").strip()
        if name:
            break
        print("  Lütfen bir isim girin.")

    # 2. Web Sitesi / Bağlantı
    while True:
        link = input("2. Web Sitesi / Portfolyo URL: ").strip()
        if link:
            if not link.startswith("http://") and not link.startswith("https://"):
                link = "https://" + link
            break
        print("  Lütfen bir bağlantı adresi girin.")

    # 3. Kategori
    print("3. Kategori:")
    print("   [1] Yazı Tasarımcısı")
    print("   [2] Yazıevi")
    print("   [3] Her İkisi (Tasarımcı & Yazıevi)")
    cat_choice = input("   Seçiminiz (1/2/3) [Varsayılan: 1]: ").strip() or "1"

    if cat_choice == "2":
        categories = ["foundry"]
        category_labels = ["Yazıevi"]
    elif cat_choice == "3":
        categories = ["designer", "foundry"]
        category_labels = ["Yazı Tasarımcısı", "Yazıevi"]
    else:
        categories = ["designer"]
        category_labels = ["Yazı Tasarımcısı"]

    # 4. Açıklama (isteğe bağlı)
    description = input("4. Kısa Açıklama (isteğe bağlı, geçmek için Enter): ").strip()

    # 5. Görsel (isteğe bağlı)
    image_source = input("5. Görsel URL'si veya Yerel Dosya Yolu (isteğe bağlı, geçmek için Enter): ").strip()
    image_path = download_or_copy_image(image_source, next_index)

    # Otomatik Alanlar
    domain = get_clean_domain(link)
    platform = detect_platform(link)
    slug = slugify(name)
    item_id = f"{next_index:02d}-{slug}"

    # Stüdyo / Tasarımcı ayrımı (varsa)
    designer_val = name
    studio_val = None
    if "foundry" in categories and "designer" in categories:
        studio_val = name

    new_item = {
        "id": item_id,
        "index": next_index,
        "name": name,
        "designer": designer_val,
        "studio": studio_val,
        "categories": categories,
        "category_labels": category_labels,
        "link": link,
        "domain": domain,
        "platform": platform,
        "description": description,
        "image": image_path,
        "dropmark_id": None
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

    print("\n" + "-" * 60)
    print(f"✓ Başarıyla eklendi: {name}")
    print(f"  • ID: {item_id}")
    print(f"  • Kategoriler: {', '.join(category_labels)}")
    print(f"  • Platform: {platform} ({domain})")
    print(f"  • Görsel: {image_path or 'Yok (Tipografik monogram gösterilecek)'}")
    print(f"  • Güncel Toplam: {data['total_count']} kayıt "
          f"({data['designers_count']} Tasarımcı, {data['foundries_count']} Yazıevi)")
    print("-" * 60)
    print("\nŞimdi GitHub Desktop'ı açıp tek tıkla 'Push origin' diyerek canlıya alabilirsiniz!\n")


if __name__ == "__main__":
    main()
