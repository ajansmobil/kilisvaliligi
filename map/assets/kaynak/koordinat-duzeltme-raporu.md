# Veri Bütünlüğü Raporu — `data/locations.js` ve `assets/yerler/`

## Yöntem (nihai, en güvenilir sürüm)

Önceki denemeler QR kodlarına ve düz metin satır numaralarına dayanıyordu; bu, birkaç
yanlış birleştirme/silmeye yol açtı. Son geçişte PDF'in **kendi font yapısı** kullanıldı:

- PyMuPDF ile her sayfanın metin öğeleri font adı + punto bilgisiyle çıkarıldı.
- Kart başlıklarının hepsinin **`HelveticaNeueLTPro-BdCn` fontunda, 7pt** yazıldığı
  tespit edildi (harita üzerindeki cadde/bina etiketleri ise tamamen farklı bir font/punto
  kullanıyor — `Helvetica-Bold`, 1.6pt — bu yüzden karıştırılmadılar).
- Bu başlık işaretleyicileri kullanılarak PDF'in kendi blok/satır sırasına göre **48 tam
  kart** (adres TR/EN + açıklama TR/EN + başlık TR/EN) otomatik olarak ayrıştırıldı:
  **sayfa 1'de 28, sayfa 2'de 20 kart.** Geleneksel el sanatları (Nakış, Yorgancılık, Taş
  İşçiliği, Yemenicilik, Bakırcılık), yemek listesi, ulaşım/turizm danışma gibi genel
  bölümler bir GPS noktasına sahip "yer" olmadığı için bu 48'e dahil edilmedi.

Bu 48 sayısı, kullanıcının belirttiği rakamla birebir örtüşüyor.

## Yapılanlar

1. **Her 48 yer için `assets/yerler/{id}/bilgi.txt` oluşturuldu** — PDF'nin kendi TR+EN
   metni, hiçbir özetleme/yorum yapılmadan birebir aktarıldı.
2. **`data/locations.js` sıfırdan bu 48 karta göre yeniden yazıldı.** Artık dosyada bu
   48 kartın dışında hiçbir kayıt yok.
3. Koordinatlar öncelik sırasıyla belirlendi:
   - Kartın kendi QR kodu varsa → QR linkinin kesin pin koordinatı (`!3d!4d`).
   - Yoksa → PDF metnindeki konum tarifine en yakın komşu QR'ın koordinatı (yaklaşık,
     kod içinde `// yaklaşık:` yorumuyla işaretli — **15 kayıt**).
4. Görseller yalnızca daha önce PDF'deki fotoğrafla **görsel olarak doğrulanmış**
   eşleşmeler için korundu. **Düzeltme:** ilk geçişte 33 klasörde görsel "doğrulanmış"
   sayılmıştı, ancak 11'i bu son yeniden inşa geçişinde yeniden atanmamış eski
   dosyalardı ve bunların **9'u piksel boyutu PDF çıktılarıyla hiç eşleşmiyordu**
   (ör. `haci-dervis-pasa-camii` 4752×3168 — orijinal kamera çözünürlüğü;
   `calik-camii` 640×400 — Google Street View ekran görüntüsü, alt köşesinde
   "Google" filigranı var). Bu 9 dosya PDF kaynaklı olmadığı için kaldırıldı.
   **Nihai doğru sayı: 24 kayıtta PDF'den doğrulanmış görsel, 24 kayıt görselsiz**
   (site bunlar için otomatik Google Street View/uydu görünümüne düşer,
   `js/gorsel.js`). Doğrulama yöntemi: her `index.jpg`'nin piksel boyutu,
   `assets/kaynak/pdf-gorseller/manifest.json`'daki 129 PDF görselinin boyut
   listesiyle karşılaştırıldı — birebir eşleşmeyenler PDF kaynaklı değildir.
5. Bu 48 karta girmeyen, yalnızca QR pini olup kendi açıklama kartı bulunmayan yerler
   (ör. Çatom Binası, Duruca Köyü Yolu, Karataş Parkı, Nurettin/Hakverdi/Akcurun adres
   pinleri, "Mevlevihane Mescidi" ayrı pini) `locations.js`'e dahil edilmedi; ilgili
   `assets/yerler/` klasörleri de temizlendi.
6. Önceki geçişte hatalı şekilde birleştirilen **Canbolat Türbesi** ile
   **Canbolat Paşa Tekke Camisi** tekrar ayrı kayıtlara bölündü — PDF'de bunlar iki
   ayrı karttır (biri türbe/sayfa 1, diğeri cami/sayfa 2).
7. PDF'de ayrı kartları olduğu hâlde daha önce hiç eklenmemiş **2 yeni yer** dahil
   edildi: **Anıt Ağaçlar** ve **Aidesim Mozaikli Bazilika**.
8. Yeni eklenen **Çağlasyan Konağı** kartı da listeye girdi (daha önce hiç fark
   edilmemişti).

## Kaynak veri

- Her yerin tam metni: `assets/yerler/{id}/bilgi.txt`
- QR kodu tam listesi: [`pdf-qr-kodlari/qr_listesi.csv`](./pdf-qr-kodlari/qr_listesi.csv)
- Ham PDF metinleri: [`pdf-metinler/sayfa_1.txt`](./pdf-metinler/sayfa_1.txt) /
  [`pdf-metinler/sayfa_2.txt`](./pdf-metinler/sayfa_2.txt)

## Yaklaşık koordinatlı 15 kayıt

`caglasyan-konagi`, `kilis-cocuk-kutuphanesi`(*QR eşleşmesi zayıfsa*), `kit-kit-dede-turbesi`,
`canbolat-turbesi`, `ensari-turbesi`, `bilal-habesi-turbesi`, `akinci-konagi`,
`neset-efendi-konagi`, `kilis-muzesi`, `salih-aga-kasteli`, `ipsir-pasa-kasteli`(*QR
eşleşmesi bulunamazsa*), `oksuz-minare-camii`, `alaeddin-yavasca-muzesi`,
`kalender-mesrep-millet-bahcesi`, `anit-agaclar`, `mevlevihane-camii` — tam liste ve
hangi referans noktasının kullanıldığı `data/locations.js` içindeki `// yaklaşık:`
yorumlarında görülebilir. Gerçek GPS koordinatı elle doğrulanırsa güncellenmelidir.
