// Templates page: sidebar scroll-spy, stepped progress, read time and the mobile contents toggle.
(function () {
  var nav = document.querySelector('.guide-nav');
  if (!nav) return;

  var main = document.querySelector('.guide-main');
  var links = Array.prototype.slice.call(nav.querySelectorAll('.guide-list a'));
  var sections = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var toggle = nav.querySelector('.guide-toggle');
  var current = nav.querySelector('.guide-current');
  // Progress: one segment per section, filled up to the active one.
  var bar = nav.querySelector('.guide-progress');
  var segs = links.map(function () { return bar.appendChild(document.createElement('i')); });

  // Read time, from the words on the page (about 220 words a minute).
  var words = main.textContent.trim().split(/\s+/).length;
  var rt = document.getElementById('read-time');
  if (rt) rt.textContent = Math.max(1, Math.round(words / 220)) + ' min read';

  var active = -1;
  function update() {
    // Active section: the last one whose top has passed a line a third of the way down the window.
    var line = window.innerHeight * 0.33;
    var idx = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].getBoundingClientRect().top <= line) idx = i;
    }
    // At the very bottom, the last section is the active one even if it is short.
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY >= max - 2) idx = sections.length - 1;

    if (idx !== active) {
      if (active >= 0) links[active].removeAttribute('aria-current');
      links[idx].setAttribute('aria-current', 'true');
      current.textContent = links[idx].textContent.replace(/^\d+/, '').trim();
      active = idx;
      segs.forEach(function (seg, i) { seg.classList.toggle('on', i <= idx); });
    }
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // Mobile: the sidebar collapses into a bar at the top with a toggle.
  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  links.forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
})();
