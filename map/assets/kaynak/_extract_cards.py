# -*- coding: utf-8 -*-
"""PDF kart basliklari + foto pozisyonlari (eslestirme yardimcisi)."""
import fitz
import json
from pathlib import Path

PDF = Path(__file__).resolve().parents[3] / "kilis_gezi_haritasi_2026.pdf"
OUT = Path(__file__).with_name("pdf-kart-foto-eslesme.json")


def main():
    doc = fitz.open(PDF)
    pages = []
    for i, page in enumerate(doc):
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
                        if text and text != "/" and len(text) > 2:
                            x0, y0, x1, y1 = s["bbox"]
                            titles.append(
                                {
                                    "x": round(x0, 1),
                                    "y": round(y0, 1),
                                    "x1": round(x1, 1),
                                    "y1": round(y1, 1),
                                    "text": text,
                                }
                            )
        # image placements
        images = []
        for info in page.get_image_info(xrefs=True):
            bbox = info.get("bbox")
            xref = info.get("xref")
            if not bbox:
                continue
            x0, y0, x1, y1 = bbox
            w, h = x1 - x0, y1 - y0
            images.append(
                {
                    "xref": xref,
                    "x": round(x0, 1),
                    "y": round(y0, 1),
                    "x1": round(x1, 1),
                    "y1": round(y1, 1),
                    "w": round(w, 1),
                    "h": round(h, 1),
                    "square_like": abs(w - h) < 25 and max(w, h) < 120,
                }
            )
        pages.append({"page": i + 1, "titles": titles, "images": images})
        print(f"PAGE {i+1}: titles={len(titles)} images={len(images)}")
        for t in titles:
            print(f"  T {t['x']:.0f},{t['y']:.0f} | {t['text']}")

    OUT.write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WROTE", OUT)


if __name__ == "__main__":
    main()
