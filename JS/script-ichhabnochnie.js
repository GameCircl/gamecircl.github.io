const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

let gameState = {
  players: [],
  currentPlayerIndex: 0,
  questionsAsked: 0,
  maxRounds: 10,
  roundsMode: 'limited',
  gameActive: false,
  gameStarted: false
};

const statements = [
  "...im Regen getanzt",
  "...einen Horrorfilm nicht zu Ende geschaut",
  "...ein Lied im Auto laut gesungen",
  "...mich verlaufen",
  "...einen Film 2x hintereinander geschaut",
  "...Sushi gegessen",
  "...eine Lüge sagen musste",
  "...einen Fehler gleich gestanden",
  "...nachts wach gelegen und über etwas nachgedacht",
  "...Albträume gehabt",
  "...jemanden um Verzeihung gebeten",
  "...einen Fehler wiederholt",
  "...etwas bereut",
  "...heimlich gelacht",
  "...jemanden vermisst",
  "...eine Überraschung bekommen",
  "...spontan eine Party geschmissen",
  "...einen Unfall gehabt",
  "...ein Geheimnis verraten",
  "...jemanden nett überrascht",
  "...ein böses Wort gesagt",
  "...nachts spielen gegangen",
  "...jemanden tief verletzt",
  "...jemandem verzeihen",
  "...etwas Mutiges getan",
  "...mich unsterblich verliebt",
  "...in einem See gebadet",
  "...ein Konzert besucht",
  "...einen Preis gewonnen",
  "...etwas bereut"
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  setupTheme();
  setupSidebar();
  setupGameUI();
});

function setupGameUI() {
  qs('#addPlayerBtn').addEventListener('click', addPlayer);
  qs('#playerName').addEventListener('keypress', e => {
    if (e.key === 'Enter') addPlayer();
  });
  qsa('.rounds-option input').forEach(input => {
    input.addEventListener('change', function() {
      qsa('.rounds-option').forEach(o => o.classList.remove('active'));
      this.closest('.rounds-option').classList.add('active');
      gameState.roundsMode = this.dataset.mode;
      if (this.dataset.mode === 'limited') {
        gameState.maxRounds = parseInt(this.dataset.rounds, 10);
      }
    });
  });
  qs('#startGameBtn').addEventListener('click', startGame);
  qs('#nextQuestionBtn').addEventListener('click', nextPlayer);
  qs('#rerollBtn').addEventListener('click', rerollQuestion);
  qs('#playAgainBtn').addEventListener('click', resetGame);
}

function addPlayer() {
  const name = qs('#playerName').value.trim();
  if (!name) return;
  if (gameState.players.length >= 12) {
    alert('Max 12 Spieler!');
    return;
  }
  gameState.players.push({ name, id: 'p_' + Date.now() });
  qs('#playerName').value = '';
  renderPlayersList();
  updateStartButton();
}

function renderPlayersList() {
  const list = qs('#playersList');
  list.innerHTML = '';
  gameState.players.forEach((p, i) => {
    const badge = document.createElement('span');
    badge.className = 'player-badge';
    badge.innerHTML = `${p.name} <span class="player-badge-remove" onclick="removePlayer(${i})">×</span>`;
    list.appendChild(badge);
  });
}

function removePlayer(index) {
  gameState.players.splice(index, 1);
  renderPlayersList();
  updateStartButton();
}

function updateStartButton() {
  const btn = qs('#startGameBtn');
  const canStart = gameState.players.length >= 2;
  btn.disabled = !canStart;
  btn.textContent = canStart ? '🎮 Spiel starten' : `👥 Mind. 2 Spieler`;
}

function startGame() {
  if (gameState.players.length < 2) return;
  gameState.gameActive = true;
  gameState.gameStarted = true;
  gameState.currentPlayerIndex = 0;
  gameState.questionsAsked = 0;
  if (gameState.roundsMode === 'limited') {
    gameState.maxRounds = gameState.maxRounds * gameState.players.length;
  }
  qs('#gameSetup').classList.add('hidden');
  qs('#gamePlay').classList.remove('hidden');
  displayCurrentPlayer();
}

function displayCurrentPlayer() {
  const player = gameState.players[gameState.currentPlayerIndex];
  const progress = gameState.questionsAsked;
  const total = gameState.maxRounds === Infinity ? '∞' : gameState.maxRounds;
  qs('#playerNameDisplay').textContent = player.name;
  qs('#playerAvatar').textContent = player.name.charAt(0).toUpperCase();
  qs('#playerRound').textContent = `Frage ${progress + 1} ${total !== '∞' ? `von ${total}` : '(∞)'}`;
  const percent = gameState.maxRounds !== Infinity ? (progress / gameState.maxRounds) * 100 : 50;
  qs('#progressFill').style.width = Math.min(percent, 100) + '%';
  qs('#progressText').textContent = gameState.maxRounds === Infinity ? `Frage ${progress + 1}` : `${progress}/${gameState.maxRounds}`;
  showQuestion();
}

function showQuestion() {
  const statement = statements[Math.floor(Math.random() * statements.length)];
  qs('#questionText').textContent = '🍻 Ich hab noch nie ' + statement;
}

function rerollQuestion() {
  showQuestion();
}

function nextPlayer() {
  gameState.questionsAsked++;
  gameState.currentPlayerIndex++;
  if (gameState.currentPlayerIndex >= gameState.players.length) {
    gameState.currentPlayerIndex = 0;
  }
  if (gameState.roundsMode === 'limited' && gameState.questionsAsked >= gameState.maxRounds) {
    finishGame();
    return;
  }
  displayCurrentPlayer();
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
  gameState.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-position">${['🥇', '🥈', '🥉'][i] || '✨'}</div>
      <div class="result-info">
        <h3>${p.name}</h3>
        <div class="result-stats">
          <div>👥 Spieler ${i + 1}/${gameState.players.length}</div>
          <div>🎮 ${gameState.questionsAsked} Fragen</div>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function resetGame() {
  gameState = { players: [], currentPlayerIndex: 0, questionsAsked: 0, maxRounds: 10, roundsMode: 'limited', gameActive: false, gameStarted: false };
  qs('#gameSetup').classList.remove('hidden');
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.add('hidden');
  qs('#playersList').innerHTML = '';
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
      localStorage.setItem('gc-theme', el.dataset.mode);
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
