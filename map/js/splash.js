/**
 * Kilis Gezi Haritası — Açılış logo animasyonu
 * Sayfa açılışında logo.svg ortada belirir ve kaybolur
 */

(function () {
  /** Animasyon süresi (ms) — CSS ile uyumlu */
  const TOPLAM_SURE_MS = 2800;

  /**
   * Logo splash ekranını kapatır ve DOM'dan kaldırır
   */
  function splashKapat() {
    const splash = document.getElementById("logo-splash");
    if (!splash) {
      return;
    }

    splash.classList.add("logo-splash--kapaniyor");

    splash.addEventListener(
      "transitionend",
      () => splash.remove(),
      { once: true }
    );

    /* transitionend tetiklenmezse yedek temizlik */
    setTimeout(() => splash.remove(), 800);
  }

  /**
   * DOM hazır olunca splash zamanlayıcısını başlatır
   */
  function baslat() {
    const splash = document.getElementById("logo-splash");
    if (!splash) {
      return;
    }

    /* Kısa gecikme ile animasyonun başlamasını garanti et */
    requestAnimationFrame(() => {
      splash.classList.add("logo-splash--aktif");
    });

    setTimeout(splashKapat, TOPLAM_SURE_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }
})();
