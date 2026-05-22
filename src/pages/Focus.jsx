import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Target, Plus, Play, Pause, RotateCcw, Timer, SkipForward, CheckCircle } from 'lucide-react'

// Full 8-segment pomodoro cycle: focus × 4, short break × 3, long break × 1
const CYCLE = [
  { type: 'work',  label: 'Fokus',       minutes: 25, color: '#06b6d4' },
  { type: 'short', label: 'Kurze Pause', minutes: 5,  color: '#10b981' },
  { type: 'work',  label: 'Fokus',       minutes: 25, color: '#06b6d4' },
  { type: 'short', label: 'Kurze Pause', minutes: 5,  color: '#10b981' },
  { type: 'work',  label: 'Fokus',       minutes: 25, color: '#06b6d4' },
  { type: 'short', label: 'Kurze Pause', minutes: 5,  color: '#10b981' },
  { type: 'work',  label: 'Fokus',       minutes: 25, color: '#06b6d4' },
  { type: 'long',  label: 'Lange Pause', minutes: 30, color: '#6366f1' },
]

// ─── Zyklus-Fortschrittsanzeige ───────────────────────────────────────────────

function CycleIndicator({ segIdx, completedIndices, onJump, currentProgress }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {CYCLE.map((seg, i) => {
        const done = completedIndices.has(i)
        const cur  = i === segIdx
        const dim  = !done && !cur
        // fill fraction: 1 if done, actual progress if current, 0 if future
        const fill = done ? 1 : cur ? currentProgress : 0

        if (seg.type === 'short') {
          return (
            <div
              key={i} onClick={() => onJump(i)} title={seg.label}
              className={cur && fill > 0 ? 'animate-pulse' : ''}
              style={{
                width: 7, height: 7, borderRadius: '50%', cursor: 'pointer',
                background: fill > 0 ? seg.color : 'rgba(255,255,255,0.13)',
                boxShadow: cur ? `0 0 5px ${seg.color}` : 'none',
                opacity: dim ? 0.4 : 1,
                transition: 'all 0.25s',
              }}
            />
          )
        }

        const w = seg.type === 'long' ? 44 : 22
        const brad = seg.type === 'long' ? 4 : 3

        return (
          <div
            key={i} onClick={() => onJump(i)} title={seg.label}
            style={{
              position: 'relative', overflow: 'hidden',
              width: w, height: 8, borderRadius: brad, cursor: 'pointer',
              background: 'rgba(255,255,255,0.13)',
              boxShadow: cur && fill > 0 ? `0 0 6px ${seg.color}` : 'none',
              opacity: dim ? 0.4 : 1,
              transition: 'opacity 0.25s, box-shadow 0.25s',
            }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${fill * 100}%`,
              background: seg.color,
              borderRadius: brad,
              transition: cur ? 'width 1s linear' : 'none',
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Pomodoro-Timer ───────────────────────────────────────────────────────────

function PomodoroTimer({ onSessionComplete }) {
  const [segIdx, setSegIdx]                         = useState(0)
  const [seconds, setSeconds]                       = useState(CYCLE[0].minutes * 60)
  const [running, setRunning]                       = useState(false)
  const [completedIndices, setCompletedIndices]     = useState(new Set())
  const [totalPomodoros, setTotalPomodoros]         = useState(0)
  const [sessionTitle, setSessionTitle]             = useState('')
  const [sessionFocusSeconds, setSessionFocusSeconds] = useState(0)
  const [hasStarted, setHasStarted]                 = useState(false)

  const intervalRef       = useRef(null)
  const breakAutoStartRef = useRef(null)

  // Refs for fresh values inside effects/callbacks
  const segIdxRef         = useRef(segIdx)
  segIdxRef.current       = segIdx
  const sessionTitleRef   = useRef(sessionTitle)
  sessionTitleRef.current = sessionTitle
  const onCompleteRef     = useRef(onSessionComplete)
  onCompleteRef.current   = onSessionComplete
  const segTypeRef        = useRef(CYCLE[segIdx].type)
  segTypeRef.current      = CYCLE[segIdx].type

  const seg   = CYCLE[segIdx]
  const total = seg.minutes * 60
  const pct   = ((total - seconds) / total)   // 0–1
  const r     = 70
  const circ  = 2 * Math.PI * r
  const offset = circ - pct * circ

  // Track hasStarted whenever timer runs
  useEffect(() => {
    if (running) setHasStarted(true)
  }, [running])

  // Ticker — also accumulates focus seconds for work segments
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => (s > 0 ? s - 1 : 0))
        if (segTypeRef.current === 'work') {
          setSessionFocusSeconds(fs => fs + 1)
        }
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // Completion detection
  useEffect(() => {
    if (seconds !== 0 || !running) return

    clearInterval(intervalRef.current)
    clearTimeout(breakAutoStartRef.current)
    setRunning(false)

    const curIdx  = segIdxRef.current
    const curSeg  = CYCLE[curIdx]
    const nextIdx = (curIdx + 1) % CYCLE.length

    setCompletedIndices(prev =>
      nextIdx === 0 ? new Set() : new Set([...prev, curIdx])
    )

    if (curSeg.type === 'work') {
      onCompleteRef.current(sessionTitleRef.current.trim() || 'Pomodoro Session')
      setTotalPomodoros(n => n + 1)
      setSessionFocusSeconds(0)  // consumed by auto-save
    }

    setSegIdx(nextIdx)
    setSeconds(CYCLE[nextIdx].minutes * 60)

    if (curSeg.type === 'work') {
      breakAutoStartRef.current = setTimeout(() => setRunning(true), 600)
    }
  }, [seconds, running])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearTimeout(breakAutoStartRef.current)
  }, [])

  // ── Actions ──

  const jumpToSegment = (idx) => {
    clearTimeout(breakAutoStartRef.current)
    setSegIdx(idx)
    setSeconds(CYCLE[idx].minutes * 60)
    setRunning(false)
  }

  const skipToNext = () => jumpToSegment((segIdxRef.current + 1) % CYCLE.length)

  const reset = () => {
    clearTimeout(breakAutoStartRef.current)
    setSeconds(CYCLE[segIdxRef.current].minutes * 60)
    setRunning(false)
  }

  const resetAll = () => {
    clearTimeout(breakAutoStartRef.current)
    clearInterval(intervalRef.current)
    setSegIdx(0)
    setSeconds(CYCLE[0].minutes * 60)
    setRunning(false)
    setCompletedIndices(new Set())
    setSessionFocusSeconds(0)
    setHasStarted(false)
  }

  const finishEarly = () => {
    const title = sessionTitleRef.current.trim() || 'Pomodoro Session'
    onCompleteRef.current(title, sessionFocusSeconds)
    resetAll()
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const focusMinutesElapsed = Math.max(1, Math.round(sessionFocusSeconds / 60))

  return (
    <div className="space-y-4">
      {/* Session title */}
      <input
        value={sessionTitle}
        onChange={e => setSessionTitle(e.target.value)}
        placeholder="Session-Titel (optional – wird bei Abschluss gespeichert)"
        className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
      />

      {/* Ring timer */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width={170} height={170} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={85} cy={85} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle
              cx={85} cy={85} r={r} fill="none"
              stroke={seg.color} strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold text-white">{mins}:{secs}</span>
            <span className="text-xs mt-1" style={{ color: seg.color }}>{seg.label}</span>
          </div>
        </div>
      </div>

      {/* Cycle progress indicator */}
      <CycleIndicator
        segIdx={segIdx}
        completedIndices={completedIndices}
        onJump={jumpToSegment}
        currentProgress={pct}
      />

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          title="Segment zurücksetzen"
          className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          className="w-20 h-11 rounded-xl flex items-center justify-center gap-2 text-white font-semibold text-sm transition-all"
          style={{ background: seg.color }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={skipToNext}
          title="Überspringen"
          className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Finish early */}
      {hasStarted && (
        <button
          onClick={finishEarly}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 hover:border-white/15 text-sm transition-all"
        >
          <CheckCircle size={14} className="text-cyan-400" />
          Session abschließen
          {sessionFocusSeconds > 0 && (
            <span className="text-xs text-slate-500">({focusMinutesElapsed} Min)</span>
          )}
        </button>
      )}

      <p className="text-center text-xs text-slate-500">
        Abgeschlossene Pomodoros heute:{' '}
        <span className="text-amber-400 font-semibold">{totalPomodoros}</span>
      </p>
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

const productivityLabels = ['', 'Sehr schlecht', 'Schlecht', 'OK', 'Gut', 'Ausgezeichnet']
const techniques = ['Pomodoro', 'Zeitblock', 'Deep Work', 'Flowstate', 'Sonstige']

export default function Focus() {
  const { state, addFocusSession } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', productivity: 4, duration: 25, technique: 'Pomodoro',
  })

  const handleAdd = () => {
    if (!form.title) return
    addFocusSession({ ...form, date: new Date().toISOString().split('T')[0] })
    setForm({ title: '', description: '', productivity: 4, duration: 25, technique: 'Pomodoro' })
    setShowForm(false)
  }

  // Called by timer: natural completion passes no elapsedSeconds, early finish passes actual seconds
  const handleAutoSave = (title, elapsedSeconds) => {
    const isEarly = elapsedSeconds !== undefined
    addFocusSession({
      title,
      description: '',
      productivity: 4,
      duration: isEarly ? Math.max(1, Math.round(elapsedSeconds / 60)) : 25,
      technique: 'Pomodoro',
      date: new Date().toISOString().split('T')[0],
      ...(isEarly && { earlyFinish: true }),
    })
  }

  return (
    <div className="p-6 space-y-5">

      {/* Pomodoro */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Timer size={16} className="text-cyan-400" />
          Pomodoro-Timer
        </h2>
        <PomodoroTimer onSessionComplete={handleAutoSave} />
      </div>

      {/* Sessions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Target size={16} className="text-cyan-400" />
            Fokus-Sessions
          </h2>
          <button
            onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-cyan text-white text-xs font-medium"
          >
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
                <input
                  type="number" value={form.duration} min={5} max={240}
                  onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Technik</label>
                <select
                  value={form.technique} onChange={e => setForm(f => ({ ...f, technique: e.target.value }))}
                  className="w-full rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50"
                >
                  {techniques.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Produktivität: <span className="text-white">{productivityLabels[form.productivity]}</span>
              </label>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, productivity: n }))}
                    className={`flex-1 h-2.5 rounded-full transition-all ${n <= form.productivity ? 'bg-cyan-500' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
            <button onClick={handleAdd} className="w-full py-2 rounded-xl gradient-cyan text-white text-sm font-medium">
              Speichern
            </button>
          </div>
        )}

        <div className="space-y-3">
          {state.focusSessions.map(s => (
            <div key={s.id} className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{s.technique}</span>
                  {s.earlyFinish && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Vorzeitig beendet
                    </span>
                  )}
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
