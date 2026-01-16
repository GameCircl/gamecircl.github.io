/* ────────────────────────────────────
   INDEX.JS - HOMEPAGE FUNCTIONALITY
──────────────────────────────────── */

/* ────────────── FAQ ACCORDION ────────────── */
function initFAQ() {
  const faqToggles = document.querySelectorAll('.faq-toggle');
  
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const answer = toggle.nextElementSibling;
      const icon = toggle.querySelector('.faq-icon');
      const isOpen = toggle.classList.contains('active');
      
      // Schließe alle anderen
      faqToggles.forEach(t => {
        if (t !== toggle && t.classList.contains('active')) {
          t.classList.remove('active');
          t.nextElementSibling?.classList.remove('visible');
        }
      });
      
      // Toggle diese Antwort
      toggle.classList.toggle('active');
      answer?.classList.toggle('visible');
      
      // Smooth scroll zur Antwort, falls geöffnet
      if (!isOpen && answer) {
        setTimeout(() => {
          answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  });
}

/* ────────────── COUNTER ANIMATION ────────────── */
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  
  const observerOptions = {
    threshold: 0.5
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.count);
        const duration = 2000; // 2 Sekunden
        const start = 0;
        const increment = target / (duration / 16);
        
        let current = start;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
            counter.dataset.animated = 'true';
          } else {
            counter.textContent = Math.floor(current);
          }
        }, 16);
      }
    });
  }, observerOptions);
  
  counters.forEach(counter => observer.observe(counter));
}

/* ────────────── PAGE LOAD ────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  animateCounters();
  
  // Smooth scroll für CTA Button
  const ctaStartBtn = document.getElementById('ctaStartBtn');
  if (ctaStartBtn) {
    ctaStartBtn.addEventListener('click', () => {
      window.location.href = 'spiele.html';
    });
  }
});

/* ────────────── SCROLL REVEAL ────────────── */
const revealElements = () => {
  const elements = document.querySelectorAll('.fade-in');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
      }
    });
  }, { threshold: 0.1 });
  
  elements.forEach(el => observer.observe(el));
};

document.addEventListener('DOMContentLoaded', revealElements);

/* ====== FEATURED GAMES (Startseite) ====== */

let allGames = [];

async function loadFeaturedGames() {
  try {
    const res = await fetch('JSON-Datastores/spiele.json', { cache: "no-store" });
    if (!res.ok) throw new Error('Network error: ' + res.status);
    const data = await res.json();
    allGames = data.spiele || data;
    if (!Array.isArray(allGames)) throw new Error('Invalid data format');
    renderFeaturedGames();
  } catch (err) {
    console.error('Fehler beim Laden der spiele.json', err);
    const gameList = document.getElementById('game-list');
    if (gameList) {
      gameList.innerHTML = `
        <div class="error-state" style="grid-column:1/-1;padding:60px 20px;text-align:center;">
          <p style="font-size:18px;color:var(--muted);margin-bottom:12px;">⚠️ Fehler beim Laden der Spiele</p>
          <p style="font-size:13px;color:var(--muted);">${err.message}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:10px 18px;background:linear-gradient(135deg,#00ffff,#00cccc);color:#000;border:none;border-radius:10px;cursor:pointer;font-weight:700;">🔄 Neu laden</button>
        </div>
      `;
    }
  }
}

function renderFeaturedGames() {
  const gameList = document.getElementById('game-list');
  if (!gameList || !allGames.length) return;
  
  gameList.innerHTML = '';
  
  // Sortiere nach Popularität und nehme die Top 4
  const featured = [...allGames]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 4);
  
  featured.forEach((game, i) => {
    const card = document.createElement('article');
    card.className = 'featured-card';
    card.style.setProperty('--card-color-1', game.color || '#00ffff');
    card.style.setProperty('--card-color-2', game.color2 || game.color || '#00cccc');
    
    const stars = '★'.repeat(game.rating || 5) + '☆'.repeat(5 - (game.rating || 5));
    
    card.innerHTML = `
      <div class="featured-card-top">
        <div class="featured-card-header">
          <div class="featured-card-icon">${game.icon || '🎮'}</div>
          <div class="featured-card-title-group">
            <h3>${game.title}</h3>
            <p class="short">${game.short || ''}</p>
          </div>
        </div>
      </div>
      
      <div class="featured-card-divider"></div>
      
      <div class="featured-card-body">
        <p class="featured-card-desc">${game.desc}</p>
        <div class="featured-card-meta">
          <div class="featured-card-meta-item">👥 ${game.players}</div>
          <div class="featured-card-meta-item">⏱ ${game.time}</div>
          <div class="featured-card-meta-item">⚙️ ${game.difficulty}</div>
        </div>
      </div>
      
      <div class="featured-card-footer">
        <div class="featured-card-rating">${stars}</div>
        <button class="featured-card-btn" data-link="${game.link || '#'}" data-title="${game.title}" title="Starte ${game.title}">▶ Spielen</button>
      </div>
    `;
    
    card.querySelector('.featured-card-btn').addEventListener('click', () => {
      if (game.link) {
        window.location.href = game.link;
      } else {
        alert(`Spiel "${game.title}" wird bald verfügbar sein!`);
      }
    });
    
    gameList.appendChild(card);
  });
}

/* Initialize */
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedGames();
});