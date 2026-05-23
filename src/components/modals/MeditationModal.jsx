import { useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'

const VIDEOS = [
  {
    id: '_VFRpeEQQxM',
    title: 'Geführte Meditation für den Morgen',
    duration: 5,
    style: 'Morgen',
    tags: ['morgen', 'kurz'],
  },
  {
    id: 'c7wsdh5-GMI',
    title: '5 Minuten Stille-Meditation',
    duration: 5,
    style: 'Stille',
    tags: ['kurz'],
  },
  {
    id: 'FjqE9a8aIAM',
    title: 'Atemmeditation · Achtsamkeit & Entspannung',
    duration: 10,
    style: 'Atemfokus',
    tags: ['mittel'],
  },
  {
    id: 'W4PEcGzMq28',
    title: 'Bodyscan für mehr Achtsamkeit',
    duration: 10,
    style: 'Body Scan',
    tags: ['mittel'],
  },
  {
    id: 'yB0aVLcMdOE',
    title: 'Atem Meditation bei Stress',
    duration: 10,
    style: 'Atemfokus',
    tags: ['mittel'],
  },
  {
    id: 'YE4Edez-d9Y',
    title: 'Entspannung, innere Ruhe & neuer Fokus',
    duration: 10,
    style: 'Entspannung',
    tags: ['mittel'],
  },
  {
    id: '4Z1RPavOX3s',
    title: 'Achtsam und Dankbar in den Tag',
    duration: 10,
    style: 'Morgen',
    tags: ['morgen', 'mittel'],
  },
  {
    id: '2DVl7unCMNA',
    title: '15 Minuten Geführte Meditation',
    duration: 15,
    style: 'Stille',
    tags: ['mittel'],
  },
  {
    id: 'ZvgeR2_6DiQ',
    title: 'Tiefenentspannt – Meditation zum Loslassen',
    duration: 20,
    style: 'Entspannung',
    tags: ['abend'],
  },
  {
    id: 'trfc1RtpImM',
    title: 'Body Scan Meditation (MBSR)',
    duration: 30,
    style: 'Body Scan',
    tags: ['abend'],
  },
]

const FILTERS = [
  { key: 'all',    label: 'Alle' },
  { key: 'kurz',   label: 'Kurz (≤7 Min)' },
  { key: 'mittel', label: 'Mittel (8–15 Min)' },
  { key: 'morgen', label: 'Morgen' },
  { key: 'abend',  label: 'Abend' },
]

const styleColors = {
  'Morgen':     'bg-amber-500/15 text-amber-300',
  'Stille':     'bg-violet-500/15 text-violet-300',
  'Atemfokus':  'bg-teal-500/15 text-teal-300',
  'Body Scan':  'bg-blue-500/15 text-blue-300',
  'Entspannung':'bg-green-500/15 text-green-300',
}

export default function MeditationModal({ onClose }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = VIDEOS.filter(v => {
    if (activeFilter === 'all')    return true
    if (activeFilter === 'kurz')   return v.duration <= 7
    if (activeFilter === 'mittel') return v.duration >= 8 && v.duration <= 15
    return v.tags.includes(activeFilter)
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0f0f1a' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-white font-semibold leading-none">Kurz-Meditation</h2>
          <p className="text-xs text-slate-500 mt-0.5">Geführte Meditationen für jeden Moment</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0 border-b border-white/5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
              ${activeFilter === f.key
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">Keine Videos für diesen Filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(v => (
              <div key={v.id} className="card overflow-hidden hover:border-white/15 transition-all group">
                {/* Thumbnail */}
                <div className="relative overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                    alt={v.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-xs font-medium">
                    {v.duration} Min
                  </span>
                  {/* Style badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${styleColors[v.style] || 'bg-white/10 text-slate-300'}`}>
                    {v.style}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white leading-snug flex-1">{v.title}</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 text-xs font-medium transition-colors"
                  >
                    <ExternalLink size={12} /> Ansehen
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
