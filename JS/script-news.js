/* script-news.js
   Dynamische News-Seite: lädt JSON/NEWS, rendert Cards, Filter & Suche.
   Erwarteter JSON-Pfad: JSON/news.json
*/

const newsContainer = document.getElementById('newsContainer');
const newsSearch = document.getElementById('newsSearch');
const clearSearch = document.getElementById('clearSearch');
const tagFiltersEl = document.getElementById('tagFilters');
const newsEmpty = document.getElementById('newsEmpty');
const latestBadge = document.getElementById('latestBadge');
const yearEl = document.getElementById('year');

if (yearEl) yearEl.textContent = new Date().getFullYear();

let NEWS = [];
let activeTag = 'all';
let filterQuery = '';

/* helper: format date -> "25. Okt 2025" (de) */
function formatDate(dStr){
  try {
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch(e) { return dStr; }
}

/* load JSON and init */
async function loadNews(){
  try {
    const res = await fetch('JSON-Datastores/news.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('netzwerk');
    const j = await res.json();
    NEWS = (j.updates || []).slice();
    // sort newest first (by date string YYYY-MM-DD)
    NEWS.sort((a,b)=> b.date.localeCompare(a.date));
    buildTagFilters();
    renderNews();
    setHeroMeta();
  } catch(err){
    console.error('Fehler beim Laden der News:', err);
    newsContainer.innerHTML = '<p class="muted">Fehler beim Laden der News.</p>';
  }
}

/* derive tag list from NEWS */
function buildTagFilters(){
  const set = new Set();
  NEWS.forEach(n => {
    (n.tags || []).forEach(t => set.add(t));
    if (n.type) set.add(n.type);
  });
  const tags = Array.from(set).sort((a,b)=> a.localeCompare(b, 'de'));
  // always add "all" first
  tagFiltersEl.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'tag-filter active';
  allBtn.textContent = 'Alle';
  allBtn.dataset.tag = 'all';
  tagFiltersEl.appendChild(allBtn);

  allBtn.addEventListener('click', ()=> { setActiveTag('all'); });

  tags.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tag-filter';
    b.textContent = t;
    b.dataset.tag = t;
    b.addEventListener('click', ()=> setActiveTag(t));
    tagFiltersEl.appendChild(b);
  });
}

function setActiveTag(tag){
  activeTag = tag;
  // update UI classes
  tagFiltersEl.querySelectorAll('.tag-filter').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tag === tag);
  });
  renderNews();
}

/* render filtered news */
function renderNews(){
  newsContainer.innerHTML = '';
  const q = (filterQuery || '').toLowerCase();

  const filtered = NEWS.filter(n => {
    // tag filter
    if (activeTag !== 'all') {
      const matchesTag = (n.tags || []).includes(activeTag) || (n.type === activeTag);
      if (!matchesTag) return false;
    }
    // search filter: title, summary, content, tags
    if (q) {
      const hay = (n.title + ' ' + (n.summary || '') + ' ' + (n.content || []).join(' ') + ' ' + (n.tags||[]).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    newsEmpty.classList.remove('hidden');
  } else {
    newsEmpty.classList.add('hidden');
  }

  filtered.forEach((n, idx) => {
    const card = document.createElement('article');
    card.className = `news-card ${n.type || ''}`;
    card.style.animationDelay = `${idx * 45}ms`;

    // choose an icon/abbrev for type
    const typeLabel = (n.type || 'news').slice(0,3).toUpperCase();

    const tagsHtml = (n.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join(' ');

    card.innerHTML = `
      <div class="news-header">
        <div class="news-left">
          <div class="news-type" title="${n.type || 'news'}">${typeLabel}</div>
          <div>
            <div class="news-date">${formatDate(n.date)}</div>
            <div class="news-title">${n.title}</div>
          </div>
        </div>
        <div class="news-meta">
          <div>${tagsHtml}</div>
          <div>
            <button class="btn btn-details" data-id="${n.id}" aria-expanded="false">Details</button>
          </div>
        </div>
      </div>

      <div class="news-summary">${n.summary || ''}</div>

      <div class="news-details" id="details-${n.id}">
        ${Array.isArray(n.content) ? '<ul>' + n.content.map(line => `<li>${line}</li>`).join('') + '</ul>' : `<p>${n.content || ''}</p>`}
      </div>
    `;

    // delegate details button
    const detailsBtn = card.querySelector('.btn-details');
    const detailsEl = card.querySelector('.news-details');
    detailsBtn.addEventListener('click', () => {
      const expanded = detailsEl.classList.toggle('expanded');
      detailsBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      // toggle max-height by setting class (CSS handles max-height)
      if (expanded) {
        // try to set a suitable max-height based on scrollHeight for smoother open
        detailsEl.style.maxHeight = detailsEl.scrollHeight + 16 + 'px';
      } else {
        detailsEl.style.maxHeight = null;
      }
    });

    newsContainer.appendChild(card);
  });
}

/* search handlers */
newsSearch.addEventListener('input', (e)=>{
  filterQuery = e.target.value;
  renderNews();
});
clearSearch.addEventListener('click', ()=>{
  newsSearch.value = '';
  filterQuery = '';
  renderNews();
});

/* small hero meta (latest update date) */
function setHeroMeta(){
  if (!NEWS || NEWS.length === 0) return;
  const latest = NEWS[0];
  if (latestBadge) {
    latestBadge.textContent = `Neueste Aktualisierung: ${formatDate(latest.date)} — ${latest.title}`;
  }
}

/* keyboard: Enter on search triggers nothing special (live search) */

/* init */
loadNews();