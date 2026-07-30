/**
 * Kilis Kültür Kütüphanesi — dolabı açma ve raf/kitap oluşturma mantığı
 * Kategori renkleri map/css/styles.css içindeki --cat-* değişkenleriyle senkron tutulur.
 */

(function () {
  const KATEGORI_RENK = {
    tarihi: "#8e5327",
    dini: "#3c6b52",
    doga: "#276b76",
    kultur: "#815d1d",
    arkeoloji: "#55628c",
  };

  const KITAP_BASINA_RAF = 5;

  const dolapSahneEl = document.getElementById("dolap-sahne");
  const dolapAcBtn = document.getElementById("dolap-ac-btn");
  const kapiSolEl = document.getElementById("kapi-sol");
  const kapiSagEl = document.getElementById("kapi-sag");
  const rafAlaniEl = document.getElementById("raf-alani");
  const rafListeEl = document.getElementById("raf-liste");
  const bilgiPanelKatmanEl = document.getElementById("bilgi-panel");
  const bilgiPanelKapatBtn = document.getElementById("bilgi-panel-kapat");

  /**
   * 34-46px arası genişlik, 150-190px arası yükseklikte hafif rastgelelik
   * verir — raftaki kitaplar birbirinin birebir aynısı görünmesin diye.
   */
  function rastgeleAralik(min, maks) {
    return Math.round(min + Math.random() * (maks - min));
  }

  function kitapOlustur(veri) {
    const kitapEl = document.createElement("div");
    kitapEl.className = "kitap";
    kitapEl.dataset.id = veri.id;
    kitapEl.style.setProperty("--renk-kitap", KATEGORI_RENK[veri.kategori] || "#51574a");
    kitapEl.style.setProperty("--kitap-en", `${rastgeleAralik(34, 46)}px`);
    kitapEl.style.setProperty("--kitap-boy", `${rastgeleAralik(150, 190)}px`);
    kitapEl.setAttribute("role", "button");
    kitapEl.setAttribute("tabindex", "0");
    kitapEl.setAttribute(
      "aria-label",
      veri.pdf ? `${veri.baslik || "Kitap"} — aç` : "İçeriği yakında eklenecek kitap"
    );

    const etiket = document.createElement("span");
    etiket.className = "kitap-etiket";
    etiket.textContent = veri.pdf ? veri.baslik || "" : "Yakında";
    kitapEl.appendChild(etiket);

    const tiklaninca = () => kitabaTiklandi(kitapEl, veri);
    kitapEl.addEventListener("click", tiklaninca);
    kitapEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tiklaninca();
      }
    });

    return kitapEl;
  }

  function kitabaTiklandi(kitapEl, veri) {
    if (veri.pdf) {
      const parametreler = new URLSearchParams({
        dosya: veri.pdf,
        baslik: veri.baslik || "",
      });
      location.href = `../kitap-oku/?${parametreler.toString()}`;
      return;
    }

    kitapEl.classList.remove("sallaniyor");
    void kitapEl.offsetWidth;
    kitapEl.classList.add("sallaniyor");
    bilgiPaneliGoster();
  }

  function rafiOlustur(kitaplarVerisi) {
    const raf = document.createElement("div");
    raf.className = "raf";

    const kitaplarKapsayici = document.createElement("div");
    kitaplarKapsayici.className = "raf-kitaplar";
    kitaplarVerisi.forEach((veri) => kitaplarKapsayici.appendChild(kitapOlustur(veri)));

    const tahta = document.createElement("div");
    tahta.className = "raf-tahta";

    raf.appendChild(kitaplarKapsayici);
    raf.appendChild(tahta);
    return raf;
  }

  function raflariOlustur() {
    const kitaplar = window.KITAPLAR || [];
    for (let i = 0; i < kitaplar.length; i += KITAP_BASINA_RAF) {
      const grup = kitaplar.slice(i, i + KITAP_BASINA_RAF);
      rafListeEl.appendChild(rafiOlustur(grup));
    }
  }

  function bilgiPaneliGoster() {
    bilgiPanelKatmanEl.hidden = false;
    requestAnimationFrame(() => bilgiPanelKatmanEl.classList.add("gorunur"));
  }

  function bilgiPaneliKapat() {
    bilgiPanelKatmanEl.classList.remove("gorunur");
    setTimeout(() => {
      bilgiPanelKatmanEl.hidden = true;
    }, 250);
  }

  function dolabiAc() {
    kapiSolEl.classList.add("acik");
    kapiSagEl.classList.add("acik");
    dolapAcBtn.disabled = true;

    setTimeout(() => {
      dolapSahneEl.classList.add("kapaniyor");

      /* Raf, dolap tamamen solup gizlenmeden görünmez — aksi halde .sahne'nin
         flex düzeninde iki bölüm bir anlığına yan yana/üst üste yarılanır. */
      setTimeout(() => {
        dolapSahneEl.hidden = true;
        rafAlaniEl.hidden = false;
      }, 550);
    }, 700);
  }

  function olaylariBagla() {
    dolapAcBtn.addEventListener("click", dolabiAc);
    bilgiPanelKapatBtn.addEventListener("click", bilgiPaneliKapat);
    bilgiPanelKatmanEl.addEventListener("click", (e) => {
      if (e.target === bilgiPanelKatmanEl) {
        bilgiPaneliKapat();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && bilgiPanelKatmanEl.classList.contains("gorunur")) {
        bilgiPaneliKapat();
      }
    });
  }

  raflariOlustur();
  olaylariBagla();
})();
