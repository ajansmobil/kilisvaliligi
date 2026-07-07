/**
 * Kilis Gezi Haritası — Google Maps modülü
 * Harita oluşturma, marker yerleştirme ve bilgi penceresi yönetimi
 */

const Harita = (function () {
  let harita = null;
  let markerlar = [];
  let acikInfoWindow = null;

  /** Kilis merkez koordinatları */
  const MERKEZ = { lat: 36.7161, lng: 37.115 };

  /**
   * Google Maps haritasını başlatır ve tüm markerları ekler
   */
  function baslat() {
    harita = new google.maps.Map(document.getElementById("harita"), {
      center: MERKEZ,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: haritaStilleri(),
    });

    LOCATIONS.forEach((konum) => markerEkle(konum));
  }

  /**
   * Haritaya özel açık renkli stil tanımı
   * @returns {Array} Google Maps stil dizisi
   */
  function haritaStilleri() {
    return [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ];
  }

  /** Logo paleti — harita marker renkleri */
  const MARKER_RENK = {
    dolgu: "#51574a",
    cerceve: "#ece6aa",
  };

  /**
   * Marka renklerine uygun özel pin ikonu
   * @returns {google.maps.Icon}
   */
  function markerIkonu() {
    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
      fillColor: MARKER_RENK.dolgu,
      fillOpacity: 1,
      strokeColor: MARKER_RENK.cerceve,
      strokeWeight: 1.5,
      scale: 1.6,
      anchor: new google.maps.Point(12, 22),
    };
  }

  /**
   * Belirtilen konuma marker ve tıklama olayı ekler
   * @param {Object} konum - Konum veri nesnesi
   */
  function markerEkle(konum) {
    const marker = new google.maps.Marker({
      position: { lat: konum.lat, lng: konum.lng },
      map: harita,
      title: konum.name,
      icon: markerIkonu(),
      animation: google.maps.Animation.DROP,
    });

    marker.addListener("click", () => {
      infoPencereAc(konum, marker);
      Menu.konumVurgula(konum.id);
    });

    markerlar.push({ id: konum.id, marker });
  }

  /**
   * Konum bilgisini içeren InfoWindow açar
   * @param {Object} konum - Konum veri nesnesi
   * @param {google.maps.Marker} marker - İlişkili marker
   */
  function infoPencereAc(konum, marker) {
    if (acikInfoWindow) {
      acikInfoWindow.close();
    }

    const icerik = `
      <div class="info-pencere">
        ${KonumGorsel.htmlImgEtiketi(konum)}
        <div class="info-pencere-icerik">
          <h3>${konum.name}</h3>
          <p>${konum.description}</p>
        </div>
      </div>
    `;

    acikInfoWindow = new google.maps.InfoWindow({ content: icerik });
    acikInfoWindow.open(harita, marker);
  }

  /**
   * Haritayı belirtilen konuma kaydırır ve bilgi penceresini açar
   * @param {Object} konum - Hedef konum nesnesi
   */
  function konumaGit(konum) {
    const hedef = { lat: konum.lat, lng: konum.lng };

    harita.panTo(hedef);
    harita.setZoom(15);

    const markerKayit = markerlar.find((m) => m.id === konum.id);
    if (markerKayit) {
      infoPencereAc(konum, markerKayit.marker);
    }
  }

  return {
    baslat,
    konumaGit,
  };
})();

/**
 * Google Maps API yüklendiğinde çağrılan global callback
 */
function initMap() {
  Harita.baslat();
  Menu.baslat();

  const yukleniyor = document.getElementById("yukleniyor");
  yukleniyor.classList.add("gizle");
  setTimeout(() => yukleniyor.remove(), 600);
}
