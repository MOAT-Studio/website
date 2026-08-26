/**
 * v2 gesture mark (PAR-179): three hand-drawn strokes — ink, solar,
 * red — that read as one continuous map → build → loop gesture.
 * Strokes draw in once on load (decorative); with prefers-reduced-motion
 * they render fully drawn (see index.css). Pure SVG, no external assets.
 *
 * `tone` picks the first stroke's colour: 'ink' on paper grounds,
 * 'cream' on night grounds (hero, PAR-180). `decorative` marks the
 * mark as presentation-only for assistive technology.
 */
const STROKES = [
  { d: 'M8 56 C40 12, 76 12, 108 56', color: 'var(--moat-ink)', length: 130, delay: 0 },
  { d: 'M96 40 C128 76, 152 76, 184 40', color: 'var(--moat-solar)', length: 100, delay: 150 },
  { d: 'M172 56 C204 12, 232 28, 236 52', color: 'var(--moat-red)', length: 90, delay: 300 },
]

export default function GestureMark({ width = 240, className, tone = 'ink', decorative = false }) {
  const firstColor = tone === 'cream' ? 'var(--moat-cream)' : 'var(--moat-ink)'
  return (
    <svg
      viewBox="0 0 240 80"
      width={width}
      height={(width * 80) / 240}
      className={`gesture-mark${className ? ` ${className}` : ''}`}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
    >
      {STROKES.map((s, i) => (
        <path
          key={s.d}
          d={s.d}
          stroke={i === 0 ? firstColor : s.color}
          strokeWidth="5"
          style={{ '--moat-gesture-length': s.length, animationDelay: `${s.delay}ms` }}
        />
      ))}
    </svg>
  )
}
