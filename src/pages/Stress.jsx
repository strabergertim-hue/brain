import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import {
  Wind, Plus, Smile, Meh, Frown, Heart,
  Camera, ImagePlus, Sparkles, Loader2, X, Key, Pencil, Check, ChevronDown, Tag,
} from 'lucide-react'
import {
  transcribeHandwriting, getApiKey, setApiKey as saveApiKey,
  maskApiKey, fileToDataUrl, ERR_NO_KEY,
} from '../lib/anthropic'
import SpazierganModal    from '../components/modals/SpazierganModal'
import MeditationModal    from '../components/modals/MeditationModal'
import MorgenprogrammModal from '../components/modals/MorgenprogrammModal'

// ─── Image Handler Hook ──────────────────────────────────────────────────────
// Returns all state + handlers needed for the photo import feature.
// Each form (add / edit) instantiates its own copy.

function useImageHandler() {
  const [pendingImages, setPendingImages] = useState([])
  const [showKeyPanel, setShowKeyPanel]   = useState(false)
  const [apiKeyInput, setApiKeyInput]     = useState('')
  const [hasApiKey, setHasApiKey]         = useState(() => !!getApiKey())
  const pendingRef = useRef(pendingImages)
  pendingRef.current = pendingImages

  const add = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
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

  const update = (id, patch) =>
    setPendingImages(prev => prev.map(img => img.id === id ? { ...img, ...patch } : img))

  const remove = (id) =>
    setPendingImages(prev => prev.filter(img => img.id !== id))

  const attach = (id) => update(id, { status: 'attached', error: null })

  const transcribe = async (id, onText) => {
    if (!getApiKey()) { setShowKeyPanel(true); setHasApiKey(false); return }
    const image = pendingRef.current.find(img => img.id === id)
    if (!image) return
    update(id, { status: 'transcribing', error: null })
    try {
      const text = await transcribeHandwriting(image.dataUrl, image.mediaType)
      onText(text)
      remove(id)
    } catch (error) {
      if (error?.message === ERR_NO_KEY) {
        setShowKeyPanel(true); setHasApiKey(false)
        update(id, { status: 'pending' })
      } else {
        update(id, { status: 'error', error: 'Text konnte nicht erkannt werden.' })
      }
    }
  }

  const saveKey = () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed) return
    saveApiKey(trimmed)
    setHasApiKey(true); setApiKeyInput(''); setShowKeyPanel(false)
  }

  const clearKey = () => { saveApiKey(null); setHasApiKey(false); setApiKeyInput('') }

  const reset = () => { setPendingImages([]); setShowKeyPanel(false); setApiKeyInput('') }

  const attachedImages = pendingImages
    .filter(img => img.status === 'attached')
    .map(img => img.dataUrl)

  return {
    pendingImages,
    showKeyPanel, setShowKeyPanel,
    apiKeyInput, setApiKeyInput,
    hasApiKey,
    add, remove, attach, transcribe, saveKey, clearKey, reset,
    attachedImages,
  }
}

// ─── Tag Dropdown ─────────────────────────────────────────────────────────────

