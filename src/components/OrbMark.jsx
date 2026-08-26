/**
 * v2 orb mark (PAR-179): the signature object of the editorial-orb
 * system. A solid solar core, a dashed orbit ring and one red
 * satellite; the ring group drifts slowly (decorative). Pure SVG —
 * no external assets. With prefers-reduced-motion the drift stops and
 * the full mark stays visible (see index.css).
 *
 * `tone` picks the orbit-ring colour: 'ink' on paper grounds, 'cream'
 * on night grounds (hero, PAR-180). `decorative` marks the mark as
 * presentation-only so assistive technology ignores it when it is used
 * purely as background artwork.
 */
export default function OrbMark({ size = 120, className, tone = 'ink', decorative = false }) {
  const ringColor = tone === 'cream' ? 'var(--moat-cream)' : 'var(--moat-ink)'
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`orb-mark${className ? ` ${className}` : ''}`}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
    >
      <g className="orb-mark-orbit">
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke={ringColor}
          strokeOpacity=".32"
          strokeWidth="1.5"
          strokeDasharray="2 7"
        />
        <circle cx="60" cy="10" r="5" fill="var(--moat-red)" />
      </g>
      <circle cx="60" cy="60" r="34" fill="var(--moat-solar)" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="var(--moat-navy)" strokeWidth="1.5" />
    </svg>
  )
}
