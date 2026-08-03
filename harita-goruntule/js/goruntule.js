(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var gorselYolu = params.get("gorsel");
  var baslik = params.get("baslik") || "Harita";
  var indirAdi = params.get("indir") || "harita.jpg";

  var yukleniyorEl = document.getElementById("yukleniyor");
  var hataEl = document.getElementById("hata");
  var viewport = document.getElementById("harita-viewport");
  var img = document.getElementById("harita-img");
  var baslikEl = document.getElementById("harita-baslik");
  var indirBtn = document.getElementById("indir-btn");
  var ipucuEl = document.getElementById("dokunma-ipucu");

  document.title = baslik + " — Kilis Valiliği";
  baslikEl.textContent = baslik;

  if (!gorselYolu) {
    yukleniyorEl.classList.add("gizle");
    hataEl.hidden = false;
    return;
  }

  indirBtn.href = gorselYolu;
  indirBtn.setAttribute("download", indirAdi);

  document.getElementById("geri-btn").addEventListener("click", function () {
    window.location.href = "../";
  });

  // ── Zoom / pan durumu ──
  var olcek = 1, minOlcek = 1, maksOlcek = 1;
  var tx = 0, ty = 0;
  var dogalGenislik = 0, dogalYukseklik = 0;

  function uygula() {
    img.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + olcek + ")";
  }

  function sinirlaCeviri(hedefOlcek, hedefTx, hedefTy) {
    var cw = viewport.clientWidth, ch = viewport.clientHeight;
    var dw = dogalGenislik * hedefOlcek;
    var dh = dogalYukseklik * hedefOlcek;

    if (dw <= cw) {
      hedefTx = (cw - dw) / 2;
    } else {
      hedefTx = Math.min(0, Math.max(cw - dw, hedefTx));
    }

    if (dh <= ch) {
      hedefTy = (ch - dh) / 2;
    } else {
      hedefTy = Math.min(0, Math.max(ch - dh, hedefTy));
    }

    return [hedefTx, hedefTy];
  }

  function otur() {
    var cw = viewport.clientWidth, ch = viewport.clientHeight;
    minOlcek = Math.min(cw / dogalGenislik, ch / dogalYukseklik);
    maksOlcek = Math.max(minOlcek * 8, 1);
    olcek = minOlcek;
    tx = (cw - dogalGenislik * olcek) / 2;
    ty = (ch - dogalYukseklik * olcek) / 2;
    uygula();
  }

  function yakinlastir(carpan, cx, cy) {
    var yeniOlcek = Math.min(maksOlcek, Math.max(minOlcek, olcek * carpan));
    var oran = yeniOlcek / olcek;
    var yeniTx = cx - (cx - tx) * oran;
    var yeniTy = cy - (cy - ty) * oran;
    var sinirli = sinirlaCeviri(yeniOlcek, yeniTx, yeniTy);
    tx = sinirli[0];
    ty = sinirli[1];
    olcek = yeniOlcek;
    uygula();
  }

  img.addEventListener("load", function () {
    dogalGenislik = img.naturalWidth;
    dogalYukseklik = img.naturalHeight;
    img.style.width = dogalGenislik + "px";
    img.style.height = dogalYukseklik + "px";
    otur();
    img.classList.add("hazir");
    yukleniyorEl.classList.add("gizle");

    ipucuEl.classList.add("gorunur");
    setTimeout(function () {
      ipucuEl.classList.remove("gorunur");
    }, 2600);
  });

  img.addEventListener("error", function () {
    yukleniyorEl.classList.add("gizle");
    hataEl.hidden = false;
  });

  img.src = gorselYolu;

  window.addEventListener("resize", function () {
    if (dogalGenislik) otur();
  });

  // ── Fare tekerleği ile yakınlaştırma ──
  viewport.addEventListener("wheel", function (e) {
    if (!dogalGenislik) return;
    e.preventDefault();
    var rect = viewport.getBoundingClientRect();
    var cx = e.clientX - rect.left;
    var cy = e.clientY - rect.top;
    var carpan = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    yakinlastir(carpan, cx, cy);
  }, { passive: false });

  // ── Buton kontrolleri ──
  document.getElementById("yakinlastir-btn").addEventListener("click", function () {
    var cw = viewport.clientWidth, ch = viewport.clientHeight;
    yakinlastir(1.5, cw / 2, ch / 2);
  });

  document.getElementById("uzaklastir-btn").addEventListener("click", function () {
    var cw = viewport.clientWidth, ch = viewport.clientHeight;
    yakinlastir(1 / 1.5, cw / 2, ch / 2);
  });

  document.getElementById("sifirla-btn").addEventListener("click", function () {
    if (dogalGenislik) otur();
  });

  // ── Sürükleme ve çok parmakla yakınlaştırma (Pointer Events) ──
  var aktifPointerlar = new Map();
  var surukleniyor = false;
  var sonMesafe = null;
  var sonTikZamani = 0;
  var sonTikKonum = null;

  function mesafe(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  viewport.addEventListener("pointerdown", function (e) {
    if (!dogalGenislik) return;
    viewport.setPointerCapture(e.pointerId);
    aktifPointerlar.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (aktifPointerlar.size === 1) {
      surukleniyor = true;
      viewport.classList.add("suruklemede");
    } else if (aktifPointerlar.size === 2) {
      surukleniyor = false;
      var pts = Array.from(aktifPointerlar.values());
      sonMesafe = mesafe(pts[0], pts[1]);
    }
  });

  viewport.addEventListener("pointermove", function (e) {
    if (!aktifPointerlar.has(e.pointerId)) return;
    var onceki = aktifPointerlar.get(e.pointerId);
    aktifPointerlar.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (aktifPointerlar.size === 1 && surukleniyor) {
      var dx = e.clientX - onceki.x;
      var dy = e.clientY - onceki.y;
      var sinirli = sinirlaCeviri(olcek, tx + dx, ty + dy);
      tx = sinirli[0];
      ty = sinirli[1];
      uygula();
    } else if (aktifPointerlar.size === 2) {
      var pts = Array.from(aktifPointerlar.values());
      var yeniMesafe = mesafe(pts[0], pts[1]);
      var ortaX = (pts[0].x + pts[1].x) / 2;
      var ortaY = (pts[0].y + pts[1].y) / 2;
      var rect = viewport.getBoundingClientRect();

      if (sonMesafe) {
        var carpan = yeniMesafe / sonMesafe;
        yakinlastir(carpan, ortaX - rect.left, ortaY - rect.top);
      }
      sonMesafe = yeniMesafe;
    }
  });

  function pointerBitir(e) {
    aktifPointerlar.delete(e.pointerId);
    sonMesafe = null;

    if (aktifPointerlar.size === 0) {
      surukleniyor = false;
      viewport.classList.remove("suruklemede");

      var simdi = Date.now();
      var konum = { x: e.clientX, y: e.clientY };
      if (sonTikKonum && simdi - sonTikZamani < 320 && mesafe(sonTikKonum, konum) < 24) {
        var rect = viewport.getBoundingClientRect();
        var hedefOlcek = olcek < (minOlcek + maksOlcek) / 2 ? Math.min(maksOlcek, minOlcek * 3) : minOlcek;
        yakinlastir(hedefOlcek / olcek, konum.x - rect.left, konum.y - rect.top);
        sonTikZamani = 0;
        sonTikKonum = null;
      } else {
        sonTikZamani = simdi;
        sonTikKonum = konum;
      }
    } else if (aktifPointerlar.size === 1) {
      surukleniyor = true;
    }
  }

  viewport.addEventListener("pointerup", pointerBitir);
  viewport.addEventListener("pointercancel", pointerBitir);
})();
