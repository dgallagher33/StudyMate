# SPEC-1-FlashCardStudyApp

## Background

Many high school and university students—especially those with ADHD—struggle to maintain focus during study sessions. We will build a mobile-first flash-card app optimized for microlearning: periodic, low-commitment study prompts delivered via interactive notifications. Users tap "Right" or "Wrong" to log results and continue their day, leveraging spaced repetition.

## Requirements

### Must Have

- **Deck Management:** Create, read, update, delete decks and cards.
- **Quiz Mode:** Present one card with "Right"/"Wrong" buttons.
- **Local Storage:** All data stored in SQLite on device.
- **Notifications:** User-configurable interval (minutes) for local interactive prompts.

### Should Have

- **Active Decks:** Mark decks as `is_active` for scheduling.

### Won’t Have (MVP)

- Cloud sync / user accounts.
- Multiple-choice quizzes.
- Calendar view or exam association.
- Sharing/collaboration features.

## Method

### Tech Stack

- **Framework:** React Native + TypeScript
- **Storage:** SQLite (`react-native-sqlite-storage`)
- **Notifications:** `react-native-push-notification` or `expo-notifications`
- **State:** Redux or React Context API

### Database Schema (`schema.sql`)

```sql
-- Decks
CREATE TABLE Decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0
);
-- Cards
CREATE TABLE Cards (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  FOREIGN KEY(deck_id) REFERENCES Decks(id) ON DELETE CASCADE
);
-- Review Records
CREATE TABLE ReviewRecords (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  reviewed_at INTEGER NOT NULL,
  was_correct INTEGER NOT NULL,
  FOREIGN KEY(card_id) REFERENCES Cards(id) ON DELETE CASCADE
);
```

### Component Diagram (PlantUML)

```plantuml
@startuml
package UI {
  DeckListScreen
  CardDetailScreen
  NotificationPrompt
}
package Logic {
  DeckService
  QuizService
  NotificationService
}
package Storage {
  SQLiteDatabase
}
UI --> Logic
Logic --> Storage
Logic --> UI : data updates
@enduml
```

### Core Workflows

1. **Deck CRUD**
   - UI triggers DeckService methods.
   - DeckService uses SQLiteDatabase to run SQL queries.
2. **Scheduling**
   - On settings save, NotificationService schedules recurring local notifications at user-defined intervals for decks where `is_active=1`.
3. **Review Prompt**
   - Tap notification → open NotificationPrompt.
   - NotificationPrompt calls QuizService.getRandomCard(activeDecks).
   - User taps Right/Wrong → QuizService.recordReview(cardId, wasCorrect).
   - QuizService reschedules next notification if needed.

## Implementation Steps

```bash
# 1. Project Setup
git init FlashCardApp
cd FlashCardApp
npx react-native init --template react-native-template-typescript
npm install react-native-sqlite-storage react-native-push-notification redux react-redux
```

```typescript
// 2. Initialize SQLite (db.ts)
import SQLite from 'react-native-sqlite-storage';
export const db = SQLite.openDatabase({name: 'flashcards.db', location: 'default'});
```

```typescript
// 3. Create tables on app launch (initDb.ts)
import {db} from './db';
export async function initDb() {
  await db.executeSql(`CREATE TABLE IF NOT EXISTS Decks (...);`);
  await db.executeSql(`CREATE TABLE IF NOT EXISTS Cards (...);`);
  await db.executeSql(`CREATE TABLE IF NOT EXISTS ReviewRecords (...);`);
}
```

```typescript
// 4. DeckService.ts
export class DeckService {
  static async getAllDecks() { /* SELECT * FROM Decks */ }
  static async addDeck(name: string) { /* INSERT INTO Decks */ }
  static async updateDeck(id: string, fields) { /* UPDATE Decks */ }
  static async deleteDeck(id: string) { /* DELETE FROM Decks */ }
}
```

```typescript
// 5. QuizService.ts
export class QuizService {
  static async getRandomCard(activeDeckIds: string[]) { /* SQL: SELECT * FROM Cards WHERE deck_id IN (...) ORDER BY RANDOM() LIMIT 1 */ }
  static async recordReview(cardId: string, wasCorrect: boolean) { /* INSERT ReviewRecords */ }
}
```

```typescript
// 6. NotificationService.ts
import PushNotification from 'react-native-push-notification';
export class NotificationService {
  static schedule(intervalMin: number) {
    PushNotification.cancelAllLocalNotifications();
    PushNotification.localNotificationSchedule({
      message: 'Study time! Open the app.',
      repeatType: 'time',
      repeatTime: intervalMin * 60000
    });
  }
}
```

```tsx
// 7. NotificationPrompt.tsx
function NotificationPrompt() {
  const [card, setCard] = useState<Card>(null);
  useEffect(() => { QuizService.getRandomCard(activeIds).then(setCard); }, []);
  return (
    <View>
      <Text>{card.front}</Text>
      <Button title="Right" onPress={() => handleAnswer(true)} />
      <Button title="Wrong" onPress={() => handleAnswer(false)} />
    </View>
  );
}
```

```tsx
// 8. SettingsScreen.tsx
function SettingsScreen() {
  const [interval, setInterval] = useState(60);
  return (
    <View>
      <Text>Notification Interval (min)</Text>
      <TextInput value={String(interval)} onChangeText={t => setInterval(Number(t))} />
      <Button title="Save" onPress={() => NotificationService.schedule(interval)} />
    </View>
  );
}
```

## Milestones

1. **Week 1:** Setup, DB init, DeckService
2. **Week 2:** DeckListScreen, CardDetailScreen, CRUD
3. **Week 3:** NotificationService, settings UI
4. **Week 4:** NotificationPrompt, QuizService
5. **Week 5:** Testing & deployment config

## Gathering Results

- Verify data persistence; manual test deck and card CRUD.
- Test notification interval accuracy and UI flow.
- Collect feedback on ease of use and engagement.

---

*Code snippets are organized by file. All SQL and TS code should be inserted into respective modules for Codex to scaffold implementation.*

