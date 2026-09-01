import { useId } from 'react'

/**
 * v3 orb (PAR-186): the solar body the whole page is composed around.
 * `rise` is the hero's sun, cresting from behind the headline; `sphere`
 * is the heavier version that bleeds out of the contact panel's corner.
 *
 * Both are one circle with a gradient and a halftone dot pattern masked
 * so the stipple only reads in the lower body — the printed look of the
 * concept, done as pure SVG so it survives the SSR prerender pass.
 * Decorative: aria-hidden, pointer-events off.
 */
export default function HeroOrb({ size = 560, variant = 'rise', className }) {
  const id = useId().replace(/:/g, '')
  const gradId = `orb-g-${id}`
  const dotId = `orb-d-${id}`
  const maskId = `orb-m-${id}`
  const rise = variant === 'rise'

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`hero-orb hero-orb-${variant}${className ? ` ${className}` : ''}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {rise ? (
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--moat-solar-pale)" />
            <stop offset="22%" stopColor="var(--moat-solar-soft)" />
            <stop offset="52%" stopColor="var(--moat-solar)" />
            <stop offset="100%" stopColor="var(--moat-solar)" />
          </linearGradient>
        ) : (
          <radialGradient id={gradId} cx="52%" cy="24%" r="86%">
            <stop offset="0%" stopColor="var(--moat-solar-pale)" />
            <stop offset="38%" stopColor="var(--moat-solar)" />
            <stop offset="100%" stopColor="var(--moat-solar-deep)" />
          </radialGradient>
        )}

        {/* Halftone stipple, densest toward the foot of the body. */}
        <pattern id={dotId} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.15" fill="var(--moat-navy)" />
        </pattern>
        <linearGradient id={`${maskId}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="12%" stopColor="#000" />
          <stop offset="72%" stopColor="#fff" />
        </linearGradient>
        <mask id={maskId}>
          <circle cx="100" cy="100" r="100" fill={`url(#${maskId}-g)`} />
        </mask>
      </defs>

      <circle cx="100" cy="100" r="100" fill={`url(#${gradId})`} />
      <circle cx="100" cy="100" r="100" fill={`url(#${dotId})`} mask={`url(#${maskId})`} opacity=".13" />
    </svg>
  )
}
