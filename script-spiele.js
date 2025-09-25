/* ============
   core logic
   ============ */

const gamesGrid = document.getElementById('gamesGrid');
const yearEl = document.getElementById('year');
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const themePoints = document.getElementById('themePoints');
const themeMarker = document.getElementById('themeMarker');
const themeLabel = document.getElementById('themeLabel');
const statusMini = document.getElementById('statusMini');
const miniName = document.getElementById('miniName');
const miniAvatar = document.getElementById('miniAvatar');
const openProfile = document.getElementById('openProfile');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const profileName = document.getElementById('profileName');
const saveProfile = document.getElementById('saveProfile');
const clearProfile = document.getElementById('clearProfile');
const whySection = document.getElementById('whySection');
const openWhy = document.getElementById('openWhy');

yearEl.textContent = new Date().getFullYear();

/* -------------------------
   THEME: auto / light / dark
------------------------- */

function applyTheme(mode) {
  // mode = 'auto' | 'light' | 'dark'
  if (mode === 'auto') {
    // match system
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    themeMarker.style.transform = 'translateX(0)';
    themeLabel.textContent = 'Auto';
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeMarker.style.transform = 'translateX(100%)';
    themeLabel.textContent = 'Hell';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeMarker.style.transform = 'translateX(200%)';
    themeLabel.textContent = 'Dunkel';
  }
  localStorage.setItem('gc-theme', mode);
}

// init theme
(function(){
  const saved = localStorage.getItem('gc-theme') || 'auto';
  applyTheme(saved);

  // handle click on theme segments
  themePoints.querySelectorAll('span[data-mode]').forEach((el, idx) => {
    el.addEventListener('click', () => {
      const mode = el.dataset.mode;
      applyTheme(mode);
    });
  });
})();

/* -------------------------
   SIDEBAR mobile toggle
------------------------- */
hamburger && hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay && (sidebarOverlay.classList.toggle('hidden'));
});
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.add('hidden');
  });
}

/* -------------------------
   PROFILE (localStorage)
------------------------- */
function loadProfile() {
  const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
  if (user && user.name) {
    miniName.textContent = user.name;
    miniAvatar.textContent = user.name.charAt(0).toUpperCase();
  } else {
    miniName.textContent = 'GameCircle';
    miniAvatar.textContent = 'G';
  }
}

openProfile.addEventListener('click', () => {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
  profileName.value = user ? user.name : '';
});
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
});
saveProfile.addEventListener('click', () => {
  const name = profileName.value.trim();
  if (!name) { alert('Bitte gib einen Namen ein'); return; }
  const user = { name, id: 'u_'+Date.now() };
  localStorage.setItem('gc-user', JSON.stringify(user));
  loadProfile();
  modal.classList.add('hidden');
});
clearProfile.addEventListener('click', () => {
  if (confirm('Lokales Profil wirklich entfernen?')) {
    localStorage.removeItem('gc-user');
    loadProfile();
    modal.classList.add('hidden');
  }
});
loadProfile();

/* -------------------------
   WHY section toggle
------------------------- */
openWhy && openWhy.addEventListener('click', () => {
  if (whySection.style.display === 'none' || whySection.style.display === '') {
    whySection.style.display = 'block';
    whySection.setAttribute('aria-hidden','false');
    whySection.scrollIntoView({behavior:'smooth'});
  } else {
    whySection.style.display = 'none';
    whySection.setAttribute('aria-hidden','true');
  }
});

/* -------------------------
   LOAD MODES (modes.json)
------------------------- */
async function loadModes() {
  try {
    const res = await fetch('modes.json', {cache: "no-store"});
    const data = await res.json();
    renderModes(data.modes || []);
  } catch (err) {
    console.error('Fehler beim Laden der modes.json', err);
    gamesGrid.innerHTML = '<p style="color:var(--muted)">Fehler beim Laden der Spielmodi.</p>';
  }
}

/* utility: create star rating */
function starsHTML(n){
  const full = Math.max(0, Math.min(5, Math.round(n||5)));
  return '★'.repeat(full) + '☆'.repeat(5-full);
}

/* render cards */
function renderModes(list) {
  gamesGrid.innerHTML = '';
  list.forEach((m, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    // give each card a small delay animation
    card.style.animationDelay = (i * 60) + 'ms';

    // header color block and pill
    const pill = `<div class="pill" style="background:linear-gradient(90deg, ${m.color}, ${m.color2 || m.color});">${m.icon || ''}</div>`;
    const rating = `<div class="card-rating" title="${m.rating || 5} von 5">${starsHTML(m.rating)}</div>`;

    card.innerHTML = `
      <div class="card-top">
        <div class="tag">
          ${pill}
          <div style="display:flex;flex-direction:column;">
            <strong style="font-size:16px">${m.title}</strong>
            <small style="color:var(--muted); font-size:13px; margin-top:6px">${m.short || m.desc}</small>
          </div>
        </div>
        <div style="margin-left:auto">${rating}</div>
      </div>

      <div class="card-body">
        <p style="color:var(--muted);">${m.desc}</p>
        <div style="margin-top:12px;">
          <strong>So wird gespielt:</strong>
          <p style="color:var(--muted); margin-top:6px; font-size:13px;">${m.how}</p>
        </div>

        <div class="tags" aria-hidden="false">
          ${m.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
        </div>
      </div>

      <div class="card-footer">
        <div class="info-row">
          <div class="info-left">
            <div>👥 ${m.players}</div>
            <div>⏱ ${m.time}</div>
            <div>⚙️ ${m.difficulty}</div>
          </div>
          <div style="text-align:right">
            <button class="card-start" style="background:linear-gradient(90deg, ${m.color}, ${m.color2 || m.color});">▶ Spiel starten</button>
          </div>
        </div>
      </div>
    `;

    // add click handler for start button
    card.querySelector('.card-start').addEventListener('click', () => {
      // increment a simple local stat
      const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
      if (!user) {
        alert('Bitte erst Profil anlegen (oben rechts) — oder Spiel wird lokal gestartet.');
      }
      // simulate starting the game
      alert(`Starte Spiel: ${m.title}`);
      // store last played
      const stats = JSON.parse(localStorage.getItem('gc-stats') || '{}');
      const uid = user ? user.id : 'anon';
      stats[uid] = stats[uid] || { plays: 0, last: null };
      stats[uid].plays++;
      stats[uid].last = new Date().toLocaleString();
      localStorage.setItem('gc-stats', JSON.stringify(stats));
    });

    gamesGrid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadModes);
