import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import {
  ArrowLeft, Plus, X, GripVertical, Bell, BellOff, Check, Clock,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Module-level notification timer (persists across re-mounts) ─────────────
let notifTimer = null

function scheduleNotif(time) {
  if (notifTimer) clearTimeout(notifTimer)
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  notifTimer = setTimeout(() => {
    if (Notification.permission === 'granted') {
      // eslint-disable-next-line no-new
      new Notification('Guten Morgen ☀️', {
        body: 'Dein Morgenprogramm wartet auf dich — aber lass das Handy noch kurz beiseite. Genieße die ersten Minuten des Tages bewusst, bevor der Alltag beginnt.',
      })
    }
    scheduleNotif(time)
  }, target - now)
}

function cancelNotif() {
  if (notifTimer) { clearTimeout(notifTimer); notifTimer = null }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const INSPIRATION = [
  { emoji: '📖', name: 'Lesen',                    duration: 20, description: 'Starte den Tag mit einem Buch statt mit dem Smartphone. Dein Geist kommt langsam in Schwung.' },
  { emoji: '🧘', name: 'Meditation',               duration: 10, description: 'Kurze Atemmeditation oder Stille – stärkt den Parasympathikus und reduziert Cortisol.' },
  { emoji: '🚶', name: 'Kurzer Spaziergang',       duration: 15, description: 'Frische Luft und Tageslicht aktivieren Serotonin und wecken den Körper sanft auf.' },
  { emoji: '✍️', name: 'Journaling',               duration: 10, description: 'Drei Dinge, für die du dankbar bist, oder deine Intention für den Tag aufschreiben.' },
  { emoji: '💧', name: 'Wasser trinken & Strecken', duration: 5,  description: 'Rehydriere nach der Nacht und mobilisiere deinen Körper mit sanften Dehnübungen.' },
  { emoji: '☀️', name: 'Sonnenlicht tanken',       duration: 10, description: 'Geh auf den Balkon oder in den Garten – Sonnenlicht reguliert deinen Schlaf-Wach-Rhythmus.' },
  { emoji: '🌬️', name: 'Atemübung',                duration: 5,  description: 'Box Breathing oder 4-7-8 Technik – senkt Stress und schärft die Konzentration.' },
  { emoji: '🚫', name: 'Handyfreie erste 30 Min',  duration: 30, description: 'Kein Scrollen, keine Nachrichten. Genieße die ersten Minuten des Tages ganz für dich.' },
]

function buildTimeline(items, wakeTime) {
  const [h, m] = wakeTime.split(':').map(Number)
  let total = h * 60 + m
  return items.map(item => {
    const sh = Math.floor(total / 60) % 24
    const sm = total % 60
    const time = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`
    total += Number(item.duration) || 0
    return { ...item, time }
  })
}

// ─── Sortable item ────────────────────────────────────────────────────────────
function SortableItem({ item, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
      <button
        {...listeners} {...attributes}
        className="mt-1 p-0.5 text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
        title="Verschieben"
      >
        <GripVertical size={16} />
      </button>

      <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji || '•'}</span>

      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
          placeholder="Aktivität"
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm p-1.5 focus:outline-none focus:border-teal-500/50"
        />
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-slate-500 flex-shrink-0" />
          <input
            type="number" min={1} max={180}
            value={item.duration}
            onChange={e => onChange({ ...item, duration: +e.target.value })}
            className="w-16 rounded-lg bg-white/5 border border-white/10 text-white text-xs p-1.5 focus:outline-none focus:border-teal-500/50"
          />
          <span className="text-xs text-slate-500">Min</span>
          <input
            value={item.note || ''}
            onChange={e => onChange({ ...item, note: e.target.value })}
            placeholder="Notiz (optional)"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs p-1.5 focus:outline-none focus:border-teal-500/50"
          />
        </div>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="mt-1 p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MorgenprogrammModal({ onClose }) {
  const { state, saveMorningProgram } = useApp()
  const prog = state.morningProgram

  const [tab, setTab]           = useState('inspiration')
  const [items, setItems]       = useState(prog.items || [])
  const [wakeTime, setWakeTime] = useState(prog.wakeTime || '06:30')
  const [reminderEnabled, setReminderEnabled] = useState(prog.reminderEnabled || false)
  const [reminderTime, setReminderTime]       = useState(prog.reminderTime || '06:30')
  const [notifStatus, setNotifStatus]         = useState(null) // null | 'denied' | 'unsupported'
  const [saved, setSaved]       = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Reschedule notification on mount if already enabled
  useEffect(() => {
    if (reminderEnabled && Notification.permission === 'granted') {
      scheduleNotif(reminderTime)
    }
    return () => {} // don't cancel on unmount — timer should persist
  }, [])

  const totalMin = items.reduce((s, i) => s + (Number(i.duration) || 0), 0)
  const timeline = buildTimeline(items, wakeTime)

  const addFromInspiration = (insp) => {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    setItems(prev => [...prev, { id, emoji: insp.emoji, name: insp.name, duration: insp.duration, note: '' }])
    setTab('mein')
  }

  const addCustomItem = () => {
    const id = `item-${Date.now()}`
    setItems(prev => [...prev, { id, emoji: '', name: '', duration: 15, note: '' }])
  }

  const updateItem = (updated) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setItems(prev => {
        const from = prev.findIndex(i => i.id === active.id)
        const to   = prev.findIndex(i => i.id === over.id)
        return arrayMove(prev, from, to)
      })
    }
  }

  const handleSave = () => {
    saveMorningProgram({ items, wakeTime, reminderEnabled, reminderTime })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleReminder = async () => {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    if (!reminderEnabled) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { setNotifStatus('denied'); return }
      }
      if (Notification.permission === 'denied') { setNotifStatus('denied'); return }
      setNotifStatus(null)
      setReminderEnabled(true)
      scheduleNotif(reminderTime)
    } else {
      setReminderEnabled(false)
      cancelNotif()
    }
  }

  const handleReminderTimeChange = (t) => {
    setReminderTime(t)
    if (reminderEnabled && Notification.permission === 'granted') scheduleNotif(t)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0f0f1a' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-white font-semibold leading-none">Morgenprogramm</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestalte deinen idealen Morgen</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3 border-b border-white/5 flex-shrink-0">
        {[['inspiration', '💡 Inspiration'], ['mein', '📋 Mein Programm']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === key
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Tab 1: Inspiration ── */}
        {tab === 'inspiration' && (
          <div className="p-4 space-y-3">
            {INSPIRATION.map((insp, i) => (
              <div key={i} className="card p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{insp.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{insp.name}</p>
                    <span className="text-xs text-slate-500">{insp.duration} Min</span>
                  </div>
                  <p className="text-xs text-slate-400">{insp.description}</p>
                </div>
                <button
                  onClick={() => addFromInspiration(insp)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 hover:bg-amber-500/25 text-xs transition-colors"
                >
                  <Plus size={12} /> Hinzufügen
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 2: Mein Programm ── */}
        {tab === 'mein' && (
          <div className="p-4 space-y-4">

            {/* Wake time */}
            <div className="card p-4 flex items-center gap-4">
              <span className="text-2xl">⏰</span>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Aufwachzeit</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e => setWakeTime(e.target.value)}
                  className="rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Sortable list */}
            {items.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.map(item => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onChange={updateItem}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <p>Noch keine Aktivitäten hinzugefügt.</p>
                <p className="text-xs mt-1 text-slate-600">Füge Aktivitäten aus dem Inspirations-Tab hinzu oder erstelle eigene.</p>
              </div>
            )}

            {/* Add custom */}
            <button
              onClick={addCustomItem}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-slate-500 hover:text-white hover:border-white/30 text-sm transition-all"
            >
              <Plus size={14} /> Eigene Aktivität
            </button>

            {/* Total duration */}
            {items.length > 0 && (
              <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <span className="text-sm text-amber-300">Gesamtdauer</span>
                <span className="text-sm font-bold text-amber-300">{totalMin} Min</span>
              </div>
            )}

            {/* Timeline */}
            {items.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-amber-400" /> Tagesplan
                </h3>
                <div className="space-y-0">
                  {timeline.map((item, i) => (
                    <div key={item.id} className="flex items-stretch gap-3">
                      {/* time + line */}
                      <div className="flex flex-col items-center w-12 flex-shrink-0">
                        <span className="text-xs font-mono text-amber-400 leading-none">{item.time}</span>
                        {i < timeline.length - 1 && (
                          <div className="flex-1 w-px bg-white/10 my-1" />
                        )}
                      </div>
                      {/* content */}
                      <div className={`flex-1 pb-3 ${i < timeline.length - 1 ? '' : ''}`}>
                        <span className="text-sm text-white">{item.emoji} {item.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{item.duration} Min</span>
                        {item.note && <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification toggle */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {reminderEnabled
                    ? <Bell size={16} className="text-amber-400" />
                    : <BellOff size={16} className="text-slate-500" />}
                  <span className="text-sm font-medium text-white">Tägliche Erinnerung</span>
                </div>
                <button
                  onClick={toggleReminder}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${reminderEnabled ? 'bg-amber-500' : 'bg-white/15'}`}
                  style={{ height: 22 }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
                    style={{ transform: reminderEnabled ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {reminderEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400">Uhrzeit</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={e => handleReminderTimeChange(e.target.value)}
                    className="rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-1 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              {notifStatus === 'denied' && (
                <p className="text-xs text-rose-400">
                  Benachrichtigungen wurden blockiert. Bitte erlaube sie in den Browsereinstellungen.
                </p>
              )}
              {notifStatus === 'unsupported' && (
                <p className="text-xs text-slate-500">
                  Dein Browser unterstützt keine Web-Benachrichtigungen.
                </p>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Die Erinnerung soll dich sanft an dein Programm erinnern — nicht dazu verleiten, direkt ins Handy abzutauchen. Leg es danach wieder weg. 🌿
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${saved ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'gradient-amber text-white'}`}
            >
              {saved ? <><Check size={15} /> Gespeichert!</> : 'Programm speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
