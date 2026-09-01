import { useId } from 'react'

/**
 * v3 brush mark (PAR-186): the dry-brush ink strokes that punctuate the
 * editorial-orb composition — one at each shoulder of the hero, one
 * behind the founder portrait, one above the contact panel.
 *
 * The ragged edge is real SVG: a thick stroked path pushed through an
 * feTurbulence/feDisplacementMap pair, so the outline breaks up the way
 * a loaded brush does on rough paper. No external asset, no dependency.
 * The filter id comes from useId() so several marks can coexist on one
 * page without colliding — and it matches between the SSR pass and the
 * client, so prerendered markup hydrates cleanly.
 *
 * Decorative in every use: aria-hidden, pointer-events off.
 */
const SHAPES = {
  // The hero's left shoulder: a loose double-back squiggle.
  squiggle: {
    viewBox: '0 0 200 150',
    paths: ['M14 116 C22 60, 58 44, 66 78 C72 104, 44 122, 40 96 C36 66, 78 30, 104 50 C130 70, 118 116, 150 108'],
    width: 200,
    height: 150,
  },
  // The hero's right shoulder and the contact panel: two swept arcs.
  sweep: {
    viewBox: '0 0 200 150',
    paths: [
      'M18 22 C70 6, 148 34, 178 88',
      'M40 74 C86 60, 140 84, 164 130',
    ],
    width: 200,
    height: 150,
  },
  // Behind the founder portrait: a wide painted ground.
  wash: {
    viewBox: '0 0 200 200',
    paths: [
      'M38 34 C30 82, 36 128, 44 172',
      'M74 14 C64 76, 70 138, 82 196',
      'M112 26 C104 80, 108 140, 116 182',
      'M150 44 C142 88, 146 130, 154 166',
      'M180 62 C174 96, 176 126, 182 150',
    ],
    width: 200,
    height: 200,
  },
}

export default function BrushMark({
  shape = 'squiggle',
  width = 200,
  tone = 'ink',
  className,
  strokeWidth = 13,
}) {
  const id = useId().replace(/:/g, '')
  const { viewBox, paths, width: vbW, height: vbH } = SHAPES[shape] ?? SHAPES.squiggle
  // The painted ground is a much fatter stroke, so it needs a coarser,
  // deeper displacement before its edge reads as torn rather than ruled.
  const wash = shape === 'wash'
  const frequency = wash ? '0.022 0.05' : '0.045 0.09'
  const displace = wash ? 26 : 9
  const stroke = tone === 'solar' ? 'var(--moat-solar)' : tone === 'sand' ? 'var(--moat-sand)' : 'var(--moat-navy)'

  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={(width * vbH) / vbW}
      className={`brush-mark${className ? ` ${className}` : ''}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`brush-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={displace} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#brush-${id})`}>
        {paths.map((d) => (
          <path key={d} d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        ))}
      </g>
    </svg>
  )
}
