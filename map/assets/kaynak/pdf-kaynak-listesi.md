# `kilis_gezi_haritasi_2026.pdf` — Ayrıştırılmış Kaynak İçerik

Bu klasör, basılı harita PDF'inden (`kilis_gezi_haritasi_2026.pdf`, 2 sayfa) ayrıştırılan ham
verileri içerir. `data/locations.js`'in koordinat düzeltmesi de bu veriler kullanılarak
yapılmıştır (bkz. [`koordinat-duzeltme-raporu.md`](./koordinat-duzeltme-raporu.md)).

## Klasör Ağacı

```
assets/kaynak/
├── pdf-kaynak-listesi.md         (bu dosya)
├── koordinat-duzeltme-raporu.md  data/locations.js için yapılan koordinat düzeltmesinin dökümü
│
├── pdf-metinler/                 PDF'den çıkarılan tüm yazılar
│   ├── sayfa_1.txt                 Sayfa 1: sokak haritası — cadde/sokak/kurum etiketleri
│   └── sayfa_2.txt                 Sayfa 2: gezilecek yer tanıtım metinleri (TR/EN)
│
├── pdf-gorseller/                PDF'den çıkarılan tüm gömülü görseller (129 adet)
│   ├── manifest.json               Her görselin sayfa/xref/boyut/format kaydı
│   ├── Fotograflar/    (79)        Gerçek fotoğraflar (JPEG + saydam PNG'ler)
│   └── Ikonlar/         (1)        Küçük harita simgesi
│
└── pdf-qr-kodlari/               Haritadaki 49 QR kodunun tamamı, çözümlenmiş
    ├── qr_listesi.csv              yer adı, kesin pin enlem/boylam, sayfa konumu, Maps linki
    ├── qr_listesi.txt              okunabilir liste
    └── 001_...png … 049_...png     her QR kodun kırpılmış görüntüsü
```

## Özet

| Kategori | Adet |
|---|---|
| Sayfa (metin dosyası) | 2 |
| Toplam gömülü görsel | 129 (79 fotoğraf + 1 ikon + 49 QR) |
| QR kodu — çözülen / toplam | 49 / 49 |
| `data/locations.js` — koordinatı QR ile doğrulanan kayıt | 38 / 51 |

## Yöntem

Adobe PDF servisleri için ortam kimlik bilgisi tanımlı olmadığından çıkarım yerel olarak
**PyMuPDF** (metin + gömülü görsel çıkarma) ve **OpenCV QRCodeDetector** (kare PNG adaylarının
QR olup olmadığının tespiti/çözümü, gerektiğinde upscale + threshold ile) kullanılarak
yapılmıştır. Her QR'ın Google Maps linkindeki `!3d<enlem>!4d<boylam>` alanı, linkteki
`@enlem,boylam` görüntü-merkezinden daha kesin olduğu için koordinat kaynağı olarak o
kullanılmıştır.
