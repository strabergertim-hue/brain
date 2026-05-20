import { useState } from 'react'
import {
  BookOpen, ChevronRight, Check, X, Lightbulb,
  RotateCcw, Mic, Send, Sparkles
} from 'lucide-react'

const topics = [
  {
    id: 1,
    title: 'Neuroplastizität',
    category: 'Neurowissenschaft',
    color: 'from-violet-600 to-purple-700',
    icon: '🧠',
    summary: 'Das Gehirn ist formbar und bildet zeitlebens neue neuronale Verbindungen – ein Prozess, der als Neuroplastizität bekannt ist.',
    keyTakes: [
      'Lernen verändert buchstäblich die Struktur deines Gehirns',
      'Regelmäßige Übung stärkt synaptische Verbindungen (Hebb\'sche Regel)',
      'Schlaf ist entscheidend für die Konsolidierung neuer neuronaler Muster',
      'Stress hemmt Neuroplastizität; Entspannung fördert sie',
    ],
    source: 'Buch: The Brain that Changes Itself – Norman Doidge',
    quiz: [
      {
        q: 'Was beschreibt die Hebb\'sche Regel?',
        options: ['Neuronen die zusammen feuern, verbinden sich', 'Das Gehirn schrumpft im Alter', 'Schlaf reduziert Synapsen', 'Stress fördert Lernen'],
        correct: 0,
      },
      {
        q: 'Was fördert Neuroplastizität?',
        options: ['Chronischer Stress', 'Passives TV-Schauen', 'Schlaf und Entspannung', 'Isolation'],
        correct: 2,
      },
    ],
    flashcards: [
      { front: 'Neuroplastizität', back: 'Die Fähigkeit des Gehirns, sich durch Erfahrungen strukturell zu verändern.' },
      { front: 'Synaptische Plastizität', back: 'Veränderung der Stärke von Verbindungen zwischen Neuronen durch Aktivität.' },
      { front: 'Konsolidierung', back: 'Prozess, bei dem Kurzzeiterinnerungen während des Schlafs in Langzeiterinnerungen umgewandelt werden.' },
    ],
  },
  {
    id: 2,
    title: 'Atomic Habits',
    category: 'Buchzusammenfassung',
    color: 'from-cyan-600 to-blue-700',
    icon: '⚛️',
    summary: 'Kleine Gewohnheiten, zusammengesetzt über Zeit, führen zu dramatischen Ergebnissen. Der Schlüssel liegt in Systemen, nicht Zielen.',
    keyTakes: [
      '1% Verbesserung täglich ergibt 37x Verbesserung in einem Jahr',
      'Gewohnheiten bestehen aus: Auslöser → Verlangen → Reaktion → Belohnung',
      'Identitätsbasierte Gewohnheiten sind nachhaltiger als ergebnisbasierte',
      'Make it obvious, attractive, easy, satisfying (4 Gesetze)',
    ],
    source: 'Buch: Atomic Habits – James Clear',
    quiz: [
      {
        q: 'Wie viel Verbesserung ergibt 1% täglich über ein Jahr?',
        options: ['3.65x', '10x', '37x', '100x'],
        correct: 2,
      },
      {
        q: 'Was ist die Reihenfolge der Gewohnheitsschleife?',
        options: ['Belohnung → Auslöser → Verlangen → Reaktion', 'Auslöser → Verlangen → Reaktion → Belohnung', 'Verlangen → Auslöser → Belohnung → Reaktion', 'Reaktion → Verlangen → Auslöser → Belohnung'],
        correct: 1,
      },
    ],
    flashcards: [
      { front: 'Die 1% Regel', back: 'Winzige, tägliche Verbesserungen von 1% ergeben nach einem Jahr eine 37-fache Gesamtverbesserung.' },
      { front: '4 Gesetze der Gewohnheit', back: 'Obvious (offensichtlich), Attractive (attraktiv), Easy (einfach), Satisfying (befriedigend).' },
    ],
  },
]

