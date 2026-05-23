import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Target, Plus, Play, Pause, RotateCcw, Timer, SkipForward, CheckCircle, Pencil } from 'lucide-react'

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

const productivityLabels = ['', 'Sehr schlecht', 'Schlecht', 'OK', 'Gut', 'Ausgezeichnet']
const techniques = ['Pomodoro', 'Zeitblock', 'Deep Work', 'Flowstate', 'Sonstige']

// ─── Produktivitäts-Balken (wiederverwendbar) ────────────────────────────────

function ProductivityBars({ value, onChange, size = 'md' }) {
  const h = size === 'lg' ? 'h-3.5' : 'h-2.5'
  return (
    <div className="flex gap-1.5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 ${h} rounded-full transition-all ${value && n <= value ? 'bg-cyan-500' : 'bg-white/10 hover:bg-white/15'}`}
        />
      ))}
    </div>
  )
}

// ─── Zyklus-Fortschrittsanzeige ───────────────────────────────────────────────

function CycleIndicator({ segIdx, completedIndices, onJump, currentProgress }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {CYCLE.map((seg, i) => {
        const done = completedIndices.has(i)
        const cur  = i === segIdx
        const dim  = !done && !cur
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

  const segIdxRef         = useRef(segIdx);         segIdxRef.current       = segIdx
  const sessionTitleRef   = useRef(sessionTitle);   sessionTitleRef.current = sessionTitle
  const onCompleteRef     = useRef(onSessionComplete); onCompleteRef.current = onSessionComplete
  const segTypeRef        = useRef(CYCLE[segIdx].type); segTypeRef.current = CYCLE[segIdx].type

  const seg   = CYCLE[segIdx]
  const total = seg.minutes * 60
  const pct   = ((total - seconds) / total)
  const r     = 70
  const circ  = 2 * Math.PI * r
  const offset = circ - pct * circ

  useEffect(() => { if (running) setHasStarted(true) }, [running])

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
      setSessionFocusSeconds(0)
    }

    setSegIdx(nextIdx)
    setSeconds(CYCLE[nextIdx].minutes * 60)

    if (curSeg.type === 'work') {
      breakAutoStartRef.current = setTimeout(() => setRunning(true), 600)
    }
  }, [seconds, running])

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearTimeout(breakAutoStartRef.current)
  }, [])

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
      <input
        value={sessionTitle}
        onChange={e => setSessionTitle(e.target.value)}
        placeholder="Session-Titel (optional – wird bei Abschluss gespeichert)"
        className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
      />

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

      <CycleIndicator
        segIdx={segIdx}
        completedIndices={completedIndices}
        onJump={jumpToSegment}
        currentProgress={pct}
      />

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

// ─── Produktivitäts-Modal nach Pomodoro ──────────────────────────────────────

function ProductivityModal({ session, onConfirm, onSkip }) {
  const [rating, setRating] = useState(null)

  if (!session) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onSkip}
    >
      <div
        className="card p-6 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="text-white font-semibold text-lg">Wie produktiv warst du?</h3>
          <p className="text-xs text-slate-400 mt-1 truncate">{session.title}</p>
        </div>

        <ProductivityBars value={rating} onChange={setRating} size="lg" />
        <p className="text-center text-xs h-4">
          {rating
            ? <span className="text-cyan-400 font-medium">{productivityLabels[rating]}</span>
            : <span className="text-slate-600">Wähle eine Bewertung</span>}
        </p>

        <button
          onClick={() => onConfirm(rating)}
          disabled={!rating}
          className="w-full py-2.5 rounded-xl gradient-cyan text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Speichern
        </button>
        <button
          onClick={onSkip}
          className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Überspringen
        </button>
      </div>
    </div>
  )
}

// ─── Bearbeitungs-Formular für Sessions ──────────────────────────────────────

