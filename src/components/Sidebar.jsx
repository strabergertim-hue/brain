import { NavLink } from 'react-router-dom'
import {
  Brain, BookOpen, Zap, Moon, Target, Activity,
  Wind, Lightbulb, LayoutDashboard, X
} from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Übersicht',          color: 'text-violet-400' },
  { to: '/learn',     icon: BookOpen,         label: 'Lernen',             color: 'text-blue-400' },
  { to: '/attention', icon: Zap,              label: 'Aufmerksamkeit',     color: 'text-yellow-400' },
  { to: '/sleep',     icon: Moon,             label: 'Schlaf',             color: 'text-indigo-400' },
  { to: '/focus',     icon: Target,           label: 'Fokus',              color: 'text-cyan-400' },
  { to: '/movement',  icon: Activity,         label: 'Bewegung',           color: 'text-green-400' },
  { to: '/stress',    icon: Wind,             label: 'Stressreduzierung',  color: 'text-teal-400' },
  { to: '/tips',      icon: Lightbulb,        label: 'Tipps',              color: 'text-amber-400' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40
        glass border-r border-white/5
        flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center glow-purple">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg leading-none block">BrainOS</span>
              <span className="text-xs text-slate-500">Gehirntraining</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                ${isActive
                  ? 'bg-violet-600/20 border border-violet-500/30 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-violet-400' : color + ' opacity-70 group-hover:opacity-100'} />
                  <span className="text-sm font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-sm font-bold">
              M
            </div>
            <div>
              <p className="text-sm font-medium text-white leading-none">Max Mustermann</p>
              <p className="text-xs text-slate-500 mt-0.5">Level 4 · 32 Tage</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
