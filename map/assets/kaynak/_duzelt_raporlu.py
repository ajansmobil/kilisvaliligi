# -*- coding: utf-8 -*-
"""Kullanici raporuna gore sorunlu yerleri duzelt."""
from __future__ import annotations

import shutil
import urllib.request
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
YERLER = ROOT / "assets" / "yerler"
FOTO = Path(__file__).parent / "pdf-gorseller" / "Fotograflar"

# PDF kart fotolari (mevcut dogru eslesmeler) — yeniden yazilacak (CDN cache kir)
PDF_YENIDEN = {
    "akinci-konagi": "sayfa1_img035_x4439.jpeg",
    "mevlevihane-camii": "sayfa1_img035_x4439.jpeg",  # placeholder overwritten below
    "kilis-muzesi": "sayfa1_img041_x4451.jpeg",
    "oksuz-minare-camii": "sayfa1_img052_x4473.jpeg",
    "salih-aga-kasteli": "sayfa1_img043_x4455.jpeg",
    "kit-kit-dede-turbesi": "sayfa1_img024_x4415.jpeg",
    "ensari-turbesi": "sayfa1_img030_x4427.jpeg",
    "caglasyan-konagi": "sayfa1_img010_x4388.jpeg",
}

PDF_YENIDEN["mevlevihane-camii"] = "sayfa2_img059_x140.jpeg"

# Resmi kilis.gov.tr — PDF kart fotosu yanlis/eksik olanlar
RESMI = {
    "muallak-camii": "http://www.kilis.gov.tr/kurumlar/kilis.gov.tr/Images/MenuResimler/KulturTurizm/Camiler/cami%20yeni%20resimler/Muallak%20cami%201%20yeni.jpg",
    "ulu-camii": "http://www.kilis.gov.tr/kurumlar/kilis.gov.tr/Images/MenuResimler/KulturTurizm/Camiler/cami%20yeni%20resimler/ulu%20cami-1%20yeni.jpg",
}


def to_landscape_jpg(img: np.ndarray, dest: Path, min_w: int = 900) -> None:
    """Kartlar yatay; dikey fotoyu yanlara padleyerek veya genisletecek sekilde kaydet."""
    h, w = img.shape[:2]
    if h > w * 1.15:
        # dikey: yanlara blur/pad ile yatay canvas
        target_w = int(h * 16 / 9)
        pad = target_w - w
        left = pad // 2
        right = pad - left
        canvas = cv2.copyMakeBorder(img, 0, 0, left, right, cv2.BORDER_REPLICATE)
        # soft blur on sides
        blur = cv2.GaussianBlur(canvas, (51, 51), 0)
        blur[:, left : left + w] = img
        img = blur
        h, w = img.shape[:2]
    if w < min_w:
        scale = min_w / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    dest.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dest), img, [int(cv2.IMWRITE_JPEG_QUALITY), 92])


def load_url(url: str) -> np.ndarray:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=30).read()
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError(f"decode failed: {url}")
    return img


def has_qr(path: Path) -> bool:
    img = cv2.imread(str(path))
    if img is None:
        return True
    det = cv2.QRCodeDetector()
    for sc in (1, 2, 3):
        t = img if sc == 1 else cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_CUBIC)
        data, _, _ = det.detectAndDecode(t)
        if data:
            return True
    return False


def main():
    for loc_id, name in PDF_YENIDEN.items():
        src = FOTO / name
        dest = YERLER / loc_id / "index.jpg"
        img = cv2.imread(str(src))
        if img is None:
            print("FAIL read", src)
            continue
        to_landscape_jpg(img, dest)
        print("PDF", loc_id, "<-", name, "qr" if has_qr(dest) else "ok", dest.stat().st_size)

    for loc_id, url in RESMI.items():
        dest = YERLER / loc_id / "index.jpg"
        img = load_url(url)
        to_landscape_jpg(img, dest)
        print("RESMI", loc_id, "qr" if has_qr(dest) else "ok", dest.stat().st_size, img.shape)

    # QR kontrol — rapor edilenler
    ids = list(PDF_YENIDEN) + list(RESMI)
    bad = [i for i in ids if has_qr(YERLER / i / "index.jpg")]
    miss = [i for i in ids if not (YERLER / i / "index.jpg").exists()]
    print("QR_BAD", bad)
    print("MISS", miss)


if __name__ == "__main__":
    main()