function QuizMode({ quiz, onBack }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const q = quiz[current]

  const choose = (i) => {
    if (selected !== null) return
    setSelected(i)
    if (i === q.correct) setCorrect(c => c + 1)
    setTimeout(() => {
      if (current + 1 < quiz.length) {
        setCurrent(c => c + 1)
        setSelected(null)
      } else {
        setDone(true)
      }
    }, 900)
  }

  if (done) return (
    <div className="text-center space-y-4 py-6">
      <div className="text-5xl">🎉</div>
      <p className="text-white text-xl font-bold">{correct}/{quiz.length} richtig!</p>
      <p className="text-slate-400 text-sm">{correct === quiz.length ? 'Perfekt! Alles verstanden.' : 'Gut gemacht! Wiederhole die falschen Antworten.'}</p>
      <button onClick={onBack} className="px-5 py-2 rounded-xl gradient-purple text-white text-sm font-medium">
        Zurück
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Frage {current + 1} / {quiz.length}</span>
        <div className="h-1.5 flex-1 mx-4 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full gradient-purple rounded-full transition-all" style={{ width: `${((current + 1) / quiz.length) * 100}%` }} />
        </div>
      </div>
      <p className="text-white font-semibold text-base">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = 'p-3 rounded-xl border text-sm cursor-pointer transition-all '
          if (selected === null) {
            cls += 'border-white/10 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/10'
          } else if (i === q.correct) {
            cls += 'border-green-500 bg-green-500/15 text-green-300'
          } else if (i === selected && selected !== q.correct) {
            cls += 'border-rose-500 bg-rose-500/15 text-rose-300'
          } else {
            cls += 'border-white/5 text-slate-500'
          }
          return (
            <div key={i} className={cls} onClick={() => choose(i)}>
              <span className="flex items-center gap-2">
                {selected !== null && i === q.correct && <Check size={14} className="text-green-400" />}
                {selected === i && selected !== q.correct && <X size={14} className="text-rose-400" />}
                {opt}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FlashcardMode({ cards, onBack }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = cards[idx]
  const next = () => { setFlipped(false); setIdx(i => (i + 1) % cards.length) }
  const prev = () => { setFlipped(false); setIdx(i => (i - 1 + cards.length) % cards.length) }

  return (
    <div className="space-y-4">
      <div className="text-center text-xs text-slate-400">{idx + 1} / {cards.length}</div>
      <div
        className="min-h-36 rounded-2xl border border-white/10 flex items-center justify-center p-6 cursor-pointer transition-all duration-300"
        style={{ background: flipped ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-2">{flipped ? 'ANTWORT' : 'FRAGE'}</p>
          <p className="text-white font-medium">{flipped ? card.back : card.front}</p>
          <p className="text-xs text-slate-500 mt-3">Tippen zum Umdrehen</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={prev} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10">← Zurück</button>
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-300"><RotateCcw size={12} className="inline mr-1" />Beenden</button>
        <button onClick={next} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10">Weiter →</button>
      </div>
    </div>
  )
}

function AIExplainMode({ onBack }) {
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = () => {
    if (!text.trim()) return
    setLoading(true)
    setTimeout(() => {
      setFeedback({
        score: 82,
        comment: 'Gute Erklärung! Du hast die Kernkonzepte richtig erfasst. Deine Beschreibung der Hebb\'schen Regel ist präzise. Für eine vollständige Antwort könntest du noch den Zusammenhang mit Schlaf und Gedächtniskonsolidierung erwähnen.',
        keywords: ['Neuroplastizität ✓', 'Synapsen ✓', 'Hebb\'sche Regel ✓', 'Schlaf (fehlend)'],
      })
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <p className="text-sm text-violet-300 flex items-center gap-2">
          <Sparkles size={14} />
          Erkläre das Thema in eigenen Worten – die KI bewertet dein Verständnis.
        </p>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full h-28 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm p-3 resize-none focus:outline-none focus:border-violet-500/50"
        placeholder="Erkläre das Thema in eigenen Worten..."
      />
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10">Abbrechen</button>
        <button onClick={submit} disabled={!text.trim() || loading} className="flex-1 py-2.5 rounded-xl gradient-purple text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
          KI-Auswertung
        </button>
      </div>
      {feedback && (
        <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">KI-Bewertung</span>
            <span className="text-lg font-bold text-violet-400">{feedback.score}/100</span>
          </div>
          <p className="text-sm text-slate-300">{feedback.comment}</p>
          <div className="flex flex-wrap gap-2">
            {feedback.keywords.map(k => (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${k.includes('✓') ? 'bg-green-500/15 text-green-400' : 'bg-rose-500/15 text-rose-400'}`}>{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Learn() {
  const [active, setActive] = useState(null)
  const [mode, setMode] = useState(null)

  const topic = topics.find(t => t.id === active)

  if (active && topic) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => { setActive(null); setMode(null) }} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zur Übersicht
        </button>

        {/* Topic header */}
        <div className={`card p-6 bg-gradient-to-r ${topic.color}`}>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{topic.icon}</span>
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{topic.category}</span>
              <h2 className="text-xl font-bold text-white mt-1">{topic.title}</h2>
              <p className="text-sm text-white/80 mt-2">{topic.summary}</p>
              <p className="text-xs text-white/50 mt-2">{topic.source}</p>
            </div>
          </div>
        </div>

        {/* Key Takes */}
        {!mode && (
          <>
            <div className="card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Lightbulb size={15} className="text-amber-400" />
                Key Takeaways
              </h3>
              <ul className="space-y-2.5">
                {topic.keyTakes.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full gradient-purple flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'quiz', label: 'Multiple Choice Quiz', icon: '🧩', desc: `${topic.quiz.length} Fragen` },
                { key: 'flash', label: 'Karteikarten', icon: '🃏', desc: `${topic.flashcards.length} Karten` },
                { key: 'ai', label: 'KI-Verständnistest', icon: '🤖', desc: 'Erklären & auswerten' },
              ].map(({ key, label, icon, desc }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className="card card-hover p-5 text-left flex items-start gap-3"
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'quiz' && (
          <div className="card p-6">
            <QuizMode quiz={topic.quiz} onBack={() => setMode(null)} />
          </div>
        )}
        {mode === 'flash' && (
          <div className="card p-6">
            <FlashcardMode cards={topic.flashcards} onBack={() => setMode(null)} />
          </div>
        )}
        {mode === 'ai' && (
          <div className="card p-6">
            <AIExplainMode onBack={() => setMode(null)} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topics.map(topic => (
          <div
            key={topic.id}
            onClick={() => setActive(topic.id)}
            className="card card-hover p-5 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-2xl`}>
                {topic.icon}
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </div>
            <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">{topic.category}</span>
            <h3 className="text-white font-semibold mt-1 mb-2">{topic.title}</h3>
            <p className="text-slate-400 text-sm line-clamp-2">{topic.summary}</p>
            <div className="flex gap-2 mt-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">Quiz</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">Karteikarten</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">KI-Test</span>
            </div>
          </div>
        ))}

        {/* Placeholder card */}
        <div className="card p-5 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-40 text-center">
          <BookOpen size={24} className="text-slate-600" />
          <p className="text-slate-500 text-sm">Neues Thema hinzufügen</p>
          <button className="text-xs text-violet-400 hover:text-violet-300">+ Inhalt erstellen</button>
        </div>
      </div>
    </div>
  )
}
