/* script-news.js
   Lädt news.json, rendert Cards, Filter, Suche, Sortierung.
   Ready-to-use mit JSON-Datastores/news.json (oder JSON-Datastores/news.json)
*/

(function(){
  // safe DOM refs (optional elements tolerated)
  const container = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');
  const tagFiltersEl = document.getElementById('tagFilters');
  const searchInput = document.getElementById('newsSearch');
  const sortSelect = document.getElementById('sortSelect');

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

    const tagsHtml = (n.tags || []).map(t => {
      // sanitize class name: replace spaces/slashes
      const safeClass = 'tag-' + t.replace(/[^\w\-]/g,'');
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
        <button class="btn-more show-more">Mehr</button>
      </div>

      <div class="news-details" aria-hidden="true">
        ${(n.content || []).map(line => `<div>${escapeHtml(line)}</div>`).join('')}
      </div>
    `;

    // enable clicking tag pills inside card to filter
    art.querySelectorAll('.tag-pill').forEach(p => {
      p.addEventListener('click', (e) => {
        const tagText = p.textContent;
        // set activeTag and update filter buttons UI
        setActiveTag(tagText);
        // reflect in filter bar (if exists)
        highlightFilterButton(tagText);
        render();
        e.stopPropagation();
      });
    });

    const btn = art.querySelector('.show-more');
    const details = art.querySelector('.news-details');
    btn.addEventListener('click', (e) => {
      const open = details.classList.toggle('open');
      details.setAttribute('aria-hidden', !open);
      btn.textContent = open ? 'Weniger' : 'Mehr';
      // ensure smooth open by setting maxHeight (CSS transition)
      if(open) details.style.maxHeight = details.scrollHeight + 'px';
      else details.style.maxHeight = '0px';
      e.stopPropagation();
    });

    return art;
  }

  // render list
  function render(){
    container.innerHTML = '';
    if(!Array.isArray(allNews) || allNews.length === 0){
      emptyEl.style.display = '';
      emptyEl.textContent = 'Keine News vorhanden.';
      return;
    }

    searchTerm = (searchInput?.value || '').trim();

    const sorted = sortNews(allNews, sortSelect?.value || 'date-desc');
    const filtered = sorted.filter(matchesFilter);

    if(filtered.length === 0){
      emptyEl.style.display = '';
      emptyEl.textContent = 'Keine News gefunden.';
      return;
    } else {
      emptyEl.style.display = 'none';
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