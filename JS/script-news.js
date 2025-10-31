/* script-news.js
   Lädt news.json, rendert Cards, Filter & Suche.
*/

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const miniName = document.getElementById('miniName');
const openLogin = document.getElementById('openLogin');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const saveUser = document.getElementById('saveUser');
const usernameInput = document.getElementById('username');
const sidebarOverlayEl = document.getElementById('sidebarOverlay');


(async function(){
  const newsUrl = 'JSON-Datastores/news.json'; // <-- passe ggf. an: 'news.json' oder 'data/news.json'
  const container = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');
  const tagFiltersEl = document.getElementById('tagFilters');
  const searchInput = document.getElementById('newsSearch');
  const sortSelect = document.getElementById('sortSelect');

  let allNews = [];
  let activeTag = null;
  let searchTerm = '';
  let sortMode = 'date-desc';

  function formatDate(d){
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' });
  }

  function collectTags(list){
    const s = new Set();
    list.forEach(n => (n.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }

  function renderFilters(tags){
    tagFiltersEl.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Alle';
    allBtn.addEventListener('click', ()=> { activeTag = null; render(); setActiveFilterBtn(); });
    tagFiltersEl.appendChild(allBtn);

    tags.forEach(t => {
      const b = document.createElement('button');
      b.className = 'filter-btn';
      b.textContent = t;
      b.dataset.tag = t;
      b.addEventListener('click', () => {
        activeTag = activeTag === t ? null : t;
        render();
        setActiveFilterBtn();
      });
      tagFiltersEl.appendChild(b);
    });
    setActiveFilterBtn();
  }
  function setActiveFilterBtn(){
    tagFiltersEl.querySelectorAll('.filter-btn').forEach(b=>{
      const t = b.dataset.tag;
      if(!t && !activeTag){
        b.classList.add('active');
      } else if (t && activeTag === t){
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function sortNews(list){
    const copy = [...list];
    if(sortMode === 'date-desc') copy.sort((a,b)=> new Date(b.date) - new Date(a.date));
    else if(sortMode === 'date-asc') copy.sort((a,b)=> new Date(a.date) - new Date(b.date));
    else if(sortMode === 'pinned-first') copy.sort((a,b)=> (b.pinned ? 1:0) - (a.pinned ? 1:0) || (new Date(b.date)-new Date(a.date)));
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

  function createCard(n){
    const art = document.createElement('article');
    art.className = 'news-card' + (n.pinned ? ' pinned' : '');
    art.innerHTML = `
      <div class="news-header">
        <div class="meta-left">
          <strong class="news-title">${escapeHtml(n.title)}</strong>
        </div>
        <div class="meta-right">
          <span class="news-date">${formatDate(n.date)}</span>
        </div>
      </div>
      <div class="news-summary">${escapeHtml(n.summary || '')}</div>
      <div class="news-details" aria-hidden="true">
        ${((n.content || []).map(item=>`<div>• ${escapeHtml(item)}</div>`)).join('')}
      </div>
      <div class="news-tags">
        ${(n.tags || []).map(t=>`<span class="tag-pill tag-${escapeHtml(t)}">${escapeHtml(t)}</span>`).join(' ')}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn show-more">Mehr</button>
        ${n.pinned ? '<span class="tag-pill" style="background:linear-gradient(90deg,#4a6cf7,#6b8cff);color:#fff;border:0">Pinned</span>' : ''}
      </div>
    `;
    const btn = art.querySelector('.show-more');
    const details = art.querySelector('.news-details');
    btn.addEventListener('click', ()=>{
      const open = details.classList.toggle('open');
      details.setAttribute('aria-hidden', !open);
      btn.textContent = open ? 'Weniger' : 'Mehr';
    });
    return art;
  }

  function render(){
    container.innerHTML = '';
    const filtered = sortNews(allNews).filter(matchesFilter);
    if(!filtered.length){
      emptyEl.style.display = '';
      return;
    } else emptyEl.style.display = 'none';

    filtered.forEach(n => container.appendChild(createCard(n)));
  }

  function escapeHtml(s){
    return (s||'').toString()
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // events
  searchInput?.addEventListener('input', e=>{
    searchTerm = e.target.value.trim();
    render();
  });
  sortSelect?.addEventListener('change', e=>{
    sortMode = e.target.value;
    render();
  });

  // load json
  try {
    const res = await fetch(newsUrl, {cache:'no-store'});
    if(!res.ok) throw new Error('netzwerk');
    const json = await res.json();
    allNews = json.news || json;
    // ensure date converted
    allNews.forEach(n=>{
      if(!n.date) n.date = '1970-01-01';
    });

    // collect & render filters
    const tags = collectTags(allNews);
    renderFilters(tags);

    // initial render
    render();
  } catch(err){
    console.error('Fehler beim Laden der News', err);
    container.innerHTML = '<p class="muted">Fehler beim Laden der News.</p>';
  }

})();


/* -------------------------
   SIDEBAR MOBILE TOGGLE & OVERLAY
------------------------- */

if(sidebarToggle){
  sidebarToggle.addEventListener('click', ()=>{
    sidebar.classList.add('open');
    sidebarOverlayEl.classList.remove('hidden');
    sidebarToggle.classList.add('hide'); // ← NEU
  });
  sidebarOverlayEl.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    sidebarOverlayEl.classList.add('hidden');
    sidebarToggle.classList.remove('hide'); // ← NEU
  });
}



/* -------------------------
   SIDEBAR MOBILE SWIPE (verbessert)
------------------------- */
let startX = 0;
let startY = 0;
let isSwiping = false;

document.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isSwiping = false;
});

document.addEventListener('touchmove', (e) => {
  const diffX = e.touches[0].clientX - startX;
  const diffY = e.touches[0].clientY - startY;

  // Prüfe, ob horizontaler Swipe
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
    e.preventDefault(); // verhindert Scrollen
    isSwiping = true;

    // Swipe nach rechts -> öffnen
    if (diffX > 70 && !sidebar.classList.contains('open')) {
      sidebar.classList.add('open');
      sidebarOverlayEl.classList.remove('hidden');
    }

    // Swipe nach links -> schließen
    if (diffX < -70 && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      sidebarOverlayEl.classList.add('hidden');
    }
  }
});

document.addEventListener('touchend', () => {
  isSwiping = false;
});



// ===== THEME SWITCHER =====
const themePoints = document.querySelectorAll(".theme-points span");
const themeMarker = document.getElementById("themeMarker");

// Setzt Theme und Marker
function setTheme(mode) {
  if (mode === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  localStorage.setItem("gc-theme", mode);

  const indexMap = { auto: 0, light: 1, dark: 2 };
  const index = indexMap[mode] ?? 0;
  themeMarker.style.transform = `translateX(${index * 100}%)`;
}

// Klicks auf die Theme-Buttons
themePoints.forEach(span => {
  span.addEventListener("click", () => {
    const mode = span.dataset.mode;
    setTheme(mode);
  });
});

// Lade gespeichertes Theme
let savedTheme = localStorage.getItem("gc-theme") || "auto";
setTheme(savedTheme);

// Reagiert auf System-Theme-Änderung, wenn Auto aktiv ist
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (localStorage.getItem("gc-theme") === "auto") {
    setTheme("auto");
  }
});


/* -------------------------
   LOGIN MODAL
------------------------- */
openLogin.addEventListener('click', ()=>{
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
});

modalClose.addEventListener('click', ()=>{
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 250);
  modal.setAttribute('aria-hidden','true');
});

saveUser.addEventListener('click', ()=>{
  const name = usernameInput.value.trim();
  if(!name) return alert('Bitte Name eingeben');
  localStorage.setItem('gc_user', name);
  miniName.textContent = name;
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 250);
});

logoutBtn.addEventListener('click', ()=>{
  localStorage.removeItem('gc_user');
  miniName.textContent = 'Gast';
});