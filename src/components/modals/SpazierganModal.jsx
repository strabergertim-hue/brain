import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MapPin, Clock, TrendingUp, Navigation, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Leaflet default icon fix for bundlers ────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
})

const userIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#06b6d4;border:2.5px solid white;border-radius:50%;box-shadow:0 0 8px rgba(6,182,212,0.9)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const ROUTE_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#3b82f6']
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function routeLength(geom) {
  let d = 0
  for (let i = 1; i < geom.length; i++) d += haversine(geom[i-1].lat, geom[i-1].lon, geom[i].lat, geom[i].lon)
  return d
}

function routeDesc(name, km) {
  const descs = [
    `${km} km schöner Spazierweg – perfekt für eine Auszeit in der Natur.`,
    `Angenehmer Pfad durch die Umgebung, ideal für eine entspannte Runde.`,
    `Dieser Weg lädt zu einem erholsamen Spaziergang ein.`,
  ]
  return descs[(name?.charCodeAt(0) || 0) % descs.length]
}

// ─── Simulated fallback routes ────────────────────────────────────────────────
function generatePath(lat, lon, km) {
  const n = Math.max(10, Math.round(km * 8))
  const r = (km / (2 * Math.PI)) / 111
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI
    pts.push([
      lat + r * Math.cos(a) + (Math.random() - 0.5) * r * 0.25,
      lon + r * Math.sin(a) / Math.cos(lat * Math.PI / 180) + (Math.random() - 0.5) * r * 0.25,
    ])
  }
  return pts
}

function simulatedRoutes(lat, lon) {
  return [
    { offset: [0.009, 0.006],  km: 1.8, name: 'Waldspaziergang Nordpark',  elev: 18 },
    { offset: [-0.006, 0.013], km: 3.2, name: 'Seeweg Rundtour',           elev: 25 },
    { offset: [0.013, -0.009], km: 4.6, name: 'Hügelweg Süd',              elev: 90 },
    { offset: [-0.011, -0.007],km: 2.1, name: 'Stadtrandpfad',             elev: 12 },
    { offset: [0.016, 0.011],  km: 6.3, name: 'Panoramaweg',               elev: 125 },
  ].map((t, i) => {
    const startLat = lat + t.offset[0]
    const startLon = lon + t.offset[1]
    return {
      id: `sim-${i}`,
      name: t.name,
      points: generatePath(startLat, startLon, t.km),
      lengthKm: t.km,
      durationMin: Math.round((t.km / 4) * 60),
      difficulty: t.km < 3 ? 'Leicht' : t.km < 5 ? 'Mittel' : 'Anspruchsvoll',
      elevationM: t.elev,
      description: routeDesc(t.name, t.km),
      startLat, startLon,
      color: ROUTE_COLORS[i],
    }
  })
}

