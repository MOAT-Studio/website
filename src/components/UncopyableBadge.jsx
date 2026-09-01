/**
 * v3 seal (PAR-186): the "become uncopyable" rosette that sits at the
 * hero's right shoulder — a scalloped solar disc with a dashed inner
 * ring and the promise set in display caps.
 *
 * The scallop is generated, not drawn: N on-curve points at the inner
 * radius alternating with N quadratic control points at the outer
 * radius, which is a rosette of N shallow lobes. Deterministic, so the
 * SSR pass and the client render byte-identical markup.
 *
 * It repeats the hero's own words, so it is decorative rather than
 * content: aria-hidden, and nothing is lost if it is not announced.
 */
const LOBES = 30
const R_IN = 84
const R_OUT = 94

function rosette() {
  const pt = (i, r) => {
    const a = (i * Math.PI) / LOBES - Math.PI / 2
    return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]
  }
  let d = `M${pt(0, R_IN).map((n) => n.toFixed(2)).join(' ')}`
  for (let i = 1; i <= LOBES; i++) {
    const [cx, cy] = pt(2 * i - 1, R_OUT)
    const [x, y] = pt(2 * i, R_IN)
    d += ` Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return `${d}Z`
}

const SCALLOP = rosette()

export default function UncopyableBadge({ size = 150, className }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`badge-mark${className ? ` ${className}` : ''}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path d={SCALLOP} fill="var(--moat-solar)" />
      <circle
        cx="100" cy="100" r="72"
        fill="none"
        stroke="var(--moat-navy)"
        strokeOpacity=".55"
        strokeWidth="1.6"
        strokeDasharray="2 6"
        strokeLinecap="round"
      />
      <text className="badge-text" x="100" y="93" textAnchor="middle">BECOME</text>
      <text className="badge-text" x="100" y="123" textAnchor="middle">UNCOPYABLE</text>
    </svg>
  )
}
