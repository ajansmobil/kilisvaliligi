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
    kategoriRenkleriniOku();

    harita = new google.maps.Map(document.getElementById("harita"), {
      center: MERKEZ,
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      styles: haritaStilleri(),
    });

    LOCATIONS.forEach((konum) => markerEkle(konum));
  }

  /**
   * Haritaya, site paletiyle uyumlu (krem zemin, çamlık yeşili parklar,
   * mavi-yeşil su) sıcak ve sade bir stil tanımı uygular
   * @returns {Array} Google Maps stil dizisi
   */
  function haritaStilleri() {
    return [
      { elementType: "geometry", stylers: [{ color: "#f2efe6" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#6b6455" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#f9f7ef" }] },
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#dbe8d0" }] },
      { featureType: "poi.park", elementType: "geometry.stroke", stylers: [{ color: "#c3d6b4" }] },
      { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#eef0e2" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e6e1cf" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e9dfc0" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d8c78f" }] },
      { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#8a8570" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfe0e0" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#2b5f66" }] },
      { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9ab4f" }] },
    ];
  }

  /** Varsayılan (kategorisiz) marker rengi — logo paleti */
  const MARKER_RENK_VARSAYILAN = "#51574a";

  /** Kategori adı → CSS değişkeni eşlemesi (styles.css'teki --cat-* ile aynı kaynak) */
  const KATEGORI_RENK_DEGISKENLERI = {
    tarihi: "--cat-tarihi",
    dini: "--cat-dini",
    doga: "--cat-doga",
    kultur: "--cat-kultur",
    arkeoloji: "--cat-arkeoloji",
  };

  /** Kategori → gerçek renk değeri önbelleği (baslat() içinde doldurulur) */
  let kategoriRenkleri = {};

  /**
   * Kategori renklerini CSS değişkenlerinden okur, tek renk kaynağını
   * (styles.css) korumak için burada tekrar tanımlamaz
   */
  function kategoriRenkleriniOku() {
    const kokStil = getComputedStyle(document.documentElement);
    Object.entries(KATEGORI_RENK_DEGISKENLERI).forEach(([kategori, degisken]) => {
      const deger = kokStil.getPropertyValue(degisken).trim();
      if (deger) {
        kategoriRenkleri[kategori] = deger;
      }
    });
  }

  /**
   * Konumun kategorisine uygun pin ikonu
   * @param {string} category - Konumun kategori adı
   * @returns {google.maps.Icon}
   */
  function markerIkonu(category) {
    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
      fillColor: kategoriRenkleri[category] || MARKER_RENK_VARSAYILAN,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 1.5,
      scale: 1.7,
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
      icon: markerIkonu(konum.category),
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

    const kategoriAdi = (Menu.kategoriEtiketleri && Menu.kategoriEtiketleri[konum.category]) || konum.category;

    const icerik = `
      <div class="info-pencere">
        ${KonumGorsel.htmlImgEtiketi(konum)}
        <div class="info-pencere-icerik">
          <h3>${konum.name}</h3>
          <p>${konum.description}</p>
          <span class="konum-etiket etiket-${konum.category}">${kategoriAdi}</span>
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
