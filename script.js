(function () {
  'use strict';

  /* Tất cả tài nguyên được đặt cùng thư mục với index.html.
     Các đường dẫn cũ dạng assets/... được đổi về thư mục gốc khi chạy. */
  var icon = document.querySelector('link[rel="icon"]');
  if (icon) icon.href = 'favicon.svg';
  var assetStyle = document.createElement('style');
  assetStyle.textContent = '.slide{background-image:radial-gradient(1100px 560px at 78% 16%,rgba(212,175,55,.07),transparent 60%),url("paper-texture.svg"),linear-gradient(160deg,#1b1410 0%,#120d0a 55%,#0b0806 100%)}';
  document.head.appendChild(assetStyle);

  var body = document.body;
  var stage = document.getElementById('stage');
  var wrap = document.getElementById('stageWrap');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var titles = slides.map(function (s) { return s.getAttribute('data-title') || 'Slide'; });
  var cur = 0;
  var menuList = document.getElementById('menuList');
  var strip = document.getElementById('previewStrip');

  slides.forEach(function (s, i) {
    var num = ('0' + i).slice(-2);
    var li = document.createElement('button');
    li.type = 'button'; li.className = 'menu-item';
    li.innerHTML = '<span class="mi-num">' + num + '</span><span class="mi-title">' + titles[i] + '</span>';
    li.addEventListener('click', function () { go(i); closeOverlays(); });
    menuList.appendChild(li);
    var tile = document.createElement('button');
    tile.type = 'button'; tile.className = 'pv-tile';
    tile.innerHTML = '<span class="pv-num">' + num + '</span><span class="pv-title">' + titles[i] + '</span>';
    tile.addEventListener('click', function () { go(i); });
    strip.appendChild(tile);
  });

  var menuItems = Array.prototype.slice.call(menuList.children);
  var tiles = Array.prototype.slice.call(strip.children);
  var counter = document.getElementById('counter');
  var counter2 = document.getElementById('counter2');
  var progressFill = document.getElementById('progressFill');
  var notesBox = document.getElementById('presenterNotes');
  var nextBox = document.getElementById('nextTitle');
  function pad(n) { return ('0' + n).slice(-2); }

  function updateUI() {
    var label = pad(cur) + ' / ' + pad(total);
    counter.textContent = label; counter2.textContent = label;
    progressFill.style.width = (total > 1 ? cur / (total - 1) * 100 : 100) + '%';
    menuItems.forEach(function (el, i) { el.classList.toggle('on', i === cur); });
    tiles.forEach(function (el, i) { el.classList.toggle('on', i === cur); });
    var notes = slides[cur].querySelector('.slide-notes');
    notesBox.innerHTML = notes ? notes.innerHTML : '<p>(Không có ghi chú)</p>';
    nextBox.textContent = cur < total - 1 ? 'Slide ' + pad(cur + 1) + ': ' + titles[cur + 1] : '— Hết bài thuyết trình —';
    if (tiles[cur] && tiles[cur].scrollIntoView) tiles[cur].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }
  function pauseOtherVideos(activeSlide) {
    var vids = document.querySelectorAll('.slide video');
    for (var i = 0; i < vids.length; i++) {
      var sl = vids[i].closest ? vids[i].closest('.slide') : null;
      if (!sl || sl !== activeSlide) { try { vids[i].pause(); } catch (e) {} }
    }
  }
  function go(n, dir) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === cur && slides[n].classList.contains('active')) { updateUI(); return; }
    stage.setAttribute('data-dir', dir || (n > cur ? 'fwd' : 'back'));
    slides.forEach(function (s) { if (s !== slides[n] && s.classList.contains('leaving')) s.classList.remove('leaving'); });
    var old = slides[cur];
    if (old !== slides[n]) {
      old.classList.remove('active'); old.classList.add('leaving');
      setTimeout(function () { old.classList.remove('leaving'); }, 650);
    }
    slides[n].classList.add('active'); cur = n; pauseOtherVideos(slides[n]); updateUI();
    if (body.classList.contains('reader') && slides[cur].scrollIntoView) slides[cur].scrollIntoView({ behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#s' + cur);
  }
  function isReader() { return body.classList.contains('reader'); }
  function closeOverlays() { body.classList.remove('menu-open', 'preview-open'); syncToggles(); }
  function syncToggles() {
    document.getElementById('btnMenu').classList.toggle('on', body.classList.contains('menu-open'));
    document.getElementById('btnPreview').classList.toggle('on', body.classList.contains('preview-open'));
    document.getElementById('btnNotes').classList.toggle('on', body.classList.contains('presenter'));
    document.getElementById('btnReader').classList.toggle('on', body.classList.contains('reader'));
    document.getElementById('btnAnim').classList.toggle('on', body.classList.contains('no-anim'));
  }
  document.getElementById('btnNext').addEventListener('click', function () { go(cur + 1); });
  document.getElementById('btnPrev').addEventListener('click', function () { go(cur - 1); });
  document.getElementById('btnHome').addEventListener('click', function () { go(0); });
  document.getElementById('btnStart').addEventListener('click', function () { go(1); });
  document.getElementById('btnReplay').addEventListener('click', function () { go(0); });
  document.getElementById('btnMenu').addEventListener('click', function () { body.classList.toggle('menu-open'); syncToggles(); });
  document.getElementById('btnPreview').addEventListener('click', function () { body.classList.toggle('preview-open'); syncToggles(); });
  document.getElementById('btnNotes').addEventListener('click', togglePresenter);
  document.getElementById('btnReader').addEventListener('click', toggleReader);
  document.getElementById('btnAnim').addEventListener('click', function () { body.classList.toggle('no-anim'); syncToggles(); });
  document.getElementById('btnFS').addEventListener('click', toggleFS);

  var memberVideo = document.getElementById('memberVideo');
  var videoFallback = document.getElementById('videoFallback');
  if (memberVideo) {
    /* Sửa đường dẫn video/poster cũ về thư mục gốc. */
    var source = memberVideo.querySelector('source');
    if (source) { source.src = 'gioi-thieu-thanh-vien.mp4'; memberVideo.load(); }
    memberVideo.setAttribute('poster', 'video-poster.svg');
    var showFb = function () { if (videoFallback) videoFallback.classList.add('show'); };
    var hideFb = function () { if (videoFallback) videoFallback.classList.remove('show'); };
    if (source) source.addEventListener('error', showFb);
    memberVideo.addEventListener('error', showFb); memberVideo.addEventListener('loadeddata', hideFb);
    document.getElementById('btnVideoBig').addEventListener('click', function () {
      if (memberVideo.requestFullscreen) memberVideo.requestFullscreen();
      else if (memberVideo.webkitRequestFullscreen) memberVideo.webkitRequestFullscreen();
      else if (memberVideo.webkitEnterFullscreen) memberVideo.webkitEnterFullscreen();
    });
  }
  function togglePresenter() { body.classList.toggle('presenter'); presStart = Date.now(); syncToggles(); scale(); }
  function toggleReader() {
    body.classList.toggle('reader'); syncToggles();
    if (isReader()) { if (slides[cur].scrollIntoView) slides[cur].scrollIntoView(); } else window.scrollTo(0, 0);
    scale();
  }
  function toggleFS() {
    var el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen(); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
  function syncFSIcon() { body.classList.toggle('fs', !!(document.fullscreenElement || document.webkitFullscreenElement)); }
  document.addEventListener('fullscreenchange', syncFSIcon); document.addEventListener('webkitfullscreenchange', syncFSIcon);
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key, ae = document.activeElement;
    var onVideo = (e.target && e.target.tagName === 'VIDEO') || (ae && ae.tagName === 'VIDEO');
    if (onVideo && (k === ' ' || k.indexOf('Arrow') === 0)) return;
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); if (!isReader()) go(cur + 1); return; }
    if ((k === 'ArrowRight' || k === 'PageDown') && !isReader()) { e.preventDefault(); go(cur + 1); }
    else if ((k === 'ArrowLeft' || k === 'PageUp') && !isReader()) { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); } else if (k === 'End') { e.preventDefault(); go(total - 1); }
    else if (k === 'f' || k === 'F') toggleFS(); else if (k === 'n' || k === 'N') togglePresenter();
    else if (k === 'm' || k === 'M') { body.classList.toggle('menu-open'); syncToggles(); }
    else if (k === 'p' || k === 'P') { body.classList.toggle('preview-open'); syncToggles(); }
    else if (k === 'r' || k === 'R') toggleReader(); else if (k === 'a' || k === 'A') { body.classList.toggle('no-anim'); syncToggles(); }
    else if (k === 'Escape') closeOverlays();
  });
  function scale() {
    if (isReader()) { stage.style.transform = 'none'; return; }
    var w = wrap.clientWidth - 28, h = wrap.clientHeight - 28, s = Math.min(w / 1280, h / 720);
    if (!isFinite(s) || s <= 0) s = 1; stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', scale); window.addEventListener('orientationchange', scale);
  var presStart = Date.now(), clockEl = document.getElementById('clock'), elapsedEl = document.getElementById('elapsed');
  setInterval(function () {
    var d = new Date(), sec = Math.floor((Date.now() - presStart) / 1000);
    clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()); elapsedEl.textContent = pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
  }, 1000);
  var tx = null, ty = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && !isReader()) { if (dx < 0) go(cur + 1); else go(cur - 1); } tx = ty = null;
  }, { passive: true });
  document.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('button') : null; if (b) b.blur(); });
  var m = location.hash.match(/^#s(\d+)$/); scale(); syncToggles(); go(m ? parseInt(m[1], 10) : 0);
})();
