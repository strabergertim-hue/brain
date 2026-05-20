import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronUp, Moon, Brain, Zap, Heart, Apple, Clock } from 'lucide-react'

const categories = [
  {
    id: 'sleep',
    icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20',
    title: 'Schlafprobleme',
    summary: 'Schlechter Schlaf beeinträchtigt Gedächtnis, Stimmung und Kognition erheblich.',
    tips: [
      { title: 'Feste Schlafzeiten', desc: 'Gehe jeden Tag zur gleichen Zeit ins Bett und stehe zur gleichen Zeit auf – auch am Wochenende. Der circadiane Rhythmus reguliert sich innerhalb von 2 Wochen.' },
      { title: 'Kein Blaulicht 1h vor Schlafen', desc: 'Smartphones und Bildschirme unterdrücken Melatonin. Nutze Nachtmodus-Filter oder lese ein echtes Buch.' },
      { title: 'Schlafzimmer kühler halten', desc: 'Die ideale Schlaftemperatur liegt bei 16-19°C. Dein Körperkerntemperatur muss sinken, um einzuschlafen.' },
      { title: '20-Minuten-Einschlafgrenze', desc: 'Kannst du nach 20 Min nicht einschlafen, stehe auf und mach etwas Ruhiges, bis du müde wirst.' },
      { title: 'Koffein-Cutoff um 14 Uhr', desc: 'Koffein hat eine Halbwertszeit von 5-7h. Ein Kaffee um 15 Uhr hat noch bei Mitternacht 50% Wirkung.' },
    ],
  },
  {
    id: 'memory',
    icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
    title: 'Gedächtnis stärken',
    summary: 'Gedächtnis ist kein statisches Talent, sondern eine trainierbare Fähigkeit.',
    tips: [
      { title: 'Spaced Repetition nutzen', desc: 'Wiederhole Inhalte in steigenden Abständen: 1 Tag, 3 Tage, 1 Woche, 1 Monat. Apps wie Anki automatisieren dies.' },
      { title: 'Schlaf nach dem Lernen', desc: 'Schlaf innerhalb von 24h nach dem Lernen ist entscheidend für Gedächtniskonsolidierung.' },
      { title: 'Aktives Erinnern üben', desc: 'Schließe das Buch und schreibe alles auf, was du weißt. "Testing effect" ist 2x effektiver als nochmaliges Lesen.' },
      { title: 'Gedächtnispalast-Technik', desc: 'Verknüpfe Informationen mit bekannten Orten. Weltmeister im Gedächtnistraining nutzen diese Methode ausnahmslos.' },
      { title: 'Emotional verbinden', desc: 'Verknüpfe neue Informationen mit Emotionen oder persönlichen Erlebnissen – das limbische System stärkt die Speicherung.' },
    ],
  },
  {
    id: 'focus',
    icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
    title: 'Fokus & Konzentration',
    summary: 'Tiefe Konzentration ist in der modernen Welt eine Superpower – trainierbar wie ein Muskel.',
    tips: [
      { title: 'Single-Tasking einüben', desc: 'Multitasking reduziert die Effizienz um bis zu 40%. Erledige eine Aufgabe vollständig, bevor du wechselst.' },
      { title: 'Ablenkungen physisch eliminieren', desc: 'Smartphone in einem anderen Raum. Sichtbarkeit erhöht Verlangen um 3x – aus den Augen, aus dem Sinn.' },
      { title: 'Energie-Management', desc: 'Plane tiefe Arbeit für deine energiereichsten Stunden (meist morgens). Routineaufgaben für den Nachmittag.' },
      { title: 'Regenerationspausen einplanen', desc: 'Alle 90 Min hat das Gehirn einen natürlichen Leistungsabfall (ultradian rhythm). Kurze Pausen steigern Gesamtproduktivität.' },
    ],
  },
  {
    id: 'stress',
    icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20',
    title: 'Stressmanagement',
    summary: 'Chronischer Stress schädigt den Hippocampus – das Gedächtniszentrum des Gehirns.',
    tips: [
      { title: 'Physiological Sigh', desc: 'Zweifach einatmen (erst normal, dann noch etwas mehr), dann lang ausatmen. Reduziert Stress schneller als jede andere Atemtechnik.' },
      { title: 'Kalt duschen beginnen', desc: '30 Sekunden kaltes Wasser erhöht Dopamin und Noradrenalin für mehrere Stunden – und trainiert Stressresistenz.' },
      { title: 'Natur als Reset', desc: '20 Min in der Natur (nicht urban) reduziert Cortisol nachweislich um durchschnittlich 21%.' },
      { title: 'Sozialen Kontakt pflegen', desc: 'Qualitative soziale Interaktion ist einer der stärksten Puffer gegen Stress. Oxytocin antagonisiert Cortisol.' },
    ],
  },
  {
    id: 'nutrition',
    icon: Apple, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20',
    title: 'Ernährung & Gehirn',
    summary: 'Das Gehirn verbraucht 20% der Energie – die richtige Ernährung macht einen messbaren Unterschied.',
    tips: [
      { title: 'Omega-3 täglich', desc: 'DHA (aus fettem Fisch oder Algenöl) ist Hauptbestandteil der Gehirnzellmembranen. 2-3g EPA/DHA täglich zeigen kognitive Vorteile.' },
      { title: 'Blutzucker stabil halten', desc: 'Zuckerpeaks und -abstürze beeinflussen Konzentration direkt. Ballaststoffe, Protein und gesunde Fette stabilisieren.' },
      { title: 'Hydrierung priorisieren', desc: 'Schon 2% Dehydration senkt kognitive Leistung messbar. Beginne den Tag mit einem großen Glas Wasser.' },
      { title: 'Intervallfasten erkunden', desc: '16:8 Intervallfasten erhöht BDNF (Brain-Derived Neurotrophic Factor) – das "Wachstumshormon" des Gehirns.' },
    ],
  },
  {
    id: 'time',
    icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
    title: 'Zeitmanagement',
    summary: 'Effizientes Zeitmanagement schafft mentale Kapazität und reduziert Entscheidungsmüdigkeit.',
    tips: [
      { title: '3 MITs pro Tag', desc: 'Identifiziere täglich 3 "Most Important Tasks". Starte mit dem schwierigsten – dann ist alles andere einfacher.' },
      { title: 'Timeboxing anwenden', desc: 'Weise jeder Aufgabe eine feste Zeitspanne zu. Parkinson\'s Law: Arbeit dehnt sich auf die verfügbare Zeit aus.' },
      { title: 'Wöchentlichen Review etablieren', desc: 'Jeden Sonntag: Was lief gut? Was nicht? Was ist nächste Woche wichtig? Hält den Überblick bei voller Termindichte.' },
    ],
  },
]

function TipCard({ category }) {
  const [open, setOpen] = useState(false)
  const { icon: Icon, color, bg, border, title, summary, tips } = category

  return (
    <div className={`card ${open ? border : ''} transition-all duration-200`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{summary}</p>
        </div>
        <div className="flex-shrink-0 text-slate-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          <p className="text-sm text-slate-400 mb-3">{summary}</p>
          {tips.map(({ title: t, desc }, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
              <span className={`w-5 h-5 rounded-full ${bg} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${color}`}>
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{t}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tips() {
  return (
    <div className="p-6 space-y-3">
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mb-5">
        <Lightbulb size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200">
          Wissenschaftlich fundierte Empfehlungen. Kleine Veränderungen, konsequent umgesetzt, ergeben große Ergebnisse.
        </p>
      </div>
      {categories.map(cat => (
        <TipCard key={cat.id} category={cat} />
      ))}
    </div>
  )
}
