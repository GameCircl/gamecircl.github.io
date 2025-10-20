const gameList = document.getElementById('game-list');
const gamesGrid = document.getElementById('games-grid');


/* -------------------------
   DATEN LADEN (nur noch spiele.json)
------------------------- */
let games = [];
fetch('spiele.json')
  .then(res => res.json())
  .then(data => { 
    games = data.spiele || [];
    renderHomeGames();
  })
  .catch(err => console.error('Fehler beim Laden der spiele.json:', err));

/* -------------------------
   HOMEPAGE: 4 zufällige Spiele anzeigen
------------------------- */
function renderHomeGames() {
  if(!gameList) return;
  gameList.innerHTML = '';

  // Array mischen
  const shuffled = [...games].sort(() => 0.5 - Math.random());
  const homeGames = shuffled.slice(0,4); // nur 4

  homeGames.forEach((g,i) => {
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
        <div class="rating">${'★'.repeat(g.rating)}${'☆'.repeat(5-g.rating)}</div>
      </div>
      <p>${g.short || g.desc}</p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <small style="color:var(--muted)">${g.players}</small>
        <button class="btn" onclick="location.href='${g.link}'">→</button>
      </div>
    `;
    gameList.appendChild(el);
  });
}