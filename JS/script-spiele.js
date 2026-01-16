/* script-spiele.js - Theme, Sidebar, Modal, JSON load, Stats + Info-Button */

/* ---- helpers ---- */
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* ---- DOM refs ---- */
const gameList = qs('#game-list');
const gamesSearch = qs('#gamesSearch');
const gamesSort = qs('#gamesSort');
const gameTagFilters = qs('#gameTagFilters');
const resetGameFilters = qs('#resetGameFilters');
const gamesFavToggle = qs('#gamesFavToggle');
const gamesEmpty = qs('#gamesEmpty');
const yearEl = qs('#year');
const sidebar = qs('#sidebar');
const sidebarToggle = qs('#sidebarToggle');
const sidebarOverlay = qs('#sidebarOverlay');
const themePoints = qs('.theme-points');
const themeMarker = qs('#themeMarker');
const statusMini = qs('#miniStatus');
const miniName = qs('#miniName');
const miniAvatar = qs('#miniAvatar');

const openLogin = qs('#openLogin');
const modal = qs('#modal');
const modalClose = qs('#modalClose');
const usernameInput = qs('#username');
const saveUser = qs('#saveUser');
const logoutBtn = qs('#logoutBtn');
const statsList = qs('#statsList');
const exportStats = qs('#exportStats');
const importStats = qs('#importStats');
const importFile = qs('#importFile');

document.addEventListener("DOMContentLoaded", () => {
  // Jahr automatisch einfügen
  document.getElementById("year").textContent = new Date().getFullYear();

  // Transform nav-links into icon (SVG) + label for a modern look
  try {
    const iconMap = {
      'index.html': '<i class="bx bx-home-alt-2"></i> ',
      'spiele.html': '<i class="bx bx-joystick"></i> ',
      'news.html': '<i class="bx bx-news"></i> ',
      'ueber.html': '<i class="bx bx-info-circle"></i> ',
      'impressum.html': '<i class="bx bx-file"></i> '
    };

    document.querySelectorAll('.nav-link').forEach(a => {
      if (a.querySelector('.icon')) return; // already transformed
      const href = (a.getAttribute('href') || '').split('/').pop();
      const label = a.textContent.trim().replace(/^[^\s]+\s*/, '');
      const svg = iconMap[href] || '';
      a.innerHTML = `<span class="icon" aria-hidden="true">${svg || label.charAt(0)}</span><span class="label">${label}</span>`;
      a.setAttribute('title', label);
      a.setAttribute('aria-label', label);
    });
  } catch (e) { console.warn('nav transform failed', e); }

// Sidebar collapse button removed (per user request). No collapse toggle is added programmatically.
    // If collapse behavior is wanted again later, reintroduce the toggle here.

});

/* ====================
   THEME (auto/light/dark)
==================== */
function applyTheme(mode) {
  if (mode === 'auto') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    themeMarker.style.transform = 'translateX(0)';
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeMarker.style.transform = 'translateX(100%)';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeMarker.style.transform = 'translateX(200%)';
  }
  localStorage.setItem('gc-theme', mode);
}

(function initTheme(){
  const saved = localStorage.getItem('gc-theme') || 'auto';
  applyTheme(saved);
  if (themePoints) {
    qsa('.theme-points span').forEach(el => {
      el.addEventListener('click', () => applyTheme(el.dataset.mode));
    });
  }
  if (saved === 'auto' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme('auto'));
  }
})();



/* ====================
   Load spiele.json and render cards (with Search/Filter/Sort)
==================== */
let allGames = [];
let activeTag = null;

