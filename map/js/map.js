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

  /** Pin gövdesi — tüm kategorilerde ortak teardrop şekli (24x24 viewBox) */
  const PIN_YOLU = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

  /**
   * Kategoriye özgü, pinin yuvarlak başının içine sığan beyaz glif —
   * harita lejantındaki simgelerden (cami, konak, ağaç, el sanatı, sütun)
   * esinlenilmiştir. Yalnızca renk değil, şekil olarak da ayrışır.
   */
  const KATEGORI_GLIF = {
    dini:
      '<path d="M12 4.1c-1.9 0-3.35 1.55-3.35 3.45 0 .85.85 1.55 1.9 1.55h2.9c1.05 0 1.9-.7 1.9-1.55 0-1.9-1.45-3.45-3.35-3.45Z" fill="#fff"/>' +
      '<rect x="9.2" y="9.5" width="5.6" height="3.3" rx="0.4" fill="#fff"/>' +
      '<path d="M11.3 3.5a1 1 0 1 0 1.7-1 1.35 1.35 0 0 1-1.7 1Z" fill="#fff"/>',
    tarihi:
      '<path d="M8.4 12.6h7.2M8.9 12.6V9.3h6.2v3.3M8.7 9.3l3.3-2.5 3.3 2.5" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M10.1 9.5v3M12 9.5v3M13.9 9.5v3" stroke="#fff" stroke-width="0.7" stroke-linecap="round"/>',
    doga:
      '<path d="M12 4.6 9.75 8.2h1.1L8.75 11.2h1.25L8.4 14h7.2l-1.6-2.8h1.25L13.15 8.2h1.1L12 4.6Z" fill="#fff"/>' +
      '<rect x="11.5" y="14" width="1" height="1.3" fill="#fff"/>',
    kultur:
      '<path d="M8.5 8.7h7v.8c0 2-1.55 3.6-3.5 3.6s-3.5-1.6-3.5-3.6v-.8Z" fill="#fff"/>' +
      '<path d="M8.5 9.2H7.3a1 1 0 1 0 0 2h1.2M15.5 9.2h1.2a1 1 0 1 1 0 2h-1.2" fill="none" stroke="#fff" stroke-width="0.7" stroke-linecap="round"/>' +
      '<rect x="10.6" y="13.1" width="2.8" height="0.85" rx="0.35" fill="#fff"/>',
    arkeoloji:
      '<path d="M9 6.5h6M9.5 7.35h5v4.5h-5zM8.6 12.35h6.8" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M10.15 7.35v4.5M12 7.35v4.5M13.85 7.35v4.5" stroke="#fff" stroke-width="0.55"/>',
  };

  /** Kategori ikonlarının Data-URI önbelleği (kategori başına bir kez oluşturulur) */
  const markerIkonOnbellek = {};

  /**
   * Konumun kategorisine uygun, kategoriye özgü glifli renkli pin ikonu
   * @param {string} category - Konumun kategori adı
   * @returns {google.maps.Icon}
   */
  function markerIkonu(category) {
    if (markerIkonOnbellek[category]) {
      return markerIkonOnbellek[category];
    }

    const renk = kategoriRenkleri[category] || MARKER_RENK_VARSAYILAN;
    const glif = KATEGORI_GLIF[category] || "";
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">` +
      `<path d="${PIN_YOLU}" fill="${renk}" stroke="#ffffff" stroke-width="1"/>` +
      glif +
      `</svg>`;

    const ikon = {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(34, 34),
      anchor: new google.maps.Point(17, 31),
    };

    markerIkonOnbellek[category] = ikon;
    return ikon;
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
    const yolTarifi = Menu.yolTarifiLinkHtml ? Menu.yolTarifiLinkHtml(konum) : "";

    const icerik = `
      <div class="info-pencere">
        ${KonumGorsel.htmlImgEtiketi(konum)}
        <div class="info-pencere-icerik">
          <h3>${konum.name}</h3>
          <p>${konum.description}</p>
          <div class="konum-alt-satir">
            <span class="konum-etiket etiket-${konum.category}">${kategoriAdi}</span>
            ${yolTarifi}
          </div>
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
