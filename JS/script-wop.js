/* ════════════════════════════════════════════════════════
   WAHRHEIT ODER PFLICHT - KOMPLETTES REMAKE (mit Strafaufgaben)
═════════════════════════════════════════════════════════ */

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* ────── GAME STATE ────── */
let gameState = {
  players: [],
  selectedCategories: [],
  selectedRegion: 'de-de',
  currentPlayerIndex: 0,
  questionsAsked: 0,
  maxRounds: 10,
  roundsMode: 'limited',
  gameActive: false,
  gameStarted: false
};

let questionsData = { truth: {}, dare: {}, penalty: {} };
let currentGender = null;
let usedQuestions = new Set();

/* ────── DOCUMENT READY ────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  
  setupTheme();
  setupSidebar();
  setupLoginModal();
  loadQuestions();
  setupGameUI();
  loadGameState();
});

/* ────── LOAD/SAVE STATE ────── */
function saveGameState() {
  const state = {
    players: gameState.players,
    selectedCategories: gameState.selectedCategories,
    selectedRegion: gameState.selectedRegion,
    currentPlayerIndex: gameState.currentPlayerIndex,
    questionsAsked: gameState.questionsAsked,
    maxRounds: gameState.maxRounds,
    roundsMode: gameState.roundsMode,
    gameActive: gameState.gameActive,
    gameStarted: gameState.gameStarted
  };
  localStorage.setItem('gc_wop_state', JSON.stringify(state));
}

function loadGameState() {
  const saved = localStorage.getItem('gc_wop_state');
  if (!saved) return;
  
  try {
    const state = JSON.parse(saved);
    if (state.gameStarted && state.gameActive) {
      gameState = { ...gameState, ...state };
      qs('#gameSetup').classList.add('hidden');
      qs('#gamePlay').classList.remove('hidden');
      displayCurrentPlayer();
    }
  } catch (e) {
    console.error('Fehler beim Laden:', e);
    localStorage.removeItem('gc_wop_state');
  }
}

function clearGameState() {
  localStorage.removeItem('gc_wop_state');
}

/* ────── LOAD QUESTIONS ────── */
async function loadQuestions() {
  try {
    const res = await fetch('JSON-Datastores/wop-questions.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Fehler beim Laden');
    const data = await res.json();
    questionsData = data;
  } catch (err) {
    console.error('Fehler:', err);
    questionsData = createFallbackQuestions();
  }
}

/* ────── SETUP GAME UI ────── */
function setupGameUI() {
  qs('#addPlayerBtn').addEventListener('click', addPlayer);
  qs('#playerName').addEventListener('keypress', e => {
    if (e.key === 'Enter') addPlayer();
  });

  // Gender buttons
  qsa('.gender-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.classList.contains('active')) {
        this.classList.remove('active');
        currentGender = null;
      } else {
        qsa('.gender-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentGender = this.dataset.gender;
      }
    });
  });

  // Rounds
  qsa('.rounds-option').forEach(opt => {
    opt.addEventListener('click', function() {
      qsa('.rounds-option').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      gameState.roundsMode = this.dataset.mode;
      if (this.dataset.mode === 'limited') {
        gameState.maxRounds = parseInt(this.dataset.rounds, 10);
      }
      updateStartButton();
    });
  });

  // Categories
  loadCategories();

  // Region
  qsa('.region-option').forEach(opt => {
    opt.addEventListener('click', function() {
      qsa('.region-option').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      gameState.selectedRegion = this.dataset.region;
    });
  });

  // Start
  qs('#startGameBtn').addEventListener('click', startGame);

  // Game controls
  qs('#nextQuestionBtn').addEventListener('click', nextPlayer);
  qs('#penaltyBtn').addEventListener('click', showPenalty);
  qs('#playAgainBtn').addEventListener('click', resetGame);

  window.addEventListener('beforeunload', () => {
    if (gameState.gameActive) saveGameState();
  });
}

