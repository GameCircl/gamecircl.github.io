/* -------------------------
   ELEMENTE
------------------------- */
const gameList = document.getElementById('game-list');
const gamesGrid = document.getElementById('games-grid');
const root = document.documentElement;
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const miniName = document.getElementById('miniName');
const openLogin = document.getElementById('openLogin');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const saveUser = document.getElementById('saveUser');
const logoutBtn = document.getElementById('logoutBtn');
const usernameInput = document.getElementById('username');
const startBtn = document.getElementById('startBtn');

/* -------------------------
   DATEN LADEN
------------------------- */
let games = [];
fetch('modes.json')
  .then(res => res.json())
  .then(data => { 
    games = data; 
    renderGames(); 
    renderGamesPage(); 
  })
  .catch(err => console.error('Fehler beim Laden der Spiele:', err));

/* -------------------------
   RENDER HOMEPAGE
------------------------- */
function renderGames() {
  if(!gameList) return;
  gameList.innerHTML = '';
  games.forEach((g, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.animationDelay = `${i * 0.05}s`;
    el.innerHTML = `
      <div class="meta">
        <div class="tag" style="display:flex;gap:8px;align-items:center">
          <div style="width:44px;height:44px;border-radius:8px;background:${g.color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700">
            ${g.title.split(' ').map(s => s[0]).slice(0,2).join('')}
          </div>
          <div style="font-weight:700">${g.title}</div>
        </div>
        <div class="rating">★★★★★</div>
      </div>
      <p>${g.desc}</p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <small style="color:var(--muted)">${g.players}</small>
        <button class="btn" onclick="alert('Starte: ${g.title}')">→</button>
      </div>
    `;
    gameList.appendChild(el);
  });
}

/* -------------------------
   RENDER SPIELE PAGE
------------------------- */
function renderGamesPage() {
  if(!gamesGrid) return;
  gamesGrid.innerHTML = '';
  games.forEach((g,i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.animationDelay = `${i*0.04}s`;
    const tagsHTML = g.tags ? g.tags.map(t => 
      `<span style="background:${g.color};padding:2px 6px;border-radius:6px;color:white;margin-right:4px">${t}</span>`).join('') : '';
    el.innerHTML = `
      <h3>${g.title}</h3>
      <p>${g.desc}</p>
      <small>Spieler: ${g.players}</small>
      ${tagsHTML ? `<div class="tag" style="margin-top:6px;">${tagsHTML}</div>` : ''}
    `;
    gamesGrid.appendChild(el);
  });
}

/* -------------------------
   SIDEBAR MOBILE TOGGLE & OVERLAY
------------------------- */
const sidebarOverlayEl = document.createElement('div');
sidebarOverlayEl.classList.add('sidebar-overlay');
document.body.appendChild(sidebarOverlayEl);

if(sidebarToggle){
  sidebarToggle.addEventListener('click', ()=>{
    sidebar.classList.add('open');
    sidebarOverlayEl.classList.add('active');
  });
  sidebarOverlayEl.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    sidebarOverlayEl.classList.remove('active');
  });
}

/* optional: swipe to close */
let startX = 0;
sidebar.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
sidebar.addEventListener('touchmove', e => {
  let diff = e.touches[0].clientX - startX;
  if(diff < -50){ // swipe left
    sidebar.classList.remove('open');
    sidebarOverlayEl.classList.remove('active');
  }
});

/* -------------------------
   THEME SLIDER MIT SMOOTH TRANSITION
------------------------- */
const themePoints = document.querySelectorAll('.theme-points span');
const themeMarker = document.getElementById('themeMarker');

function setMarker(point){
  const rect = point.getBoundingClientRect();
  const parentRect = point.parentElement.getBoundingClientRect();
  const left = rect.left - parentRect.left + rect.width/2 - themeMarker.offsetWidth/2;
  themeMarker.style.left = left + 'px';
}

function applyTheme(mode){
  if(mode==='auto'){
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark?'dark':'light');
  } else {
    root.setAttribute('data-theme', mode);
  }
  themePoints.forEach(p=>{
    p.classList.toggle('active', p.dataset.mode===mode);
    if(p.dataset.mode===mode) setMarker(p);
  });
  localStorage.setItem('gc-theme', mode);
}

themePoints.forEach(p => p.addEventListener('click', ()=>applyTheme(p.dataset.mode)));
let savedTheme = localStorage.getItem('gc-theme') || 'auto';
applyTheme(savedTheme);
if(savedTheme==='auto'){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>applyTheme('auto'));
}
window.addEventListener('resize', ()=>applyTheme(localStorage.getItem('gc-theme') || 'auto'));

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
  miniName.textContent='GameCircle';
});

/* -------------------------
   USER INIT
------------------------- */
const savedUser = localStorage.getItem('gc_user');
if(savedUser) miniName.textContent = savedUser;

/* -------------------------
   FOOTER YEAR
------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* -------------------------
   START BUTTON
------------------------- */
startBtn.addEventListener('click', ()=>{
  alert('Hier würde das Spiel starten!');
});
