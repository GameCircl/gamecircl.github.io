const gamesGrid = document.getElementById('gamesGrid');
const yearEl = document.getElementById('year');
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const themePoints = document.getElementById('themePoints');
const themeMarker = document.getElementById('themeMarker');
const statusMini = document.getElementById('statusMini');
const miniName = document.getElementById('miniName');
const miniAvatar = document.getElementById('miniAvatar');
const openProfile = document.getElementById('openProfile');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

yearEl.textContent = new Date().getFullYear();

/* -------------------------
   THEME
------------------------- */
function applyTheme(mode){
  if(mode==='auto'){
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark?'dark':'light');
    themeMarker.style.transform='translateX(0)';
  } else if(mode==='light'){
    document.documentElement.setAttribute('data-theme','light');
    themeMarker.style.transform='translateX(100%)';
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    themeMarker.style.transform='translateX(200%)';
  }
  localStorage.setItem('gc-theme',mode);
}

(function(){
  const saved = localStorage.getItem('gc-theme')||'auto';
  applyTheme(saved);
  themePoints.querySelectorAll('span[data-mode]').forEach(el=>{
    el.addEventListener('click',()=>applyTheme(el.dataset.mode));
  });
})();

/* -------------------------
   SIDEBAR mobile toggle
------------------------- */
hamburger?.addEventListener('click',()=>{
  sidebar.classList.toggle('open');
  sidebarOverlay?.classList.toggle('hidden');
});
sidebarOverlay?.addEventListener('click',()=>{
  sidebar.classList.remove('open');
  sidebarOverlay.classList.add('hidden');
});

/* -------------------------
   PROFILE (localStorage)
------------------------- */
function loadProfile(){
  const user=JSON.parse(localStorage.getItem('gc-user')||'null');
  if(user && user.name){
    miniName.textContent=user.name;
    miniAvatar.textContent=user.name.charAt(0).toUpperCase();
  } else {
    miniName.textContent='GameCircl';
    miniAvatar.textContent='G';
  }
}
openProfile.addEventListener('click',()=>{
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
});
modalClose.addEventListener('click',()=>{
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
});
loadProfile();

/* -------------------------
   LOAD MODES
------------------------- */
async function loadModes(){
  try{
    const res = await fetch('modes-spiele.json',{cache:"no-store"});
    const data = await res.json();
    renderModes(data.modes||[]);
  } catch(err){
    console.error('Fehler beim Laden',err);
    gamesGrid.innerHTML='<p style="color:var(--muted)">Fehler beim Laden der Spielmodi.</p>';
  }
}

/* UTILITY: stars */
function starsHTML(n){
  const full=Math.max(0,Math.min(5,Math.round(n||5)));
  return '★'.repeat(full)+'☆'.repeat(5-full);
}

/* RENDER */
function renderModes(list){
  gamesGrid.innerHTML='';
  list.forEach((m,i)=>{
    const card=document.createElement('article');
    card.className='card';
    card.style.animationDelay=(i*80)+'ms';
    card.innerHTML=`
      <div class="card-img">
        <img src="bilder/${m.id}.png" alt="${m.title}" />
      </div>
      <div class="card-body">
        <h3>${m.title}</h3>
        <p>${m.desc}</p>
        <div class="stars">${starsHTML(m.rating)}</div>
        <button class="btn primary start-game">▶ Spiel starten</button>
      </div>
    `;
    card.querySelector('.start-game')?.addEventListener('click',()=>alert(`Starte ${m.title}!`));
    gamesGrid.appendChild(card);
  });

  /* IntersectionObserver für fade-in */
  const cards = document.querySelectorAll('.card');
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.1});
  cards.forEach(c=>observer.observe(c));
}

loadModes();