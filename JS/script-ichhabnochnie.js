const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

let gameState = {
  questions: [],
  currentIndex: 0,
  questionsAsked: 0,
  maxRounds: 20,
  selectedCategories: new Set(['funny', 'spicy', 'cringe', 'personal', 'deep']),
  drinkMode: 'shot',
  wildMode: false,
  gameActive: false
};

const categories = [
  { key: 'funny', label: 'Locker & Lustig' },
  { key: 'spicy', label: 'Spicy' },
  { key: 'cringe', label: 'Cringe' },
  { key: 'personal', label: 'Persönlich' },
  { key: 'deep', label: 'Deep' }
];

const statements = [
  { text: "...im Regen getanzt", category: 'funny' },
  { text: "...einen Horrorfilm nicht zu Ende geschaut", category: 'cringe' },
  { text: "...ein Lied im Auto laut gesungen", category: 'funny' },
  { text: "...mich verlaufen", category: 'cringe' },
  { text: "...einen Film 2x hintereinander geschaut", category: 'funny' },
  { text: "...Sushi gegessen", category: 'funny' },
  { text: "...eine Lüge sagen musste", category: 'spicy' },
  { text: "...einen Fehler gleich gestanden", category: 'personal' },
  { text: "...nachts wach gelegen und über etwas nachgedacht", category: 'deep' },
  { text: "...Albträume gehabt", category: 'cringe' },
  { text: "...jemanden um Verzeihung gebeten", category: 'personal' },
  { text: "...einen Fehler wiederholt", category: 'spicy' },
  { text: "...etwas bereut", category: 'deep' },
  { text: "...heimlich gelacht", category: 'funny' },
  { text: "...jemanden vermisst", category: 'personal' },
  { text: "...eine Überraschung bekommen", category: 'personal' },
  { text: "...spontan eine Party geschmissen", category: 'funny' },
  { text: "...einen Unfall gehabt", category: 'deep' },
  { text: "...ein Geheimnis verraten", category: 'spicy' },
  { text: "...jemanden nett überrascht", category: 'funny' },
  { text: "...ein böses Wort gesagt", category: 'cringe' },
  { text: "...nachts spielen gegangen", category: 'funny' },
  { text: "...jemanden tief verletzt", category: 'deep' },
  { text: "...jemandem verzeihen", category: 'personal' },
  { text: "...etwas Mutiges getan", category: 'deep' },
  { text: "...mich unsterblich verliebt", category: 'spicy' },
  { text: "...in einem See gebadet", category: 'funny' },
  { text: "...ein Konzert besucht", category: 'funny' },
  { text: "...einen Preis gewonnen", category: 'spicy' },
  { text: "...etwas bereut", category: 'deep' },
  { text: "...ein Geheimnis ausgeplaudert, das nicht deins war", category: 'wild' },
  { text: "...jemanden auf WhatsApp geschrieben, während du ihn im echten Leben siehst", category: 'wild' },
  { text: "...beim Karaoke komplett aus dem Takt geraten", category: 'wild' }
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  setupTheme();
  setupSidebar();
  setupGameUI();
});

function setupGameUI() {
  const startBtn = qs('#startGameBtn');
  if (startBtn) startBtn.addEventListener('click', startGame);

  const nextBtn = qs('#nextQuestionBtn');
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

  const rerollBtn = qs('#rerollBtn');
  if (rerollBtn) rerollBtn.addEventListener('click', rerollQuestion);

  const playAgainBtn = qs('#playAgainBtn');
  if (playAgainBtn) playAgainBtn.addEventListener('click', resetGame);

  const roundsRange = qs('#roundsRange');
  if (roundsRange) {
    roundsRange.addEventListener('input', updateRoundsValue);
    updateRoundsValue();
  }

  const categoriesGrid = qs('#categoriesGrid');
  if (categoriesGrid) {
    categoriesGrid.addEventListener('click', event => {
      const button = event.target.closest('.category-btn');
      if (!button) return;
      button.classList.toggle('active');
      const categoryKey = button.dataset.category;
      if (!categoryKey) return;
      if (gameState.selectedCategories.has(categoryKey)) {
        gameState.selectedCategories.delete(categoryKey);
      } else {
        gameState.selectedCategories.add(categoryKey);
      }
    });
  }

  const modeButtons = qsa('.mode-btn');
  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      modeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      gameState.drinkMode = button.dataset.mode;
      updateRuleText();
    });
  });

  const wildBoostBtn = qs('#wildBoostBtn');
  if (wildBoostBtn) {
    wildBoostBtn.addEventListener('click', () => {
      gameState.wildMode = !gameState.wildMode;
      wildBoostBtn.classList.toggle('active', gameState.wildMode);
    });
  }
}

