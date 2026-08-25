/**
 * v2 orb mark (PAR-179): the signature object of the editorial-orb
 * system. A solid solar core, a dashed orbit ring and one red
 * satellite; the ring group drifts slowly (decorative). Pure SVG —
 * no external assets. With prefers-reduced-motion the drift stops and
 * the full mark stays visible (see index.css).
 */
export default function OrbMark({ size = 120, className }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`orb-mark${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="MOAT orb mark"
    >
      <g className="orb-mark-orbit">
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke="var(--moat-ink)"
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
