# 406 — Map görseller: QR yasak, PDF foto zorunlu

**rol:** web  
**agent_cli:** opencode  
**cwd:** `D:\projeler\kilisvaliligi\Web\public\map`  
**migrasyon:** yerel varlık düzeltmesi (ELO/webmaker dışı doğrudan public/map)

## Hedef

`map` konum görsellerinde **asla QR kod olmasın**. Eksik/yanlış görseller
`kilis_gezi_haritasi_2026.pdf` içindeki gerçek fotoğraflarla tamamlanacak.

## Mevcut durum (tespit)

- 48 yer klasörü (`assets/yerler/{id}/`)
- 24 yerde doğrulanmış `index.jpg` var
- 24 yerde `index.jpg` YOK (Street View fallback — kullanıcı PDF foto istiyor)
- PDF kaynak: `assets/kaynak/pdf-gorseller/Fotograflar/` (79 foto)
- QR kaynaklar: `assets/kaynak/pdf-qr-kodlari/` — **yerler/ altına kopyalanmayacak**
- `menu.js` içinde `qrGorsel` sıralama kalıntısı var — temizlenebilir

## Eksik id listesi

aidesim-bazilika, akinci-konagi, alaeddin-yavasca-muzesi, anit-agaclar,
bilal-habesi-turbesi, caglasyan-konagi, calik-camii, canbolat-turbesi,
cuneyne-camii, ensari-turbesi, haci-cumbus-camii, haci-dervis-pasa-camii,
hoca-hamami, ipsir-pasa-kasteli, kalender-mesrep-millet-bahcesi, kilis-muzesi,
kit-kit-dede-turbesi, mevlevihane-camii, muallak-camii, neset-efendi-konagi,
oksuz-minare-camii, pasa-hamami, salih-aga-kasteli, tabakhane-camii

## Yapılacaklar

1. PDF kart başlığı ↔ kart fotoğrafı mekânsal eşleştirme (PyMuPDF bbox).
2. Her eksik yer için doğru fotoğrafı `assets/yerler/{id}/index.jpg` olarak yaz.
3. Mevcut 24 `index.jpg`'yi OpenCV `QRCodeDetector` ile tara; QR çıkarsa değiştir.
4. Geleneksel el sanatları / yemek / bağcılık kart fotoğraflarını yerlere atama.
5. Kare ~QR boyutlu PNG'leri asla `yerler/` altına koyma.
6. Eşleşme raporu: `assets/kaynak/fotograf-eslesme-2026.md`
7. `qrGorsel` kalıntısını kaldır (locations + menu).
8. Doğrulama: 48/48 index.jpg var + 0 QR decode.

## Doğrulama

```
python -c "QR tarama: hits==0; missing==0"
```

## Kapanış

İş bitince `D:\projeler\kilisvaliligi\Web` üzerinde commit + `git push`
(kullanıcı açıkça "git gönder" istedi).
