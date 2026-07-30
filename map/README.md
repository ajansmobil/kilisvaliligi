# Kilis Gezi Haritası

Google Maps tabanlı, soldan açılan menülü interaktif Kilis gezi haritası.

## Klasör Yapısı

```
Links/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── menu.js
│   └── map.js
├── data/
│   └── locations.js
└── assets/
    ├── yerler/              ← Her yer için assets/yerler/{id}/
    │   ├── index.jpg          (varsa) PDF'den doğrulanmış fotoğraf
    │   └── bilgi.txt          PDF'nin o yere ait tam TR/EN metni (birebir)
    └── kaynak/              ← kilis_gezi_haritasi_2026.pdf'den ayrıştırılmış kaynak veri
        ├── pdf-kaynak-listesi.md        ← genel özet
        ├── koordinat-duzeltme-raporu.md ← locations.js'in 48 karta göre yeniden inşası
        ├── fotograf-duzeltme-raporu.md  ← index.jpg düzeltmelerinin dökümü
        ├── pdf-metinler/                ← PDF sayfa metinleri (ham çıktı)
        ├── pdf-gorseller/               ← PDF'deki 129 gömülü görsel (fotoğraf/ikon)
        └── pdf-qr-kodlari/              ← 49 QR kodu + çözümlenmiş yer adı/koordinat listesi
```

> **Veri notu:** `data/locations.js` ve `assets/yerler/` artık **yalnızca PDF'den
> doğrulanmış 48 yeri** içerir. Bu sayı, PDF'in kendi başlık fontuyla (7pt
> `HelveticaNeueLTPro-BdCn`) tek tek tespit edilen 48 açıklama kartına (sayfa 1'de 28,
> sayfa 2'de 20) birebir karşılık gelir — genel kültür/el sanatı/yemek bölümleri ile
> yalnızca adres pini olup kendi kartı olmayan QR'lar dahil değildir. Her yerin PDF'deki
> tam metni `assets/yerler/{id}/bilgi.txt` olarak, hiçbir özetleme yapılmadan
> saklanmaktadır. 48 kayıttan **24'ünün görseli PDF'deki fotoğrafla piksel boyutu
> üzerinden doğrulanmıştır** (`assets/kaynak/pdf-gorseller/manifest.json`'daki
> boyutlarla birebir eşleşiyor); kalan 24'ü görselsizdir (site bunlar için otomatik
> Google Street View/uydu görünümüne düşer — bkz. `js/gorsel.js`). Daha önce 9 klasörde
> PDF'den olmayan (Google Street View ekran görüntüsü/harici fotoğraf) dosyalar
> yanlışlıkla "doğrulanmış" sayılmıştı; bunlar tespit edilip kaldırıldı. Detay ve
> yöntem için bkz.
> [`assets/kaynak/koordinat-duzeltme-raporu.md`](assets/kaynak/koordinat-duzeltme-raporu.md).
>
> PDF kaynaklı olmayan `ham-fotograflar/`, `tasarim/`, `arsiv/` arşiv klasörleri
> kaldırılmıştır — proje artık yalnızca PDF'den türetilmiş veri içerir.

## Kurulum

1. [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) üzerinden Maps JavaScript API anahtarı alın.
2. `index.html` dosyasındaki `YOUR_API_KEY` ifadesini kendi anahtarınızla değiştirin.
3. `index.html` dosyasını tarayıcıda açın.

## Konum Verisi Güncelleme

`data/locations.js` elle düzenlenir. Yeni bir yer eklerken:

1. `assets/yerler/{id}/index.jpg` yoluna görseli, `assets/yerler/{id}/bilgi.txt` yoluna
   kaynağın (PDF, tabela, resmî belge vb.) tam metnini ekleyin.
2. `LOCATIONS` dizisine `id`, `name`, `description`, `lat`, `lng`, `image`, `category`
   alanlarını içeren bir kayıt ekleyin.
3. Enlem/boylam için mümkünse haritadaki QR kodunun Google Maps linkindeki
   `!3d<enlem>!4d<boylam>` değerini kullanın — `@enlem,boylam` yalnızca harita görüntüsünün
   merkezidir, gerçek pin konumundan sapabilir (bkz.
   [`assets/kaynak/koordinat-duzeltme-raporu.md`](assets/kaynak/koordinat-duzeltme-raporu.md)).

## Özellikler

- Tam ekran Google Maps haritası
- Soldan açılan yan menü
- Görselin altında yer adı
- Kategori filtreleme
- UTF-8 Türkçe karakter desteği
- Mobil uyumlu tasarım