function startGame() {
  if (gameState.gameActive) return;

  const roundsRange = qs('#roundsRange');
  gameState.maxRounds = roundsRange ? parseInt(roundsRange.value, 10) : 20;

  gameState.questions = getSelectedQuestions();
  if (gameState.questions.length === 0) {
    gameState.questions = shuffleArray(statements);
  }
  if (gameState.questions.length < gameState.maxRounds) {
    gameState.maxRounds = gameState.questions.length;
  }
  gameState.questions = gameState.questions.slice(0, gameState.maxRounds);

  gameState.currentIndex = 0;
  gameState.questionsAsked = 0;
  gameState.gameActive = true;

  qs('#gameSetup').classList.add('hidden');
  qs('#gameFinished').classList.add('hidden');
  qs('#gamePlay').classList.remove('hidden');

  displayCurrentQuestion(true);
}

function getSelectedQuestions() {
  const selected = gameState.selectedCategories.size ? Array.from(gameState.selectedCategories) : categories.map(c => c.key);
  if (gameState.wildMode) selected.push('wild');
  return shuffleArray(statements.filter(statement => selected.includes(statement.category)));
}

function updateRoundsValue() {
  const roundsRange = qs('#roundsRange');
  const roundsValue = qs('#roundsValue');
  if (!roundsRange || !roundsValue) return;
  roundsValue.textContent = roundsRange.value;
}

function updateRuleText() {
  const ruleText = gameState.drinkMode === 'sip' ? 'Jeder, der es schon gemacht hat, nimmt einen Schluck.' : 'Jeder, der es schon gemacht hat, nimmt einen Shot.';
  const desc = qs('#gamePlay .section-desc');
  if (desc) desc.textContent = ruleText;
}

function displayCurrentQuestion(first = false) {
  const total = gameState.maxRounds;
  const progress = gameState.questionsAsked + 1;
  const statement = gameState.questions[gameState.currentIndex];

  qs('#questionText').textContent = `🍻 Ich hab noch nie ${statement.text}`;
  const categoryLabel = qs('#questionCategory');
  if (categoryLabel) {
    const categoryObject = categories.find(c => c.key === statement.category);
    categoryLabel.textContent = categoryObject ? categoryObject.label : '';
  }
  qs('#progressText').textContent = `Frage ${progress}/${total}`;
  qs('#roundTracker').textContent = `Bisher gespielt: ${Math.min(progress, total)} / ${total}`;
  qs('#progressFill').style.width = `${((progress - 1) / total) * 100}%`;

  if (!first) animateQuestion();
}

function animateQuestion() {
  const card = qs('#questionCard');
  if (!card) return;
  card.classList.remove('pulse');
  void card.offsetWidth;
  card.classList.add('pulse');
}

function rerollQuestion() {
  if (!gameState.gameActive || gameState.questions.length <= 1) return;
  let nextIndex = gameState.currentIndex;
  while (nextIndex === gameState.currentIndex) {
    nextIndex = Math.floor(Math.random() * gameState.questions.length);
  }
  gameState.currentIndex = nextIndex;
  displayCurrentQuestion();
}

function nextQuestion() {
  if (!gameState.gameActive) return;

  gameState.questionsAsked++;
  gameState.currentIndex++;

  if (gameState.currentIndex >= gameState.questions.length) {
    finishGame();
    return;
  }

  displayCurrentQuestion();
}

function finishGame() {
  gameState.gameActive = false;
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.remove('hidden');
  renderResults();
}

function renderResults() {
  const list = qs('#resultsList');
  if (!list) return;

  const played = Math.max(1, gameState.questionsAsked);
  list.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="result-position">🥂</div>
    <div class="result-info">
      <h3>Team-Herausforderung abgeschlossen</h3>
      <div class="result-stats">
        <div>Fragen gespielt: ${played}</div>
        <div>Jeder, der's schon gemacht hat, trinkt.</div>
      </div>
    </div>
  `;

  list.appendChild(card);
}

function resetGame() {
  gameState = {
    questions: [],
    currentIndex: 0,
    questionsAsked: 0,
    maxRounds: 20,
    gameActive: false
  };

  qs('#gameSetup').classList.remove('hidden');
  qs('#gamePlay').classList.add('hidden');
  qs('#gameFinished').classList.add('hidden');
  qs('#progressFill').style.width = '0%';
  qs('#progressText').textContent = '';
  qs('#roundTracker').textContent = '';

  const roundsRange = qs('#roundsRange');
  const roundsValue = qs('#roundsValue');
  if (roundsRange) roundsRange.value = 20;
  if (roundsValue) roundsValue.textContent = '20';

  qsa('.category-btn').forEach(btn => btn.classList.add('active'));
  gameState.selectedCategories = new Set(categories.map(c => c.key));

  qsa('.mode-btn').forEach(btn => {
    if (btn.dataset.mode === 'shot') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  gameState.drinkMode = 'shot';
  updateRuleText();

  const wildBoostBtn = qs('#wildBoostBtn');
  if (wildBoostBtn) wildBoostBtn.classList.remove('active');
  gameState.wildMode = false;
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  if (themeMarker) {
    themeMarker.style.transform = saved === 'auto' ? 'translateX(0)' : (saved === 'light' ? 'translateX(100%)' : 'translateX(200%)');
  }
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
