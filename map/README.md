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
│   ├── locations.js
│   ├── generate-locations.py
│   └── generate-locations.ps1
└── assets/
    ├── images/              ← Konum görselleri (dosya adında yer ismi)
    └── kaynak/
        ├── ham-fotograflar/ ← DJI, DSC ham çekimler
        ├── tasarim/         ← .ai, .psd, .tif tasarım dosyaları
        └── arsiv/           ← Yinelenen / kullanılmayan görseller
```

## Kurulum

1. [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) üzerinden Maps JavaScript API anahtarı alın.
2. `index.html` dosyasındaki `YOUR_API_KEY` ifadesini kendi anahtarınızla değiştirin.
3. `index.html` dosyasını tarayıcıda açın.

## Konum Verisi Güncelleme

`assets/images/` klasörüne yeni görsel ekledikten sonra:

```bash
python data/generate-locations.py
```

## Özellikler

- Tam ekran Google Maps haritası
- Soldan açılan yan menü
- Görselin altında yer adı
- Kategori filtreleme
- UTF-8 Türkçe karakter desteği
- Mobil uyumlu tasarım
