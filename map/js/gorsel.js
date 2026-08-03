/**
 * Kilis Gezi Haritası — Görsel modülü
 * Öncelik: 1) Yerel resim  2) Google Street View  3) Google Static Map
 */

const KonumGorsel = (function () {
  /** CDN/tarayıcı önbelleğini kırmak için sürüm — görsel güncellemesinde artır */
  const GORSEL_SURUM = "20260803e";

  /**
   * Konum klasöründeki standart görsel yolu: assets/yerler/{id}/kart.jpg
   * (eski index.jpg CDN önbelleğinde kaldığı için kart.jpg kullanılıyor)
   */
  function standartGorselYolu(konum) {
    if (!konum || !konum.id) {
      return null;
    }
    return `assets/yerler/${konum.id}/kart.jpg`;
  }

  /**
   * Yerel görsel yoluna önbellek kırıcı ekler
   */
  function onbellekKir(yol) {
    if (!yol) {
      return null;
    }
    const ayirici = yol.includes("?") ? "&" : "?";
    return `${yol}${ayirici}v=${GORSEL_SURUM}`;
  }

  /**
   * Konumdaki yerel görsel yolunu döndürür (varsa)
   */
  function yerelGorselUrl(konum) {
    const yol = konum.image || standartGorselYolu(konum);
    if (!yol) {
      return null;
    }
    return encodeURI(onbellekKir(yol));
  }

  /**
   * Street View panoraması URL'si
   */
  function streetViewUrl(konum, genislik = 400, yukseklik = 200) {
    const params = new URLSearchParams({
      size: `${genislik}x${yukseklik}`,
      location: `${konum.lat},${konum.lng}`,
      fov: "80",
      pitch: "0",
      key: GOOGLE_MAPS_API_KEY,
    });
    return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
  }

  /**
   * Static Maps uydu görünümü (son yedek)
   */
  function staticMapUrl(konum, genislik = 400, yukseklik = 200) {
    const merkez = `${konum.lat},${konum.lng}`;
    const marker = `color:0x51574a%7C${merkez}`;
    const params = new URLSearchParams({
      center: merkez,
      zoom: "17",
      size: `${genislik}x${yukseklik}`,
      scale: "2",
      maptype: "hybrid",
      markers: marker,
      key: GOOGLE_MAPS_API_KEY,
    });
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }

  /**
   * Görsel kaynak sırasını oluşturur: yerel → street → static
   */
  function kaynakSirasi(konum) {
    const kaynaklar = [];
    const yerel = yerelGorselUrl(konum);
    if (yerel) {
      kaynaklar.push(yerel);
    }
    kaynaklar.push(streetViewUrl(konum));
    kaynaklar.push(staticMapUrl(konum));
    return kaynaklar;
  }

  /**
   * img öğesine sıralı yedek kaynakları bağlar
   */
  function imgBagla(img, konum) {
    const kaynaklar = kaynakSirasi(konum);
    let indeks = 0;

    img.alt = konum.name;
    img.loading = "lazy";
    img.src = kaynaklar[indeks];

    img.onerror = function () {
      indeks += 1;
      if (indeks < kaynaklar.length) {
        this.src = kaynaklar[indeks];
      } else {
        this.onerror = null;
      }
    };
  }

  /**
   * Yeni img öğesi oluşturur ve kaynak zincirini bağlar
   */
  function imgOlustur(konum) {
    const img = document.createElement("img");
    imgBagla(img, konum);
    return img;
  }

  /**
   * InfoWindow gibi innerHTML alanları için img HTML üretir
   */
  function htmlImgEtiketi(konum) {
    const kaynaklar = kaynakSirasi(konum);
    const birincil = kaynaklar[0];
    const ikinci = kaynaklar[1] || birincil;
    const ucuncu = kaynaklar[2] || ikinci;

    return (
      `<img src="${birincil}" alt="${konum.name}" ` +
      `onerror="if(this.dataset.adim==='2'){this.onerror=null;this.src='${ucuncu}'}` +
      `else if(this.dataset.adim==='1'){this.dataset.adim='2';this.src='${ikinci}'}` +
      `else{this.dataset.adim='1';this.src='${ikinci}'}">`
    );
  }

  return {
    standartGorselYolu,
    yerelGorselUrl,
    streetViewUrl,
    staticMapUrl,
    kaynakSirasi,
    imgBagla,
    imgOlustur,
    htmlImgEtiketi,
  };
})();
