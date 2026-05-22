import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ScoreRing from '../components/ScoreRing'
import {
  TrendingUp, Star, AlertTriangle, Flame, Moon, Target,
  Activity, Brain, ChevronRight, CheckCircle2, Wind
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer
} from 'recharts'

const scoreColors = {
  memory:    '#7c3aed',
  attention: '#f59e0b',
  learning:  '#3b82f6',
  sleep:     '#6366f1',
  focus:     '#06b6d4',
  movement:  '#10b981',
  stress:    '#14b8a6',
}

const scoreLabels = {
  memory: 'Gedächtnis', attention: 'Aufmerksamkeit', learning: 'Lernen',
  sleep: 'Schlaf', focus: 'Fokus', movement: 'Bewegung', stress: 'Stressresistenz',
}

const scoreRoutes = {
  memory:    '/learn',
  attention: '/attention',
  learning:  '/learn',
  sleep:     '/sleep',
  focus:     '/focus',
  movement:  '/movement',
  stress:    '/stress',
}

const hints = [
  { icon: Moon,     color: 'text-indigo-400', bg: 'bg-indigo-500/10', route: '/sleep',    text: 'Dein Schlaf war die letzten 2 Nächte unter 7h. Probiere 30 min früher ins Bett zu gehen.' },
  { icon: Activity, color: 'text-green-400',  bg: 'bg-green-500/10',  route: '/movement', text: 'Heute noch keine Bewegung erfasst. 10 Minuten Spaziergang verbessern die Kognition.' },
  { icon: Wind,     color: 'text-teal-400',   bg: 'bg-teal-500/10',   route: '/stress',   text: 'Stressresistenz ist dein schwächster Bereich. Probiere heute eine 5-Min-Atemübung.' },
]

export default function Dashboard() {
  const { state } = useApp()
  const navigate = useNavigate()
  const { scores, streaks } = state

  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length)

  const radarData = Object.entries(scores).map(([key, val]) => ({
    subject: scoreLabels[key],
    score: val,
    fullMark: 100,
  }))

  const strengths = Object.entries(scores).filter(([, v]) => v >= 75).map(([k]) => k)
  const weaknesses = Object.entries(scores).filter(([, v]) => v < 65).map(([k]) => k)

  return (
    <div className="p-6 space-y-6">
      {/* Top row: overall + streaks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Overall score */}
        <div className="card p-6 flex items-center gap-4 glow-purple sm:col-span-2 xl:col-span-1">
          <div className="relative">
            <ScoreRing score={overall} size={88} strokeWidth={7} color="#7c3aed" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-purple flex items-center justify-center">
              <Brain size={10} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Gesamt-Score</p>
            <p className="text-3xl font-bold text-white">{overall}<span className="text-lg text-slate-400">/100</span></p>
            <p className="text-xs text-violet-400 flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> +4 seit letzter Woche
            </p>
          </div>
        </div>

        {/* Streaks */}
        {[
          { label: 'Schlaf-Streak', val: streaks.sleep,      icon: Moon,     color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
          { label: 'Fokus-Streak',  val: streaks.focus,      icon: Target,   color: 'text-cyan-400',   bg: 'bg-cyan-500/15' },
          { label: 'Sport-Streak',  val: streaks.movement,   icon: Activity, color: 'text-green-400',  bg: 'bg-green-500/15' },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4 card-hover">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">{label}</p>
              <p className="text-2xl font-bold text-white">{val} <span className="text-sm text-slate-400">Tage</span></p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame size={12} className="text-orange-400" />
                <span className="text-xs text-orange-400">Aktiv</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Radar + Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            Kompetenz-Radar
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Individual scores */}
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">Bereichs-Scores</h2>
          <div className="space-y-3">
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-slate-400 text-sm w-28 flex-shrink-0">{scoreLabels[key]}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: scoreColors[key] }}
                  />
                </div>
                <span className="text-sm font-semibold text-white w-8 text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hints */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          Empfehlungen für heute
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hints.map(({ icon: Icon, color, bg, route, text }, i) => (
            <div
              key={i}
              onClick={() => navigate(route)}
              className={`flex items-start gap-3 p-4 rounded-xl ${bg} border border-transparent hover:border-white/15 cursor-pointer transition-all`}
            >
              <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            Stärken
          </h2>
          <div className="space-y-2">
            {strengths.length === 0 && <p className="text-slate-500 text-sm">Noch keine Stärken ermittelt.</p>}
            {strengths.map(k => (
              <div key={k} className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/15">
                <CheckCircle2 size={16} className="text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">{scoreLabels[k]}</p>
                  <p className="text-xs text-slate-400">Score: {scores[k]}/100 · Überdurchschnittlich</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400" />
            Verbesserungspotenzial
          </h2>
          <div className="space-y-2">
            {weaknesses.length === 0 && <p className="text-slate-500 text-sm">Keine Schwächen erkannt – weiter so!</p>}
            {weaknesses.map(k => (
              <div
                key={k}
                onClick={() => navigate(scoreRoutes[k])}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-rose-500/5 border border-white/10 hover:bg-white/5 hover:border-white/20 cursor-pointer transition-all group"
                style={{ borderLeft: `2px solid ${scoreColors[k]}` }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{scoreLabels[k]}</p>
                    <p className="text-xs text-slate-400">Score: {scores[k]}/100 · Ausbaufähig</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
