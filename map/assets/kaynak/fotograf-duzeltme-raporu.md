# Fotoğraf Düzeltme Raporu — `assets/yerler/*/index.jpg`

> **Not:** Bu rapor, QR-görsel sorununun ilk tespit/düzeltme geçişini belgeler (yöntem
> hâlâ geçerlidir). Ancak sonrasında `data/locations.js` sıfırdan, PDF'in 48 gerçek yer
> kartına göre yeniden inşa edildiği için buradaki id listesi (32/24/11) güncelliğini
> yitirmiştir — **güncel ve nihai liste için
> [`koordinat-duzeltme-raporu.md`](./koordinat-duzeltme-raporu.md)'ye bakın.**

## Sorun

`assets/yerler/{id}/index.jpg` dosyalarının çoğu gerçek bir mekân fotoğrafı değil,
haritadaki **QR kodlarından biriydi** (PDF'den çıkarılan 49 QR kodunun 300×300 boyutuna
küçültülmüş kopyaları, gelişigüzel/yanlış klasörlere dağıtılmış). 51 klasörden **35'inin**
görseli aslında bir QR koduydu; bunların çoğu kendi yerine bile ait değildi (ör.
`kilis-muzesi/index.jpg` aslında "Neşet Efendi Konağı" QR'ıydı, `salih-aga-kasteli/index.jpg`
aslında "Tabakhane Cami" QR'ıydı).

Tespit yöntemi: her `index.jpg` OpenCV `QRCodeDetector` ile (gerekirse upscale/kenarlık
ekleyerek) tarandı; QR içeriği çözülebilenler "yanlış görsel" olarak işaretlendi.

## Düzeltilen 24 kayıt

Her biri PDF'deki fotoğrafla görsel olarak karşılaştırılıp doğrulandıktan sonra
değiştirildi (kaynak: `pdf-gorseller/Fotograflar/`):

| id | Kaynak PDF görseli |
|---|---|
| sogutludere | sayfa1_img004_x4376.jpeg |
| seve-baraji | sayfa1_img006_x4380.jpeg |
| surahbil-turbesi | sayfa1_img008_x4384.jpeg |
| hukumet-konagi | sayfa1_img013_x4393.jpeg |
| cocuk-kutuphanesi | sayfa1_img015_x4397.jpeg |
| kemaliye-ilkokulu | sayfa1_img017_x4401.jpeg |
| seyh-mansur-turbesi | sayfa1_img019_x4405.jpeg |
| seyh-efendi-turbesi | sayfa1_img021_x4409.jpeg |
| zubeyr-ve-talha-turbesi | sayfa1_img026_x4419.jpeg |
| canpolat-pasa-camii | sayfa1_img028_x4423.jpeg |
| salihefendi-sokak | sayfa1_img039_x4447.jpeg |
| kuru-kastel | sayfa1_img046_x4461.jpeg |
| kucuk-carsi-kasteli | sayfa1_img048_x4465.jpeg |
| bedevi-turbesi | sayfa1_img059_x4487.jpeg |
| resul-osman-mesire-alani | sayfa1_img060_x4489.jpeg |
| akpinar-mesire-alani | sayfa1_img062_x4493.jpeg |
| ravanda-kalesi | sayfa2_img000_x20.jpeg |
| karakadi-camii | sayfa2_img004_x28.jpeg |
| oylum-hoyuk | sayfa2_img008_x36.jpeg |
| ulu-camii | sayfa2_img015_x50.jpeg |
| eski-hamam | sayfa2_img024_x68.jpeg |
| akcurun-camii | sayfa2_img030_x80.jpeg |
| cumhuriyet-meydani | sayfa2_img035_x90.jpeg |
| mercidabik-meydani | sayfa2_img037_x94.jpeg |

## QR görseli kaldırılan 11 kayıt

PDF'de bu yerlere ait ne bir QR kod ne de güvenilir şekilde eşleştirilebilecek bir fotoğraf
bulunabildi (bazı adlar PDF metninde hiç geçmiyor; bazılarının civarındaki fotoğraflar başka
yerlerle çakışıyor, net eşleşme yok). Yanlış/uydurma bir fotoğraf koymak yerine, kullanıcı
tercihiyle **`index.jpg` dosyası silindi**:

- `akinci-konagi`, `canpolat-camii-ve-turbesi`, `duruca`, `ensari-turbesi`,
  `karatas-cumhuriyet-parki`, `kilis-muzesi`, `kit-kit-dede-turbesi`, `mevlevihane-camii`,
  `oksuz-minare-camii`, `sabunhane-muzesi`, `salih-aga-kasteli`

Bu kayıtlar boş görsel bırakmıyor: `js/gorsel.js` içindeki `KonumGorsel` modülü, yerel görsel
404 verdiğinde otomatik olarak **Google Street View** panoramasına, o da başarısız olursa
**Google Static Map** uydu görünümüne düşüyor (bkz. `kaynakSirasi()` fonksiyonu). Yani site
bu 11 yer için de görselsiz kalmayacak — gerçek bir fotoğraf temin edilene kadar geçici
otomatik bir görsel gösterilecek.

## Not

`ensari-turbesi` ve `salih-aga-kasteli` daha önce
[`koordinat-duzeltme-raporu.md`](./koordinat-duzeltme-raporu.md)'de de "QR eşleşmesi
bulunamadı" olarak işaretlenmişti; bu iki liste tutarlı.
