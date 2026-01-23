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
const learnMore = document.getElementById('learnMore');
const ctaStartBtn = document.getElementById('ctaStartBtn');
const sidebarOverlayEl = document.getElementById('sidebarOverlay');


document.addEventListener("DOMContentLoaded", () => {
  // Jahr automatisch einfügen
  document.getElementById("year").textContent = new Date().getFullYear();

  // Fade-in beim Scrollen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

});


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

document.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isSwiping = false;
});

document.addEventListener('touchmove', (e) => {
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
function loadUserUI() {
  const user = JSON.parse(localStorage.getItem('gc_user') || 'null');
  if (user && user.name) {
    miniName.textContent = user.name;
  } else {
    miniName.textContent = 'Gast';
  }
}

openLogin.addEventListener('click', ()=>{
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  const user = JSON.parse(localStorage.getItem('gc_user') || 'null');
  usernameInput.value = user ? user.name : '';
  renderStats();
});

modalClose.addEventListener('click', ()=>{
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 250);
  modal.setAttribute('aria-hidden','true');
});

saveUser.addEventListener('click', ()=>{
  const name = usernameInput.value.trim();
  if(!name) {
    usernameInput.focus();
    usernameInput.style.borderColor = '#ff6b6b';
    setTimeout(() => {
      usernameInput.style.borderColor = '';
    }, 2000);
    return;
  }
  try {
    const user = { name, id: 'user_' + Date.now() };
    localStorage.setItem('gc_user', JSON.stringify(user));
    loadUserUI();
    renderStats();
    modal.classList.remove('show');
    setTimeout(()=> modal.classList.add('hidden'), 250);
    modal.setAttribute('aria-hidden','true');
  } catch(e) {
    console.error('Fehler beim Speichern:', e);
    alert('Fehler beim Speichern des Profils');
  }
});

logoutBtn.addEventListener('click', ()=>{
  if(confirm('Profil wirklich entfernen?')) {
    localStorage.removeItem('gc_user');
    loadUserUI();
    renderStats();
    modal.classList.remove('show');
    setTimeout(()=> modal.classList.add('hidden'), 250);
  }
});

// Init user on page load
loadUserUI();

/* Stat Rendering */
function renderStats() {
  const statsList = qs('#statsList');
  if (!statsList) return;
  
  const user = JSON.parse(localStorage.getItem('gc_user') || 'null');
  const stats = JSON.parse(localStorage.getItem('gc-stats') || '{}');
  
  if (!user) {
    statsList.innerHTML = '<p class="muted">Erstelle ein Profil, um Statistiken zu speichern.</p>';
    return;
  }
  
  const s = stats[user.id] || { plays: 0, wins: 0, last: '' };
  
  statsList.innerHTML = `
    <div><strong>Spieler:</strong> <span>${user.name}</span></div>
    <div><strong>Runden:</strong> <span>${s.plays}</span></div>
    <div><strong>Siege:</strong> <span>${s.wins}</span></div>
    <div><strong>Zuletzt:</strong> <span>${s.last || '—'}</span></div>
  `;
}


/* -------------------------
   ÜBER- und START BUTTON (LINKS)
------------------------- */

startBtn?.addEventListener('click', ()=>{
  window.location.href = "spiele.html";
});

learnMore?.addEventListener('click', ()=>{
  window.location.href = "ueber.html";
});

ctaStartBtn?.addEventListener('click', ()=>{
  window.location.href = "spiele.html";
});


/* -------------------------
   STAT COUNTER ANIMATION
------------------------- */
function animateCounter(element) {
  const target = parseInt(element.dataset.count, 10);
  if (isNaN(target)) return;
  
  const duration = 2000;
  const steps = 60;
  const increment = target / steps;
  let current = 0;

  const interval = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(interval);
    } else {
      element.textContent = Math.floor(current);
    }
  }, duration / steps);
}

// Trigger animations beim Scrollen
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('.stat-number');
      counters.forEach(c => {
        if (!c.dataset.animated) {
          animateCounter(c);
          c.dataset.animated = 'true';
        }
      });
    }
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) observer.observe(statsSection);

/* ────────────── IMPROVED FAQ CLICK HANDLING ────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Enhanced FAQ interaction
  const faqSection = document.querySelector('.faq-section');
  if (faqSection) {
    faqSection.style.animation = 'slideInUp 0.6s ease forwards 0.3s both';
  }
  
  // Smooth scroll on page load with hash
  if (window.location.hash) {
    setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }
});