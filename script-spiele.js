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


/* ====================
   Load spiele.json and render cards
==================== */
async function loadSpiele() {
  try {
    const res = await fetch('spiele.json', { cache: "no-store" });
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


/* initialize */
loadSpiele();