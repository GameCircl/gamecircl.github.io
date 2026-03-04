/* script-news.js
   Lädt news.json, rendert schöne Cards mit Animationen, Filter, Suche, Sortierung.
*/

(function(){
  const container = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');
  const tagFiltersEl = document.getElementById('tagFilters');
  const searchInput = document.getElementById('newsSearch');
  const sortSelect = document.getElementById('sortSelect');
  const resetBtn = document.getElementById('resetFilters');

  if(!container) {
    console.warn('newsList container nicht gefunden');
    return;
  }

  const newsUrl = 'JSON-Datastores/news.json';
  let allNews = [];
  let activeTag = null;
  let searchTerm = '';

  // HTML Escaping
  const escapeHtml = s => (s||'').toString()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // Date Formatting
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
        return `${from.toLocaleDateString('de-DE', { day:'2-digit', month:'short' })} – ${to.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' })}`;
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

  // Collect all tags
  const collectTags = list => {
    const s = new Set();
    (list || []).forEach(n => (n.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort((a,b) => a.localeCompare(b,'de'));
  };

  // Sort news
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
    } else if(mode === 'pinned-first'){
      copy.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || byDateDesc(a,b));
    } else {
      copy.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || byDateDesc(a,b));
    }
    return copy;
  }

  // Filter matching
  function matchesFilter(n){
    if(activeTag && !(n.tags || []).includes(activeTag)) return false;
    if(searchTerm){
      const hay = (n.title + ' ' + (n.summary||'') + ' ' + (n.content||[]).join(' ')).toLowerCase();
      if(!hay.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }

  // Create card DOM
  function createCard(n){
    const art = document.createElement('article');
    art.className = 'news-card' + (n.pinned ? ' pinned' : '');
    art.setAttribute('data-id', n.id || '');

    const tagsHtml = (n.tags || []).map(t => {
      const safeClass = 'tag-' + t.replace(/[^\w\-]/g,'');
      return `<span class="tag-pill ${safeClass}" title="Nach '${escapeHtml(t)}' filtern">${escapeHtml(t)}</span>`;
    }).join('');

    const contentHtml = (n.content || []).map((line, idx) => {
      return `<div style="animation-delay: ${idx * 0.05}s;">${escapeHtml(line)}</div>`;
    }).join('');

    art.innerHTML = `
      ${n.pinned ? '<div class="pinned-badge">📌 NEU</div>' : ''}

      <div class="news-header">
        <div style="min-width: 0; flex: 1;">
          <h3 class="news-title">${escapeHtml(n.title)}</h3>
        </div>
        <div class="news-date">${fmtDate(n.date)}</div>
      </div>

      <div class="news-summary">${escapeHtml(n.summary || '')}</div>

      ${tagsHtml ? `<div class="news-tags">${tagsHtml}</div>` : ''}

      <div class="news-details" aria-hidden="true">
        ${contentHtml}
      </div>

      <div class="news-controls-row">
        <button class="btn-more show-more" aria-expanded="false">
          <span class="btn-text">Mehr zeigen</span>
          <span class="btn-icon">↓</span>
        </button>
      </div>
    `;

    // Setup expand/collapse
    const btn = art.querySelector('.show-more');
    const details = art.querySelector('.news-details');
    const btnText = art.querySelector('.btn-text');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = details.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      btnText.textContent = isOpen ? 'Weniger zeigen' : 'Mehr zeigen';
      details.setAttribute('aria-hidden', !isOpen);

      if(isOpen) {
        details.style.maxHeight = (details.scrollHeight + 20) + 'px';
        btn.style.transform = 'none';

        // Auto-scroll zur Karte wenn aufgeklappt
        setTimeout(() => {
          art.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 150);
      } else {
        details.style.maxHeight = '0px';
      }
    });

    // Make tags clickable for filtering
    art.querySelectorAll('.tag-pill').forEach(tag => {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagName = tag.textContent;
        activeTag = activeTag === tagName ? null : tagName;
        setActiveFilterBtn();
        render();
        // Scroll to top of list for UX
        document.querySelector('.news-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    return art;
  }

  // Render all cards
  function render(){
    container.innerHTML = '';
    if(!Array.isArray(allNews) || allNews.length === 0){
      emptyEl.style.display = 'block';
      emptyEl.textContent = 'Keine News vorhanden.';
      return;
    }

    searchTerm = (searchInput?.value || '').trim();

    const sorted = sortNews(allNews, sortSelect?.value || 'date-desc');
    const filtered = sorted.filter(matchesFilter);

    if(filtered.length === 0){
      emptyEl.style.display = 'block';
      emptyEl.textContent = searchTerm ? 'Keine News für diese Suche gefunden.' : 'Keine News für diesen Filter gefunden.';
      return;
    } else {
      emptyEl.style.display = 'none';
    }

    filtered.forEach(n => {
      const card = createCard(n);
      container.appendChild(card);
    });
  }

  // Render filter buttons
  function renderFilters(tags){
    if(!tagFiltersEl) return;
    tagFiltersEl.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Alle';
    allBtn.dataset.tag = '';
    allBtn.addEventListener('click', () => {
      activeTag = null;
      setActiveFilterBtn();
      render();
    });
    tagFiltersEl.appendChild(allBtn);

    tags.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
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

  // Update active filter button styling
  function setActiveFilterBtn(){
    if(!tagFiltersEl) return;
    tagFiltersEl.querySelectorAll('.filter-btn').forEach(b => {
      const t = b.dataset.tag;
      if((!t && !activeTag) || (t && activeTag === t)) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // Event listeners
  searchInput?.addEventListener('input', () => render());
  sortSelect?.addEventListener('change', () => render());
  resetBtn?.addEventListener('click', () => {
    activeTag = null;
    if(searchInput) searchInput.value = '';
    if(sortSelect) sortSelect.value = 'date-desc';
    setActiveFilterBtn();
    render();
  });

  // Load news
  (async function load(){
    try {
      const res = await fetch(newsUrl, { cache: 'no-store' });
      if(!res.ok) throw new Error('Netzwerk-Fehler beim Laden der News');
      const json = await res.json();
      allNews = json.updates || json.news || json || [];

      // Ensure all news have dates
      allNews.forEach(n => { if(!n.date) n.date = '1970-01-01'; });

      const tags = collectTags(allNews);
      renderFilters(tags);
      render();
    } catch(err){
      console.error('Fehler beim Laden der News:', err);
      if(emptyEl) {
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = '⚠️ Fehler beim Laden der News. Bitte versuche es später noch mal.';
      }
    }
  })();

})();
