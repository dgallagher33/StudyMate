const appState = {
  stacks: JSON.parse(localStorage.getItem('stacks') || '[]'),
  currentStack: null,
};

function saveStacks() {
  localStorage.setItem('stacks', JSON.stringify(appState.stacks));
}

function renderStacks() {
  const list = document.getElementById('stack-list');
  list.innerHTML = '';
  appState.stacks.forEach((stack, index) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.textContent = stack.name + ` (${stack.cards.length} cards)`;
    div.addEventListener('click', () => openStack(index));
    list.appendChild(div);
  });
}

function openStack(index) {
  appState.currentStack = index;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('stack-view').classList.remove('hidden');
  document.getElementById('stack-title').textContent = appState.stacks[index].name;
  renderCards();
}

function renderCards() {
  const stack = appState.stacks[appState.currentStack];
  const container = document.getElementById('cards');
  container.innerHTML = '';
  stack.cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${card.front}</strong><br>${card.back}`;
    container.appendChild(div);
  });
}

function addStack(name) {
  appState.stacks.push({ name, cards: [] });
  saveStacks();
  renderStacks();
}

function addCard(front, back) {
  const stack = appState.stacks[appState.currentStack];
  stack.cards.push({ front, back });
  saveStacks();
  renderCards();
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

renderStacks();