// Favorites (local)
const favKey = 'gc-favs';
let favs = new Set(JSON.parse(localStorage.getItem(favKey) || '[]'));
function saveFavs(){ localStorage.setItem(favKey, JSON.stringify(Array.from(favs))); }
function isFavorited(id){ return favs.has(id); }
function toggleFavorite(id, btn){
  if(!id) return;
  if(favs.has(id)){
    favs.delete(id);
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed','false');
  } else {
    favs.add(id);
    btn.classList.add('active');
    btn.setAttribute('aria-pressed','true');
  }
  // pulse feedback
  btn.classList.add('pulse');
  setTimeout(()=>btn.classList.remove('pulse'), 380);

  saveFavs();
  // update UI and re-filter if necessary
  updateFavToggleUI();
  if (favFilter) renderFilteredGames();
}

/* --- Favoriten‑Filter (Nur Favoriten) --- */
const favFilterKey = 'gc-fav-filter';
let favFilter = false;
function saveFavFilter(){ localStorage.setItem(favFilterKey, favFilter ? '1' : '0'); }
function loadFavFilter(){ favFilter = localStorage.getItem(favFilterKey) === '1'; updateFavToggleUI(); }
function updateFavToggleUI(){ if(!gamesFavToggle) return; const count = favs.size; gamesFavToggle.setAttribute('aria-pressed', favFilter ? 'true' : 'false'); gamesFavToggle.textContent = `⭐ Nur Favoriten (${count})`; gamesFavToggle.classList.toggle('active', favFilter); }
if (gamesFavToggle) {
  gamesFavToggle.addEventListener('click', ()=>{
    favFilter = !favFilter;
    saveFavFilter();
    updateFavToggleUI();
    renderFilteredGames();
  });
}

async function loadSpiele() {
  try {
    const res = await fetch('JSON-Datastores/spiele.json', { cache: "no-store" });
    if (!res.ok) throw new Error('Server error: ' + res.status);
    const data = await res.json();
    const list = data.spiele || data;
    if (!Array.isArray(list)) throw new Error('Invalid data format');
    
    allGames = list;
    renderGameFilters(collectGameTags(allGames));
    renderFilteredGames();
  } catch (err) {
    console.error('Fehler beim Laden der spiele.json', err);
    if (gameList) {
      gameList.innerHTML = `
        <div class="error-state" style="grid-column:1/-1;">
          <p style="font-size:18px;color:var(--text);margin-bottom:8px;">⚠️ Fehler beim Laden</p>
          <p style="font-size:13px;color:var(--muted);margin-bottom:16px;">${err.message}</p>
          <button onclick="location.reload()" style="padding:10px 18px;background:linear-gradient(135deg,#00ffff,#00cccc);color:#000;border:none;border-radius:10px;cursor:pointer;font-weight:700;">🔄 Neu laden</button>
        </div>
      `;
    }
  }
}

function collectGameTags(list){
  const s = new Set();
  (list || []).forEach(g => (g.tags || []).forEach(t => s.add(t)));
  return Array.from(s).sort((a,b) => a.localeCompare(b,'de'));
}

function renderGameFilters(tags){
  if(!gameTagFilters) return;
  gameTagFilters.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'Alle';
  allBtn.dataset.tag = '';
  allBtn.addEventListener('click', () => {
    activeTag = null;
    setActiveFilterBtn();
    renderFilteredGames();
  });
  gameTagFilters.appendChild(allBtn);

  tags.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = t;
    btn.dataset.tag = t;
    btn.addEventListener('click', () => {
      activeTag = activeTag === t ? null : t;
      setActiveFilterBtn();
      renderFilteredGames();
    });
    gameTagFilters.appendChild(btn);
  });

  setActiveFilterBtn();
}

function setActiveFilterBtn(){
  if(!gameTagFilters) return;
  gameTagFilters.querySelectorAll('.filter-btn').forEach(b => {
    const t = b.dataset.tag;
    if((!t && !activeTag) || (t && activeTag === t)) b.classList.add('active');
    else b.classList.remove('active');
  });
}

