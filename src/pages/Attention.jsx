import { useState, useEffect, useRef } from 'react'
import { Zap, Eye, Timer, RefreshCw, ChevronRight } from 'lucide-react'

// ─── Reaction Time Game ────────────────────────────────────────────────────
function ReactionGame() {
  const [phase, setPhase] = useState('idle') // idle | wait | go | done
  const [times, setTimes] = useState([])
  const [startTime, setStartTime] = useState(null)
  const timerRef = useRef(null)

  const start = () => {
    setPhase('wait')
    const delay = 2000 + Math.random() * 3000
    timerRef.current = setTimeout(() => {
      setPhase('go')
      setStartTime(Date.now())
    }, delay)
  }

  const tap = () => {
    if (phase === 'wait') {
      clearTimeout(timerRef.current)
      setPhase('idle')
      return
    }
    if (phase === 'go') {
      const t = Date.now() - startTime
      setTimes(ts => [...ts.slice(-4), t])
      setPhase('done')
    }
  }

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">Klicke so schnell wie möglich, wenn die Fläche grün wird.</p>
      <div
        onClick={tap}
        className={`h-36 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150 select-none
          ${phase === 'go' ? 'bg-green-500 scale-105' : phase === 'wait' ? 'bg-rose-500/30' : 'bg-white/5 hover:bg-white/10'}
        `}
      >
        <p className="text-white font-bold text-lg">
          {phase === 'idle' && 'Klicken zum Starten'}
          {phase === 'wait' && 'Warte...'}
          {phase === 'go' && 'JETZT!'}
          {phase === 'done' && `${times[times.length - 1]}ms`}
        </p>
      </div>
      {phase === 'done' && (
        <button onClick={start} className="w-full py-2.5 rounded-xl gradient-purple text-white text-sm font-medium flex items-center justify-center gap-2">
          <RefreshCw size={14} /> Nochmal
        </button>
      )}
      {phase === 'idle' && times.length === 0 && (
        <button onClick={start} className="w-full py-2.5 rounded-xl gradient-purple text-white text-sm font-medium">
          Starten
        </button>
      )}
      {times.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {times.map((t, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-full ${t < 250 ? 'bg-green-500/20 text-green-400' : t < 400 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {t}ms
            </span>
          ))}
          {avg && <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400">Ø {avg}ms</span>}
        </div>
      )}
    </div>
  )
}

// ─── Number Sequence Memory ────────────────────────────────────────────────
function NumberMemory() {
  const [phase, setPhase] = useState('idle') // idle | show | input | result
  const [level, setLevel] = useState(3)
  const [seq, setSeq] = useState([])
  const [input, setInput] = useState('')
  const [best, setBest] = useState(3)

  const genSeq = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10))

  const startRound = () => {
    const s = genSeq(level)
    setSeq(s)
    setInput('')
    setPhase('show')
    setTimeout(() => setPhase('input'), level * 800 + 500)
  }

  const check = () => {
    const correct = seq.join('') === input
    if (correct) {
      const next = level + 1
      setBest(b => Math.max(b, next))
      setLevel(next)
      setPhase('idle')
    } else {
      setPhase('result')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">Merke dir die Zahlenfolge und gib sie ein.</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Level <span className="text-white font-bold">{level}</span></span>
        <span className="text-slate-400">Bestleistung <span className="text-amber-400 font-bold">{best} Ziffern</span></span>
      </div>

      <div className="h-20 rounded-2xl bg-white/5 flex items-center justify-center text-3xl font-mono font-bold tracking-widest text-white">
        {phase === 'show' && seq.join(' ')}
        {phase === 'idle' && <span className="text-slate-600 text-sm">Bereit?</span>}
        {phase === 'input' && <span className="text-slate-600 text-sm">Eingabe...</span>}
        {phase === 'result' && <span className="text-rose-400 text-base">War: {seq.join(' ')}</span>}
      </div>

      {(phase === 'idle' || phase === 'result') && (
        <button onClick={startRound} className="w-full py-2.5 rounded-xl gradient-purple text-white text-sm font-medium">
          {phase === 'result' ? `Nochmal (Level ${level})` : 'Starten'}
        </button>
      )}

      {phase === 'input' && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && check()}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl tracking-widest p-3 focus:outline-none focus:border-violet-500/50"
            placeholder="Zahlen eingeben"
            maxLength={level}
            autoFocus
          />
          <button onClick={check} className="px-5 rounded-xl gradient-purple text-white text-sm font-medium">OK</button>
        </div>
      )}
    </div>
  )
}

