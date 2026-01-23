const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

let gameState = {
  teams: [],
  currentTeamIndex: 0,
  round: 1,
  maxRounds: 5,
  gameActive: false,
  gameStarted: false
};

const challenges = [
  '🎯 Wie viele Liegestütze schaffst du?',
  '⏱️ Wie lange kannst du auf einem Bein stehen?',
  '🔤 Wie viele Wörter kannst du in 30 Sekunden aufzählen?',
  '🎵 Wie lange hältst du einen Ton?',
  '💪 Wie lange Plank?',
  '👟 Wie weit kannst du springen?',
  '🎲 Wie oft kannst du eine Münze werfen?',
  '🧮 Wie schnell kannst du bis 100 zählen?'
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  setupTheme();
  setupSidebar();
  setupGameUI();
});

function setupGameUI() {
  qs('#addTeamBtn').addEventListener('click', addTeam);
  qs('#teamName').addEventListener('keypress', e => {
    if (e.key === 'Enter') addTeam();
  });
  qs('#startGameBtn').addEventListener('click', startGame);
  qs('#submitBetBtn').addEventListener('click', submitBet);
  qs('#playAgainBtn').addEventListener('click', resetGame);
}

function addTeam() {
  const name = qs('#teamName').value.trim();
  if (!name) {
    qs('#teamName').focus();
    return;
  }

  if (gameState.teams.length >= 10) {
    alert('Maximum 10 Teams!');
    return;
  }

  gameState.teams.push({ name, bet: 0, id: 't_' + Date.now() });
  qs('#teamName').value = '';
  renderTeamsList();
  updateStartButton();
}

function renderTeamsList() {
  const list = qs('#teamsList');
  list.innerHTML = '';
  gameState.teams.forEach((t, i) => {
    const badge = document.createElement('span');
    badge.className = 'player-badge';
    badge.innerHTML = `${t.name} <span class="player-badge-remove" onclick="removeTeam(${i})">×</span>`;
    list.appendChild(badge);
  });
}

function removeTeam(index) {
  gameState.teams.splice(index, 1);
  renderTeamsList();
  updateStartButton();
}

function updateStartButton() {
  const btn = qs('#startGameBtn');
  const canStart = gameState.teams.length >= 2;
  btn.disabled = !canStart;
  btn.textContent = canStart ? '🎮 Spiel starten' : `👥 Mind. 2 Teams (${gameState.teams.length})`;
}

function startGame() {
  if (gameState.teams.length < 2) return;

  gameState.gameActive = true;
  gameState.gameStarted = true;
  gameState.currentTeamIndex = 0;
  gameState.round = 1;

  qs('#gameSetup').classList.add('hidden');
  qs('#gamePlay').classList.remove('hidden');
  displayCurrentTeam();
}

function displayCurrentTeam() {
  const team = gameState.teams[gameState.currentTeamIndex];
  const progress = gameState.currentTeamIndex + 1;
  const total = gameState.teams.length;

  qs('#currentTeam').textContent = team.name;
  qs('#teamDisplay').textContent = team.name.charAt(0).toUpperCase();
  qs('#roundInfo').textContent = `Runde ${gameState.round} — Team ${progress}/${total}`;

  const percent = (progress / total) * 100;
  qs('#progressFill').style.width = percent + '%';
  qs('#progressText').textContent = `${progress}/${total} Teams haben gewettet`;

  const challenge = challenges[Math.floor(Math.random() * challenges.length)];
  qs('#challengeText').textContent = challenge;
  qs('#betInput').value = '';
  qs('#betInput').focus();
}

function submitBet() {
  const bet = parseInt(qs('#betInput').value, 10);
  if (isNaN(bet) || bet < 0) {
    alert('Bitte gib eine gültige Zahl ein!');
    return;
  }

  gameState.teams[gameState.currentTeamIndex].bet = bet;
  gameState.currentTeamIndex++;

  if (gameState.currentTeamIndex >= gameState.teams.length) {
    if (gameState.round < gameState.maxRounds) {
      gameState.round++;
      gameState.currentTeamIndex = 0;
      displayCurrentTeam();
    } else {
      finishGame();
    }
  } else {
    displayCurrentTeam();
  }
}

function finishGame() {
  gameState.gameActive = false;
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.remove('hidden');
  renderResults();
}

function renderResults() {
  const list = qs('#resultsList');
  list.innerHTML = '';
  gameState.teams.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-position">${i + 1}. 🎲</div>
      <div class="result-info">
        <h3>${t.name}</h3>
        <div class="result-stats">
          <div>💰 Gewette: ${t.bet} Punkte</div>
          <div>🎮 ${gameState.round} Runden</div>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function resetGame() {
  gameState = {
    teams: [],
    currentTeamIndex: 0,
    round: 1,
    maxRounds: 5,
    gameActive: false,
    gameStarted: false
  };
  qs('#gameSetup').classList.remove('hidden');
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.add('hidden');
  qs('#teamsList').innerHTML = '';
  updateStartButton();
}

function setupTheme() {
  const saved = localStorage.getItem('gc-theme') || 'auto';
  const themeMarker = qs('#themeMarker');
  if (saved === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', saved);
  }
  themeMarker.style.transform = saved === 'auto' ? 'translateX(0)' : (saved === 'light' ? 'translateX(100%)' : 'translateX(200%)');
  qsa('.theme-points span').forEach(el => {
    el.addEventListener('click', () => {
      const mode = el.dataset.mode;
      localStorage.setItem('gc-theme', mode);
      location.reload();
    });
  });
}

function setupSidebar() {
  const toggle = qs('#sidebarToggle');
  const sidebar = qs('#sidebar');
  const overlay = qs('#sidebarOverlay');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    });
  }
}