function renderFilteredGames(){
  if(!allGames) return;
  const term = (gamesSearch?.value || '').trim().toLowerCase();
  const sortMode = gamesSort?.value || 'title-asc';
  let filtered = allGames.filter(g => {
    // Favoriten-Filter: wenn aktiv, nur Spiele beachten, die in favs sind
    if (favFilter && !isFavorited(g.id)) return false;
    if (activeTag && !(g.tags || []).includes(activeTag)) return false;
    if (!term) return true;
    const hay = ((g.title||'') + ' ' + (g.short||'') + ' ' + (g.desc||'') + ' ' + (g.tags||[]).join(' ')).toLowerCase();
    return hay.includes(term);
  });

  // sorting — 'default' leaves original JSON order; fallback is title-asc
  if (sortMode === 'title-asc') filtered.sort((a,b)=>a.title.localeCompare(b.title,'de'));
  else if (sortMode === 'title-desc') filtered.sort((a,b)=>b.title.localeCompare(a.title,'de'));
  else if (sortMode === 'time-asc') filtered.sort((a,b)=> parseTime(a.time) - parseTime(b.time));
  else if (sortMode === 'time-desc') filtered.sort((a,b)=> parseTime(b.time) - parseTime(a.time));
  // else if sortMode === 'default' do nothing (keep JSON order)


  if (filtered.length === 0) {
    if (gameList) gameList.innerHTML = '';
    if (gamesEmpty) gamesEmpty.style.display = '';
    return;
  } else {
    if (gamesEmpty) gamesEmpty.style.display = 'none';
  }

  renderSpiele(filtered);
}

function parseTime(t){
  if(!t) return 0;
  const m = t.match(/(\d+)\s*-?\s*(\d+)?/);
  if(!m) return 0;
  const a = parseInt(m[1],10);
  const b = m[2] ? parseInt(m[2],10) : a;
  return (a + b)/2;
}

function renderSpiele(list){
  if (!gameList) return;
  gameList.innerHTML = '';
  list.forEach((m,i) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.style.animationDelay = (i*60) + 'ms';
    el.dataset.id = m.id || '';

    const color1 = m.color || '#6c5ce7';
    const color2 = m.color2 || color1;

    // expose CSS vars for per-card accents
    el.style.setProperty('--accent1', color1);
    el.style.setProperty('--accent2', color2);

    el.innerHTML = `
      <div class="card-top-bg" style="background:linear-gradient(180deg, ${color1}22, ${color2}22);">
        <div class="card-title-wrapper">
          <div class="pill" style="background:linear-gradient(90deg, ${color1}, ${color2});" aria-hidden="true">${m.icon || ''}</div>
          <div style="display:flex;flex-direction:column">
            <h3>${m.title}</h3>
            <div class="short">${m.short || m.desc}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="fav-btn" title="Als Favorit markieren" aria-pressed="${isFavorited(m.id) ? 'true' : 'false'}">${isFavorited(m.id) ? '★' : '☆'}</button>
          <button class="card-info-btn" title="Anleitung anzeigen" aria-label="Anleitung für ${m.title}">ℹ️</button>
        </div>
      </div>
      <div class="card-line"></div>
      <div class="card-body">
        <p>${m.desc}</p>
        <div class="tags">${(m.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('')}</div>
      </div>
      <div class="card-footer">
        <div class="meta info-left">
          <div>👥 ${m.players}</div>
          <div>⏱ ${m.time}</div>
          <div>⚙️ ${m.difficulty}</div>
        </div>
        <div class="card-actions">
          <button class="card-start" style="background:linear-gradient(90deg, ${color1}, ${color2});" aria-label="${m.title} starten">▶ Spiel starten</button>
        </div>
      </div>
    `;

    // Favorite button
    const favBtn = el.querySelector('.fav-btn');
    if(favBtn){
      if(isFavorited(m.id)) favBtn.classList.add('active');
      favBtn.addEventListener('click', (e) => { toggleFavorite(m.id, favBtn); e.stopPropagation(); });
    }

    // Start button — wenn eine Spielseite vorhanden ist, navigiere dorthin
    const startBtn = el.querySelector('.card-start');
    startBtn.addEventListener('click', () => {
      if (m.link) {
        window.location.href = m.link;
      } else {
        alert(`Spiel "${m.title}" starten!`);
      }
    });

    // Info button — öffnet das neue eigene Modal
    el.querySelector('.card-info-btn').addEventListener('click', () => {
      showGameInfo(m);
    });

    gameList.appendChild(el);
  });
}

