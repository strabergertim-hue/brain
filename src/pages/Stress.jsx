import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import {
  Wind, Plus, Smile, Meh, Frown, Heart,
  Camera, ImagePlus, Sparkles, Loader2, X, Key,
} from 'lucide-react'
import {
  transcribeHandwriting, getApiKey, setApiKey as saveApiKey,
  maskApiKey, fileToDataUrl, ERR_NO_KEY,
} from '../lib/anthropic'

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

  // Photo-import state
  const [pendingImages, setPendingImages] = useState([])
  const [lightboxImage, setLightboxImage] = useState(null)
  const [showKeyPanel, setShowKeyPanel] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasApiKey, setHasApiKey] = useState(() => !!getApiKey())

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxImage) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxImage(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxImage])

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (pendingImages.length >= 3) return
    try {
      const dataUrl = await fileToDataUrl(file)
      setPendingImages(prev => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        dataUrl,
        mediaType: file.type,
        status: 'pending',
        error: null,
      }])
    } catch { /* ignore */ }
  }

  const updateImage = (id, patch) =>
    setPendingImages(prev => prev.map(img => img.id === id ? { ...img, ...patch } : img))

  const removeImage = (id) =>
    setPendingImages(prev => prev.filter(img => img.id !== id))

  const attachImage = (id) => updateImage(id, { status: 'attached', error: null })

  const transcribeImage = async (id) => {
    if (!getApiKey()) {
      setShowKeyPanel(true)
      setHasApiKey(false)
      return
    }
    const image = pendingImages.find(img => img.id === id)
    if (!image) return

    updateImage(id, { status: 'transcribing', error: null })
    try {
      const text = await transcribeHandwriting(image.dataUrl, image.mediaType)
      setJournalText(prev => prev ? `${prev}\n\n${text}` : text)
      removeImage(id)
    } catch (error) {
      if (error?.message === ERR_NO_KEY) {
        setShowKeyPanel(true)
        setHasApiKey(false)
        updateImage(id, { status: 'pending' })
      } else {
        updateImage(id, { status: 'error', error: 'Text konnte nicht erkannt werden.' })
      }
    }
  }

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed) return
    saveApiKey(trimmed)
    setHasApiKey(true)
    setApiKeyInput('')
    setShowKeyPanel(false)
  }

  const handleClearApiKey = () => {
    saveApiKey(null)
    setHasApiKey(false)
    setApiKeyInput('')
  }

  const saveJournal = () => {
    if (!journalText.trim()) return
    const attached = pendingImages
      .filter(img => img.status === 'attached')
      .map(img => img.dataUrl)
    addJournalEntry({
      date: new Date().toISOString().split('T')[0],
      mood,
      text: journalText,
      tags: [],
      ...(attached.length > 0 && { images: attached }),
    })
    setJournalText('')
    setPendingImages([])
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

            {/* Pending image previews */}
            {pendingImages.length > 0 && (
              <div className="space-y-2">
                {pendingImages.map(img => (
                  <div key={img.id} className="p-2 rounded-xl bg-white/3 border border-teal-500/25">
                    <div className="relative">
                      <img
                        src={img.dataUrl} alt="Vorschau"
                        className="w-full h-32 object-cover rounded-lg border border-teal-500/20"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-500/80 text-white flex items-center justify-center transition-colors"
                        title="Entfernen"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {img.status === 'attached' ? (
                      <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/15 text-teal-300 text-xs">
                        <Camera size={12} /> Wird mit Eintrag gespeichert
                      </div>
                    ) : (
                      <>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => attachImage(img.id)}
                            disabled={img.status === 'transcribing'}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs disabled:opacity-50 transition-colors"
                          >
                            Als Bild speichern
                          </button>
                          <button
                            onClick={() => transcribeImage(img.id)}
                            disabled={img.status === 'transcribing'}
                            className="flex-1 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                          >
                            {img.status === 'transcribing' ? (
                              <><Loader2 size={12} className="animate-spin" /> Erkenne…</>
                            ) : (
                              <><Sparkles size={12} /> Als Text erkennen (KI)</>
                            )}
                          </button>
                        </div>
                        {img.status === 'error' && img.error && (
                          <p className="mt-1.5 text-xs text-rose-400">{img.error}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Photo import buttons */}
            {pendingImages.length < 3 && (
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-transparent border border-teal-500/30 hover:bg-teal-500/10 text-teal-300 text-xs cursor-pointer transition-colors">
                  <input
                    type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => { handleFileSelect(e.target.files?.[0]); e.target.value = '' }}
                  />
                  <Camera size={14} /> Foto aufnehmen
                </label>
                <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-transparent border border-teal-500/30 hover:bg-teal-500/10 text-teal-300 text-xs cursor-pointer transition-colors">
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={e => { handleFileSelect(e.target.files?.[0]); e.target.value = '' }}
                  />
                  <ImagePlus size={14} /> Bild hochladen
                </label>
              </div>
            )}

            {/* API key footer */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowKeyPanel(p => !p)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-400 transition-colors"
              >
                <Key size={11} />
                {hasApiKey ? 'API-Schlüssel verwalten' : 'API-Schlüssel hinzufügen'}
                {hasApiKey && <span className="text-teal-500/60 font-mono">{maskApiKey(getApiKey())}</span>}
              </button>
            </div>

            {showKeyPanel && (
              <div className="p-3 rounded-xl bg-white/3 border border-teal-500/20 space-y-2">
                <p className="text-xs text-slate-400">
                  Anthropic API-Schlüssel für die handschriftliche Texterkennung. Wird nur lokal in deinem Browser gespeichert.
                </p>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder={hasApiKey ? 'Neuen Schlüssel eingeben…' : 'sk-ant-...'}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-xs p-2 focus:outline-none focus:border-teal-500/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs hover:bg-teal-500/30 disabled:opacity-50"
                  >
                    Speichern
                  </button>
                  {hasApiKey && (
                    <button onClick={handleClearApiKey} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs hover:bg-rose-500/20">
                      Entfernen
                    </button>
                  )}
                  <button onClick={() => setShowKeyPanel(false)} className="ml-auto px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10">
                    Schließen
                  </button>
                </div>
              </div>
            )}

            <button onClick={saveJournal} className="w-full py-2 rounded-xl gradient-rose text-white text-sm font-medium">Speichern</button>
          </div>
        )}

        <div className="space-y-3">
          {state.journalEntries.map(e => {
            const m = moodOptions.find(o => o.value === e.mood) || moodOptions[1]
            const hasImages = e.images?.length > 0
            return (
              <div key={e.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{e.date}</span>
                    {hasImages && (
                      <span className="flex items-center gap-1 text-xs text-teal-400" title="Enthält Fotos">
                        <Camera size={11} />
                      </span>
                    )}
                  </div>
                  <m.icon size={14} className={m.color} />
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{e.text}</p>
                {e.tags?.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {e.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{t}</span>)}
                  </div>
                )}
                {hasImages && (
                  <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
                    {e.images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxImage(src)}
                        className="flex-shrink-0 rounded-lg overflow-hidden border border-white/10 hover:border-teal-500/40 transition-colors"
                      >
                        <img src={src} alt="" className="w-16 h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title="Schließen (Esc)"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt=""
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-xl cursor-default"
          />
        </div>
      )}
    </div>
  )
}