/* ────── ADD PLAYER ────── */
function addPlayer() {
  const name = qs('#playerName').value.trim();
  
  if (!name) {
    qs('#playerName').focus();
    return;
  }

  if (!currentGender) {
    alert('Bitte Geschlecht/Kategorie wählen!');
    return;
  }

  if (gameState.players.length >= 12) {
    alert('Max 12 Spieler!');
    return;
  }

  gameState.players.push({
    name,
    gender: currentGender,
    id: 'player_' + Date.now() + Math.random()
  });

  qs('#playerName').value = '';
  currentGender = null;
  qsa('.gender-btn').forEach(b => b.classList.remove('active'));
  
  renderPlayersList();
  updateStartButton();
}

function renderPlayersList() {
  const list = qs('#playersList');
  list.innerHTML = '';

  gameState.players.forEach((player, i) => {
    const genderIcon = {
      'male': '♂️',
      'female': '♀️',
      'neutral': '⚪',
      'any': '👥'
    }[player.gender];

    const badge = document.createElement('span');
    badge.className = 'player-badge';
    badge.innerHTML = `
      ${player.name} ${genderIcon}
      <span class="player-badge-remove" onclick="removePlayer(${i})">×</span>
    `;
    list.appendChild(badge);
  });
}

function removePlayer(index) {
  gameState.players.splice(index, 1);
  renderPlayersList();
  updateStartButton();
}

/* ────── CATEGORIES ────── */
function loadCategories() {
  const categories = [
    { name: 'Liebe & Beziehungen', id: 'Liebe & Beziehungen', emoji: '💕' },
    { name: 'Körper & Gesundheit', id: 'Körper & Gesundheit', emoji: '💪' },
    { name: 'Geheimnisse', id: 'Geheimnisse', emoji: '🤐' },
    { name: 'Abenteuer', id: 'Abenteuer', emoji: '🚀' },
    { name: 'Peinlich', id: 'Peinlich', emoji: '😳' },
    { name: 'Mutprobe', id: 'Mutprobe', emoji: '⚡' }
  ];

  const grid = qs('#categoriesGrid');
  grid.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-btn active';
    btn.textContent = `${cat.emoji} ${cat.name}`;
    btn.dataset.id = cat.id;
    btn.addEventListener('click', function() {
      this.classList.toggle('active');
      updateSelectedCategories();
    });
    grid.appendChild(btn);
  });

  gameState.selectedCategories = categories.map(c => c.id);
  updateCategoryCount();
}

function updateSelectedCategories() {
  gameState.selectedCategories = qsa('.category-btn.active').map(btn => btn.dataset.id);
  updateCategoryCount();
}

function updateCategoryCount() {
  const count = qs('#selectedCategoryCount');
  count.textContent = gameState.selectedCategories.length;
}

function updateStartButton() {
  const btn = qs('#startGameBtn');
  const canStart = gameState.players.length >= 2 && gameState.selectedCategories.length > 0;
  btn.disabled = !canStart;
  btn.textContent = canStart ? '🎮 Spiel starten' : `👥 Mindestens 2 Spieler (${gameState.players.length})`;
}

/* ────── START GAME ────── */
function startGame() {
  if (gameState.players.length < 2 || gameState.selectedCategories.length === 0) return;

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

  saveGameState();
  qs('#gameSetup').classList.add('hidden');
  qs('#gamePlay').classList.remove('hidden');
  
  displayCurrentPlayer();
}

/* ────── DISPLAY CURRENT PLAYER ────── */
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

  updateGameStats(gameState.currentPlayerIndex);

  qs('#questionContainer').classList.add('hidden');
  qs('.choice-buttons').classList.remove('hidden');
  
  saveGameState();
}

