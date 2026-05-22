import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

const initialState = {
  sleepLog: [
    { date: '2026-05-14', hours: 7.5, quality: 4 },
    { date: '2026-05-15', hours: 6.0, quality: 3 },
    { date: '2026-05-16', hours: 8.0, quality: 5 },
    { date: '2026-05-17', hours: 7.0, quality: 4 },
    { date: '2026-05-18', hours: 5.5, quality: 2 },
    { date: '2026-05-19', hours: 7.5, quality: 4 },
    { date: '2026-05-20', hours: 8.0, quality: 5 },
  ],
  focusSessions: [
    { id: 1, title: 'Deep Work: React Projekt', description: 'Komponenten entworfen', productivity: 5, duration: 90, technique: 'Pomodoro', date: '2026-05-19' },
    { id: 2, title: 'Buchkapitel lesen', description: 'Atomic Habits Kap. 3-5', productivity: 4, duration: 45, technique: 'Zeitblock', date: '2026-05-20' },
  ],
  movementLog: [
    { date: '2026-05-18', steps: 8200, sport: 'Joggen 30min', relaxation: 'Dehnen' },
    { date: '2026-05-19', steps: 5400, sport: '', relaxation: 'Yoga 20min' },
    { date: '2026-05-20', steps: 9100, sport: 'Krafttraining 45min', relaxation: '' },
  ],
  journalEntries: [
    { id: 1, date: '2026-05-19', mood: 4, text: 'Guter Tag, viel geschafft. Fokus war heute sehr gut.', tags: ['produktiv', 'fokus'] },
    { id: 2, date: '2026-05-20', mood: 5, text: 'Ausgeruht und energiegeladen. Meditation am Morgen hat geholfen.', tags: ['entspannt', 'meditation'] },
  ],
  scores: {
    memory: 72,
    attention: 65,
    learning: 80,
    sleep: 78,
    focus: 70,
    movement: 60,
    stress: 55,
  },
  streaks: {
    sleep: 7,
    focus: 3,
    movement: 5,
    meditation: 2,
  },
}

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState)

  const addSleepEntry = (entry) =>
    setState(s => ({ ...s, sleepLog: [...s.sleepLog, entry] }))

  const upsertSleepEntry = (entry) =>
    setState(s => ({
      ...s,
      sleepLog: s.sleepLog.some(l => l.date === entry.date)
        ? s.sleepLog.map(l => l.date === entry.date ? entry : l)
        : [...s.sleepLog, entry],
    }))

  const addFocusSession = (session) =>
    setState(s => ({ ...s, focusSessions: [{ ...session, id: Date.now() }, ...s.focusSessions] }))

  const addMovementEntry = (entry) =>
    setState(s => ({ ...s, movementLog: [...s.movementLog, entry] }))

  const addJournalEntry = (entry) =>
    setState(s => ({ ...s, journalEntries: [{ ...entry, id: Date.now() }, ...s.journalEntries] }))

  return (
    <AppContext.Provider value={{ state, addSleepEntry, upsertSleepEntry, addFocusSession, addMovementEntry, addJournalEntry }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
