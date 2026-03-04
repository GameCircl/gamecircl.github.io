/* ────────────────────────────────────
   INDEX.JS - HOMEPAGE FUNCTIONALITY
──────────────────────────────────── */

/* ────────────── FAQ ACCORDION ────────────── */
function initFAQ() {
  const faqToggles = document.querySelectorAll('.faq-toggle');

  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const answer = this.nextElementSibling;
      const isOpen = this.classList.contains('active');

      // Schließe alle anderen FAQs (Accordion-Modus)
      faqToggles.forEach(t => {
        if (t !== this && t.classList.contains('active')) {
          t.classList.remove('active');
          const otherAnswer = t.nextElementSibling;
          otherAnswer?.classList.remove('visible');
        }
      });

      // Toggle diese Antwort
      this.classList.toggle('active');
      answer?.classList.toggle('visible');

      // Smooth scroll zur Antwort, falls geöffnet
      if (!isOpen && answer) {
        setTimeout(() => {
          answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 200);
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

/* ────────────── FEATURED GAMES LADEN ────────────── */
async function loadFeaturedGames() {
  try {
    const res = await fetch('JSON-Datastores/spiele.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Fehler beim Laden des Spieleverzeichnisses');
    const data = await res.json();
    const allGames = data.spiele || data;

    if (!Array.isArray(allGames)) throw new Error('Ungültiges Datenformat');

    // Sortiere nach Popularität und nehme die Top 4
    const featured = [...allGames]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 4);

    renderFeaturedGames(featured);
  } catch (err) {
    console.error('Fehler beim Laden der Spiele:', err);
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

function renderFeaturedGames(games) {
  const gameList = document.getElementById('game-list');
  if (!gameList || !games.length) return;

  gameList.innerHTML = '';

  games.forEach((game, index) => {
    const card = document.createElement('article');
    card.className = 'featured-card';
    card.style.setProperty('--card-color-1', game.color || '#00ffff');
    card.style.setProperty('--card-color-2', game.color2 || game.color || '#00cccc');
    card.style.animationDelay = `${index * 100}ms`;

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
          ${game.difficulty ? `<div class="featured-card-meta-item">⚙️ ${game.difficulty}</div>` : ''}
        </div>
      </div>

      <div class="featured-card-footer">
        <div class="featured-card-rating">${stars}</div>
        <button class="featured-card-btn" data-link="${game.link || '#'}" data-title="${game.title}" title="Spiel starten">▶ Spielen</button>
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

/* ────────────── PAGE INTERACTIONS ────────────── */
function setupPageInteractions() {
  // CTA Start Button
  const ctaStartBtn = document.getElementById('ctaStartBtn');
  if (ctaStartBtn) {
    ctaStartBtn.addEventListener('click', () => {
      window.location.href = 'spiele.html';
    });
  }

  // Start Button im Hero
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      window.location.href = 'spiele.html';
    });
  }

  // Learn More Button
  const learnMoreBtn = document.getElementById('learnMore');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      const whySection = document.querySelector('.why-section');
      if (whySection) {
        whySection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/* ────────────── SCROLL REVEAL ────────────── */
function revealElements() {
  const elements = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

/* ────────────── DOM CONTENT LOADED ────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedGames();
  initFAQ();
  animateCounters();
  setupPageInteractions();
  revealElements();
});
