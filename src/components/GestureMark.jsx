/**
 * v2 gesture mark (PAR-179): three hand-drawn strokes — ink, solar,
 * red — that read as one continuous map → build → loop gesture.
 * Strokes draw in once on load (decorative); with prefers-reduced-motion
 * they render fully drawn (see index.css). Pure SVG, no external assets.
 */
const STROKES = [
  { d: 'M8 56 C40 12, 76 12, 108 56', color: 'var(--moat-ink)', length: 130, delay: 0 },
  { d: 'M96 40 C128 76, 152 76, 184 40', color: 'var(--moat-solar)', length: 100, delay: 150 },
  { d: 'M172 56 C204 12, 232 28, 236 52', color: 'var(--moat-red)', length: 90, delay: 300 },
]

export default function GestureMark({ width = 240, className }) {
  return (
    <svg
      viewBox="0 0 240 80"
      width={width}
      height={(width * 80) / 240}
      className={`gesture-mark${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Map, build, loop gesture"
    >
      {STROKES.map((s) => (
        <path
          key={s.d}
          d={s.d}
          stroke={s.color}
          strokeWidth="5"
          style={{ '--moat-gesture-length': s.length, animationDelay: `${s.delay}ms` }}
        />
      ))}
    </svg>
  )
}
