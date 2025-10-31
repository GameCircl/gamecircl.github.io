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

/* -------------------------
   SIDEBAR MOBILE TOGGLE & OVERLAY
------------------------- */
if(sidebarToggle){
  sidebarToggle.addEventListener('click', ()=>{
    sidebar.classList.add('open');
    sidebarOverlayEl.classList.remove('hidden');
    sidebarToggle.classList.add('hide');
  });
  sidebarOverlayEl.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    sidebarOverlayEl.classList.add('hidden');
    sidebarToggle.classList.remove('hide');
  });
}

/* -------------------------
   SIDEBAR MOBILE SWIPE
------------------------- */
let startX = 0;
let startY = 0;
let isSwiping = false;
document.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isSwiping = false;
});
document.addEventListener('touchmove', e => {
  const diffX = e.touches[0].clientX - startX;
  const diffY = e.touches[0].clientY - startY;
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
    e.preventDefault();
    isSwiping = true;
    if (diffX > 70 && !sidebar.classList.contains('open')) {
      sidebar.classList.add('open');
      sidebarOverlayEl.classList.remove('hidden');
    }
    if (diffX < -70 && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      sidebarOverlayEl.classList.add('hidden');
    }
  }
});
document.addEventListener('touchend', () => isSwiping = false);

/* -------------------------
   THEME SWITCHER
------------------------- */
const themePoints = document.querySelectorAll(".theme-points span");
const themeMarker = document.getElementById("themeMarker");
function setTheme(mode) {
  if (mode === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  localStorage.setItem("gc-theme", mode);
  const indexMap = { auto: 0, light: 1, dark: 2 };
  themeMarker.style.transform = `translateX(${(indexMap[mode] ?? 0) * 100}%)`;
}
themePoints.forEach(span => span.addEventListener("click", () => setTheme(span.dataset.mode)));
setTheme(localStorage.getItem("gc-theme") || "auto");
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (localStorage.getItem("gc-theme") === "auto") setTheme("auto");
});

/* -------------------------
   LOGIN MODAL
------------------------- */
openLogin?.addEventListener('click', ()=>{
  modal.classList.remove('hidden');
  modal.classList.add('show');
});
modalClose?.addEventListener('click', ()=>{
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 250);
});
saveUser?.addEventListener('click', ()=>{
  const name = usernameInput.value.trim();
  if(!name) return alert('Bitte Name eingeben');
  localStorage.setItem('gc_user', name);
  miniName.textContent = name;
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 250);
});
logoutBtn?.addEventListener('click', ()=>{
  localStorage.removeItem('gc_user');
  miniName.textContent = 'Gast';
});

/* -------------------------
   NEWS SYSTEM
------------------------- */
(async function(){
  const newsUrl = 'JSON-Datastores/news.json';
  const container = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');
  const tagFiltersEl = document.getElementById('tagFilters');
  const searchInput = document.getElementById('newsSearch');
  const sortSelect = document.getElementById('sortSelect');

  let allNews = [];
  let activeTag = null;
  let searchTerm = '';
  let sortMode = 'date-desc';

  const tagPalette = ['#4a6cf7','#1bb88a','#ff7b54','#d96cff','#f2c14e','#70a1ff','#a29bfe'];

  const escapeHtml = s => (s||'').toString()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const formatDate = d => new Date(d+'T00:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'});

  const collectTags = list => [...new Set(list.flatMap(n => n.tags || []))].sort();

  function sortNews(list){
    const copy = [...list];
    if(sortMode === 'pinned-first')
      copy.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0) || new Date(b.date)-new Date(a.date));
    else if(sortMode === 'date-asc')
      copy.sort((a,b)=>new Date(a.date)-new Date(b.date));
    else
      copy.sort((a,b)=>new Date(b.date)-new Date(a.date));
    return copy;
  }

  function matchesFilter(n){
    if(activeTag && !(n.tags||[]).includes(activeTag)) return false;
    if(searchTerm){
      const hay = (n.title + ' ' + (n.summary||'') + ' ' + (n.content||[]).join(' ')).toLowerCase();
      if(!hay.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }

  function createCard(n){
    const art = document.createElement('article');
    art.className = 'news-card' + (n.pinned ? ' pinned' : '');
    const tagColor = tagPalette[Math.abs(n.title.charCodeAt(0)) % tagPalette.length];

    art.innerHTML = `
      ${n.pinned ? '<div class="pinned-badge">📌 Angeheftet</div>' : ''}
      <div class="news-header">
        <strong class="news-title">${escapeHtml(n.title)}</strong>
        <span class="news-date">${formatDate(n.date)}</span>
      </div>
      <p class="news-summary">${escapeHtml(n.summary||'')}</p>
      <div class="news-details" aria-hidden="true">
        ${(n.content||[]).map(line=>`<div>• ${escapeHtml(line)}</div>`).join('')}
      </div>
      <div class="news-tags">
        ${(n.tags||[]).map(t=>`<span class="tag-pill" style="border-color:${tagColor}">${escapeHtml(t)}</span>`).join(' ')}
      </div>
      <button class="btn show-more">Mehr</button>
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
    emptyEl.style.display = filtered.length ? 'none' : '';
    filtered.forEach(n => container.appendChild(createCard(n)));
  }

  function renderFilters(tags){
    tagFiltersEl.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Alle';
    allBtn.addEventListener('click', ()=>{ activeTag=null; render(); setActiveFilterBtn(); });
    tagFiltersEl.appendChild(allBtn);
    tags.forEach(t=>{
      const b = document.createElement('button');
      b.className = 'filter-btn';
      b.textContent = t;
      b.dataset.tag = t;
      b.addEventListener('click', ()=>{
        activeTag = activeTag === t ? null : t;
        render();
        setActiveFilterBtn();
      });
      tagFiltersEl.appendChild(b);
    });
  }
  function setActiveFilterBtn(){
    tagFiltersEl.querySelectorAll('.filter-btn').forEach(b=>{
      const t = b.dataset.tag;
      b.classList.toggle('active', !t && !activeTag || t && activeTag === t);
    });
  }

  searchInput?.addEventListener('input', e=>{
    searchTerm = e.target.value.trim();
    render();
  });
  sortSelect?.addEventListener('change', e=>{
    sortMode = e.target.value;
    render();
  });

  try {
    const res = await fetch(newsUrl, {cache:'no-store'});
    if(!res.ok) throw new Error('Netzwerkfehler');
    const json = await res.json();
    allNews = json.updates || json;
    allNews.forEach(n=>n.date = n.date || '1970-01-01');

    const tags = collectTags(allNews);
    renderFilters(tags);
    render();
  } catch(err){
    console.error('Fehler beim Laden der News:', err);
    container.innerHTML = '<p class="muted">Fehler beim Laden der News.</p>';
  }
})();