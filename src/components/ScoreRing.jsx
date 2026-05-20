export default function ScoreRing({ score, size = 80, strokeWidth = 6, color = '#7c3aed', label }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="progress-ring" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size * 0.22}
          fontWeight="700"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  )
}