function TagDropdown({ selected, onChange, availableTags, onAddTag }) {
  const [open, setOpen]     = useState(false)
  const [newTag, setNewTag] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const toggle = (tag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else if (selected.length < 10) {
      onChange([...selected, tag])
    }
  }

  const handleAddCustom = () => {
    const tag = newTag.trim().toLowerCase()
    if (!tag) return
    if (!availableTags.includes(tag)) onAddTag(tag)
    if (!selected.includes(tag) && selected.length < 10) onChange([...selected, tag])
    setNewTag('')
  }

  return (
    <div ref={ref} className="space-y-2">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-white transition-all"
      >
        <span className="flex items-center gap-1.5 text-xs">
          <Tag size={12} />
          Tags auswählen
          {selected.length > 0 && <span className="text-rose-400 font-medium">({selected.length})</span>}
        </span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="relative z-20 rounded-xl bg-[#1a1a2e] border border-white/15 overflow-hidden shadow-xl">
          {availableTags.length > 0 ? (
            <div className="max-h-44 overflow-y-auto">
              {availableTags.map(tag => {
                const sel = selected.includes(tag)
                const atLimit = !sel && selected.length >= 10
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={atLimit}
                    onClick={() => toggle(tag)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors
                      ${sel ? 'bg-rose-500/10 text-rose-300' : 'text-slate-300 hover:bg-white/5 disabled:opacity-40'}`}
                  >
                    {tag}
                    {sel && <Check size={12} className="text-rose-400 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="px-3 py-2 text-xs text-slate-500">Noch keine Tags vorhanden</p>
          )}
          {/* Custom tag input */}
          <div className="flex items-center gap-2 p-2 border-t border-white/10">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom() } }}
              placeholder="Neues Tag erstellen…"
              className="flex-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs p-1.5 focus:outline-none focus:border-rose-500/50"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={!newTag.trim()}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-300 text-xs hover:bg-rose-500/25 disabled:opacity-40 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(selected.filter(t => t !== tag))}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition-colors"
            >
              {tag} <X size={10} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mood Selector ────────────────────────────────────────────────────────────

const moodOptions = [
  { value: 1, icon: Frown,  label: 'Schlecht', color: 'text-rose-400',  bg: 'bg-rose-500/15' },
  { value: 2, icon: Meh,   label: 'OK',        color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { value: 3, icon: Smile, label: 'Gut',       color: 'text-green-400', bg: 'bg-green-500/15' },
]

function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {moodOptions.map(({ value: v, icon: Icon, label, color, bg }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all
            ${value === v ? `${bg} border border-current/30` : 'bg-white/5'}`}
        >
          <Icon size={18} className={value === v ? color : 'text-slate-500'} />
          <span className={`text-xs ${value === v ? color : 'text-slate-500'}`}>{label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Pending Images Section ───────────────────────────────────────────────────
// Renders pending image cards + photo import buttons + API key panel.
// maxImages controls when the "add" buttons are hidden.

function PendingImagesSection({ handler, onText, maxImages }) {
  const canAdd = handler.pendingImages.length < maxImages

  return (
    <div className="space-y-2">
      {handler.pendingImages.map(img => (
        <div key={img.id} className="p-2 rounded-xl bg-white/3 border border-teal-500/25">
          <div className="relative">
            <img
              src={img.dataUrl} alt="Vorschau"
              className="w-full h-32 object-cover rounded-lg border border-teal-500/20"
            />
            <button
              onClick={() => handler.remove(img.id)}
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
                  onClick={() => handler.attach(img.id)}
                  disabled={img.status === 'transcribing'}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs disabled:opacity-50 transition-colors"
                >
                  Als Bild speichern
                </button>
                <button
                  onClick={() => handler.transcribe(img.id, onText)}
                  disabled={img.status === 'transcribing'}
                  className="flex-1 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {img.status === 'transcribing'
                    ? <><Loader2 size={12} className="animate-spin" /> Erkenne…</>
                    : <><Sparkles size={12} /> Als Text erkennen (KI)</>}
                </button>
              </div>
              {img.status === 'error' && img.error && (
                <p className="mt-1.5 text-xs text-rose-400">{img.error}</p>
              )}
            </>
          )}
        </div>
      ))}

      {canAdd && (
        <div className="flex gap-2">
          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-transparent border border-teal-500/30 hover:bg-teal-500/10 text-teal-300 text-xs cursor-pointer transition-colors">
            <input
              type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handler.add(f) }}
            />
            <Camera size={14} /> Foto aufnehmen
          </label>
          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-transparent border border-teal-500/30 hover:bg-teal-500/10 text-teal-300 text-xs cursor-pointer transition-colors">
            <input
              type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handler.add(f) }}
            />
            <ImagePlus size={14} /> Bild hochladen
          </label>
        </div>
      )}

      {/* API key footer */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          onClick={() => handler.setShowKeyPanel(p => !p)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-400 transition-colors"
        >
          <Key size={11} />
          {handler.hasApiKey ? 'API-Schlüssel verwalten' : 'API-Schlüssel hinzufügen'}
          {handler.hasApiKey && (
            <span className="text-teal-500/60 font-mono ml-1">{maskApiKey(getApiKey())}</span>
          )}
        </button>
      </div>

      {handler.showKeyPanel && (
        <div className="p-3 rounded-xl bg-white/3 border border-teal-500/20 space-y-2">
          <p className="text-xs text-slate-400">
            Anthropic API-Schlüssel für die handschriftliche Texterkennung. Wird nur lokal in deinem Browser gespeichert.
          </p>
          <input
            type="password"
            value={handler.apiKeyInput}
            onChange={e => handler.setApiKeyInput(e.target.value)}
            placeholder={handler.hasApiKey ? 'Neuen Schlüssel eingeben…' : 'sk-ant-...'}
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-xs p-2 focus:outline-none focus:border-teal-500/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handler.saveKey}
              disabled={!handler.apiKeyInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs hover:bg-teal-500/30 disabled:opacity-50"
            >
              Speichern
            </button>
            {handler.hasApiKey && (
              <button
                onClick={handler.clearKey}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs hover:bg-rose-500/20"
              >
                Entfernen
              </button>
            )}
            <button
              onClick={() => handler.setShowKeyPanel(false)}
              className="ml-auto px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Journal Edit Form ────────────────────────────────────────────────────────
// Self-contained inline edit form, mirrors the Schlaf/Fokus patterns.

function JournalEditForm({ entry, availableTags, onAddTag, onUpdate, onDelete, onCancel, onOpenLightbox }) {
  const [form, setForm] = useState({
    date:   entry.date,
    mood:   entry.mood,
    text:   entry.text,
    tags:   entry.tags  || [],
    images: entry.images || [],
  })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const imgHandler = useImageHandler()
  const maxPending = Math.max(0, 3 - form.images.length)

  const handleSave = () => {
    if (!form.text.trim()) return
    onUpdate({
      date:   form.date,
      mood:   form.mood,
      text:   form.text,
      tags:   form.tags,
      images: [...form.images, ...imgHandler.attachedImages],
    })
  }

  return (
    <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
      {/* Date */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">Datum</label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-rose-500/50"
        />
      </div>

      {/* Mood */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">Stimmung</label>
        <MoodSelector value={form.mood} onChange={v => setForm(f => ({ ...f, mood: v }))} />
      </div>

      {/* Text */}
      <textarea
        value={form.text}
        onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
        className="w-full h-24 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm p-3 resize-none focus:outline-none focus:border-rose-500/50"
        placeholder="Was beschäftigt dich gerade?"
      />

      {/* Tags */}
      <TagDropdown
        selected={form.tags}
        onChange={tags => setForm(f => ({ ...f, tags }))}
        availableTags={availableTags}
        onAddTag={onAddTag}
      />

      {/* Existing images */}
      {form.images.length > 0 && (
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Gespeicherte Bilder</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {form.images.map((src, i) => (
              <div key={i} className="relative flex-shrink-0">
                <button onClick={() => onOpenLightbox(src)} className="block">
                  <img
                    src={src} alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-white/10 hover:border-teal-500/40 transition-colors"
                  />
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-500/80 text-white flex items-center justify-center transition-colors"
                >
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New images */}
      <PendingImagesSection
        handler={imgHandler}
        onText={text => setForm(f => ({ ...f, text: f.text ? `${f.text}\n\n${text}` : text }))}
        maxImages={maxPending}
      />

      {/* Actions */}
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
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded-xl gradient-rose text-white text-sm font-medium"
        >
          Speichern
        </button>
      </div>
    </div>
  )
}

// ─── Breathing Exercise ───────────────────────────────────────────────────────

function BreathingExercise({ pattern }) {
  const phases = pattern.phases
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
  const r    = 60
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
          : <button onClick={stop} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold">Stoppen</button>}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Stress() {
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry, addAvailableTag } = useApp()
  const [activeBreath, setActiveBreath] = useState(0)
  const [activeModal, setActiveModal]   = useState(null) // 'spaziergang' | 'meditation' | 'morgenprogramm'
  const [showJournal, setShowJournal]   = useState(false)
  const [addForm, setAddForm]           = useState({ mood: 2, text: '', tags: [] })
  const addImages                       = useImageHandler()
  const [editingId, setEditingId]       = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxImage) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxImage(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxImage])

  const toggleJournal = () => {
    if (showJournal) { setAddForm({ mood: 2, text: '', tags: [] }); addImages.reset() }
    setShowJournal(f => !f)
  }

  const saveJournal = () => {
    if (!addForm.text.trim()) return
    addJournalEntry({
      date:   new Date().toISOString().split('T')[0],
      mood:   addForm.mood,
      text:   addForm.text,
      tags:   addForm.tags,
      ...(addImages.attachedImages.length > 0 && { images: addImages.attachedImages }),
    })
    setAddForm({ mood: 2, text: '', tags: [] })
    addImages.reset()
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

      {/* Quick actions — clickable tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: '🚶', title: 'Spaziergang',    desc: '20 Min in der Natur, Cortisol sinkt messbar',       color: 'text-green-400',  bg: 'bg-green-500/10',  modal: 'spaziergang'    },
          { emoji: '🧘', title: 'Kurz-Meditation', desc: '5 Min Körperscan oder Stille-Meditation',           color: 'text-violet-400', bg: 'bg-violet-500/10', modal: 'meditation'     },
          { emoji: '☀️', title: 'Morgenprogramm',  desc: 'Wasser, Sonnenlicht, Bewegung – startet den Tag',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  modal: 'morgenprogramm' },
        ].map(({ emoji, title, desc, color, bg, modal }) => (
          <div
            key={title}
            onClick={() => setActiveModal(modal)}
            className={`card p-4 ${bg} border border-transparent hover:border-white/15 cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]`}
          >
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
          <button
            onClick={toggleJournal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-rose text-white text-xs font-medium"
          >
            <Plus size={14} /> Eintrag
          </button>
        </div>

        {/* Add form */}
        {showJournal && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Wie geht es dir?</label>
              <MoodSelector value={addForm.mood} onChange={v => setAddForm(f => ({ ...f, mood: v }))} />
            </div>
            <textarea
              value={addForm.text}
              onChange={e => setAddForm(f => ({ ...f, text: e.target.value }))}
              className="w-full h-24 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm p-3 resize-none focus:outline-none focus:border-rose-500/50"
              placeholder="Was beschäftigt dich gerade? Wie war dein Tag?"
            />
            <TagDropdown
              selected={addForm.tags}
              onChange={tags => setAddForm(f => ({ ...f, tags }))}
              availableTags={state.availableTags}
              onAddTag={addAvailableTag}
            />
            <PendingImagesSection
              handler={addImages}
              onText={text => setAddForm(f => ({ ...f, text: f.text ? `${f.text}\n\n${text}` : text }))}
              maxImages={3}
            />
            <button
              onClick={saveJournal}
              className="w-full py-2 rounded-xl gradient-rose text-white text-sm font-medium"
            >
              Speichern
            </button>
          </div>
        )}

        {/* Entry list */}
        <div className="space-y-3">
          {state.journalEntries.map(e => {
            if (editingId === e.id) {
              return (
                <JournalEditForm
                  key={e.id}
                  entry={e}
                  availableTags={state.availableTags}
                  onAddTag={addAvailableTag}
                  onUpdate={(updates) => { updateJournalEntry(e.id, updates); setEditingId(null) }}
                  onDelete={() => { deleteJournalEntry(e.id); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                  onOpenLightbox={setLightboxImage}
                />
              )
            }

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
                  <div className="flex items-center gap-2">
                    <m.icon size={14} className={m.color} />
                    <button
                      onClick={() => setEditingId(e.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-300 whitespace-pre-wrap">{e.text}</p>

                {e.tags?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {e.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{t}</span>
                    ))}
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

      {/* Activity modals */}
      {activeModal === 'spaziergang'    && <SpazierganModal    onClose={() => setActiveModal(null)} />}
      {activeModal === 'meditation'     && <MeditationModal    onClose={() => setActiveModal(null)} />}
      {activeModal === 'morgenprogramm' && <MorgenprogrammModal onClose={() => setActiveModal(null)} />}

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