function SessionEditForm({ form, onChange, onSave, onCancel, onDelete }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  return (
    <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
      <input
        value={form.title}
        onChange={e => onChange({ ...form, title: e.target.value })}
        placeholder="Titel"
        className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50"
      />
      <textarea
        value={form.description || ''}
        onChange={e => onChange({ ...form, description: e.target.value })}
        placeholder="Beschreibung (optional)"
        className="w-full h-16 rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 resize-none focus:outline-none focus:border-cyan-500/50"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Datum</label>
          <input
            type="date"
            value={form.date}
            onChange={e => onChange({ ...form, date: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Dauer (Min)</label>
          <input
            type="number" min={1} max={480}
            value={form.duration}
            onChange={e => onChange({ ...form, duration: +e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">Tag</label>
        <select
          value={form.technique}
          onChange={e => onChange({ ...form, technique: e.target.value })}
          className="w-full rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-cyan-500/50"
        >
          {techniques.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1.5">
          Produktivität:{' '}
          <span className="text-white">
            {form.productivity ? productivityLabels[form.productivity] : 'Nicht bewertet'}
          </span>
        </label>
        <ProductivityBars
          value={form.productivity}
          onChange={n => onChange({ ...form, productivity: n })}
        />
      </div>

      <div className="flex gap-2 pt-1">
        {deleteConfirm ? (
          <>
            <button
              onClick={() => { onDelete(); setDeleteConfirm(false) }}
              className="py-2 px-3 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-sm font-medium border border-rose-500/30"
            >
              Wirklich löschen?
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="py-2 px-3 rounded-xl bg-white/5 text-slate-400 text-sm"
            >
              Nein
            </button>
          </>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="py-2 px-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-sm border border-rose-500/20 transition-colors"
          >
            Löschen
          </button>
        )}
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10">
          Abbrechen
        </button>
        <button onClick={onSave} className="flex-1 py-2 rounded-xl gradient-cyan text-white text-sm font-medium">
          Speichern
        </button>
      </div>
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function Focus() {
  const { state, addFocusSession, updateFocusSession, deleteFocusSession } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', productivity: null, duration: 25, technique: 'Pomodoro',
  })
  const [pendingSession, setPendingSession] = useState(null)
  const [editingId, setEditingId]           = useState(null)
  const [editForm, setEditForm]             = useState(null)

  const handleAdd = () => {
    if (!form.title) return
    addFocusSession({ ...form, date: new Date().toISOString().split('T')[0] })
    setForm({ title: '', description: '', productivity: null, duration: 25, technique: 'Pomodoro' })
    setShowForm(false)
  }

  // Called by timer: natural completion (no elapsedSeconds) or early finish (with seconds)
  const handleAutoSave = (title, elapsedSeconds) => {
    const isEarly = elapsedSeconds !== undefined
    setPendingSession({
      title,
      description: '',
      duration: isEarly ? Math.max(1, Math.round(elapsedSeconds / 60)) : 25,
      technique: 'Pomodoro',
      date: new Date().toISOString().split('T')[0],
      ...(isEarly && { earlyFinish: true }),
    })
  }

  const saveWithRating = (rating) => {
    addFocusSession({ ...pendingSession, productivity: rating })
    setPendingSession(null)
  }

  const skipRating = () => {
    addFocusSession({ ...pendingSession, productivity: null })
    setPendingSession(null)
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setEditForm({ ...s })
  }
  const cancelEdit = () => { setEditingId(null); setEditForm(null) }
  const saveEdit = () => {
    if (!editForm.title) return
    const { id, ...updates } = editForm
    updateFocusSession(id, updates)
    cancelEdit()
  }
  const deleteEdit = () => {
    deleteFocusSession(editingId)
    cancelEdit()
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
                Produktivität:{' '}
                <span className="text-white">
                  {form.productivity ? productivityLabels[form.productivity] : 'Nicht bewertet'}
                </span>
              </label>
              <ProductivityBars
                value={form.productivity}
                onChange={n => setForm(f => ({ ...f, productivity: n }))}
              />
            </div>
            <button onClick={handleAdd} className="w-full py-2 rounded-xl gradient-cyan text-white text-sm font-medium">
              Speichern
            </button>
          </div>
        )}

        <div className="space-y-3">
          {state.focusSessions.map(s => (
            editingId === s.id ? (
              <SessionEditForm
                key={s.id}
                form={editForm}
                onChange={setEditForm}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onDelete={deleteEdit}
              />
            ) : (
              <div key={s.id} className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
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
                <div className="flex items-center gap-2 ml-3 mt-0.5">
                  <div className="flex gap-0.5" title={s.productivity ? `Produktivität: ${s.productivity}/5` : 'Nicht bewertet'}>
                    {[1,2,3,4,5].map(n => (
                      <div
                        key={n}
                        className={`w-2 h-5 rounded-sm ${s.productivity && n <= s.productivity ? 'bg-cyan-500' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => startEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Bearbeiten"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      <ProductivityModal
        session={pendingSession}
        onConfirm={saveWithRating}
        onSkip={skipRating}
      />
    </div>
  )
}
