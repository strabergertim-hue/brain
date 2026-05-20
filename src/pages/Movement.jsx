import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Activity, Plus, Footprints, Dumbbell, Smile } from 'lucide-react'

const relaxTips = [
  { icon: '🧘', title: 'Yoga', desc: '15 Min Morgen-Yoga verbessert Körperbewusstsein und Flexibilität.' },
  { icon: '🤸', title: 'Dehnen', desc: '5-10 Min Dehnen nach jedem Training reduziert Muskelspannung.' },
  { icon: '🌬️', title: '4-7-8 Atemübung', desc: '4s einatmen, 7s halten, 8s ausatmen – aktiviert das Parasympathikum.' },
  { icon: '🚶', title: 'Spaziergang', desc: '20 Min in der Natur senken Cortisol nachweislich.' },
  { icon: '🏊', title: 'Schwimmen', desc: 'Gelenksschonendes Ausdauertraining mit starker mentaler Wirkung.' },
]

export default function Movement() {
  const { state, addMovementEntry } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], steps: '', sport: '', relaxation: '' })

  const logs = state.movementLog
  const avgSteps = logs.length
    ? Math.round(logs.filter(l => l.steps).reduce((a, b) => a + Number(b.steps), 0) / logs.length)
    : 0

  const handleAdd = () => {
    if (!form.steps && !form.sport) return
    addMovementEntry({ ...form, steps: form.steps ? parseInt(form.steps) : 0 })
    setForm({ date: new Date().toISOString().split('T')[0], steps: '', sport: '', relaxation: '' })
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ø Schritte', value: avgSteps.toLocaleString(), icon: Footprints, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Sport-Tage', value: logs.filter(l => l.sport).length, icon: Dumbbell, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Entspannung', value: logs.filter(l => l.relaxation).length, icon: Smile, color: 'text-teal-400', bg: 'bg-teal-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex flex-col items-center text-center">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Log */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Activity size={16} className="text-green-400" />
            Bewegungsprotokoll
          </h2>
          <button onClick={() => setShowForm(f => !f)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-green text-white text-xs font-medium">
            <Plus size={14} /> Eintrag
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Datum</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-green-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Schritte</label>
                <input type="number" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
                  placeholder="8000"
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-green-500/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Sport (optional)</label>
              <input value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                placeholder="z.B. Joggen 30min, Krafttraining"
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-green-500/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Entspannung (optional)</label>
              <input value={form.relaxation} onChange={e => setForm(f => ({ ...f, relaxation: e.target.value }))}
                placeholder="z.B. Yoga, Dehnen"
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-2.5 focus:outline-none focus:border-green-500/50" />
            </div>
            <button onClick={handleAdd} className="w-full py-2 rounded-xl gradient-green text-white text-sm font-medium">Speichern</button>
          </div>
        )}

        <div className="space-y-3">
          {[...logs].reverse().map((l, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{l.date}</span>
                {l.steps > 0 && (
                  <span className={`text-sm font-bold ${l.steps >= 8000 ? 'text-green-400' : l.steps >= 5000 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {l.steps.toLocaleString()} Schritte
                  </span>
                )}
              </div>
              {(l.sport || l.relaxation) && (
                <div className="flex flex-wrap gap-2">
                  {l.sport && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{l.sport}</span>}
                  {l.relaxation && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400">{l.relaxation}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5">
        <h2 className="text-white font-semibold mb-4">Entspannungs- & Bewegungstipps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {relaxTips.map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