// Events
gamesSearch?.addEventListener('input', () => renderFilteredGames());
gamesSort?.addEventListener('change', () => renderFilteredGames());
resetGameFilters?.addEventListener('click', () => {
  activeTag = null;
  gamesSearch.value = '';
  gamesSort.value = 'title-asc';
  // Reset favorite filter as requested (Option 1)
  favFilter = false;
  saveFavFilter();
  setActiveFilterBtn();
  updateFavToggleUI();
  renderFilteredGames();
});



/* initialize */
loadSpiele();
loadFavFilter();
updateFavToggleUI();

/* -------------------------
   GAME INFO MODAL (custom) — öffnet ein eigenes Fenster statt alert()
------------------------- */
const gameInfoModal = qs('#gameInfoModal');
const gameInfoClose = qs('#gameInfoClose');
const gameInfoTitle = qs('#gameInfoTitle');
const gameInfoShort = qs('#gameInfoShort');
const gameInfoDesc = qs('#gameInfoDesc');
const gameInfoHow = qs('#gameInfoHow');
const gameInfoTags = qs('#gameInfoTags');
const gameInfoPill = qs('#gameInfoPill');
const gameInfoLink = qs('#gameInfoLink');

function showGameInfo(m){
  if(!gameInfoModal) return alert(m.how || m.desc || 'Keine Details verfügbar.');
  
  // Animate in
  gameInfoModal.classList.remove('hidden');
  gameInfoModal.setAttribute('aria-hidden','false');
  
  // Content
  gameInfoTitle.textContent = m.title || '';
  gameInfoShort.textContent = m.short || '';
  gameInfoDesc.textContent = m.desc || '';
  gameInfoHow.textContent = m.how || 'Keine Anleitung verfügbar.';
  gameInfoPill.textContent = m.icon || '';
  
  // Colors
  const _c1 = m.color || '#6c5ce7';
  const _c2 = m.color2 || _c1;
  gameInfoPill.style.background = `linear-gradient(90deg, ${_c1}, ${_c2})`;
  
  // Tags
  gameInfoTags.innerHTML = (m.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('');
  
  // Link
  if (m.link) {
    gameInfoLink.href = m.link;
    gameInfoLink.classList.remove('hidden');
  } else {
    gameInfoLink.classList.add('hidden');
  }
  
  // Trigger animation
  setTimeout(() => gameInfoModal.classList.add('show'), 10);
}

if (gameInfoClose) {
  gameInfoClose.addEventListener('click', ()=> {
    gameInfoModal.classList.remove('show');
    setTimeout(()=> {
      gameInfoModal.classList.add('hidden');
      gameInfoModal.setAttribute('aria-hidden','true');
    }, 240);
  });
}

// Improved ESC handling
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    // Close game info modal first
    if (gameInfoModal && gameInfoModal.classList.contains('show')) {
      gameInfoModal.classList.remove('show');
      setTimeout(() => {
        gameInfoModal.classList.add('hidden');
        gameInfoModal.setAttribute('aria-hidden','true');
      }, 240);
      return;
    }
    // Then close login modal
    if (modal && modal.classList.contains('show')) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden','true');
      }, 240);
    }
  }
});



/* -------------------------
   SIDEBAR MOBILE TOGGLE & OVERLAY
------------------------- */

if(sidebarToggle){
  sidebarToggle.addEventListener('click', ()=>{
    sidebar.classList.add('open');
    sidebarOverlay.classList.remove('hidden');
    sidebarToggle.classList.add('hide'); // ← NEU
  });
  sidebarOverlay.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    sidebarOverlay.classList.add('hidden');
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
      sidebarOverlay.classList.remove('hidden');
    }

    // Swipe nach links -> schließen
    if (diffX < -70 && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.add('hidden');
    }
  }
});

