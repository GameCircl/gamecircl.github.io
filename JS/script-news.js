/* script-news.js
   Lädt news.json, rendert Cards, Filter, Suche, Sortierung.
   Updated v2: collapsed cards, reset-button, no clickable tag-pills inside cards.
*/

(function(){
  // safe DOM refs (optional elements tolerated)
  const container = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');
  const tagFiltersEl = document.getElementById('tagFilters');
  const searchInput = document.getElementById('newsSearch');
  const sortSelect = document.getElementById('sortSelect');
  const resetBtn = document.getElementById('resetFilters');

  if(!container) {
    console.warn('newsList container nicht gefunden – Abbruch script-news.js');
    return;
  }

  const newsUrl = 'JSON-Datastores/news.json'; // deine Struktur
  let allNews = [];
  let activeTag = null;
  let searchTerm = '';

  // helpers
  const escapeHtml = s => (s||'').toString()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const fmtDate = dStr => {
    try {
      const dt = new Date(dStr + 'T00:00:00');
      return dt.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' });
    } catch(e){ return dStr; }
  };

  const collectTags = list => {
    const s = new Set();
    (list || []).forEach(n => (n.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort((a,b) => a.localeCompare(b,'de'));
  };

  // sort: pinned always on top, then by date (default newest first)
  function sortNews(list, mode = 'date-desc'){
    const copy = [...list];
    const byDateDesc = (a,b) => new Date(b.date) - new Date(a.date);
    const byDateAsc  = (a,b) => new Date(a.date) - new Date(b.date);

    // pinned always before non-pinned; then date order according to mode
    if(mode === 'date-asc'){
      copy.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || byDateAsc(a,b));
    } else if(mode === 'pinned-first') {
      copy.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || byDateDesc(a,b));
    } else {
      // default date-desc (but keep pinned on top)
      copy.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || byDateDesc(a,b));
    }
    return copy;
  }

  function matchesFilter(n){
    if(activeTag && !(n.tags || []).includes(activeTag)) return false;
    if(searchTerm){
      const hay = (n.title + ' ' + (n.summary||'') + ' ' + (n.content||[]).join(' ')).toLowerCase();
      if(!hay.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }

  // create a card DOM node
  function createCard(n){
    const art = document.createElement('article');
    art.className = 'news-card' + (n.pinned ? ' pinned' : '');
    art.classList.add('collapsed'); // start collapsed so all cards have equal height

    const tagsHtml = (n.tags || []).map(t => {
      // sanitize class name: replace spaces/slashes
      const safeClass = 'tag-' + t.replace(/[^\w\-]/g,'');
      // tag-pill is decorative now (pointer-events:none in CSS)
      return `<span class="tag-pill ${safeClass}">${escapeHtml(t)}</span>`;
    }).join(' ');

    art.innerHTML = `
      ${n.pinned ? '<div class="pinned-badge">📌 Angeheftet</div>' : ''}
      <div class="news-header">
        <div style="min-width:0;flex:1;">
          <h3 class="news-title">${escapeHtml(n.title)}</h3>
        </div>
        <div class="news-date">${fmtDate(n.date)}</div>
      </div>

      <div class="news-summary">${escapeHtml(n.summary || '')}</div>

      <div class="news-tags">
        ${tagsHtml}
      </div>

      <div class="news-controls-row">
        <button class="toggle-btn" aria-expanded="false">Mehr</button>
      </div>

      <div class="news-details" aria-hidden="true">
        ${(n.content || []).map(line => `<div>${escapeHtml(line)}</div>`).join('')}
      </div>
    `;

    // NOTE: tag-pill elements are decorative only (no click listeners)

    const btn = art.querySelector('.toggle-btn');
    const details = art.querySelector('.news-details');

btn.addEventListener('click', (e) => {
  const open = details.classList.toggle('open');
  details.setAttribute('aria-hidden', !open);
  btn.textContent = open ? 'Weniger' : 'Mehr';
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');

  // sanfte Animation
  if(open){
    art.classList.remove('collapsed');
    details.style.maxHeight = details.scrollHeight + 'px';

    // nach Transition maxHeight auf "none" setzen, damit dynamischer Inhalt nicht abgeschnitten wird
    const clearHeight = () => {
      details.style.maxHeight = 'none';
      details.removeEventListener('transitionend', clearHeight);
    };
    details.addEventListener('transitionend', clearHeight);
  } else {
    // dynamisch auf scrollHeight setzen, damit Übergang flüssig startet
    details.style.maxHeight = details.scrollHeight + 'px';

    // nächsten Frame warten, dann auf 0 setzen für smooth collapse
    requestAnimationFrame(() => {
      details.style.maxHeight = '0px';
    });

    // collapsed wieder nach Transition setzen
    const addCollapsed = () => {
      art.classList.add('collapsed');
      details.removeEventListener('transitionend', addCollapsed);
    };
    details.addEventListener('transitionend', addCollapsed);
  }
  e.stopPropagation();
});

    return art;
  }

  // render list
  function render(){
    container.innerHTML = '';
    if(!Array.isArray(allNews) || allNews.length === 0){
      if(emptyEl) {
        emptyEl.style.display = '';
        emptyEl.textContent = 'Keine News vorhanden.';
      }
      return;
    }

    searchTerm = (searchInput?.value || '').trim();

    const sorted = sortNews(allNews, sortSelect?.value || 'date-desc');
    const filtered = sorted.filter(matchesFilter);

    if(filtered.length === 0){
      if(emptyEl) {
        emptyEl.style.display = '';
        emptyEl.textContent = 'Keine News gefunden.';
      }
      return;
    } else {
      if(emptyEl) emptyEl.style.display = 'none';
    }

    filtered.forEach(n => container.appendChild(createCard(n)));
  }

  // filter bar rendering (top)
  function renderFilters(tags){
    if(!tagFiltersEl) return;
    tagFiltersEl.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Alle';
    allBtn.dataset.tag = '';
    allBtn.addEventListener('click', () => {
      setActiveTag(null);
      setActiveFilterBtn();
      render();
    });
    tagFiltersEl.appendChild(allBtn);

    tags.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = t;
      btn.dataset.tag = t;
      btn.addEventListener('click', () => {
        activeTag = activeTag === t ? null : t;
        setActiveFilterBtn();
        render();
      });
      tagFiltersEl.appendChild(btn);
    });

    setActiveFilterBtn();
  }

  function setActiveFilterBtn(){
    if(!tagFiltersEl) return;
    tagFiltersEl.querySelectorAll('.filter-btn').forEach(b => {
      const t = b.dataset.tag;
      if((!t && !activeTag) || (t && activeTag === t)) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function setActiveTag(tag){
    activeTag = tag || null;
  }

  function highlightFilterButton(tag){
    if(!tagFiltersEl) return;
    tagFiltersEl.querySelectorAll('.filter-btn').forEach(b => {
      if(b.dataset.tag === tag) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  // events
  searchInput?.addEventListener('input', () => {
    render();
  });

  sortSelect?.addEventListener('change', () => {
    render();
  });

  // reset button functionality
  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      if(searchInput) searchInput.value = '';
      if(sortSelect) sortSelect.value = 'date-desc';
      setActiveTag(null);
      setActiveFilterBtn();
      render();
      // optional: put focus back to search
      if(searchInput) searchInput.focus();
    });
  }

  // initial load
  (async function load(){
    try {
      const res = await fetch(newsUrl, { cache: 'no-store' });
      if(!res.ok) throw new Error('Netzwerk-Fehler beim Laden der News');
      const json = await res.json();
      allNews = json.updates || json.news || json || [];

      // ensure dates exist for sorting
      allNews.forEach(n => { if(!n.date) n.date = '1970-01-01'; });

      // collect tags, render filter UI
      const tags = collectTags(allNews);
      renderFilters(tags);

      // initial render
      render();
    } catch(err){
      console.error('Fehler beim Laden der News:', err);
      if(emptyEl) {
        emptyEl.style.display = '';
        emptyEl.textContent = 'Fehler beim Laden der News.';
      }
    }
  })();

})();