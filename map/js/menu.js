/**
 * Kilis Gezi Haritası — Yan menü kontrol modülü
 * Menü açma/kapama, konum listesi oluşturma ve kategori filtreleme
 */

const Menu = (function () {
  /** DOM referansları */
  let sidebarEl = null;
  let overlayEl = null;
  let listeEl = null;
  let haritaKapsayiciEl = null;
  let menuAcik = false;
  let seciliKonumId = null;
  let aktifKategori = "tumu";

  /** Kategori etiket Türkçe karşılıkları */
  const KATEGORI_ETIKETLERI = {
    tarihi: "Tarihi",
    arkeoloji: "Arkeoloji",
    dini: "Dini",
    kultur: "Kültür",
    doga: "Doğa",
  };

  /**
   * QR kodlu görselli konumları listenin sonuna taşır
   * @param {Array} konumlar - Sıralanacak konum dizisi
   */
  function siralaKonumlar(konumlar) {
    return [...konumlar].sort((a, b) => {
      const aSon = a.qrGorsel ? 1 : 0;
      const bSon = b.qrGorsel ? 1 : 0;
      if (aSon !== bSon) {
        return aSon - bSon;
      }
      return a.name.localeCompare(b.name, "tr");
    });
  }

  /**
   * Menü modülünü başlatır ve olay dinleyicilerini bağlar
   */
  function baslat() {
    sidebarEl = document.getElementById("sidebar");
    overlayEl = document.getElementById("sidebar-overlay");
    listeEl = document.getElementById("konum-listesi");
    haritaKapsayiciEl = document.getElementById("harita-kapsayici");

    document.getElementById("menu-toggle").addEventListener("click", menuToggle);
    overlayEl.addEventListener("click", menuKapat);

    kategoriButonlariniOlustur();
    konumListesiniOlustur(siralaKonumlar(LOCATIONS));
  }

  /**
   * Menüyü açar veya kapatır
   */
  function menuToggle() {
    menuAcik ? menuKapat() : menuAc();
  }

  /**
   * Yan menüyü açar
   */
  function menuAc() {
    menuAcik = true;
    sidebarEl.classList.add("acik");
    overlayEl.classList.add("gorunur");
    haritaKapsayiciEl.classList.add("menu-acik");
  }

  /**
   * Yan menüyü kapatır
   */
  function menuKapat() {
    menuAcik = false;
    sidebarEl.classList.remove("acik");
    overlayEl.classList.remove("gorunur");
    haritaKapsayiciEl.classList.remove("menu-acik");
  }

  /**
   * Kategori filtre butonlarını oluşturur
   */
  function kategoriButonlariniOlustur() {
    const filtreAlani = document.getElementById("kategori-filtreler");
    const kategoriler = ["tumu", ...new Set(LOCATIONS.map((k) => k.category))];

    kategoriler.forEach((kat) => {
      const btn = document.createElement("button");
      btn.className = "kategori-btn" + (kat === "tumu" ? " aktif" : "");
      btn.textContent = kat === "tumu" ? "Tümü" : KATEGORI_ETIKETLERI[kat] || kat;
      btn.dataset.kategori = kat;
      btn.addEventListener("click", () => kategoriFiltrele(kat, btn));
      filtreAlani.appendChild(btn);
    });
  }

  /**
   * Seçilen kategoriye göre konum listesini filtreler
   * @param {string} kategori - Filtrelenecek kategori adı
   * @param {HTMLElement} btn - Tıklanan buton elementi
   */
  function kategoriFiltrele(kategori, btn) {
    aktifKategori = kategori;

    document.querySelectorAll(".kategori-btn").forEach((b) => b.classList.remove("aktif"));
    btn.classList.add("aktif");

    const filtrelenmis =
      kategori === "tumu"
        ? LOCATIONS
        : LOCATIONS.filter((k) => k.category === kategori);

    konumListesiniOlustur(siralaKonumlar(filtrelenmis));
  }

  /**
   * Konum kartlarını menü listesine render eder
   * @param {Array} konumlar - Gösterilecek konum dizisi
   */
  function konumListesiniOlustur(konumlar) {
    listeEl.innerHTML = "";

    konumlar.forEach((konum) => {
      const kart = document.createElement("div");
      kart.className = "konum-karti" + (konum.id === seciliKonumId ? " secili" : "");
      kart.dataset.id = konum.id;

      const gorselWrap = document.createElement("div");
      gorselWrap.className = "konum-gorsel-wrap";
      gorselWrap.appendChild(KonumGorsel.imgOlustur(konum));

      const isim = document.createElement("span");
      isim.className = "konum-gorsel-isim";
      isim.textContent = konum.name;
      gorselWrap.appendChild(isim);

      const bilgi = document.createElement("div");
      bilgi.className = "konum-bilgi";
      bilgi.innerHTML = `
        <p>${konum.description}</p>
        <span class="konum-etiket etiket-${konum.category}">
          ${KATEGORI_ETIKETLERI[konum.category] || konum.category}
        </span>
      `;

      kart.appendChild(gorselWrap);
      kart.appendChild(bilgi);

      kart.addEventListener("click", () => konumSecildi(konum));
      listeEl.appendChild(kart);
    });
  }

  /**
   * Menüden bir konum seçildiğinde haritayı günceller
   * @param {Object} konum - Seçilen konum nesnesi
   */
  function konumSecildi(konum) {
    seciliKonumId = konum.id;
    document.querySelectorAll(".konum-karti").forEach((k) => {
      k.classList.toggle("secili", k.dataset.id === konum.id);
    });
    Harita.konumaGit(konum);
  }

  /**
   * Haritadan seçilen konumu menüde vurgular
   * @param {string} konumId - Vurgulanacak konumun id değeri
   */
  function konumVurgula(konumId) {
    seciliKonumId = konumId;
    document.querySelectorAll(".konum-karti").forEach((k) => {
      k.classList.toggle("secili", k.dataset.id === konumId);
    });

    const seciliKart = listeEl.querySelector(`[data-id="${konumId}"]`);
    if (seciliKart) {
      seciliKart.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return {
    baslat,
    konumVurgula,
    menuAc,
  };
})();
