/* -------------------------
   ELEMENTE
------------------------- */
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
const sidebarOverlayEl = document.getElementById('sidebarOverlay');


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