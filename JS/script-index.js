/* ────────────────────────────────────
   INDEX.JS - HOMEPAGE FUNCTIONALITY
──────────────────────────────────── */

/* ────────────── FAQ ACCORDION ────────────── */
function initFAQ() {
  const faqToggles = document.querySelectorAll('.faq-toggle');
  
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const answer = toggle.nextElementSibling;
      const isOpen = toggle.classList.contains('active');
      
      // Schließe alle anderen
      document.querySelectorAll('.faq-toggle').forEach(t => {
        if (t !== toggle) {
          t.classList.remove('active');
          t.nextElementSibling.classList.remove('visible');
        }
      });
      
      // Toggle aktuelle
      toggle.classList.toggle('active');
      answer.classList.toggle('visible');
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

/* ────────────── FEATURED GAMES LADEN ────────────── */
let homeGames = [];

fetch('JSON-Datastores/spiele.json')
  .then(res => res.json())
  .then(data => {
    const allGames = data.spiele || [];
    // Nur Spiele mit vollständigen Daten (mit icon, rating, etc.)
    homeGames = allGames.filter(g => g.icon && g.rating).slice(0, 4);
    renderFeaturedGames();
  })
  .catch(err => console.error('Fehler beim Laden:', err));

function renderFeaturedGames() {
  const gameList = document.getElementById('game-list');
  if (!gameList) return;
  
  gameList.innerHTML = '';
  
  homeGames.forEach((game, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${i * 0.1}s`;
    
    const tags = (game.tags || []).slice(0, 2).map(t => `<span class="tag-badge">${t}</span>`).join('');
    
    card.innerHTML = `
      <div class="card-header">
        <div class="game-icon" style="background: linear-gradient(135deg, ${game.color}, ${game.color2}); width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
          ${game.icon}
        </div>
        <div class="game-title">
          <h3>${game.title}</h3>
          <p>${game.short || ''}</p>
        </div>
      </div>
      
      <div class="card-body">
        <p>${game.desc}</p>
      </div>
      
      <div class="card-meta">
        <div class="tags-row">
          ${tags}
        </div>
        <div class="rating">
          ${'★'.repeat(game.rating)}${'☆'.repeat(5 - game.rating)}
        </div>
      </div>
      
      <div class="card-footer">
        <small>${game.players} • ${game.time}</small>
        <a href="${game.link}" class="btn-play">→ Spielen</a>
      </div>
    `;
    
    gameList.appendChild(card);
  });
}