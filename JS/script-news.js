/* script-news.js
   Lädt news.json, rendert Cards, Filter, Suche, Sortierung.
   Ready-to-use mit JSON-Datastores/news.json
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

  const newsUrl = 'JSON-Datastores/news.json';
  let allNews = [];
  let activeTag = null;
  let searchTerm = '';

  // helpers
  const escapeHtml = s => (s||'').toString()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // 💡 neue Datumsfunktion (unterstützt Strings und {from,to})
  const fmtDate = d => {
    if (!d) return '';
    try {
      if (typeof d === 'string') {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' });
      }
      if (typeof d === 'object' && d.from && d.to) {
        const from = new Date(d.from + 'T00:00:00');
        const to = new Date(d.to + 'T00:00:00');
        return `${from.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' })} – ${to.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' })}`;
      }
      if (typeof d === 'object' && d.from) {
        const from = new Date(d.from + 'T00:00:00');
        return from.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' });
      }
      return '';
    } catch(e){
      return (d.from || d.to || d).toString();
    }
  };

  const collectTags = list => {
    const s = new Set();
    (list || []).forEach(n => (n.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort((a,b) => a.localeCompare(b,'de'));
  };

  // sort: pinned always on top, then by date
  function sortNews(list, mode = 'date-desc'){
    const copy = [...list];
    const getDateValue = d => {
      if (typeof d === 'string') return new Date(d);
      if (typeof d === 'object' && d.to) return new Date(d.to);
      if (typeof d === 'object' && d.from) return new Date(d.from);
      return new Date('1970-01-01');
    };

    const byDateDesc = (a,b) => getDateValue(b.date) - getDateValue(a.date);
    const byDateAsc  = (a,b) => getDateValue(a.date) - getDateValue(b.date);

    if(mode === 'date-asc'){
      copy.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || byDateAsc(a,b));
    } else {
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
      const safeClass = 'tag-' + t.replace(/[^\w\-]/g,'');
      // 💡 keine Uppercase-Transformation & nicht klickbar
      return `<span class="tag-pill ${safeClass}">${escapeHtml(t)}</span>`;
    }).join(' ');

    art.innerHTML = `
      ${n.pinned ? '<div class="pinned-badge">📌 NEU</div>' : ''}
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

    // 🟢 Button-Animation (sanftes Expand/Collapse)
    const btn = art.querySelector('.show-more');
    const details = art.querySelector('.news-details');
    btn.addEventListener('click', (e) => {
      const open = details.classList.toggle('open');
      details.setAttribute('aria-hidden', !open);
      btn.textContent = open ? 'Weniger' : 'Mehr';
      details.style.maxHeight = open ? details.scrollHeight + 'px' : '0px';
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

  // filter bar rendering
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

  // events
  searchInput?.addEventListener('input', () => render());
  sortSelect?.addEventListener('change', () => render());

  // load
  (async function load(){
    try {
      const res = await fetch(newsUrl, { cache: 'no-store' });
      if(!res.ok) throw new Error('Netzwerk-Fehler beim Laden der News');
      const json = await res.json();
      allNews = json.updates || json.news || json || [];

      allNews.forEach(n => { if(!n.date) n.date = '1970-01-01'; });

      const tags = collectTags(allNews);
      renderFilters(tags);
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