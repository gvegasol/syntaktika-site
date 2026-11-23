// Renders the component reference from data/components.js (window.SYNTAKTIKA),
// plus the sidebar menu: one drop-down per category, listing its components.
(function () {
  const data = window.SYNTAKTIKA || { components: [] };
  const list = document.getElementById('list');
  const side = document.getElementById('side');
  const nav = document.querySelector('.guide-nav');
  const toggle = nav.querySelector('.guide-toggle');
  const current = nav.querySelector('.guide-current');
  const q = document.getElementById('q');
  const count = document.getElementById('count');

  // Toolbar order of the Syntaktika tab (the number prefix sets the order in Grasshopper).
  const ORDER = ['1_General', '2_Isovist', '3_MedialAxis'];
  const LABEL = { '1_General': 'General', '2_Isovist': 'Isovist', '3_MedialAxis': 'Medial Axis' };
  const BLURB = {
    '1_General': 'Environment, grids, colouring and utilities shared by every analysis.',
    '2_Isovist': 'Visibility polygons, their measures, thresholds and diameters.',
    '3_MedialAxis': 'The skeleton of free space: parts, points, circles and export.',
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (data.version) document.getElementById('version').textContent = ` (version ${data.version.replace(/\.0$/, '')})`;

  const components = data.components.filter(c => ORDER.includes(c.subcategory)).sort((a, b) =>
    (ORDER.indexOf(a.subcategory) - ORDER.indexOf(b.subcategory)) ||
    (a.exposure - b.exposure) || a.name.localeCompare(b.name));

  function paramRows(params) {
    if (!params.length) return '<p class="count">None</p>';
    return '<table class="ptable">' + params.map(p =>
      `<tr><td>${esc(p.name)}${p.optional ? ' <span class="count">(optional)</span>' : ''}</td>` +
      `<td>${esc(p.type)}${p.access !== 'item' ? ' · ' + esc(p.access) : ''}</td>` +
      `<td>${esc(p.description)}</td></tr>`).join('') + '</table>';
  }

  function card(c) {
    return `<details class="comp" id="${esc(c.id)}">
      <summary>
        <img src="${esc(c.icon)}" alt="" loading="lazy" width="22" height="22">
        <div>
          <div><span class="comp-title">${esc(c.name)}</span><span class="comp-nick">${esc(c.nickname)}</span></div>
          <div class="comp-desc">${esc(c.description)}</div>
        </div>
      </summary>
      <div class="comp-body">
        <div><h4>Inputs</h4>${paramRows(c.inputs)}</div>
        <div><h4>Outputs</h4>${paramRows(c.outputs)}</div>
      </div>
    </details>`;
  }

  function matches(c, term) {
    if (!term) return true;
    const hay = [c.name, c.nickname, c.description, c.subcategory,
      ...c.inputs.map(p => p.name + ' ' + p.description), ...c.outputs.map(p => p.name + ' ' + p.description)]
      .join(' ').toLowerCase();
    return term.split(/\s+/).every(t => hay.includes(t));
  }

  // Sidebar drop-downs keep their open/closed state across searches.
  const openCats = new Set();

  function sideMenu(groups, term) {
    side.innerHTML = groups.map(([s, g]) => `<details class="side-cat" data-cat="${s}"${term || openCats.has(s) ? ' open' : ''}>
        <summary><span class="side-name">${esc(LABEL[s] || s)}</span><span class="side-count">${g.length}</span></summary>
        <ul class="side-list">${g.map(c => `<li><a href="#${esc(c.id)}"><img src="${esc(c.icon)}" alt="" width="16" height="16">${esc(c.name)}</a></li>`).join('')}</ul>
      </details>`).join('') || '<p class="side-empty">No matches</p>';
    side.querySelectorAll('details.side-cat').forEach(d => d.addEventListener('toggle', () => {
      if (d.open) openCats.add(d.dataset.cat); else openCats.delete(d.dataset.cat);
    }));
  }

  let cards = [], sideLinks = {}, activeId = null;

  function render() {
    const term = q.value.trim().toLowerCase();
    const shown = components.filter(c => matches(c, term));
    const groups = ORDER.map(s => [s, shown.filter(c => c.subcategory === s)]).filter(([, g]) => g.length);

    list.innerHTML = groups.length
      ? groups.map(([s, g]) => `<div class="subcat" id="cat-${s}"><h2>${esc(LABEL[s] || s)} <span>${g.length}</span></h2>
          <p>${esc(BLURB[s] || '')}</p></div>${g.map(card).join('')}`).join('')
      : '<p class="empty">No components match your search.</p>';
    sideMenu(groups, term);
    count.textContent = term ? `${shown.length} of ${components.length}` : `${components.length} components`;
    if (term) list.querySelectorAll('details.comp').forEach(d => d.open = shown.length <= 6);

    cards = Array.from(list.querySelectorAll('details.comp'));
    sideLinks = {};
    side.querySelectorAll('.side-list a').forEach(a => { sideLinks[a.hash.slice(1)] = a; });
    activeId = null;
    spy();
  }

  // Scroll-spy: highlight the component in view and open its category's drop-down.
  function spy() {
    const line = window.innerHeight * 0.33;
    let id = null;
    for (const el of cards) { if (el.getBoundingClientRect().top <= line) id = el.id; else break; }
    if (!id && cards.length) id = cards[0].id;
    if (id === activeId) return;
    if (activeId && sideLinks[activeId]) sideLinks[activeId].removeAttribute('aria-current');
    activeId = id;
    const a = id && sideLinks[id];
    if (!a) { current.textContent = ''; return; }
    a.setAttribute('aria-current', 'true');
    const cat = a.closest('details.side-cat');
    if (!cat.open) cat.open = true;
    current.textContent = a.textContent.trim();
    // Keep the active link visible inside the sidebar when it scrolls on its own.
    const panel = nav.scrollHeight > nav.clientHeight ? nav : null;
    if (panel) {
      const r = a.getBoundingClientRect(), p = panel.getBoundingClientRect();
      if (r.top < p.top || r.bottom > p.bottom) a.scrollIntoView({ block: 'nearest' });
    }
  }

  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; spy(); });
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || id.startsWith('cat-')) return;
    const el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'start' }); }
  }

  // Mobile: the sidebar collapses into a bar at the top with a toggle.
  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  // Clicking a component in the sidebar opens its card (also when the hash is already set).
  side.addEventListener('click', e => {
    const a = e.target.closest('.side-list a');
    if (!a) return;
    const el = document.getElementById(a.hash.slice(1));
    if (el) el.open = true;
    setOpen(false);
  });

  q.addEventListener('input', render);
  window.addEventListener('hashchange', openFromHash);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  render();
  openFromHash();
})();