document.addEventListener('touchend', () => {
  isSwiping = false;
});



/* ====================
   PROFILE & STATS (local)
==================== */
function loadProfileUI() {
  const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
  if (user && user.name) {
    miniName.textContent = user.name;
    miniAvatar.textContent = user.name.charAt(0).toUpperCase();
  } else {
    miniName.textContent = 'GameCircl';
    miniAvatar.textContent = 'G';
  }
}
loadProfileUI();

if (openLogin) {
  openLogin.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
    usernameInput.value = user ? user.name : '';
    renderStats();
  });
}
if (modalClose) {
  modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
  });
}

if (saveUser) {
  saveUser.addEventListener('click', () => {
    const val = usernameInput.value.trim();
    if (!val) { alert('Bitte Namen eingeben'); return; }
    const user = { name: val, id: 'u_' + Date.now() };
    localStorage.setItem('gc-user', JSON.stringify(user));
    loadProfileUI();
    modal.classList.add('hidden');
  });
}

// Improve logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Lokales Profil wirklich entfernen?')) {
      localStorage.removeItem('gc_user');
      loadUserUI();
      renderStats();
      modal.classList.remove('show');
      setTimeout(() => modal.classList.add('hidden'), 240);
    }
  });
}

/* Stats rendering */
function renderStats() {
  const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
  const stats = JSON.parse(localStorage.getItem('gc-stats') || '{}');

  if (!statsList) return;

  if (!user) {
    statsList.innerHTML = '<p class="muted">Kein eingeloggter Benutzer. Erstelle ein lokales Profil.</p>';
    return;
  }

  const s = stats[user.id] || { plays: 0, wins: 0, last: null };
  statsList.innerHTML = `
    <div><strong>Benutzer:</strong> ${user.name}</div>
    <div><strong>Runden gespielt:</strong> ${s.plays}</div>
    <div><strong>Siege:</strong> ${s.wins}</div>
    <div><strong>Letzte Runde:</strong> ${s.last || '-'}</div>
    <div style="margin-top:10px;">
      <button id="addPlay" class="btn">+ Runde simulieren</button>
      <button id="resetStats" class="btn">Reset</button>
    </div>
  `;

  qs('#addPlay').addEventListener('click', () => {
    const uid = user.id;
    const stats = JSON.parse(localStorage.getItem('gc-stats') || '{}');
    stats[uid] = stats[uid] || { plays: 0, wins: 0, last: null };
    stats[uid].plays++;
    stats[uid].last = new Date().toLocaleString();
    localStorage.setItem('gc-stats', JSON.stringify(stats));
    renderStats();
  });
  qs('#resetStats').addEventListener('click', () => {
    if (!confirm('Statistiken zurücksetzen?')) return;
    const stats = JSON.parse(localStorage.getItem('gc-stats') || '{}');
    stats[user.id] = { plays: 0, wins: 0, last: null };
    localStorage.setItem('gc-stats', JSON.stringify(stats));
    renderStats();
  });
}

/* Export / Import */
if (exportStats) {
  exportStats.addEventListener('click', () => {
    const data = {
      stats: JSON.parse(localStorage.getItem('gc-stats') || '{}'),
      user: JSON.parse(localStorage.getItem('gc-user') || 'null')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gamecircl_stats.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
if (importStats && importFile) {
  importStats.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (parsed.stats) {
          localStorage.setItem('gc-stats', JSON.stringify(parsed.stats));
          if (parsed.user) localStorage.setItem('gc-user', JSON.stringify(parsed.user));
          loadProfileUI();
          renderStats();
          alert('Import erfolgreich');
        } else {
          alert('Ungültiges Format');
        }
      } catch (err) {
        alert('Fehler beim Import');
      }
    };
    r.readAsText(f);
  });
}


