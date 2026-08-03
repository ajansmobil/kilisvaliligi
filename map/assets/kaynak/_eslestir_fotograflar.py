# -*- coding: utf-8 -*-
"""
PDF kart basligi <-> foto eslestirme.
QR / kare kucuk PNG asla yerler/ altina yazilmaz.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import cv2
import fitz
import numpy as np

ROOT = Path(__file__).resolve().parents[2]  # map/
PDF = ROOT.parent / "kilis_gezi_haritasi_2026.pdf"
FOTOGRAFLAR = Path(__file__).parent / "pdf-gorseller" / "Fotograflar"
YERLER = ROOT / "assets" / "yerler"
MANIFEST = Path(__file__).parent / "pdf-gorseller" / "manifest.json"
RAPOR = Path(__file__).parent / "fotograf-eslesme-2026.md"

# PDF baslik (normalize) -> locations.js id
TITLE_TO_ID = {
    "sogutludere": "sogutludere",
    "seve baraji ve cevresi": "seve-baraji",
    "surahbil bin hasene hz. turbesi ve cami": "surahbil-turbesi",
    "caglasyan konagi": "caglasyan-konagi",
    "kilis tarihi hukumet konagi (kilis valiligi)": "hukumet-konagi",
    "bebek ve cocuk kutuphanesi": "kilis-cocuk-kutuphanesi",
    "kemaliye ilgretim okulu": "kemaliye-ilkokulu",
    "kemaliye ilogretim okulu": "kemaliye-ilkokulu",
    "kemaliye ilköğretim okulu": "kemaliye-ilkokulu",
    "seyh mansur simati (r.a) turbesi": "seyh-mansur-turbesi",
    "seyh efendi tekkesi (nakşibendi tekkesi)": "seyh-efendi-turbesi",
    "seyh efendi tekkesi (naksibendi tekkesi)": "seyh-efendi-turbesi",
    "semun nebi turbesi (kit kit dede turbesi)": "kit-kit-dede-turbesi",
    "hz. zubeyr ve hz. talha turbesi": "zubeyr-ve-talha-turbesi",
    "canbolat turbesi": "canbolat-turbesi",
    "seyh muhammed ensari hz. turbesi": "ensari-turbesi",
    "bilal-i habesi turbesi (makami)": "bilal-habesi-turbesi",
    "akinci konagi": "akinci-konagi",
    "neset efendi konagi": "neset-efendi-konagi",
    "salih efendi sokak": "salihefendi-sokak",
    "kilis muzesi (tarihi sabunhane binasi)": "kilis-muzesi",
    "salih aga kasteli": "salih-aga-kasteli",
    "kuru kastel": "kuru-kastel",
    "kucuk carsi kasteli": "kucuk-carsi-kasteli",
    "ipsir pasa kasteli": "ipsir-pasa-kasteli",
    "mehmet pasa cami minaresi (oksuz minare)": "oksuz-minare-camii",
    "alaeddin yavasca muzesi": "alaeddin-yavasca-muzesi",
    "kalender mesrep millet bahcesi": "kalender-mesrep-millet-bahcesi",
    "seyh muhammed bedevi turbesi alani": "bedevi-turbesi",
    "resul osman dagi ve mesire alani": "resul-osman-mesire-alani",
    "akpinar mesire alani": "akpinar-mesire-alani",
    "ravanda kalesi": "ravanda-kalesi",
    "anit agaclar": "anit-agaclar",
    "kilis mevlevihanesi (mevlevihane cami)": "mevlevihane-camii",
    "canbolat pasa tekke camisi (tekke camisi)": "canpolat-pasa-camii",
    "kadi camisi (kara kadi camisi)": "karakadi-camii",
    "haci dervis camisi": "haci-dervis-pasa-camii",
    "aidesim mozaikli bazilika": "aidesim-bazilika",
    "oylum hoyuk": "oylum-hoyuk",
    "haci cumbus cami": "haci-cumbus-camii",
    "ulu cami (cami-i kebir)": "ulu-camii",
    "muallak camii (hasan bey camisi)": "muallak-camii",
    "tabakhane camii": "tabakhane-camii",
    "pasa hamami": "pasa-hamami",
    "eski hamam": "eski-hamam",
    "hoca hamami": "hoca-hamami",
    "cuneyye camii": "cuneyne-camii",
    "akcurun camii": "akcurun-camii",
    "calik camii": "calik-camii",
    "cumhuriyet meydani": "cumhuriyet-meydani",
    "mercidabik meydani": "mercidabik-meydani",
}

SKIP_TITLE_KEYWORDS = (
    "geleneksel el sanatlari",
    "yemeden donme",
    "kilis ulasim",
    "tur programi",
    "turizm danisma",
    "kilis mutfagi",
    "ne alinir",
    "gelenek ve gorenekler",
    "zeytincilik",
    "bagcilik",
    "tarihi sokak dokusu",
    "kilis ili turizm haritasi",
    "ktb.gov",
    "kilis.ktb",
)


def norm(s: str) -> str:
    tr = str.maketrans(
        {
            "ç": "c",
            "Ç": "c",
            "ğ": "g",
            "Ğ": "g",
            "ı": "i",
            "İ": "i",
            "I": "i",
            "ö": "o",
            "Ö": "o",
            "ş": "s",
            "Ş": "s",
            "ü": "u",
            "Ü": "u",
            "â": "a",
            "î": "i",
            "û": "u",
        }
    )
    s = s.translate(tr).lower()
    s = re.sub(r"[/\n]+", " ", s)
    s = re.sub(r"[^a-z0-9.()\- ]+", "", s)
    s = re.sub(r"\s+", " ", s).strip(" .")
    return s


def is_skip_title(t: str) -> bool:
    n = norm(t)
    if len(n) < 4:
        return True
    return any(k in n for k in SKIP_TITLE_KEYWORDS)


def resolve_id(title: str) -> str | None:
    n = norm(title)
    if n in TITLE_TO_ID:
        return TITLE_TO_ID[n]
    # fuzzy contains
    for key, loc_id in TITLE_TO_ID.items():
        if key in n or n in key:
            return loc_id
    # token overlap
    best = None
    best_score = 0
    nt = set(n.replace("(", " ").replace(")", " ").split())
    for key, loc_id in TITLE_TO_ID.items():
        kt = set(key.replace("(", " ").replace(")", " ").split())
        score = len(nt & kt) / max(len(kt), 1)
        if score > best_score:
            best_score = score
            best = loc_id
    if best_score >= 0.55:
        return best
    return None


def load_manifest_by_xref():
    """manifest: [page, idx, xref, w, h, fmt, name]"""
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_xref = {}
    for e in data:
        page, idx, xref, w, h, fmt, name = e
        by_xref[xref] = {
            "page": page,
            "idx": idx,
            "xref": xref,
            "w": w,
            "h": h,
            "fmt": fmt,
            "name": name,
            "path": FOTOGRAFLAR / name,
        }
    return by_xref


def is_photo(meta) -> bool:
    if not meta:
        return False
    w, h = meta["w"], meta["h"]
    # QR-like squares excluded
    if abs(w - h) < 20 and max(w, h) <= 320:
        return False
    if meta["fmt"] == "png" and abs(w - h) < 30 and max(w, h) < 400:
        return False
    p = meta["path"]
    return p.exists()


def extract_titles(page):
    d = page.get_text("dict")
    titles = []
    for b in d["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b.get("lines", []):
            for s in line.get("spans", []):
                font = s.get("font", "")
                size = s.get("size", 0)
                if "HelveticaNeueLTPro-BdCn" in font and abs(size - 7) < 0.6:
                    text = s["text"].replace("\n", " ").strip()
                    if is_skip_title(text):
                        continue
                    x0, y0, x1, y1 = s["bbox"]
                    titles.append(
                        {
                            "text": text,
                            "x": x0,
                            "y": y0,
                            "cx": (x0 + x1) / 2,
                            "cy": (y0 + y1) / 2,
                            "bbox": (x0, y0, x1, y1),
                        }
                    )
    return titles


def extract_photo_placements(page, by_xref):
    placements = []
    # unique image xrefs on page
    seen = set()
    for img in page.get_images(full=True):
        xref = img[0]
        if xref in seen:
            continue
        seen.add(xref)
        meta = by_xref.get(xref)
        if not is_photo(meta):
            continue
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        # take largest rect if multiple
        rect = max(rects, key=lambda r: r.width * r.height)
        if rect.width < 40 or rect.height < 40:
            continue
        placements.append(
            {
                "xref": xref,
                "meta": meta,
                "x": rect.x0,
                "y": rect.y0,
                "cx": (rect.x0 + rect.x1) / 2,
                "cy": (rect.y0 + rect.y1) / 2,
                "w": rect.width,
                "h": rect.height,
            }
        )
    return placements


def match_photo_for_title(title, photos, used_xrefs):
    """Kart basligina ayni sutunda en yakin foto (ustte veya altta)."""
    tx, ty = title["x"], title["y"]
    candidates = []
    for ph in photos:
        if ph["xref"] in used_xrefs:
            continue
        dx = abs(ph["x"] - tx)
        dy = ph["y"] - ty  # negatif: foto basligin ustunde
        if dx > 130:
            continue
        if dy < -180 or dy > 130:
            continue
        # yakinlik agirlikli; alan sadece hafif tie-break (buyuk yanlis gorsel kazanmasin)
        display_area = max(ph["w"] * ph["h"], 1)
        # kart fotolari genelde basligin hemen altinda (~10-80) veya hemen ustunde
        score = 1000 / (1 + dx * 3 + abs(dy) * 4) + min(display_area, 80000) / 80000
        candidates.append((score, abs(dy), ph))
    if not candidates:
        return None
    candidates.sort(key=lambda x: (-x[0], x[1]))
    return candidates[0][2]


def has_qr(path: Path) -> bool:
    img = cv2.imread(str(path))
    if img is None:
        return False
    det = cv2.QRCodeDetector()
    for scale in (1, 2, 3):
        if scale == 1:
            test = img
        else:
            test = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        data, pts, _ = det.detectAndDecode(test)
        if data:
            return True
        detected, _ = det.detect(test)
        if detected:
            # gray + threshold retry
            gray = cv2.cvtColor(test, cv2.COLOR_BGR2GRAY)
            _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            data2, pts2, _ = det.detectAndDecode(th)
            if data2:
                return True
    return False


def write_index_jpg(src: Path, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    img = cv2.imread(str(src))
    if img is None:
        # copy as-is then convert via PIL-less path
        shutil.copy2(src, dest.with_suffix(src.suffix))
        return
    cv2.imwrite(str(dest), img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])


def main():
    by_xref = load_manifest_by_xref()
    doc = fitz.open(PDF)
    matches = []  # id -> {title, source, page}
    used = set()
    unmatched_titles = []

    for page_index, page in enumerate(doc):
        titles = extract_titles(page)
        photos = extract_photo_placements(page, by_xref)
        print(f"PAGE {page_index+1}: placeable_titles={len(titles)} photos={len(photos)}")
        for t in titles:
            loc_id = resolve_id(t["text"])
            if not loc_id:
                unmatched_titles.append((page_index + 1, t["text"], norm(t["text"])))
                continue
            ph = match_photo_for_title(t, photos, used)
            if not ph:
                unmatched_titles.append((page_index + 1, t["text"] + " [NO PHOTO]", norm(t["text"])))
                continue
            used.add(ph["xref"])
            matches.append(
                {
                    "id": loc_id,
                    "title": t["text"],
                    "page": page_index + 1,
                    "source": ph["meta"]["name"],
                    "xref": ph["xref"],
                    "w": ph["meta"]["w"],
                    "h": ph["meta"]["h"],
                }
            )

    # dedupe by id: keep first (PDF order)
    by_id = {}
    for m in matches:
        by_id.setdefault(m["id"], m)

    written = []
    qr_rejected = []
    for loc_id, m in sorted(by_id.items()):
        src = FOTOGRAFLAR / m["source"]
        dest = YERLER / loc_id / "index.jpg"
        if not src.exists():
            print("MISSING SRC", src)
            continue
        # temp write then QR check
        write_index_jpg(src, dest)
        if has_qr(dest):
            dest.unlink(missing_ok=True)
            qr_rejected.append(m)
            print("QR REJECTED", loc_id, m["source"])
            continue
        written.append(m)
        print("OK", loc_id, "<-", m["source"])

    # verify all locations
    all_ids = sorted([p.name for p in YERLER.iterdir() if p.is_dir()])
    missing = [i for i in all_ids if not (YERLER / i / "index.jpg").exists()]
    qr_hits = []
    for i in all_ids:
        p = YERLER / i / "index.jpg"
        if p.exists() and has_qr(p):
            qr_hits.append(i)

    lines = [
        "# Fotoğraf Eşleştirme 2026",
        "",
        f"- Yazılan: {len(written)}",
        f"- Klasör: {len(all_ids)}",
        f"- Eksik index.jpg: {len(missing)}",
        f"- QR hit: {len(qr_hits)}",
        f"- QR reject (aday): {len(qr_rejected)}",
        "",
        "## Eşleşmeler",
        "",
        "| id | sayfa | kaynak |",
        "|---|---|---|",
    ]
    for m in sorted(written, key=lambda x: x["id"]):
        lines.append(f"| {m['id']} | {m['page']} | `{m['source']}` |")
    if missing:
        lines += ["", "## Eksik", ""] + [f"- {x}" for x in missing]
    if unmatched_titles:
        lines += ["", "## Eşleşmeyen başlıklar", ""]
        for page, text, n in unmatched_titles:
            lines.append(f"- p{page}: {text} (`{n}`)")
    if qr_hits:
        lines += ["", "## QR kalan", ""] + [f"- {x}" for x in qr_hits]
    RAPOR.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("---")
    print("written", len(written), "missing", missing, "qr", qr_hits)
    print("unmatched titles", len(unmatched_titles))
    for u in unmatched_titles:
        print(" ", u)


if __name__ == "__main__":
    main()
