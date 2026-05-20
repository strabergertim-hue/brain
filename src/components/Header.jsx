import { Menu, Bell } from 'lucide-react'

export default function Header({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-none">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
