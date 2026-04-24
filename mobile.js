// Armür Maliyet - mobil uygulama mantığı
(function () {
  'use strict';

  var STORE_KEY = 'armur.mobile.records';
  var TYPES = ['DENYE', 'DTEX', 'NM', 'NE'];

  var nfMoney = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nfInt   = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  var nfG     = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function money(n) { return '$' + nfMoney.format(isFinite(n) ? n : 0); }
  function mtMoney(n) { return money(n) + ' /mt'; }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function emptyCozgu() {
    return { tip: 'DENYE', denye: '', kat: 1, tel: '', fiyat: '' };
  }
  function emptyAtki() {
    return { tip: 'DENYE', denye: '', kat: 1, tel: 1, fiyat: '' };
  }

  var state = {
    step: 1,
    fis: {
      tarakEn: '',
      cozguSik: '',
      atkiSik: '',
      devir: 360,
      randiman: 85,
      terbiyeFiyat: 0,
      genelFire: 2,
      kursum: 0,
      ekMal: 0,
      kar: 0
    },
    iplikler: {
      cozgu: [emptyCozgu()],
      atki:  [emptyAtki()]
    },
    currentId: null,
    currentName: ''
  };

  // --- DOM helpers
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function numOrEmpty(v) {
    if (v === '' || v === null || v === undefined) return '';
    var n = parseFloat(v);
    return isFinite(n) ? n : '';
  }

  // =======================================================
  // Render / navigation
  // =======================================================
  function renderStep(n) {
    state.step = n;
    $$('.step').forEach(function (s) {
      s.hidden = String(s.dataset.step) !== String(n);
    });
    $('#step-chip').textContent = n + '/5';
    $('#progress-fill').style.width = (n * 20) + '%';

    // Action bar visible except step 5
    var bar = $('#actionbar');
    if (n === 5) bar.classList.add('hidden');
    else bar.classList.remove('hidden');

    $('#btn-back').disabled = (n === 1);

    if (n === 2) renderCards('cozgu');
    if (n === 3) renderCards('atki');
    if (n === 5) renderResult();

    updateNextButton();
    window.scrollTo(0, 0);
  }

  function gotoNext() {
    if (!validateStep(state.step)) return;
    if (state.step < 5) renderStep(state.step + 1);
  }
  function gotoBack() {
    if (state.step > 1) renderStep(state.step - 1);
  }

  // =======================================================
  // Validation
  // =======================================================
  function showErr(fieldId, msg) {
    var input = $('#f-' + fieldId);
    var err = $('#e-' + fieldId);
    var field = input && input.closest('.field');
    if (!field) return;
    if (msg) {
      field.classList.add('has-err');
      err.textContent = msg;
    } else {
      field.classList.remove('has-err');
      err.textContent = '';
    }
  }

  function validStep1() {
    var t = parseFloat($('#f-tarakEn').value);
    var c = parseFloat($('#f-cozguSik').value);
    var a = parseFloat($('#f-atkiSik').value);
    return isFinite(t) && t > 0 && isFinite(c) && c > 0 && isFinite(a) && a > 0;
  }

  function validCard(it) {
    if (!it) return false;
    if (TYPES.indexOf(it.tip) < 0) return false;
    var den = parseFloat(it.denye), kat = parseFloat(it.kat), tel = parseFloat(it.tel), fi = parseFloat(it.fiyat);
    if (!(isFinite(den) && den > 0)) return false;
    if (!(isFinite(kat) && kat >= 1)) return false;
    if (!(isFinite(tel) && tel > 0)) return false;
    if (!(isFinite(fi)  && fi  > 0)) return false;
    return true;
  }
  function validStep2() {
    var arr = state.iplikler.cozgu;
    if (!arr.length) return false;
    return arr.every(validCard);
  }
  function validStep3() {
    var arr = state.iplikler.atki;
    if (!arr.length) return false;
    return arr.every(validCard);
  }
  function validStep4() {
    var f = state.fis;
    var devir = parseFloat(f.devir);
    var rand  = parseFloat(f.randiman);
    var terb  = parseFloat(f.terbiyeFiyat);
    var fire  = parseFloat(f.genelFire);
    var k1 = parseFloat(f.kursum), k2 = parseFloat(f.ekMal), k3 = parseFloat(f.kar);
    if (!(isFinite(devir) && devir > 0)) return false;
    if (!(isFinite(rand)  && rand >= 0)) return false;
    if (!(isFinite(terb)  && terb >= 0)) return false;
    if (!(isFinite(fire)  && fire >= 0)) return false;
    if (!(isFinite(k1)    && k1   >= 0)) return false;
    if (!(isFinite(k2)    && k2   >= 0)) return false;
    if (!(isFinite(k3)    && k3   >= 0)) return false;
    return true;
  }

  function validateStep(n) {
    if (n === 1) return validStep1();
    if (n === 2) return validStep2();
    if (n === 3) return validStep3();
    if (n === 4) return validStep4();
    return true;
  }
  function updateNextButton() {
    $('#btn-next').disabled = !validateStep(state.step);
  }

  // =======================================================
  // Step 1 bindings
  // =======================================================
  function bindStep1() {
    var map = [
      ['tarakEn', 'Tarak eni 0\'dan büyük olmalı.'],
      ['cozguSik', 'Çözgü sıklığı 0\'dan büyük olmalı.'],
      ['atkiSik', 'Atkı sıklığı 0\'dan büyük olmalı.']
    ];
    map.forEach(function (pair) {
      var id = pair[0], msg = pair[1];
      var input = $('#f-' + id);
      input.addEventListener('input', function () {
        state.fis[id] = numOrEmpty(input.value);
        showErr(id, '');
        updateNextButton();
      });
      input.addEventListener('blur', function () {
        var v = parseFloat(input.value);
        if (!(isFinite(v) && v > 0)) showErr(id, msg);
      });
    });
  }

  // =======================================================
  // Step 2 / 3 — cards
  // =======================================================
  function renderCards(which) {
    var host = $('#' + which + '-list');
    host.innerHTML = '';
    var arr = state.iplikler[which];
    arr.forEach(function (it, i) {
      host.appendChild(makeCard(which, it, i));
    });
    updateNextButton();
  }

  function makeCard(which, it, idx) {
    var card = document.createElement('div');
    card.className = 'card';
    var valid = validCard(it);
    card.classList.add(valid ? 'valid' : 'invalid');

    var head = document.createElement('div');
    head.className = 'card-head';
    var title = document.createElement('h3');
    var label = (which === 'cozgu' ? 'Çözgü' : 'Atkı') + ' #' + (idx + 1);
    title.innerHTML = label + ' <span class="badge">' + (valid ? '✓' : '!') + '</span>';

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'del-btn';
    del.setAttribute('aria-label', 'Sil');
    del.textContent = '🗑';
    del.disabled = state.iplikler[which].length <= 1;
    del.addEventListener('click', function () {
      if (state.iplikler[which].length <= 1) return;
      state.iplikler[which].splice(idx, 1);
      renderCards(which);
    });

    head.appendChild(title);
    head.appendChild(del);
    card.appendChild(head);

    // Segmented control for tip
    var seg = document.createElement('div');
    seg.className = 'seg';
    TYPES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      if (it.tip === t) b.classList.add('active');
      b.addEventListener('click', function () {
        it.tip = t;
        renderCards(which);
      });
      seg.appendChild(b);
    });
    card.appendChild(seg);

    // Row 1: denye + kat
    var row1 = document.createElement('div');
    row1.className = 'row2';
    row1.appendChild(makeInput('Denye', it.denye, function (v) { it.denye = v; liveUpdate(card, which, it); }, { min: 0 }));
    row1.appendChild(makeInput('Kat', it.kat, function (v) { it.kat = v; liveUpdate(card, which, it); }, { min: 1, step: 1 }));
    card.appendChild(row1);

    // Row 2: tel + fiyat
    var row2 = document.createElement('div');
    row2.className = 'row2';
    row2.appendChild(makeInput('Tel sayısı', it.tel, function (v) { it.tel = v; liveUpdate(card, which, it); }, { min: 0 }));
    row2.appendChild(makeInput('Fiyat $/kg', it.fiyat, function (v) { it.fiyat = v; liveUpdate(card, which, it); }, { min: 0 }));
    card.appendChild(row2);

    // Preview
    var prev = document.createElement('div');
    prev.className = 'preview';
    card.appendChild(prev);
    fillPreview(prev, which, it);

    return card;
  }

  function makeInput(label, value, onChange, opts) {
    opts = opts || {};
    var field = document.createElement('label');
    field.className = 'field';
    var lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = label;
    field.appendChild(lbl);
    var input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.step = opts.step || 'any';
    if (opts.min !== undefined) input.min = opts.min;
    input.value = (value === '' || value === null || value === undefined) ? '' : value;
    input.addEventListener('input', function () {
      var v = input.value === '' ? '' : parseFloat(input.value);
      onChange(isFinite(v) ? v : (input.value === '' ? '' : 0));
    });
    field.appendChild(input);
    return field;
  }

  function liveUpdate(card, which, it) {
    var valid = validCard(it);
    card.classList.toggle('valid', valid);
    card.classList.toggle('invalid', !valid);
    var badge = card.querySelector('.badge');
    if (badge) badge.textContent = valid ? '✓' : '!';
    var prev = card.querySelector('.preview');
    if (prev) fillPreview(prev, which, it);
    updateNextButton();
  }

  function fillPreview(el, which, it) {
    var fp = self.FPD;
    var aSik = parseFloat(state.fis.atkiSik) || 0;
    var tarakEn = parseFloat(state.fis.tarakEn) || 0;
    var t = 0;
    if (validCard(it)) {
      if (which === 'cozgu') {
        t = self.tukH(it.tip, it.denye, it.kat, it.tel, 1, fp);
      } else {
        var tBase = self.tukH(it.tip, it.denye, it.kat, it.tel, aSik / 100, fp);
        t = tarakEn > 0 ? tBase * (tarakEn / 100) : tBase;
      }
      var cost = t * parseFloat(it.fiyat) / 1000;
      el.textContent = 'Gramaj: ' + nfG.format(t) + ' g/mt  ·  Tutar: ' + money(cost) + ' /mt';
    } else {
      el.textContent = 'Tüm alanları doldurun.';
    }
  }

  // =======================================================
  // Step 4 bindings
  // =======================================================
  function bindStep4() {
    var fields = [
      ['devir',         function (v) { return v > 0; }, 'Devir 0\'dan büyük olmalı.'],
      ['randiman',      function (v) { return v >= 0; }, 'Randıman 0 veya daha büyük.'],
      ['terbiyeFiyat',  function (v) { return v >= 0; }, 'Terbiye fiyatı 0 veya daha büyük.'],
      ['genelFire',     function (v) { return v >= 0; }, 'Fire 0 veya daha büyük.'],
      ['kursum',        function (v) { return v >= 0; }, 'Kurşum 0 veya daha büyük.'],
      ['ekMal',         function (v) { return v >= 0; }, 'Ek malzeme 0 veya daha büyük.'],
      ['kar',           function (v) { return v >= 0; }, 'Kâr 0 veya daha büyük.']
    ];
    fields.forEach(function (pair) {
      var id = pair[0], ok = pair[1], msg = pair[2];
      var input = $('#f-' + id);
      input.addEventListener('input', function () {
        state.fis[id] = numOrEmpty(input.value);
        showErr(id, '');
        updateNextButton();
      });
      input.addEventListener('blur', function () {
        var v = parseFloat(input.value);
        if (!(isFinite(v) && ok(v))) showErr(id, msg);
      });
    });
  }

  // =======================================================
  // DOM <-> state sync
  // =======================================================
  function writeFormFromState() {
    $('#f-tarakEn').value  = state.fis.tarakEn === '' ? '' : state.fis.tarakEn;
    $('#f-cozguSik').value = state.fis.cozguSik === '' ? '' : state.fis.cozguSik;
    $('#f-atkiSik').value  = state.fis.atkiSik === '' ? '' : state.fis.atkiSik;

    $('#f-devir').value        = state.fis.devir;
    $('#f-randiman').value     = state.fis.randiman;
    $('#f-terbiyeFiyat').value = state.fis.terbiyeFiyat;
    $('#f-genelFire').value    = state.fis.genelFire;
    $('#f-kursum').value       = state.fis.kursum;
    $('#f-ekMal').value        = state.fis.ekMal;
    $('#f-kar').value          = state.fis.kar;

    ['tarakEn','cozguSik','atkiSik','devir','randiman','terbiyeFiyat','genelFire','kursum','ekMal','kar']
      .forEach(function (id) { showErr(id, ''); });
  }

  // =======================================================
  // Step 5 — result
  // =======================================================
  function renderResult() {
    var out = self.calcBreakdown(state.fis, state.iplikler, self.FPD);
    var ek = (parseFloat(state.fis.kursum) || 0) + (parseFloat(state.fis.ekMal) || 0) + (parseFloat(state.fis.kar) || 0);

    $('#r-total').textContent  = mtMoney(out.total);
    $('#r-total2').textContent = mtMoney(out.total);
    $('#r-iplik').textContent   = money(out.topI);
    $('#r-iscilik').textContent = money(out.fasI);
    $('#r-terbiye').textContent = money(out.terbM);
    $('#r-fire').textContent    = money(out.fireM);
    $('#r-ek').textContent      = money(ek);
    $('#r-grmt').textContent    = nfG.format(out.grmt) + ' g/mt';
    $('#r-uay').textContent     = nfInt.format(out.uAy) + ' mt/ay';
  }

  // =======================================================
  // localStorage kayıtları
  // =======================================================
  function loadRecords() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeRecords(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function saveRecord() {
    var defaultName = state.currentName || ('Hesap ' + new Date().toLocaleDateString('tr-TR'));
    var name = prompt('Bu hesabı hangi isimle kaydetmek istersiniz?', defaultName);
    if (name === null) return;
    name = String(name).trim();
    if (!name) return;

    var out = self.calcBreakdown(state.fis, state.iplikler, self.FPD);
    var records = loadRecords();
    var now = new Date().toISOString();
    var rec;
    if (state.currentId) {
      var idx = records.findIndex(function (r) { return r.id === state.currentId; });
      if (idx >= 0) {
        rec = records[idx];
        rec.name = name;
        rec.fis = clone(state.fis);
        rec.iplikler = clone(state.iplikler);
        rec.total = out.total;
        rec.updatedAt = now;
      } else {
        rec = buildRec(name, out.total, now);
        records.unshift(rec);
      }
    } else {
      rec = buildRec(name, out.total, now);
      records.unshift(rec);
    }
    writeRecords(records);
    state.currentId = rec.id;
    state.currentName = rec.name;
    toast('Kaydedildi ✓');
  }

  function buildRec(name, total, now) {
    return {
      id: newId(),
      name: name,
      fis: clone(state.fis),
      iplikler: clone(state.iplikler),
      total: total,
      createdAt: now,
      updatedAt: now
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function loadRecord(id) {
    var records = loadRecords();
    var r = records.find(function (x) { return x.id === id; });
    if (!r) return;
    state.fis = Object.assign({
      tarakEn: '', cozguSik: '', atkiSik: '',
      devir: 360, randiman: 85, terbiyeFiyat: 0,
      genelFire: 2, kursum: 0, ekMal: 0, kar: 0
    }, r.fis || {});
    state.iplikler = {
      cozgu: (r.iplikler && r.iplikler.cozgu || [emptyCozgu()]).map(function (x) { return Object.assign(emptyCozgu(), x); }),
      atki:  (r.iplikler && r.iplikler.atki  || [emptyAtki() ]).map(function (x) { return Object.assign(emptyAtki(),  x); })
    };
    state.currentId = r.id;
    state.currentName = r.name;
    writeFormFromState();
    closeSheet();
    renderStep(5);
  }

  function deleteRecord(id) {
    if (!confirm('Bu kayıt silinsin mi?')) return;
    var records = loadRecords().filter(function (r) { return r.id !== id; });
    writeRecords(records);
    if (state.currentId === id) { state.currentId = null; state.currentName = ''; }
    renderRecordsSheet();
  }

  // =======================================================
  // Kayıtlar modalı
  // =======================================================
  function openSheet() {
    renderRecordsSheet();
    $('#sheet-backdrop').hidden = false;
    $('#records-sheet').hidden = false;
  }
  function closeSheet() {
    $('#sheet-backdrop').hidden = true;
    $('#records-sheet').hidden = true;
  }
  function renderRecordsSheet() {
    var host = $('#records-list');
    host.innerHTML = '';
    var records = loadRecords().slice().sort(function (a, b) {
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
    if (!records.length) {
      var e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'Henüz kayıt yok';
      host.appendChild(e);
      return;
    }
    records.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'rec';
      row.addEventListener('click', function (ev) {
        if (ev.target.closest('.del-btn')) return;
        loadRecord(r.id);
      });

      var main = document.createElement('div');
      main.className = 'rec-main';
      var name = document.createElement('div');
      name.className = 'rec-name';
      name.textContent = r.name;
      var sub = document.createElement('div');
      sub.className = 'rec-sub';
      var dt = r.updatedAt || r.createdAt;
      sub.textContent = dt ? new Date(dt).toLocaleString('tr-TR') : '';
      main.appendChild(name);
      main.appendChild(sub);

      var total = document.createElement('div');
      total.className = 'rec-total';
      total.textContent = mtMoney(r.total || 0);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del-btn';
      del.setAttribute('aria-label', 'Sil');
      del.textContent = '🗑';
      del.addEventListener('click', function (ev) {
        ev.stopPropagation();
        deleteRecord(r.id);
      });

      row.appendChild(main);
      row.appendChild(total);
      row.appendChild(del);
      host.appendChild(row);
    });
  }

  // =======================================================
  // Toast
  // =======================================================
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }

  // =======================================================
  // Yeni hesap
  // =======================================================
  function newCalc() {
    state.fis = {
      tarakEn: '', cozguSik: '', atkiSik: '',
      devir: 360, randiman: 85, terbiyeFiyat: 0,
      genelFire: 2, kursum: 0, ekMal: 0, kar: 0
    };
    state.iplikler = { cozgu: [emptyCozgu()], atki: [emptyAtki()] };
    state.currentId = null;
    state.currentName = '';
    writeFormFromState();
    renderStep(1);
  }

  // =======================================================
  // Init
  // =======================================================
  function init() {
    bindStep1();
    bindStep4();
    writeFormFromState();

    $('#btn-next').addEventListener('click', gotoNext);
    $('#btn-back').addEventListener('click', gotoBack);

    $('#btn-add-cozgu').addEventListener('click', function () {
      state.iplikler.cozgu.push(emptyCozgu());
      renderCards('cozgu');
    });
    $('#btn-add-atki').addEventListener('click', function () {
      state.iplikler.atki.push(emptyAtki());
      renderCards('atki');
    });

    $('#btn-new').addEventListener('click', newCalc);
    $('#btn-save').addEventListener('click', saveRecord);
    $('#btn-records').addEventListener('click', openSheet);
    $('#btn-records2').addEventListener('click', openSheet);
    $('#btn-close-sheet').addEventListener('click', closeSheet);
    $('#sheet-backdrop').addEventListener('click', closeSheet);

    renderStep(1);

    // Service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./mobile-sw.js').catch(function () {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
