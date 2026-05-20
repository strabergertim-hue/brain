import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Wind, Plus, Smile, Meh, Frown, Heart } from 'lucide-react'

// ─── Breathing Exercise ──────────────────────────────────────────────────
function BreathingExercise({ pattern }) {
  const phases = pattern.phases // [{label, duration}]
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef(null)
  const tickRef = useRef(0)

  const phase = phases[phaseIdx]
  const totalTicks = phase.duration * 10

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      tickRef.current += 1
      setProgress(tickRef.current / totalTicks)
      if (tickRef.current >= totalTicks) {
        tickRef.current = 0
        setProgress(0)
        setPhaseIdx(i => {
          const next = (i + 1) % phases.length
          if (next === 0) setCycles(c => c + 1)
          return next
        })
      }
    }, 100)
    return () => clearInterval(intervalRef.current)
  }, [running, phaseIdx])

  const stop = () => { setRunning(false); setPhaseIdx(0); setProgress(0); tickRef.current = 0 }

  const size = 160
  const r = 60
  const circ = 2 * Math.PI * r

  const phaseColors = { 'Einatmen': '#06b6d4', 'Ausatmen': '#10b981', 'Halten': '#f59e0b', 'Halten (leer)': '#f59e0b' }
  const color = phaseColors[phase.label] || '#7c3aed'

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke={color} strokeWidth={8} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - progress * circ}
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {running ? (
              <>
                <span className="text-2xl" style={{ color }}>{phase.label}</span>
                <span className="text-xs text-slate-400 mt-1">{phase.duration}s</span>
              </>
            ) : (
              <span className="text-sm text-slate-400">Bereit</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        {!running
          ? <button onClick={() => setRunning(true)} className="flex-1 py-2.5 rounded-xl gradient-cyan text-white text-sm font-semibold">Starten</button>
          : <button onClick={stop} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold">Stoppen</button>
        }
      </div>
      {cycles > 0 && <p className="text-center text-xs text-teal-400">Abgeschlossene Zyklen: {cycles}</p>}
    </div>
  )
}

const breathingPatterns = [
  {
    name: 'Box Breathing', desc: '4-4-4-4 – für Ruhe & Fokus', icon: '⬛',
    phases: [{ label: 'Einatmen', duration: 4 }, { label: 'Halten', duration: 4 }, { label: 'Ausatmen', duration: 4 }, { label: 'Halten (leer)', duration: 4 }],
  },
  {
    name: '4-7-8 Technik', desc: 'Ideal zum Einschlafen & Stressabbau', icon: '💤',
    phases: [{ label: 'Einatmen', duration: 4 }, { label: 'Halten', duration: 7 }, { label: 'Ausatmen', duration: 8 }],
  },
  {
    name: 'Kohärentes Atmen', desc: '5-5 – aktiviert Parasympathikus', icon: '♾️',
    phases: [{ label: 'Einatmen', duration: 5 }, { label: 'Ausatmen', duration: 5 }],
  },
]

const moodOptions = [
  { value: 1, icon: Frown,  label: 'Schlecht',    color: 'text-rose-400',  bg: 'bg-rose-500/15' },
  { value: 2, icon: Meh,   label: 'OK',           color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { value: 3, icon: Smile, label: 'Gut',          color: 'text-green-400', bg: 'bg-green-500/15' },
]

export default function Stress() {
  const { state, addJournalEntry } = useApp()
  const [activeBreath, setActiveBreath] = useState(0)
  const [journalText, setJournalText] = useState('')
  const [mood, setMood] = useState(2)
  const [showJournal, setShowJournal] = useState(false)

  const saveJournal = () => {
    if (!journalText.trim()) return
    addJournalEntry({ date: new Date().toISOString().split('T')[0], mood, text: journalText, tags: [] })
    setJournalText('')
    setShowJournal(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Breathing */}
      <div className="card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Wind size={16} className="text-teal-400" />
          Atemübungen
        </h2>
        {/* Pattern tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {breathingPatterns.map((p, i) => (
            <button key={i} onClick={() => setActiveBreath(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${activeBreath === i ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-4">{breathingPatterns[activeBreath].desc}</p>
        <BreathingExercise key={activeBreath} pattern={breathingPatterns[activeBreath]} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: '🚶', title: 'Spaziergang', desc: '20 Min in der Natur, Cortisol sinkt messbar', color: 'text-green-400', bg: 'bg-green-500/10' },
          { emoji: '🧘', title: 'Kurz-Meditation', desc: '5 Min Körperscan oder Stille-Meditation', color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { emoji: '☀️', title: 'Morgenprogramm', desc: 'Wasser, Sonnenlicht, Bewegung – startet den Tag', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ emoji, title, desc, color, bg }) => (
          <div key={title} className={`card p-4 ${bg} border-none`}>
            <div className="text-2xl mb-2">{emoji}</div>
            <p className={`text-sm font-semibold ${color}`}>{title}</p>
            <p className="text-xs text-slate-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Journal */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Heart size={16} className="text-rose-400" />
            Journaling
          </h2>
          <button onClick={() => setShowJournal(f => !f)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-rose text-white text-xs font-medium">
            <Plus size={14} /> Eintrag
          </button>
        </div>

        {showJournal && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Wie geht es dir?</label>
              <div className="flex gap-3">
                {moodOptions.map(({ value, icon: Icon, label, color, bg }) => (
                  <button key={value} onClick={() => setMood(value)}
                    className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all
                      ${mood === value ? `${bg} border border-current/30` : 'bg-white/5'}`}
                  >
                    <Icon size={18} className={mood === value ? color : 'text-slate-500'} />
                    <span className={`text-xs ${mood === value ? color : 'text-slate-500'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={journalText} onChange={e => setJournalText(e.target.value)}
              className="w-full h-24 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm p-3 resize-none focus:outline-none focus:border-rose-500/50"
              placeholder="Was beschäftigt dich gerade? Wie war dein Tag?"
            />
            <button onClick={saveJournal} className="w-full py-2 rounded-xl gradient-rose text-white text-sm font-medium">Speichern</button>
          </div>
        )}

        <div className="space-y-3">
          {state.journalEntries.map(e => {
            const m = moodOptions.find(o => o.value === e.mood) || moodOptions[1]
            return (
              <div key={e.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">{e.date}</span>
                  <m.icon size={14} className={m.color} />
                </div>
                <p className="text-sm text-slate-300">{e.text}</p>
                {e.tags?.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {e.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{t}</span>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
