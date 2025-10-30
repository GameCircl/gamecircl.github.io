/* script-spiele.js - Theme, Sidebar, Modal, JSON load, Stats + Info-Button */

/* ---- helpers ---- */
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* ---- DOM refs ---- */
const gameList = qs('#game-list');
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

/* set year */
if (yearEl) yearEl.textContent = new Date().getFullYear();

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
   Load spiele.json and render cards
==================== */
async function loadSpiele() {
  try {
    const res = await fetch('JSON-Datastores/spiele.json', { cache: "no-store" });
    if (!res.ok) throw new Error('netzwerkfehler');
    const data = await res.json();
    const list = data.spiele || data; 
    renderSpiele(list);
  } catch (err) {
    console.error('Fehler beim Laden der spiele.json', err);
    if (gameList) gameList.innerHTML = `<p class="muted">Fehler beim Laden der Spielmodi.</p>`;
  }
}

function renderSpiele(list){
  if (!gameList) return;
  gameList.innerHTML = '';
  list.forEach((m,i) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.style.animationDelay = (i*60) + 'ms';

    const color1 = m.color || '#6c5ce7';
    const color2 = m.color2 || color1;

    el.innerHTML = `
      <div class="card-top-bg" style="background:linear-gradient(180deg, ${color1}22, ${color2}22);">
        <div class="card-title-wrapper">
          <div class="pill" style="background:linear-gradient(90deg, ${color1}, ${color2});">${m.icon || ''}</div>
          <div style="display:flex;flex-direction:column">
            <h3>${m.title}</h3>
            <div class="short">${m.short || m.desc}</div>
          </div>
        </div>
        <button class="card-info-btn" title="Anleitung anzeigen">ℹ️</button>
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
        <div>
          <button class="card-start" style="background:linear-gradient(90deg, ${color1}, ${color2});">▶ Spiel starten</button>
        </div>
      </div>
    `;

    // Start button
    el.querySelector('.card-start').addEventListener('click', () => {
      alert(`Spiel "${m.title}" starten!`);
    });

    // Info button
    el.querySelector('.card-info-btn').addEventListener('click', () => {
      alert(m.how || 'Keine Anleitung verfügbar.');
    });

    gameList.appendChild(el);
  });
}



/* initialize */
loadSpiele();



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

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Lokales Profil entfernen?')) {
      localStorage.removeItem('gc-user');
      loadProfileUI();
      renderStats();
      modal.classList.add('hidden');
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