/**
 * Kitap Görüntüleyici — PDF sayfalarını gerçek bir kitap gibi çevirerek gösterir.
 * Kullanım: kitap-oku/index.html?dosya=<pdf yolu>&baslik=<gösterilecek başlık>
 *
 * Teknik: PDF.js ile her sayfa bir <canvas>'a render edilir ve önbelleğe alınır
 * (büyük PDF'lerde performans için yalnızca görülen ve komşu sayfalar render edilir).
 * Sayfa çevirme; tek bir "yaprak" öğesinin CSS 3B (rotateY) döndürülmesiyle, önü ve
 * arkası backface-visibility:hidden olan iki yüz arasında geçiş yapılarak elde edilir.
 */

(function () {
  const PDF_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const yukleniyorEl = document.getElementById("yukleniyor");
  const hataEl = document.getElementById("hata");
  const hataMetinEl = document.getElementById("hata-metin");
  const kitapBaslikEl = document.getElementById("kitap-baslik");
  const sayfaGostergeEl = document.getElementById("sayfa-gostergesi");
  const indirBtnEl = document.getElementById("indir-btn");
  const geriBtnEl = document.getElementById("geri-btn");
  const kitapGovdeEl = document.getElementById("kitap-govde");
  const tabanCanvas = document.getElementById("taban-canvas");
  const onCanvas = document.getElementById("on-canvas");
  const arkaCanvas = document.getElementById("arka-canvas");
  const yaprakEl = document.getElementById("yaprak");
  const sayfaYukleniyorEl = document.getElementById("sayfa-yukleniyor");
  const oncekiBtn = document.getElementById("onceki-btn");
  const sonrakiBtn = document.getElementById("sonraki-btn");
  const tikSolEl = document.querySelector(".tik-sol");
  const tikSagEl = document.querySelector(".tik-sag");

  let pdfBelge = null;
  let toplamSayfa = 0;
  let mevcut = 1;
  let temelGenislik = 0;
  let temelYukseklik = 0;
  let renderOlcegi = 1;
  let kilit = false;

  /** sayfaNo → Promise<HTMLCanvasElement> önbelleği */
  const canvasOnbellek = new Map();

  function hataGoster(mesaj) {
    yukleniyorEl.classList.add("gizle");
    hataMetinEl.textContent = mesaj;
    hataEl.hidden = false;
  }

  function guncelleGosterge() {
    sayfaGostergeEl.textContent = `${mevcut} / ${toplamSayfa}`;
  }

  function guncelleOkDurumu() {
    oncekiBtn.disabled = mevcut <= 1;
    sonrakiBtn.disabled = mevcut >= toplamSayfa;
  }

  function sayfaYukleniyorGoster(goster) {
    sayfaYukleniyorEl.hidden = !goster;
  }

  /**
   * Belirtilen sayfayı render edip önbelleğe alınmış bir canvas olarak döndürür
   * @param {number} sayfaNo
   * @returns {Promise<HTMLCanvasElement>}
   */
  function sayfaCanvasGetir(sayfaNo) {
    if (sayfaNo < 1 || sayfaNo > toplamSayfa) {
      return Promise.reject(new Error("Sayfa aralık dışında"));
    }
    if (canvasOnbellek.has(sayfaNo)) {
      return canvasOnbellek.get(sayfaNo);
    }

    const p = pdfBelge.getPage(sayfaNo).then((sayfa) => {
      const viewport = sayfa.getViewport({ scale: renderOlcegi });
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(viewport.width));
      c.height = Math.max(1, Math.round(viewport.height));
      const ctx = c.getContext("2d");
      return sayfa.render({ canvasContext: ctx, viewport }).promise.then(() => c);
    });

    canvasOnbellek.set(sayfaNo, p);
    return p;
  }

  /**
   * Önbellekteki sayfa görüntüsünü hedef (görünen) canvas'a çizer
   * @param {HTMLCanvasElement} hedefCanvasEl
   * @param {number} sayfaNo
   */
  async function hedefeCiz(hedefCanvasEl, sayfaNo) {
    const kaynak = await sayfaCanvasGetir(sayfaNo);
    hedefCanvasEl.width = kaynak.width;
    hedefCanvasEl.height = kaynak.height;
    hedefCanvasEl.getContext("2d").drawImage(kaynak, 0, 0);
  }

  /** Mevcut sayfanın komşularını arka planda önceden render eder */
  function komsulariOnYukle() {
    sayfaCanvasGetir(mevcut + 1).catch(() => {});
    sayfaCanvasGetir(mevcut - 1).catch(() => {});
  }

  async function ilkGosterimiHazirla() {
    await Promise.all([hedefeCiz(tabanCanvas, mevcut), hedefeCiz(onCanvas, mevcut)]);
    guncelleGosterge();
    guncelleOkDurumu();
    komsulariOnYukle();
  }

  /** Bir sonraki sayfaya, kitap sayfası çevirir gibi geçiş yapar */
  function sonrakiSayfa() {
    if (kilit || mevcut >= toplamSayfa) {
      return;
    }
    kilit = true;
    const hedef = mevcut + 1;
    sayfaYukleniyorGoster(true);

    Promise.all([
      hedefeCiz(tabanCanvas, hedef),
      hedefeCiz(onCanvas, mevcut),
      hedefeCiz(arkaCanvas, hedef),
    ])
      .then(() => {
        sayfaYukleniyorGoster(false);

        yaprakEl.addEventListener(
          "transitionend",
          function biten(e) {
            if (e.propertyName !== "transform") {
              return;
            }
            yaprakEl.removeEventListener("transitionend", biten);
            mevcut = hedef;
            yaprakEl.classList.remove("animasyonlu", "cevrildi");
            hedefeCiz(onCanvas, mevcut);
            guncelleGosterge();
            guncelleOkDurumu();
            komsulariOnYukle();
            kilit = false;
          },
          { once: true }
        );

        yaprakEl.classList.add("animasyonlu");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => yaprakEl.classList.add("cevrildi"));
        });
      })
      .catch(() => {
        sayfaYukleniyorGoster(false);
        kilit = false;
      });
  }

  /** Bir önceki sayfaya, kitap sayfası geri çevrilir gibi geçiş yapar */
  function oncekiSayfa() {
    if (kilit || mevcut <= 1) {
      return;
    }
    kilit = true;
    const hedef = mevcut - 1;
    sayfaYukleniyorGoster(true);

    Promise.all([
      hedefeCiz(tabanCanvas, hedef),
      hedefeCiz(onCanvas, hedef),
      hedefeCiz(arkaCanvas, mevcut),
    ])
      .then(() => {
        sayfaYukleniyorGoster(false);
        yaprakEl.classList.remove("animasyonlu");
        yaprakEl.classList.add("cevrildi");
        void yaprakEl.offsetWidth; /* reflow zorla — sınıf sıfırlamasının anında uygulanmasını sağlar */

        yaprakEl.addEventListener(
          "transitionend",
          function biten(e) {
            if (e.propertyName !== "transform") {
              return;
            }
            yaprakEl.removeEventListener("transitionend", biten);
            mevcut = hedef;
            yaprakEl.classList.remove("animasyonlu", "cevrildi");
            hedefeCiz(onCanvas, mevcut);
            guncelleGosterge();
            guncelleOkDurumu();
            komsulariOnYukle();
            kilit = false;
          },
          { once: true }
        );

        yaprakEl.classList.add("animasyonlu");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => yaprakEl.classList.remove("cevrildi"));
        });
      })
      .catch(() => {
        sayfaYukleniyorGoster(false);
        kilit = false;
      });
  }

  /** Pencere yeniden boyutlandığında render çözünürlüğünü günceller */
  let yenidenOlceklendirZamanlayici = null;
  function yenidenOlceklendirPlanla() {
    clearTimeout(yenidenOlceklendirZamanlayici);
    yenidenOlceklendirZamanlayici = setTimeout(yenidenOlceklendir, 250);
  }

  function yenidenOlceklendir() {
    if (!temelGenislik || kilit) {
      return;
    }
    const kutu = kitapGovdeEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const yeniOlcek = (kutu.width * dpr) / temelGenislik;
    if (!Number.isFinite(yeniOlcek) || Math.abs(yeniOlcek - renderOlcegi) < 0.05) {
      return;
    }
    renderOlcegi = yeniOlcek;
    canvasOnbellek.clear();
    hedefeCiz(tabanCanvas, mevcut);
    hedefeCiz(onCanvas, mevcut);
    komsulariOnYukle();
  }

  function olaylariBagla() {
    oncekiBtn.addEventListener("click", oncekiSayfa);
    sonrakiBtn.addEventListener("click", sonrakiSayfa);
    tikSolEl.addEventListener("click", oncekiSayfa);
    tikSagEl.addEventListener("click", sonrakiSayfa);

    geriBtnEl.addEventListener("click", () => {
      if (history.length > 1) {
        history.back();
      } else {
        location.href = "../";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        sonrakiSayfa();
      } else if (e.key === "ArrowLeft") {
        oncekiSayfa();
      }
    });

    let dokunmaBaslangicX = null;
    kitapGovdeEl.addEventListener(
      "touchstart",
      (e) => {
        dokunmaBaslangicX = e.touches[0].clientX;
      },
      { passive: true }
    );

    kitapGovdeEl.addEventListener("touchend", (e) => {
      if (dokunmaBaslangicX === null) {
        return;
      }
      const fark = e.changedTouches[0].clientX - dokunmaBaslangicX;
      dokunmaBaslangicX = null;
      if (Math.abs(fark) < 40) {
        return;
      }
      if (fark < 0) {
        sonrakiSayfa();
      } else {
        oncekiSayfa();
      }
    });

    window.addEventListener("resize", yenidenOlceklendirPlanla);
  }

  async function basla() {
    if (!window.pdfjsLib) {
      hataGoster("Görüntüleyici bileşenleri yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.");
      return;
    }

    const params = new URLSearchParams(location.search);
    const dosya = params.get("dosya");
    const baslik = params.get("baslik");

    if (baslik) {
      document.title = `${baslik} — Kilis Valiliği`;
      kitapBaslikEl.textContent = baslik;
    }

    if (!dosya) {
      hataGoster("Görüntülenecek bir belge belirtilmedi.");
      return;
    }

    indirBtnEl.href = dosya;
    indirBtnEl.setAttribute("download", dosya.split("/").pop() || "belge.pdf");

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      pdfBelge = await pdfjsLib.getDocument(dosya).promise;
      toplamSayfa = pdfBelge.numPages;

      const ilkSayfa = await pdfBelge.getPage(1);
      const temelViewport = ilkSayfa.getViewport({ scale: 1 });
      temelGenislik = temelViewport.width;
      temelYukseklik = temelViewport.height;

      kitapGovdeEl.style.aspectRatio = `${temelGenislik} / ${temelYukseklik}`;

      const kutu = kitapGovdeEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderOlcegi = (kutu.width * dpr) / temelGenislik;

      olaylariBagla();
      await ilkGosterimiHazirla();

      yukleniyorEl.classList.add("gizle");
      setTimeout(() => yukleniyorEl.remove(), 500);
    } catch (hata) {
      console.error("Kitap yüklenemedi:", hata);
      hataGoster("Belge yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  }

  basla();
})();
