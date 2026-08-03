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
  let menuToggleEl = null;
  let menuAcik = false;
  let seciliKonumId = null;
  let aktifKategori = "tumu";

  /** Mobil sürükleyerek kapatma durumu */
  let surukleBaslangicY = null;
  let surukleFarki = 0;
  let surukleniyor = false;
  const SURUKLE_KAPATMA_ESIGI = 90;

  /** Kategori etiket Türkçe karşılıkları */
  const KATEGORI_ETIKETLERI = {
    tarihi: "Tarihi",
    arkeoloji: "Arkeoloji",
    dini: "Dini",
    kultur: "Kültür",
    doga: "Doğa",
  };

  /**
   * Google Maps yol tarifi URL'si — konum ne olursa olsun, kullanıcının
   * bulunduğu yerden hedefe navigasyon başlatır (API anahtarı gerektirmez)
   * @param {Object} konum - Konum veri nesnesi
   */
  function yolTarifiUrl(konum) {
    const params = new URLSearchParams({
      api: "1",
      destination: `${konum.lat},${konum.lng}`,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  /**
   * "Yol Tarifi Al" bağlantısının HTML'i — konum kartında ve info window'da
   * ortak kullanılır
   * @param {Object} konum - Konum veri nesnesi
   */
  function yolTarifiLinkHtml(konum) {
    return `
      <a class="yol-tarifi-btn" href="${yolTarifiUrl(konum)}" target="_blank" rel="noopener noreferrer" aria-label="${konum.name} için yol tarifi al">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-8-8 18-2-8-8-2Z"/></svg>
        Yol Tarifi
      </a>
    `;
  }

  /**
   * Konumları ada göre (TR) sıralar
   * @param {Array} konumlar - Sıralanacak konum dizisi
   */
  function siralaKonumlar(konumlar) {
    return [...konumlar].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  /**
   * Menü modülünü başlatır ve olay dinleyicilerini bağlar
   */
  function baslat() {
    sidebarEl = document.getElementById("sidebar");
    overlayEl = document.getElementById("sidebar-overlay");
    listeEl = document.getElementById("konum-listesi");
    haritaKapsayiciEl = document.getElementById("harita-kapsayici");
    menuToggleEl = document.getElementById("menu-toggle");

    menuToggleEl.addEventListener("click", menuToggle);
    overlayEl.addEventListener("click", menuKapat);
    document.getElementById("sidebar-kapat").addEventListener("click", menuKapat);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuAcik) {
        menuKapat();
      }
    });

    surukleyerekKapatmayiBagla();
    kategoriButonlariniOlustur();
    konumListesiniOlustur(siralaKonumlar(LOCATIONS));
  }

  /**
   * Mobilde panelin tutamacından ve başlığından aşağı sürükleyerek
   * kapatılabilmesini sağlayan dokunma olaylarını bağlar
   */
  function surukleyerekKapatmayiBagla() {
    const surukleAlanlari = [
      document.querySelector(".sidebar-handle"),
      document.querySelector(".sidebar-header"),
    ].filter(Boolean);

    surukleAlanlari.forEach((el) => {
      el.addEventListener("touchstart", surukleBaslat, { passive: true });
      el.addEventListener("touchmove", surukleDevam, { passive: false });
      el.addEventListener("touchend", surukleBitir);
      el.addEventListener("touchcancel", surukleBitir);
    });
  }

  function surukleBaslat(e) {
    if (window.innerWidth > 768) {
      return;
    }
    surukleBaslangicY = e.touches[0].clientY;
    surukleniyor = true;
    sidebarEl.style.transition = "none";
  }

  function surukleDevam(e) {
    if (!surukleniyor || surukleBaslangicY === null) {
      return;
    }
    const fark = e.touches[0].clientY - surukleBaslangicY;
    if (fark > 0) {
      surukleFarki = fark;
      sidebarEl.style.transform = `translateY(${fark}px)`;
      e.preventDefault();
    }
  }

  function surukleBitir() {
    if (!surukleniyor) {
      return;
    }
    surukleniyor = false;
    sidebarEl.style.transition = "";
    sidebarEl.style.transform = "";

    if (surukleFarki > SURUKLE_KAPATMA_ESIGI) {
      menuKapat();
    }

    surukleFarki = 0;
    surukleBaslangicY = null;
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
    sidebarEl.setAttribute("aria-hidden", "false");
    menuToggleEl.setAttribute("aria-expanded", "true");
  }

  /**
   * Yan menüyü kapatır
   */
  function menuKapat() {
    menuAcik = false;
    sidebarEl.classList.remove("acik");
    overlayEl.classList.remove("gorunur");
    haritaKapsayiciEl.classList.remove("menu-acik");
    sidebarEl.setAttribute("aria-hidden", "true");
    menuToggleEl.setAttribute("aria-expanded", "false");
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
        <div class="konum-alt-satir">
          <span class="konum-etiket etiket-${konum.category}">
            ${KATEGORI_ETIKETLERI[konum.category] || konum.category}
          </span>
          ${yolTarifiLinkHtml(konum)}
        </div>
      `;

      kart.appendChild(gorselWrap);
      kart.appendChild(bilgi);

      /* Yol tarifi linki kendi sekmesinde açılır; karta tıklanmış gibi
         haritayı da oynatmaması için olay üst kart dinleyicisine sızmaz. */
      bilgi.querySelector(".yol-tarifi-btn").addEventListener("click", (e) => e.stopPropagation());

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

    /* Mobilde alttan açılan panel haritayı kapattığından, konum seçilince kapatılır */
    if (window.innerWidth <= 768) {
      menuKapat();
    }
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
    kategoriEtiketleri: KATEGORI_ETIKETLERI,
    yolTarifiLinkHtml,
  };
})();
