// Armür Maliyet - hesap motoru
// tukH: tek iplik satırının gramajı (g/mt)
// calcBreakdown: tam kumaş maliyet kırılımı
(function (g) {
  function num(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function tukH(tip, den, kat, tel, fak, fp) {
    fp = fp || g.FPD;
    den = num(den);
    tel = num(tel);
    fak = num(fak);
    var k = num(kat) || 1;
    if (den <= 0 || tel <= 0) return 0;
    var t = (typeof tip === 'string') ? tip.toUpperCase() : 'DENYE';
    switch (t) {
      case 'DENYE':
        return (tel / (fp.denye_base / den)) * k / fp.g_div * fak * fp.g_mul;
      case 'DTEX':
        return (tel / (fp.dtex_base / den)) * k / fp.g_div * fak * fp.g_mul;
      case 'NM':
        return (tel / (den / k)) / fp.g_div * fak * fp.g_mul;
      case 'NE':
        return tel / (fp.ne_factor * den / k) / fp.g_div * fak * fp.g_mul;
      default:
        return 0;
    }
  }

  function calcBreakdown(fis, iplikler, fp) {
    fp = fp || g.FPD;
    fis = fis || {};
    iplikler = iplikler || {};
    var cozguList = iplikler.cozgu || iplikler.c || [];
    var atkiList  = iplikler.atki  || iplikler.a || [];

    var tarakEn = num(fis.tarakEn);
    var aSik    = num(fis.atkiSik);
    var devir   = num(fis.devir);
    var rand    = num(fis.randiman);
    var terbFi  = num(fis.terbiyeFiyat);
    var fire    = num(fis.genelFire);
    var kursum  = num(fis.kursum);
    var ekMal   = num(fis.ekMal);
    var kar     = num(fis.kar);

    var topI = 0;
    var grmt = 0;
    var i, it, t, tBase;

    for (i = 0; i < cozguList.length; i++) {
      it = cozguList[i] || {};
      t = tukH(it.tip, it.denye, it.kat, it.tel, 1, fp);
      topI += t * num(it.fiyat) / 1000;
      grmt += t;
    }

    for (i = 0; i < atkiList.length; i++) {
      it = atkiList[i] || {};
      tBase = tukH(it.tip, it.denye, it.kat, it.tel, aSik / 100, fp);
      if (tarakEn > 0) {
        t = tBase * (tarakEn / 100);
      } else {
        t = tBase;
      }
      topI += t * num(it.fiyat) / 1000;
      grmt += t;
    }

    var binD = aSik < fp.bin_thr
      ? (fp.bin_thr - aSik) * fp.bin_mul + fp.bin_base
      : fp.bin_base2;

    var uAy = 0;
    if (aSik > 0) {
      uAy = devir * fp.dak * fp.saat * fp.ay_gun / fp.rand_div / aSik * (rand / fp.rand_div2);
    }

    var fasI = uAy > 0 ? (binD / uAy) * fp.iscilikKdv : 0;
    var terbM = grmt / fp.terb_div * terbFi;
    var fireM = (topI + fasI + terbM) * fire / fp.fire_div;
    var total = topI + fasI + terbM + kursum + ekMal + fireM + kar;

    return {
      topI: topI,
      grmt: grmt,
      fasI: fasI,
      terbM: terbM,
      fireM: fireM,
      uAy: uAy,
      total: total
    };
  }

  g.tukH = tukH;
  g.calcBreakdown = calcBreakdown;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tukH: tukH, calcBreakdown: calcBreakdown };
  }
})(typeof self !== 'undefined' ? self : this);