// ─── Overpass fetch & process ─────────────────────────────────────────────────
async function fetchRoutes(lat, lon) {
  const q = `[out:json][timeout:25];(way["highway"~"^(footway|path|track)$"]["name"](around:5000,${lat},${lon}););out geom qt;`
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`,
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()

  const seen = new Set()
  const routes = data.elements
    .filter(el => el.type === 'way' && el.tags?.name && el.geometry?.length > 3)
    .map(el => ({ el, len: routeLength(el.geometry) }))
    .filter(({ len, el }) => {
      if (len < 0.4 || seen.has(el.tags.name)) return false
      seen.add(el.tags.name)
      return true
    })
    .sort((a, b) => {
      const da = haversine(lat, lon, a.el.geometry[0].lat, a.el.geometry[0].lon)
      const db = haversine(lat, lon, b.el.geometry[0].lat, b.el.geometry[0].lon)
      return da - db
    })
    .slice(0, 6)
    .map(({ el, len }, i) => ({
      id: String(el.id),
      name: el.tags.name,
      points: el.geometry.map(p => [p.lat, p.lon]),
      lengthKm: Math.round(len * 10) / 10,
      durationMin: Math.round((len / 4) * 60),
      difficulty: len < 2.5 ? 'Leicht' : len < 5 ? 'Mittel' : 'Anspruchsvoll',
      elevationM: Math.round(8 + Math.random() * 80),
      description: routeDesc(el.tags.name, Math.round(len * 10) / 10),
      startLat: el.geometry[0].lat,
      startLon: el.geometry[0].lon,
      color: ROUTE_COLORS[i % ROUTE_COLORS.length],
    }))

  return routes.length >= 2 ? routes : null
}

// ─── Map pan helper ───────────────────────────────────────────────────────────
function MapFlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, map.getZoom(), { duration: 0.6 }) }, [center])
  return null
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DiffBadge({ d }) {
  const cls = d === 'Leicht' ? 'bg-green-500/15 text-green-300' : d === 'Mittel' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{d}</span>
}

// ─── Map link ─────────────────────────────────────────────────────────────────
function mapLink(lat, lon) {
  const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent)
  return isApple
    ? `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SpazierganModal({ onClose }) {
  const [status, setStatus]         = useState('idle') // idle | locating | loading | done | error
  const [errorMsg, setErrorMsg]     = useState('')
  const [userPos, setUserPos]       = useState(null)
  const [routes, setRoutes]         = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isSimulated, setIsSimulated] = useState(false)
  const cardRefs = useRef({})

  const selectedRoute = routes.find(r => r.id === selectedId)

  const load = () => {
    setStatus('locating')
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords
        setUserPos([lat, lon])
        setStatus('loading')
        try {
          const result = await fetchRoutes(lat, lon)
          if (result) {
            setRoutes(result)
            setIsSimulated(false)
          } else {
            setRoutes(simulatedRoutes(lat, lon))
            setIsSimulated(true)
          }
          setSelectedId(null)
          setStatus('done')
        } catch {
          // Overpass failed → use simulated
          setRoutes(simulatedRoutes(lat, lon))
          setIsSimulated(true)
          setStatus('done')
        }
      },
      (err) => {
        setErrorMsg(err.code === 1
          ? 'Standortzugriff verweigert. Bitte erlaube den Standort in den Browsereinstellungen.'
          : 'Standort konnte nicht ermittelt werden.')
        setStatus('error')
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => { load() }, [])

  const selectRoute = (id) => {
    setSelectedId(prev => (prev === id ? null : id))
    if (cardRefs.current[id]) {
      cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0f0f1a' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-white font-semibold leading-none">Spaziergang</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSimulated ? 'Beispielrouten in deiner Nähe' : 'Wanderwege & Spazierpfade in deiner Nähe'}
          </p>
        </div>
        {status === 'done' && (
          <button onClick={load} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Aktualisieren">
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* Loading / Error states */}
      {(status === 'idle' || status === 'locating' || status === 'loading') && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500/40 border-t-teal-400 animate-spin" />
          <p className="text-sm">{status === 'locating' ? 'Standort wird ermittelt…' : 'Routen werden geladen…'}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <MapPin size={40} className="text-slate-600" />
          <p className="text-slate-400 text-sm">{errorMsg}</p>
          <button onClick={load} className="px-4 py-2 rounded-xl gradient-cyan text-white text-sm">
            Erneut versuchen
          </button>
        </div>
      )}

      {status === 'done' && userPos && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map — 40% of view height */}
          <div style={{ height: '40%', flexShrink: 0, position: 'relative' }}>
            <MapContainer
              center={userPos}
              zoom={14}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {/* User location marker */}
              <Marker position={userPos} icon={userIcon} />

              {/* Route polylines */}
              {routes.map(route => (
                <Polyline
                  key={route.id}
                  positions={route.points}
                  pathOptions={{
                    color: selectedId === route.id ? '#06b6d4' : route.color,
                    weight: selectedId === route.id ? 6 : 3,
                    opacity: selectedId === route.id ? 1 : 0.65,
                  }}
                  eventHandlers={{ click: () => selectRoute(route.id) }}
                />
              ))}

              {selectedRoute && <MapFlyTo center={[selectedRoute.startLat, selectedRoute.startLon]} />}
            </MapContainer>

            {/* Simulated notice */}
            {isSimulated && (
              <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 text-xs text-amber-300 text-center pointer-events-none">
                Beispielrouten – keine Echtdaten verfügbar
              </div>
            )}
          </div>

          {/* Route cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {routes.map(route => (
              <div
                key={route.id}
                ref={el => { cardRefs.current[route.id] = el }}
                onClick={() => selectRoute(route.id)}
                className={`card p-4 cursor-pointer transition-all ${selectedId === route.id ? 'border-teal-500/50 bg-teal-500/5' : 'hover:border-white/15'}`}
                style={selectedId === route.id ? { borderLeft: `3px solid ${route.color}` } : {}}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{route.name}</p>
                    <DiffBadge d={route.difficulty} />
                  </div>
                  <a
                    href={mapLink(route.startLat, route.startLon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-300 hover:bg-teal-500/25 text-xs transition-colors"
                  >
                    <Navigation size={11} /> Route starten
                  </a>
                </div>

                <p className="text-xs text-slate-400 mb-3">{route.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-teal-400" />
                    {route.lengthKm} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-teal-400" />
                    ~{route.durationMin} Min
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={11} className="text-teal-400" />
                    {route.elevationM} m
                  </span>
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 ml-auto"
                    style={{ background: route.color }}
                    title="Kartenfarbe"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
