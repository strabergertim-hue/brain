import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Target, Plus, Play, Pause, RotateCcw, Timer } from 'lucide-react'

function PomodoroTimer() {
  const MODES = [
    { key: 'work', label: 'Fokus', minutes: 25, color: '#06b6d4' },
    { key: 'short', label: 'Kurze Pause', minutes: 5, color: '#10b981' },
    { key: 'long', label: 'Lange Pause', minutes: 15, color: '#6366f1' },
  ]

  const [modeIdx, setModeIdx] = useState(0)
  const [seconds, setSeconds] = useState(MODES[0].minutes * 60)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const intervalRef = useRef(null)

  const mode = MODES[modeIdx]
  const total = mode.minutes * 60
  const pct = ((total - seconds) / total) * 100
  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode.key === 'work') setRounds(r => r + 1)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const switchMode = (i) => {
    setModeIdx(i)
    setSeconds(MODES[i].minutes * 60)
    setRunning(false)
  }

  const reset = () => { setSeconds(mode.minutes * 60); setRunning(false) }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-2">
        {MODES.map((m, i) => (
          <button key={m.key} onClick={() => switchMode(i)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all
              ${modeIdx === i ? 'text-white' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
            style={modeIdx === i ? { background: m.color + '33', border: `1px solid ${m.color}55`, color: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Ring timer */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width={170} height={170} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={85} cy={85} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle
              cx={85} cy={85} r={r} fill="none"
              stroke={mode.color} strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold text-white">{mins}:{secs}</span>
            <span className="text-xs text-slate-400 mt-1">{mode.label}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          className="w-20 h-11 rounded-xl flex items-center justify-center gap-2 text-white font-semibold text-sm transition-all"
          style={{ background: mode.color }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : 'Start'}
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        Abgeschlossene Pomodoros heute: <span className="text-amber-400 font-semibold">{rounds}</span>
      </p>
    </div>
  )
}

const productivityLabels = ['', 'Sehr schlecht', 'Schlecht', 'OK', 'Gut', 'Ausgezeichnet']
const techniques = ['Pomodoro', 'Zeitblock', 'Deep Work', 'Flowstate', 'Sonstige']

export default function Focus() {
  const { state, addFocusSession } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', productivity: 4, duration: 25, technique: 'Pomodoro' })

  const handleAdd = () => {
    if (!form.title) return
    addFocusSession({ ...form, date: new Date().toISOString().split('T')[0] })
    setForm({ title: '', description: '', productivity: 4, duration: 25, technique: 'Pomodoro' })
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Pomodoro */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Timer size={16} className="text-cyan-400" />
          Pomodoro-Timer
        </h2>
        <PomodoroTimer />
      </div>

      {/* Sessions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Target size={16} className="text-cyan-400" />
            Fokus-Sessions
          </h2>
          <button onClick={() => setShowForm(f => !f)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-cyan text-white text-xs font-medium">
            <Plus size={14} /> Session
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <input
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Titel der Session"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50"
            />
            <textarea
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Kurze Beschreibung (optional)"
              className="w-full h-16 rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 resize-none focus:outline-none focus:border-cyan-500/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Dauer (Min)</label>
                <input type="number" value={form.duration} min={5} max={240} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Technik</label>
                <select value={form.technique} onChange={e => setForm(f => ({ ...f, technique: e.target.value }))}
                  className="w-full rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50">
                  {techniques.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Produktivität: <span className="text-white">{productivityLabels[form.productivity]}</span></label>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, productivity: n }))}
                    className={`flex-1 h-2.5 rounded-full transition-all ${n <= form.productivity ? 'bg-cyan-500' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
            <button onClick={handleAdd} className="w-full py-2 rounded-xl gradient-cyan text-white text-sm font-medium">Speichern</button>
          </div>
        )}

        <div className="space-y-3">
          {state.focusSessions.map(s => (
            <div key={s.id} className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{s.technique}</span>
                </div>
                {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
                <p className="text-xs text-slate-500 mt-1">{s.date} · {s.duration} Min</p>
              </div>
              <div className="flex gap-0.5 ml-3 mt-0.5">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className={`w-2 h-5 rounded-sm ${n <= s.productivity ? 'bg-cyan-500' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
