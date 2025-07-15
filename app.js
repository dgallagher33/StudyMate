const appState = {
  stacks: JSON.parse(localStorage.getItem('stacks') || '[]'),
  reviewRecords: JSON.parse(localStorage.getItem('reviewRecords') || '[]'),
  currentStack: null,
  currentQuizCard: null,
  notificationInterval: Number(localStorage.getItem('notificationInterval') || 0)
};

let notificationTimer = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function saveStacks() {
  localStorage.setItem('stacks', JSON.stringify(appState.stacks));
}

function saveReviewRecords() {
  localStorage.setItem('reviewRecords', JSON.stringify(appState.reviewRecords));
}

function scheduleNotifications(interval) {
  if (notificationTimer) clearInterval(notificationTimer);
  appState.notificationInterval = interval;
  localStorage.setItem('notificationInterval', String(interval));
  if (interval > 0) {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    notificationTimer = setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('StudyMate', { body: 'Time to study!' });
      }
    }, interval * 60000);
  }
}

function renderStacks() {
  const list = document.getElementById('stack-list');
  list.innerHTML = '';
  appState.stacks.forEach((stack, index) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    const activeText = stack.isActive ? ' [Active]' : '';
    div.textContent = stack.name + ` (${stack.cards.length} cards)` + activeText;
    div.addEventListener('click', () => openStack(index));
    list.appendChild(div);
  });
}

function openStack(index) {
  appState.currentStack = index;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('stack-view').classList.remove('hidden');
  const stack = appState.stacks[index];
  document.getElementById('stack-title').textContent = stack.name;
  document.getElementById('deck-active-checkbox').checked = !!stack.isActive;
  renderCards();
}

function renderCards() {
  const stack = appState.stacks[appState.currentStack];
  const container = document.getElementById('cards');
  container.innerHTML = '';
  stack.cards.forEach((card, idx) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${card.front}</strong><br>${card.back}`;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteCard(idx));
    div.appendChild(delBtn);
    container.appendChild(div);
  });
}

function addStack(name) {
  appState.stacks.push({ id: generateId(), name, isActive: false, cards: [] });
  saveStacks();
  renderStacks();
}

function deleteCurrentStack() {
  if (appState.currentStack !== null) {
    appState.stacks.splice(appState.currentStack, 1);
    saveStacks();
    appState.currentStack = null;
    document.getElementById('stack-view').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    renderStacks();
  }
}

function addCard(front, back) {
  const stack = appState.stacks[appState.currentStack];
  stack.cards.push({ id: generateId(), front, back });
  saveStacks();
  renderCards();
}

function deleteCard(index) {
  const stack = appState.stacks[appState.currentStack];
  stack.cards.splice(index, 1);
  saveStacks();
  renderCards();
}

function startQuiz() {
  document.getElementById('quiz-container').classList.remove('hidden');
  nextQuizCard();
}

function nextQuizCard() {
  const activeDecks = appState.stacks.filter(s => s.isActive);
  const cards = activeDecks.flatMap(s => s.cards);
  const frontEl = document.getElementById('quiz-front');
  const backEl = document.getElementById('quiz-back');
  if (cards.length === 0) {
    frontEl.textContent = 'No active cards';
    backEl.textContent = '';
    document.getElementById('show-answer-btn').classList.add('hidden');
    document.getElementById('quiz-actions').classList.add('hidden');
    return;
  }
  const card = cards[Math.floor(Math.random() * cards.length)];
  appState.currentQuizCard = card;
  frontEl.textContent = card.front;
  backEl.textContent = card.back;
  backEl.classList.add('hidden');
  document.getElementById('quiz-actions').classList.add('hidden');
  document.getElementById('show-answer-btn').classList.remove('hidden');
}

function showAnswer() {
  document.getElementById('quiz-back').classList.remove('hidden');
  document.getElementById('quiz-actions').classList.remove('hidden');
  document.getElementById('show-answer-btn').classList.add('hidden');
}

function recordAnswer(correct) {
  if (appState.currentQuizCard) {
    appState.reviewRecords.push({
      id: generateId(),
      card_id: appState.currentQuizCard.id,
      reviewed_at: Date.now(),
      was_correct: correct ? 1 : 0
    });
    saveReviewRecords();
  }
  nextQuizCard();
}

// Event listeners

document.getElementById('add-stack-btn').addEventListener('click', () => {
  document.getElementById('stack-editor').classList.remove('hidden');
});

document.getElementById('close-stack-editor').addEventListener('click', () => {
  document.getElementById('stack-editor').classList.add('hidden');
});

document.getElementById('save-stack-btn').addEventListener('click', () => {
  const name = document.getElementById('stack-name').value.trim();
  if (name) {
    addStack(name);
    document.getElementById('stack-name').value = '';
    document.getElementById('stack-editor').classList.add('hidden');
  }
});

document.getElementById('back-to-stacks').addEventListener('click', () => {
  document.getElementById('stack-view').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  appState.currentStack = null;
});

document.getElementById('add-card-btn').addEventListener('click', () => {
  document.getElementById('card-editor').classList.remove('hidden');
});

document.getElementById('close-card-editor').addEventListener('click', () => {
  document.getElementById('card-editor').classList.add('hidden');
});

document.getElementById('save-card-btn').addEventListener('click', () => {
  const front = document.getElementById('card-front').value.trim();
  const back = document.getElementById('card-back').value.trim();
  if (front && back) {
    addCard(front, back);
    document.getElementById('card-front').value = '';
    document.getElementById('card-back').value = '';
    document.getElementById('card-editor').classList.add('hidden');
  }
});

document.getElementById('deck-active-checkbox').addEventListener('change', e => {
  const stack = appState.stacks[appState.currentStack];
  stack.isActive = e.target.checked;
  saveStacks();
  renderStacks();
});

document.getElementById('delete-deck-btn').addEventListener('click', deleteCurrentStack);

document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

document.getElementById('show-answer-btn').addEventListener('click', showAnswer);

document.getElementById('right-btn').addEventListener('click', () => recordAnswer(true));

document.getElementById('wrong-btn').addEventListener('click', () => recordAnswer(false));

document.getElementById('close-quiz-btn').addEventListener('click', () => {
  document.getElementById('quiz-container').classList.add('hidden');
});

document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('notif-interval').value = appState.notificationInterval;
  document.getElementById('settings-modal').classList.remove('hidden');
});

document.getElementById('close-settings-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
});

document.getElementById('save-settings-btn').addEventListener('click', () => {
  const val = Number(document.getElementById('notif-interval').value);
  scheduleNotifications(val);
  document.getElementById('settings-modal').classList.add('hidden');
});

renderStacks();
scheduleNotifications(appState.notificationInterval);

