import { useId } from 'react'

/**
 * v3 hand-drawn arrow (PAR-186): the hand-off between the process
 * cards, roughened by the same turbulence/displacement pair as
 * BrushMark so it reads as ink rather than as an icon.
 *
 * On narrow screens CSS rotates this same geometry 90° into a vertical
 * connector (see index.css) — one drawing, both orientations.
 *
 * Both paths carry pathLength="1" so a single stroke-dashoffset value
 * draws either of them regardless of their real length (PAR-187): the
 * shaft sweeps first, the head lands last. Decorative: aria-hidden.
 */
export default function InkArrow({ width = 96, tone = 'ink', className }) {
  const id = useId().replace(/:/g, '')
  const stroke = tone === 'cream' ? 'var(--moat-cream)' : 'var(--moat-navy)'
  return (
    <svg
      viewBox="0 0 96 40"
      width={width}
      height={(width * 40) / 96}
      className={`ink-arrow${className ? ` ${className}` : ''}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`ink-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.11" numOctaves="3" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#ink-${id})`} fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path className="ink-draw" data-draw="1" pathLength="1" d="M6 24 C28 12, 54 12, 84 19" />
        <path className="ink-draw" data-draw="2" pathLength="1" d="M70 8 L86 19 L68 30" />
      </g>
    </svg>
  )
}
