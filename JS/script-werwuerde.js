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

let questionsData = [];
let usedQuestions = new Set();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  setupTheme();
  setupSidebar();
  loadQuestions();
  setupGameUI();
});

async function loadQuestions() {
  questionsData = [
    "...auf eine Party gehen, obwohl niemand andere kennt?",
    "...im Supermarkt Ware einfach stehen lassen?",
    "...öffentlich singen?",
    "...einen Horrorfilm nicht bis zum Ende schauen?",
    "...sich schämen, wenn jemand eine falsche Frage stellt?",
    "...einen unerwarteten Anruf ignorieren?",
    "...eine Lüge sagen, um Zeit zu sparen?",
    "...barfuß im Winter rausgehen?",
    "...bei einem schlechten Film bleiben?",
    "...ohne Frühstück rausgehen?",
    "...eine Nachricht 3x durchlesen vor dem Senden?",
    "...im Dunkeln ins Bett springen?",
    "...einen Fehler zugeben?",
    "...mit Schuhen ins Bett gehen?",
    "...einen Film 2x schauen?",
    "...vergeblich für jemanden warten?",
    "...eine Spinne ignorieren?",
    "...beim Zahnarzt weinen?",
    "...den falschen Namen nennen?",
    "...einen Freund vergessen?",
    "...bei Regen spielen gehen?",
    "...zu einer Party ohne Geschenk gehen?",
    "...einen Horror-Lift nehmen?",
    "...das Essen anderer testen?",
    "...den Weg fragen, obwohl man eine Karte hat?",
    "...Text vor dem Senden löschen?",
    "...nach Fremden zum Datum fragen?",
    "...im Restaurant Essen zurückgeben?",
    "...ein Bad mit zu heißem Wasser nehmen?",
    "...eine Einladung ablehnen?"
  ];
}

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
      updateStartButton();
    });
  });

  qs('#startGameBtn').addEventListener('click', startGame);
  qs('#nextQuestionBtn').addEventListener('click', nextPlayer);
  qs('#rerollBtn').addEventListener('click', rerollQuestion);
  qs('#playAgainBtn').addEventListener('click', resetGame);
}

function addPlayer() {
  const name = qs('#playerName').value.trim();
  if (!name) {
    qs('#playerName').focus();
    return;
  }

  if (gameState.players.length >= 12) {
    alert('Maximum 12 Spieler!');
    return;
  }

  gameState.players.push({ name, id: 'p_' + Date.now() + Math.random() });
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
  btn.textContent = canStart ? '🎮 Spiel starten' : `👥 Mind. 2 Spieler (${gameState.players.length})`;
}

function startGame() {
  if (gameState.players.length < 2) return;

  gameState.gameActive = true;
  gameState.gameStarted = true;
  gameState.currentPlayerIndex = 0;
  gameState.questionsAsked = 0;
  usedQuestions.clear();

  if (gameState.roundsMode === 'limited') {
    gameState.maxRounds = gameState.maxRounds * gameState.players.length;
  } else {
    gameState.maxRounds = Infinity;
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

  if (gameState.maxRounds !== Infinity) {
    const percent = Math.min((progress / gameState.maxRounds) * 100, 100);
    qs('#progressFill').style.width = percent + '%';
  } else {
    qs('#progressFill').style.width = '50%';
  }

  qs('#progressText').textContent = gameState.maxRounds === Infinity
    ? `Frage ${progress + 1} (Kein Limit)`
    : `${progress}/${gameState.maxRounds}`;

  showQuestion();
}

function showQuestion() {
  const question = getRandomQuestion();
  qs('#questionText').textContent = '👥 ' + question;
}

function getRandomQuestion() {
  let question = questionsData[Math.floor(Math.random() * questionsData.length)];
  let attempts = 0;
  while (usedQuestions.has(question) && attempts < 5 && questionsData.length > 10) {
    question = questionsData[Math.floor(Math.random() * questionsData.length)];
    attempts++;
  }
  usedQuestions.add(question);
  return question;
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
  const medals = ['🥇', '🥈', '🥉'];
  gameState.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-position">${medals[i] || '✨'}</div>
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
  gameState = {
    players: [],
    currentPlayerIndex: 0,
    questionsAsked: 0,
    maxRounds: 10,
    roundsMode: 'limited',
    gameActive: false,
    gameStarted: false
  };
  usedQuestions.clear();
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
