const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

let gameState = {
  questions: [],
  currentIndex: 0,
  questionsAsked: 0,
  maxRounds: 20,
  selectedCategories: new Set(['funny', 'spicy', 'cringe', 'personal', 'deep']),
  drinkMode: 'shot',
  gameActive: false
};

const fallbackCategories = [
  { key: "chill", "label": "🟢 Chill & Locker" },
  { key: "party", "label": "🟡 Party & Chaos" },
  { key: "cringe", "label": "😬 Peinlich & Cringe" },
  { key: "deep", "label": "🧠 Persönlich & Deep" },
  { key: "friendship", "label": "🧑‍🤝‍🧑 Freundschaft" },
  { key: "flirty", "label": "😏 Flirty & Teasing" },
  { key: "spicy", "label": "🔥 Spicy / Hot" },
  { key: "wild", "label": "😈 Grenzen & Tabus" },
  { key: "explizit", "label": "🛑 18+ / Explizit" }
];

let questionData = { statements: {} };
let categories = [];

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  setupTheme();
  setupSidebar();
  await loadQuestions();
  renderCategoryButtons();
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
}

async function loadQuestions() {
  try {
    const res = await fetch('JSON-Datastores/ichhabnochnie-questions.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Fehler beim Laden der Fragen');
    const data = await res.json();
    questionData = { statements: data.statements || {} };
    categories = Array.isArray(data.metadata?.categories) && data.metadata.categories.length ? data.metadata.categories : fallbackCategories;
    const defaultCategories = Array.isArray(data.metadata?.defaultCategories) && data.metadata.defaultCategories.length
      ? data.metadata.defaultCategories
      : fallbackCategories.filter(c => c.key !== 'wild').map(c => c.key);
    gameState.selectedCategories = new Set(defaultCategories);
  } catch (error) {
    console.error('Fehler beim Laden der Fragen:', error);
    categories = fallbackCategories;
    gameState.selectedCategories = new Set(fallbackCategories.filter(c => c.key !== 'wild').map(c => c.key));
  }
}

function renderCategoryButtons() {
  const categoriesGrid = qs('#categoriesGrid');
  if (!categoriesGrid || !categories.length) return;
  categoriesGrid.innerHTML = categories
    .map(cat => `
      <button type="button" class="category-btn ${gameState.selectedCategories.has(cat.key) ? 'active' : ''}" data-category="${cat.key}">${cat.label}</button>
    `)
    .join('');
}

function startGame() {
  if (gameState.gameActive) return;

  const roundsRange = qs('#roundsRange');
  gameState.maxRounds = roundsRange ? parseInt(roundsRange.value, 10) : 20;

  gameState.questions = getSelectedQuestions();
  if (gameState.questions.length === 0) {
    alert('Keine Fragen geladen. Bitte lade die Seite neu.');
    return;
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
  const selected = gameState.selectedCategories.size ? Array.from(gameState.selectedCategories) : categories.filter(c => c.key !== 'wild').map(c => c.key);

  let selectedQuestions = [];
  selected.forEach(categoryKey => {
    const statements = Array.isArray(questionData.statements[categoryKey]) ? questionData.statements[categoryKey] : [];
    statements.forEach(item => {
      const text = typeof item === 'string' ? item : item.text;
      if (text) selectedQuestions.push({ text, category: categoryKey });
    });
  });

  if (selectedQuestions.length === 0) {
    categories.forEach(category => {
      const statements = Array.isArray(questionData.statements[category.key]) ? questionData.statements[category.key] : [];
      statements.forEach(item => {
        const text = typeof item === 'string' ? item : item.text;
        if (text) selectedQuestions.push({ text, category: category.key });
      });
    });
  }

  return shuffleArray(selectedQuestions);
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

  qs('#questionText').textContent = `🍻 Ich hab noch nie... ${statement.text}`;
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
  gameState.selectedCategories = new Set(categories.filter(c => c.key !== 'wild').map(c => c.key));

  qsa('.mode-btn').forEach(btn => {
    if (btn.dataset.mode === 'shot') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  gameState.drinkMode = 'shot';
  updateRuleText();
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
  const themeMarker = qs('#themeMarker');
  const themePoints = qs('.theme-points');

  if (!themePoints) return;

  function applyTheme(mode) {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      if (themeMarker) themeMarker.style.transform = 'translateX(0)';
    } else if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (themeMarker) themeMarker.style.transform = 'translateX(100%)';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeMarker) themeMarker.style.transform = 'translateX(200%)';
    }
    localStorage.setItem('gc-theme', mode);
  }

  const saved = localStorage.getItem('gc-theme') || 'auto';
  applyTheme(saved);

  qsa('.theme-points span').forEach(el => {
    el.addEventListener('click', () => applyTheme(el.dataset.mode));
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
