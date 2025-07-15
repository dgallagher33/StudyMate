const { useState, useEffect } = React;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function App() {
  const [stacks, setStacks] = useState(() => JSON.parse(localStorage.getItem('stacks') || '[]'));
  const [reviewRecords, setReviewRecords] = useState(() => JSON.parse(localStorage.getItem('reviewRecords') || '[]'));
  const [currentStack, setCurrentStack] = useState(null);
  const [notificationInterval, setNotificationInterval] = useState(() => Number(localStorage.getItem('notificationInterval') || 0));
  const [showSettings, setShowSettings] = useState(false);
  const [showStackEditor, setShowStackEditor] = useState(false);
  const [showCardEditor, setShowCardEditor] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [quizCard, setQuizCard] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    localStorage.setItem('stacks', JSON.stringify(stacks));
  }, [stacks]);

  useEffect(() => {
    localStorage.setItem('reviewRecords', JSON.stringify(reviewRecords));
  }, [reviewRecords]);

  useEffect(() => {
    localStorage.setItem('notificationInterval', String(notificationInterval));
  }, [notificationInterval]);

  useEffect(() => {
    let timer;
    if (notificationInterval > 0) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      timer = setInterval(() => {
        if (Notification.permission === 'granted') {
          new Notification('StudyMate', { body: 'Time to study!' });
        }
      }, notificationInterval * 60000);
    }
    return () => timer && clearInterval(timer);
  }, [notificationInterval]);

  const addStack = () => {
    if (!newStackName.trim()) return;
    setStacks([...stacks, { id: generateId(), name: newStackName.trim(), isActive: false, cards: [] }]);
    setNewStackName('');
    setShowStackEditor(false);
  };

  const deleteStack = (index) => {
    const next = [...stacks];
    next.splice(index, 1);
    setStacks(next);
    setCurrentStack(null);
  };

  const addCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    const next = [...stacks];
    next[currentStack].cards.push({ id: generateId(), front: newCardFront.trim(), back: newCardBack.trim() });
    setStacks(next);
    setNewCardFront('');
    setNewCardBack('');
    setShowCardEditor(false);
  };

  const deleteCard = (idx) => {
    const next = [...stacks];
    next[currentStack].cards.splice(idx, 1);
    setStacks(next);
  };

  const startQuiz = () => {
    setShowQuiz(true);
    nextQuizCard();
  };

  const nextQuizCard = () => {
    const cards = stacks.filter(s => s.isActive).flatMap(s => s.cards);
    if (cards.length === 0) {
      setQuizCard(null);
      return;
    }
    const card = cards[Math.floor(Math.random() * cards.length)];
    setQuizCard(card);
    setShowAnswer(false);
  };

  const recordAnswer = (correct) => {
    if (quizCard) {
      setReviewRecords([...reviewRecords, { id: generateId(), card_id: quizCard.id, reviewed_at: Date.now(), was_correct: correct ? 1 : 0 }]);
    }
    nextQuizCard();
  };

  return (
    <div>
      <h1>StudyMate - Flashcards</h1>
      {currentStack === null && !showSettings && (
        <div>
          <button onClick={() => setShowSettings(true)}>Settings</button>
          <div>
            {stacks.map((stack, idx) => (
              <div key={stack.id} className="stack-item" onClick={() => setCurrentStack(idx)}>
                {stack.name} ({stack.cards.length} cards){stack.isActive ? ' [Active]' : ''}
              </div>
            ))}
          </div>
          <button onClick={() => setShowStackEditor(true)}>Add Stack</button>
        </div>
      )}

      {showStackEditor && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create Stack</h2>
            <input value={newStackName} onChange={e => setNewStackName(e.target.value)} placeholder="Stack Name" />
            <button onClick={addStack}>Save</button>
            <button onClick={() => setShowStackEditor(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showCardEditor && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Card</h2>
            <input value={newCardFront} onChange={e => setNewCardFront(e.target.value)} placeholder="Front" />
            <input value={newCardBack} onChange={e => setNewCardBack(e.target.value)} placeholder="Back" />
            <button onClick={addCard}>Save Card</button>
            <button onClick={() => setShowCardEditor(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div id="settings-screen">
          <button onClick={() => setShowSettings(false)}>Back</button>
          <h2>Settings</h2>
          <label>Notification Interval (min)</label>
          <input type="number" min="0" value={notificationInterval} onChange={e => setNotificationInterval(Number(e.target.value))} />
          <h3>Active Decks</h3>
          <div id="active-deck-list">
            {stacks.map((stack, idx) => (
              <div key={stack.id}>
                <input
                  type="checkbox"
                  checked={stack.isActive}
                  onChange={e => {
                    const next = [...stacks];
                    next[idx].isActive = e.target.checked;
                    setStacks(next);
                  }}
                />
                <label>{stack.name}</label>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStack !== null && !showSettings && (
        <div id="stack-view">
          <button onClick={() => setCurrentStack(null)}>Back to Stacks</button>
          <h2>{stacks[currentStack].name}</h2>
          <label>
            <input
              type="checkbox"
              checked={!!stacks[currentStack].isActive}
              onChange={e => {
                const next = [...stacks];
                next[currentStack].isActive = e.target.checked;
                setStacks(next);
              }}
            />
            Active
          </label>
          <button onClick={() => deleteStack(currentStack)}>Delete Deck</button>
          <button onClick={startQuiz}>Start Quiz</button>
          <div>
            {stacks[currentStack].cards.map((card, idx) => (
              <div key={card.id} className="card">
                <strong>{card.front}</strong>
                <br />
                {card.back}
                <button onClick={() => deleteCard(idx)}>Delete</button>
              </div>
            ))}
          </div>
          <button onClick={() => setShowCardEditor(true)}>Add Card</button>
        </div>
      )}

      {showQuiz && (
        <div id="quiz-container" className="modal">
          <div className="modal-content">
            <div id="quiz-front">{quizCard ? quizCard.front : 'No active cards'}</div>
            {quizCard && (
              <>
                <div id="quiz-back" className={showAnswer ? '' : 'hidden'}>
                  {quizCard.back}
                </div>
                {!showAnswer && (
                  <button id="show-answer-btn" onClick={() => setShowAnswer(true)}>
                    Show Answer
                  </button>
                )}
                {showAnswer && (
                  <div id="quiz-actions">
                    <button id="right-btn" onClick={() => recordAnswer(true)}>
                      Right
                    </button>
                    <button id="wrong-btn" onClick={() => recordAnswer(false)}>
                      Wrong
                    </button>
                  </div>
                )}
              </>
            )}
            <button id="close-quiz-btn" onClick={() => setShowQuiz(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