/* ────── SELECT CHOICE ────── */
function selectChoice(type) {
  const question = getRandomQuestion(type);
  
  qs('.choice-buttons').classList.add('hidden');
  qs('#questionContainer').classList.remove('hidden');
  
  qs('#questionType').textContent = type === 'truth' ? '❓ WAHRHEIT' : '⚡ PFLICHT';
  qs('#questionText').textContent = question;
  
  qs('#questionContainer').dataset.type = type;
  qs('#questionContainer').dataset.lastQuestion = question;
  
  // Zeige/verstecke Penalty Button basierend auf Type
  const penaltyBtn = qs('#penaltyBtn');
  if (penaltyBtn) {
    penaltyBtn.dataset.type = type;
    penaltyBtn.textContent = type === 'truth' ? '🔥 Strafaufgabe' : '🔥 Strafrage';
    penaltyBtn.style.display = 'block';
  }
}

/* ────── GET RANDOM QUESTION ────── */
function getRandomQuestion(type) {
  const categories = gameState.selectedCategories || [];
  
  if (categories.length === 0) {
    return `Denke dir eine ${type === 'truth' ? 'Wahrheit' : 'Pflicht'} aus!`;
  }

  let allQuestions = [];
  categories.forEach(catId => {
    const catQuestions = questionsData[type]?.[catId] || [];
    allQuestions = allQuestions.concat(catQuestions);
  });

  if (allQuestions.length === 0) {
    return `Denke dir eine ${type === 'truth' ? 'Wahrheit' : 'Pflicht'} aus!`;
  }

  let question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
  
  let attempts = 0;
  while (usedQuestions.has(question) && attempts < 5 && allQuestions.length > 10) {
    question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    attempts++;
  }

  usedQuestions.add(question);
  return question;
}

/* ────── SHOW PENALTY (Strafaufgabe/Strafrage) ────── */
function showPenalty() {
  const type = qs('#questionContainer').dataset.type;
  const penaltyType = type === 'truth' ? 'Strafaufgabe' : 'Strafrage';
  const penaltyQuestions = questionsData.penalty?.[penaltyType] || [];
  
  if (penaltyQuestions.length === 0) {
    alert('Keine Strafaufgaben verfügbar!');
    return;
  }
  
  const penalty = penaltyQuestions[Math.floor(Math.random() * penaltyQuestions.length)];
  
  qs('#questionText').textContent = penalty;
  qs('#questionType').textContent = type === 'truth' ? '🔥 STRAFAUFGABE' : '🔥 STRAFRAGE';
  qs('#questionContainer').dataset.isPenalty = 'true';
  
  // Verstecke Penalty Button nach dem Klick
  const penaltyBtn = qs('#penaltyBtn');
  if (penaltyBtn) penaltyBtn.style.display = 'none';
}

/* ────── NEXT PLAYER ────── */
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

/* ────── FINISH GAME ────── */
function finishGame() {
  gameState.gameActive = false;
  
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.remove('hidden');
  
  clearGameState();
  renderResults();
}

/* ────── RENDER RESULTS ────── */
function renderResults() {
  const resultsList = qs('#resultsList');
  resultsList.innerHTML = '';

  gameState.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = (i * 0.1) + 's';
    
    const medal = ['🥇', '🥈', '🥉', '⭐'][i] || '✨';
    const roundText = gameState.roundsMode === 'unlimited' 
      ? `${gameState.questionsAsked} Fragen` 
      : `${gameState.maxRounds} Fragen`;
    
    card.innerHTML = `
      <div class="result-position">${medal}</div>
      <div class="result-info">
        <h3>${p.name}</h3>
        <div class="result-stats">
          <div>👥 ${p.gender === 'any' ? 'Alle' : p.gender}</div>
          <div>🎮 ${roundText}</div>
        </div>
      </div>
    `;
    resultsList.appendChild(card);
  });
}

/* ────── UPDATE GAME STATS ────── */
function updateGameStats(activeIndex) {
  const statsList = qs('#gameStats');
  statsList.innerHTML = '';

  gameState.players.forEach((p, i) => {
    const stat = document.createElement('div');
    stat.className = 'stat-player' + (i === activeIndex ? ' active' : '');
    stat.innerHTML = `
      <div class="stat-player-name">${p.name}</div>
      <div class="stat-player-info">Spieler ${i + 1}/${gameState.players.length}</div>
    `;
    statsList.appendChild(stat);
  });
}

