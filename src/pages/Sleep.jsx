import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Moon, Plus, Star, ChevronLeft, ChevronRight,
  CalendarDays, List, Pencil, Trash2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  hours: '',
  quality: 4,
})

function hoursColor(h) {
  return h >= 7 ? '#34d399' : h >= 6 ? '#fbbf24' : '#fb7185'
}

function hoursLabel(h) {
  return h >= 7 ? 'Gut' : h >= 6 ? 'OK' : 'Zu wenig'
}

// ─── Sterne-Auswahl ───────────────────────────────────────────────────────────

function QualityStars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} className="focus:outline-none">
          <Star size={20} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
        </button>
      ))}
    </div>
  )
}

// ─── Chart-Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { value, payload: data } = payload[0]
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="text-white font-semibold">{value}h Schlaf</p>
      <p className="text-slate-400">Qualität: {data.quality}/5</p>
    </div>
  )
}

// ─── Kalender ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const DOW = ['Mo','Di','Mi','Do','Fr','Sa','So']

function SleepCalendar({ logs }) {
  const now = new Date()
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))

  const year  = month.getFullYear()
  const mon   = month.getMonth()
  const firstDow     = (new Date(year, mon, 1).getDay() + 6) % 7 // Mon=0 … Sun=6
  const daysInMonth  = new Date(year, mon + 1, 0).getDate()
  const todayStr     = now.toISOString().split('T')[0]

  const logMap = Object.fromEntries(logs.map(l => [l.date, l]))

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      {/* Monats-Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(new Date(year, mon - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-white">{MONTH_NAMES[mon]} {year}</span>
        <button
          onClick={() => setMonth(new Date(year, mon + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Wochentag-Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs text-slate-600 font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Tag-Zellen */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const entry   = logMap[dateStr]
          const isToday = dateStr === todayStr
          const color   = entry ? hoursColor(entry.hours) : null

          const cellBg     = entry ? `${color}1a` : 'transparent'  // 10% opacity
          const cellBorder = isToday ? '#7c3aed' : entry ? `${color}4d` : 'rgba(255,255,255,0.06)'

          return (
            <div
              key={dateStr}
              className="rounded-lg flex flex-col p-1"
              style={{
                minHeight: 56,
                border: `1px solid ${cellBorder}`,
                background: cellBg,
                boxShadow: isToday ? '0 0 0 1px #7c3aed' : 'none',
              }}
            >
              <span style={{ fontSize: 10, color: isToday ? '#a78bfa' : '#475569', lineHeight: 1 }}>
                {day}
              </span>
              {entry && (
                <>
                  <span style={{ fontSize: 11, fontWeight: 700, color, marginTop: 'auto', lineHeight: 1.2 }}>
                    {entry.hours}h
                  </span>
                  {/* Qualitäts-Balken */}
                  <div style={{ display: 'flex', gap: 1, marginTop: 3 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{
                        flex: 1, height: 2, borderRadius: 1,
                        background: n <= entry.quality ? color : 'rgba(255,255,255,0.1)',
                      }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legende */}
      <div className="flex gap-4 mt-3 justify-center">
        {[{ color: '#34d399', label: '≥ 7h' }, { color: '#fbbf24', label: '6–7h' }, { color: '#fb7185', label: '< 6h' }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Protokoll-Liste ─────────────────────────────────────────────────────────

function Protokoll({ logs, onUpsert, onDelete }) {
  const [editingDate, setEditingDate]       = useState(null)
  const [editForm, setEditForm]             = useState(null)
  const [deleteConfirmDate, setDeleteConfirmDate] = useState(null)

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  const startEdit = (date) => {
    const e = logs.find(l => l.date === date)
    setEditingDate(date)
    setEditForm({ ...e, hours: String(e.hours) })
    setDeleteConfirmDate(null)
  }

  const saveEdit = () => {
    if (!editForm.hours) return
    onUpsert({ ...editForm, hours: parseFloat(editForm.hours) })
    setEditingDate(null)
    setEditForm(null)
  }

  const cancelEdit = () => { setEditingDate(null); setEditForm(null) }

  if (logs.length === 0)
    return <p className="text-center text-slate-500 text-sm py-6">Noch keine Einträge vorhanden.</p>

  return (
    <div className="space-y-1.5">
      {sorted.map(l => (
        editingDate === l.date ? (
          /* ── Inline-Bearbeiten ── */
          <div key={l.date} className="p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Datum</label>
                <input
                  type="date" value={editForm.date} disabled
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm p-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Stunden</label>
                <input
                  type="number" min="0" max="24" step="0.5"
                  value={editForm.hours}
                  onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Schlafqualität</label>
              <QualityStars value={editForm.quality} onChange={q => setEditForm(f => ({ ...f, quality: q }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10">
                Abbrechen
              </button>
              <button onClick={saveEdit} className="flex-1 py-2 rounded-xl gradient-purple text-white text-sm font-medium">
                Speichern
              </button>
            </div>
          </div>
        ) : (
          /* ── Normale Zeile ── */
          <div
            key={l.date}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/3 border border-transparent hover:border-white/5 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-white">{l.date}</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={10} className={n <= l.quality ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold" style={{ color: hoursColor(l.hours) }}>{l.hours}h</span>
                <p className="text-xs text-slate-500">{hoursLabel(l.hours)}</p>
              </div>

              {deleteConfirmDate === l.date ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { onDelete(l.date); setDeleteConfirmDate(null) }}
                    className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-medium"
                  >
                    Löschen
                  </button>
                  <button
                    onClick={() => setDeleteConfirmDate(null)}
                    className="px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs"
                  >
                    Nein
                  </button>
                </div>
              ) : (
                <div className="flex gap-0.5">
                  <button
                    onClick={() => startEdit(l.date)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Bearbeiten"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { setDeleteConfirmDate(l.date); setEditingDate(null) }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function Sleep() {
  const { state, upsertSleepEntry, deleteSleepEntry } = useApp()
  const [form, setForm]                 = useState(emptyForm)
  const [showForm, setShowForm]         = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [bottomView, setBottomView]     = useState('calendar') // 'calendar' | 'list'

  const logs = state.sleepLog

  const chartData = logs.map(l => ({
    date: l.date,
    hours: l.hours,
    quality: l.quality,
  }))

  const avg  = logs.length ? (logs.reduce((a, b) => a + b.hours, 0) / logs.length).toFixed(1) : '–'
  const avgQ = logs.length ? (logs.reduce((a, b) => a + b.quality, 0) / logs.length).toFixed(1) : '–'

  const dateExists = logs.some(l => l.date === form.date)

  const handleAdd = () => {
    if (!form.hours) return
    if (dateExists) { setConfirmOverwrite(true); return }
    upsertSleepEntry({ ...form, hours: parseFloat(form.hours) })
    setForm(emptyForm)
    setShowForm(false)
  }

  const handleConfirmOverwrite = () => {
    upsertSleepEntry({ ...form, hours: parseFloat(form.hours) })
    setForm(emptyForm)
    setConfirmOverwrite(false)
    setShowForm(false)
  }

  const openForm = () => {
    setShowForm(f => !f)
    setConfirmOverwrite(false)
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ø Schlafdauer', value: `${avg}h`,                      color: 'text-indigo-400' },
          { label: 'Ø Qualität',    value: `${avgQ}/5`,                     color: 'text-amber-400' },
          { label: 'Einträge',      value: logs.length,                     color: 'text-slate-300' },
          { label: 'Streak',        value: `${state.streaks.sleep} Tage`,   color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Balkendiagramm ── */}
      <div className="card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Moon size={16} className="text-indigo-400" />
          Schlafdauer der letzten Tage
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={28}>
            <XAxis
              dataKey="date"
              tickFormatter={d => { const dt = new Date(d); return `${dt.getDate()}.${dt.getMonth() + 1}.` }}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={8} stroke="#6366f1" strokeDasharray="4 2" strokeOpacity={0.5} />
            <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 text-center mt-1">Gestrichelte Linie = Empfohlene 8h</p>
      </div>

      {/* ── Kalender / Protokoll ── */}
      <div className="card p-5">

        {/* Header mit Buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Schlafprotokoll</h2>
          <div className="flex items-center gap-2">
            {/* View-Toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5">
              <button
                onClick={() => setBottomView('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${bottomView === 'calendar' ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                <CalendarDays size={13} /> Kalender
              </button>
              <button
                onClick={() => setBottomView('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${bottomView === 'list' ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                <List size={13} /> Protokoll
              </button>
            </div>
            {/* Eintrag-Button */}
            <button
              onClick={openForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-purple text-white text-xs font-medium"
            >
              <Plus size={14} /> Eintrag
            </button>
          </div>
        </div>

        {/* Eintrag-Formular */}
        {showForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Datum</label>
                <input
                  type="date" value={form.date}
                  onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setConfirmOverwrite(false) }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Stunden</label>
                <input
                  type="number" min="0" max="24" step="0.5" value={form.hours}
                  onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="7.5"
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Schlafqualität</label>
              <QualityStars value={form.quality} onChange={q => setForm(f => ({ ...f, quality: q }))} />
            </div>

            {confirmOverwrite ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <p className="text-sm text-amber-200">
                  Für den <span className="font-semibold">{form.date}</span> existiert bereits ein Eintrag. Überschreiben?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmOverwrite(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10">
                    Abbrechen
                  </button>
                  <button onClick={handleConfirmOverwrite} className="flex-1 py-2 rounded-xl gradient-amber text-white text-sm font-medium">
                    Überschreiben
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleAdd} className="w-full py-2 rounded-xl gradient-purple text-white text-sm font-medium">
                Speichern
              </button>
            )}
          </div>
        )}

        {/* Kalender oder Protokoll-Liste */}
        {bottomView === 'calendar'
          ? <SleepCalendar logs={logs} />
          : <Protokoll logs={logs} onUpsert={upsertSleepEntry} onDelete={deleteSleepEntry} />
        }
      </div>
    </div>
  )
}
