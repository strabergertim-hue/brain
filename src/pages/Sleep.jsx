import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Moon, Plus, Star } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function QualityStars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} className="focus:outline-none">
          <Star
            size={20}
            className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="text-white font-semibold">{payload[0].value}h Schlaf</p>
      <p className="text-slate-400">Qualität: {payload[0].payload.quality}/5</p>
    </div>
  )
}

const emptyForm = () => ({ date: new Date().toISOString().split('T')[0], hours: '', quality: 4 })

export default function Sleep() {
  const { state, upsertSleepEntry } = useApp()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const logs = state.sleepLog

  // Datum als eindeutiger Schlüssel → kein Tooltip-Bug bei gleichen Wochentagen
  const chartData = logs.map(l => ({
    date: l.date,
    label: (() => { const d = new Date(l.date); return `${d.getDate()}.${d.getMonth() + 1}.` })(),
    hours: l.hours,
    quality: l.quality,
  }))

  const avg = logs.length ? (logs.reduce((a, b) => a + b.hours, 0) / logs.length).toFixed(1) : '–'
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

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ø Schlafdauer', value: `${avg}h`, color: 'text-indigo-400' },
          { label: 'Ø Qualität', value: `${avgQ}/5`, color: 'text-amber-400' },
          { label: 'Einträge', value: logs.length, color: 'text-slate-300' },
          { label: 'Streak', value: `${state.streaks.sleep} Tage`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Moon size={16} className="text-indigo-400" />
          Schlafdauer der letzten Tage
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="date" tickFormatter={d => { const dt = new Date(d); return `${dt.getDate()}.${dt.getMonth()+1}.` }} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={8} stroke="#6366f1" strokeDasharray="4 2" strokeOpacity={0.5} />
            <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 text-center mt-1">Gestrichelte Linie = Empfohlene 8h</p>
      </div>

      {/* Log */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Schlafprotokoll</h2>
          <button
            onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-purple text-white text-xs font-medium"
          >
            <Plus size={14} /> Eintrag
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Datum</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Stunden</label>
                <input type="number" min="0" max="24" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="7.5"
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-violet-500/50" />
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

        <div className="space-y-2">
          {[...logs].reverse().map((l, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-white font-medium">{l.date}</p>
                <div className="flex gap-0.5 mt-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={11} className={n <= l.quality ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${l.hours >= 7 ? 'text-green-400' : l.hours >= 6 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {l.hours}h
                </span>
                <p className="text-xs text-slate-500">{l.hours >= 7 ? 'Gut' : l.hours >= 6 ? 'OK' : 'Zu wenig'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
