#!/usr/bin/env python3
"""
Yazı Tasarımcıları ve Yazıevleri — Türkiye
Yeni Kayıt Ekleme Sihirbazı ve Veri Denetleyicisi (add.py)

Kullanım:
    python3 add.py          # Yeni kayıt ekleme sihirbazı
    python3 add.py --check  # data/index.json şema ve tutarlılık denetimi
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

    # 2. Her kayıt için kural denetimleri
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

    if errors:
        print(f"\n❌ DENETİM BAŞARISIZ: {len(errors)} hata bulundu:\n")
        for err in errors:
            print(f"  • {err}")
        print()
        sys.exit(1)
    else:
        print(f"\n✓ Tüm denetimler başarıyla geçti ({actual_total} kayıt doğrulandı: "
              f"{actual_designers} Tasarımcı, {actual_foundries} Yazıevi).\n")
        sys.exit(0)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        run_check()
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
    next_index = len(items) + 1

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
        if link:
            if not link.startswith("http://") and not link.startswith("https://"):
                link = "https://" + link
            break
        print("  Lütfen bir bağlantı adresi girin.")

    # 5. Açıklama (isteğe bağlı)
    description = input("\n5. Kısa Açıklama (isteğe bağlı, geçmek için Enter): ").strip()

    # 6. Görsel (isteğe bağlı)
    image_source = input("\n6. Görsel URL'si veya Yerel Dosya Yolu (isteğe bağlı, geçmek için Enter): ").strip()
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
        "description": description,
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