// ─── Color Stroop ─────────────────────────────────────────────────────────
function StroopGame() {
  const colors = [
    { name: 'ROT', hex: '#ef4444' },
    { name: 'BLAU', hex: '#3b82f6' },
    { name: 'GRÜN', hex: '#22c55e' },
    { name: 'GELB', hex: '#eab308' },
  ]

  const genRound = () => {
    const word = colors[Math.floor(Math.random() * 4)]
    let ink = colors[Math.floor(Math.random() * 4)]
    while (ink.hex === word.hex) ink = colors[Math.floor(Math.random() * 4)]
    return { word, ink }
  }

  const [round, setRound] = useState(genRound)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [flash, setFlash] = useState(null)

  const answer = (color) => {
    const correct = color.hex === round.ink.hex
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    setTotal(t => t + 1)
    setTimeout(() => {
      setRound(genRound())
      setFlash(null)
    }, 400)
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">Klicke auf die <strong className="text-white">Farbe der Tinte</strong>, nicht auf den Text.</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Punkte <span className="text-white font-bold">{score}</span></span>
        <span className="text-slate-400">Gesamt <span className="text-white font-bold">{total}</span></span>
      </div>
      <div className={`h-24 rounded-2xl flex items-center justify-center transition-all ${flash === 'correct' ? 'bg-green-500/20' : flash === 'wrong' ? 'bg-rose-500/20' : 'bg-white/5'}`}>
        <span className="text-4xl font-black" style={{ color: round.ink.hex }}>{round.word.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {colors.map(c => (
          <button key={c.hex} onClick={() => answer(c)}
            className="py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: c.hex + '33', color: c.hex, border: `1px solid ${c.hex}44` }}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const exercises = [
  {
    id: 'reaction', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    title: 'Reaktionszeit', desc: 'Messe und verbessere deine Reaktionsgeschwindigkeit', difficulty: 'Leicht',
    component: ReactionGame,
  },
  {
    id: 'memory', icon: Eye, color: 'text-violet-400', bg: 'bg-violet-500/10',
    title: 'Zahlengedächtnis', desc: 'Merke dir zunehmend längere Zahlenfolgen', difficulty: 'Mittel',
    component: NumberMemory,
  },
  {
    id: 'stroop', icon: Timer, color: 'text-cyan-400', bg: 'bg-cyan-500/10',
    title: 'Stroop-Test', desc: 'Trainiere kognitive Flexibilität und Impulskontrolle', difficulty: 'Mittel',
    component: StroopGame,
  },
]

export default function Attention() {
  const [active, setActive] = useState(null)
  const ex = exercises.find(e => e.id === active)

  if (active && ex) {
    const Component = ex.component
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActive(null)} className="text-slate-400 hover:text-white text-sm transition-colors">← Zurück</button>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl ${ex.bg} flex items-center justify-center`}>
              <ex.icon size={20} className={ex.color} />
            </div>
            <div>
              <h2 className="text-white font-bold">{ex.title}</h2>
              <p className="text-xs text-slate-400">{ex.desc}</p>
            </div>
          </div>
          <Component />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-300">
          <Zap size={14} className="inline mr-2" />
          Regelmäßiges Aufmerksamkeitstraining verbessert Konzentration, Reaktionsfähigkeit und kognitive Flexibilität.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {exercises.map(({ id, icon: Icon, color, bg, title, desc, difficulty }) => (
          <div key={id} onClick={() => setActive(id)} className="card card-hover p-5 cursor-pointer">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={22} className={color} />
            </div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-slate-400 text-sm mt-1 mb-3">{desc}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${difficulty === 'Leicht' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {difficulty}
              </span>
              <ChevronRight size={14} className="text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
