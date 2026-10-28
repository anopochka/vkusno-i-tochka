/* Подсветка касаний для записи экрана на юзабилити-тестах.
   Показывает: тапы/клики (кружок), свайпы и перетаскивания (след), прокрутку колесом/тачпадом (стрелка).
   Отключить: добавить к ссылке ?taps=0 */
(function () {
  if (/[?&]taps=0\b/.test(location.search)) return;

  function init() {
    var css = document.createElement('style');
    css.textContent =
      '.tv-dot{position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;' +
      'background:rgba(255,0,90,.28);border:3px solid rgba(255,0,90,.9);box-shadow:0 0 0 2px rgba(255,255,255,.7);' +
      'pointer-events:none;z-index:2147483647;transition:opacity .45s, transform .45s;}' +
      '.tv-dot.up{opacity:0;transform:scale(1.6);}' +
      '.tv-trail{position:fixed;left:0;top:0;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;' +
      'background:rgba(255,0,90,.55);pointer-events:none;z-index:2147483646;transition:opacity .6s;}' +
      '.tv-wheel{position:fixed;left:0;top:0;margin:-20px 0 0 -20px;width:40px;height:40px;border-radius:50%;' +
      'background:rgba(0,0,0,.6);color:#fff;font:bold 22px/40px sans-serif;text-align:center;' +
      'pointer-events:none;z-index:2147483647;transition:opacity .3s;}';
    document.head.appendChild(css);

    var active = {}; // pointerId -> dot element
    var lastTrail = {};

    function place(el, x, y) { el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }
    function kill(el, delay) { setTimeout(function () { el.remove(); }, delay); }

    window.addEventListener('pointerdown', function (e) {
      var d = document.createElement('div');
      d.className = 'tv-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      active[e.pointerId] = d;
      lastTrail[e.pointerId] = { x: e.clientX, y: e.clientY };
    }, true);

    window.addEventListener('pointermove', function (e) {
      var d = active[e.pointerId];
      if (!d) return;
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      var p = lastTrail[e.pointerId];
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) return;
      lastTrail[e.pointerId] = { x: e.clientX, y: e.clientY };
      var t = document.createElement('div');
      t.className = 'tv-trail';
      t.style.left = e.clientX + 'px';
      t.style.top = e.clientY + 'px';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.style.opacity = '0'; });
      kill(t, 700);
    }, true);

    function release(e) {
      var d = active[e.pointerId];
      if (!d) return;
      delete active[e.pointerId];
      d.classList.add('up');
      kill(d, 500);
    }
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', function (e) {
      // на телефоне браузер «забирает» касание, когда начинается прокрутка — ведём след через touch
      var d = active[e.pointerId];
      if (d) d.dataset.touch = '1';
    }, true);

    // Прокрутка пальцем: после pointercancel продолжаем рисовать по touchmove
    window.addEventListener('touchmove', function (e) {
      var t0 = e.touches[0];
      if (!t0) return;
      for (var id in active) {
        var d = active[id];
        if (d.dataset.touch) {
          d.style.left = t0.clientX + 'px';
          d.style.top = t0.clientY + 'px';
          var p = lastTrail[id];
          if (Math.hypot(t0.clientX - p.x, t0.clientY - p.y) >= 8) {
            lastTrail[id] = { x: t0.clientX, y: t0.clientY };
            var t = document.createElement('div');
            t.className = 'tv-trail';
            t.style.left = t0.clientX + 'px';
            t.style.top = t0.clientY + 'px';
            document.body.appendChild(t);
            requestAnimationFrame(function () { t.style.opacity = '0'; });
            kill(t, 700);
          }
        }
      }
    }, { capture: true, passive: true });
    window.addEventListener('touchend', function () {
      for (var id in active) {
        if (active[id].dataset.touch) { active[id].classList.add('up'); kill(active[id], 500); delete active[id]; }
      }
    }, { capture: true, passive: true });

    // Прокрутка колесом мыши / тачпадом
    var wheelEl = null, wheelTimer = null, mx = innerWidth / 2, my = innerHeight / 2;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, true);
    window.addEventListener('wheel', function (e) {
      if (!wheelEl) {
        wheelEl = document.createElement('div');
        wheelEl.className = 'tv-wheel';
        document.body.appendChild(wheelEl);
      }
      wheelEl.textContent = e.deltaY > 0 ? '↓' : '↑';
      wheelEl.style.left = mx + 'px';
      wheelEl.style.top = (my + 34) + 'px';
      wheelEl.style.opacity = '1';
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { if (wheelEl) wheelEl.style.opacity = '0'; }, 400);
    }, { capture: true, passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