/* ────── RESET GAME ────── */
function resetGame() {
  clearGameState();
  
  gameState = {
    players: [],
    selectedCategories: [],
    selectedRegion: 'de-de',
    currentPlayerIndex: 0,
    questionsAsked: 0,
    maxRounds: 10,
    roundsMode: 'limited',
    gameActive: false,
    gameStarted: false
  };

  currentGender = null;
  usedQuestions.clear();

  qs('#gameSetup').classList.remove('hidden');
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.add('hidden');
  
  qs('#playersList').innerHTML = '';
  qsa('.gender-btn').forEach(b => b.classList.remove('active'));
  qsa('.rounds-option').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });
  
  updateStartButton();
}

/* ────── THEME ────── */
function setupTheme() {
  const themeMarker = qs('#themeMarker');
  const themePoints = qs('.theme-points');
  
  if (!themePoints) return;

  function applyTheme(mode) {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      themeMarker.style.transform = 'translateX(0)';
    } else if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeMarker.style.transform = 'translateX(100%)';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeMarker.style.transform = 'translateX(200%)';
    }
    localStorage.setItem('gc-theme', mode);
  }

  const saved = localStorage.getItem('gc-theme') || 'auto';
  applyTheme(saved);
  
  qsa('.theme-points span').forEach(el => {
    el.addEventListener('click', () => applyTheme(el.dataset.mode));
  });
}

/* ────── SIDEBAR ────── */
function setupSidebar() {
  const sidebarToggle = qs('#sidebarToggle');
  const sidebar = qs('#sidebar');
  const sidebarOverlay = qs('#sidebarOverlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.remove('hidden');
      sidebarToggle.classList.add('hide');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.add('hidden');
      if (sidebarToggle) sidebarToggle.classList.remove('hide');
    });
  }
}

/* ────── LOGIN ────── */
function setupLoginModal() {
  const openLogin = qs('#openLogin');
  const modal = qs('#modal');
  const modalClose = qs('#modalClose');

  if (openLogin) {
    openLogin.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
}

/* ────── FALLBACK QUESTIONS ────── */
function createFallbackQuestions() {
  return {
    truth: {
      'Liebe & Beziehungen': ['Hattest du schon mal einen Crush?', 'Was ist dein Idealtyp?'],
      'Körper & Gesundheit': ['Wie oft machst du Sport?', 'Was ist deine größte Unsicherheit?'],
      'Geheimnisse': ['Welches Geheimnis hast du?', 'Hast du schon mal gelogen?'],
      'Abenteuer': ['Was ist das Verrückteste, das du getan hast?', 'Wo möchtest du gerne hin?'],
      'Peinlich': ['Was ist die peinlichste Sache, die dir passiert ist?', 'Hast du schon mal im Freien geweint?'],
      'Mutprobe': ['Würdest du abschreiben?', 'Hast du schon mal etwas Illegales getan?']
    },
    dare: {
      'Liebe & Beziehungen': ['Gib jemandem einen Kuss!', 'Mache jemandem ein Kompliment!'],
      'Körper & Gesundheit': ['Mache 15 Liegestütze!', 'Tanze 30 Sekunden lang!'],
      'Geheimnisse': ['Teile dein Passwort!', 'Lese deine letzte SMS vor!'],
      'Abenteuer': ['Ruf jemanden an!', 'Gehe nach draußen!'],
      'Peinlich': ['Mache komische Grimassen!', 'Ahme jemanden nach!'],
      'Mutprobe': ['Iss etwas Verrücktes!', 'Tue etwas Mutiges!']
    },
    penalty: {
      'Strafaufgabe': ['Laufe wild herum!', 'Tauche deine Hand in Eiswasser!'],
      'Straffrage': ['Wann hast du zuletzt...?', 'Hast du jemals...?']
    }
  };
}
