import { Fragment } from 'react'
import NumberBadge from './NumberBadge.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

/**
 * Original principle diagram for "Your workflows" (PAR-186): a
 * hand-drawn arrow turning all the way around a solid solar core. The
 * loop is the work that turns; the core is the advantage that stays.
 * Pure SVG, pure tokens — no external assets. Decorative: hidden from
 * assistive technology in markup.
 */
function WorkflowsDiagram() {
  return (
    <svg viewBox="0 0 120 120" className="proof-diagram" role="presentation" aria-hidden="true" focusable="false">
      <circle className="proof-core" cx="60" cy="60" r="30" />
      <path className="proof-stroke" d="M60 12a48 48 0 1 1-40 21" />
      <path className="proof-stroke" d="M86 88 L92 108 L72 106" />
    </svg>
  )
}

/**
 * Original principle diagram for "Your knowledge" (PAR-186): two thin
 * rings that overlap, with the shared lens filled solar — the place
 * your data and your context meet. Pure SVG, pure tokens. Decorative.
 */
function KnowledgeDiagram() {
  return (
    <svg viewBox="0 0 120 120" className="proof-diagram" role="presentation" aria-hidden="true" focusable="false">
      <path className="proof-core" d="M60 31.2A34 34 0 0 1 60 88.8 34 34 0 0 1 60 31.2Z" />
      <circle className="proof-ring" cx="42" cy="60" r="34" />
      <circle className="proof-ring" cx="78" cy="60" r="34" />
    </svg>
  )
}

/**
 * Original principle diagram for "Your judgement" (PAR-186): the solar
 * body held inside four crop marks — the call is framed, and it stays
 * yours. Pure SVG, pure tokens. Decorative.
 */
function JudgementDiagram() {
  return (
    <svg viewBox="0 0 120 120" className="proof-diagram" role="presentation" aria-hidden="true" focusable="false">
      <circle className="proof-core" cx="60" cy="60" r="33" />
      <path className="proof-stroke" d="M14 38V14h24M106 38V14H82M14 82v24h24M106 82v24H82" />
    </svg>
  )
}

const PRINCIPLES = [
  {
    num: '01',
    name: ['Your', 'workflows'],
    body: 'We embed AI into the processes that already move your business forward.',
    Diagram: WorkflowsDiagram,
  },
  {
    num: '02',
    name: ['Your', 'knowledge'],
    body: 'We connect your data and context so AI understands what matters.',
    Diagram: KnowledgeDiagram,
  },
  {
    num: '03',
    name: ['Your', 'judgement'],
    body: 'We design for human oversight so better decisions compound over time.',
    Diagram: JudgementDiagram,
  },
]

/**
 * v3 editorial chapter 03 (PAR-186): "AI built around your business."
 *
 * The editorial bridge between the navy process slab and the founder: a
 * heavy display claim on the left, and on the right the three places
 * the work is actually grounded — your workflows, your knowledge, your
 * judgement — each with one original diagram beneath it. The chapter
 * stays on the warm paper so the slab above it reads as method and this
 * reads as claim.
 *
 * #proof-principles is a semantic <section> labelled by its H2. The
 * three principles are an ordered list; each keeps its numeral, heading
 * and explanatory text in the DOM, and every diagram is aria-hidden.
 * Nothing here is unverifiable: no client claims, no benchmarks, no
 * outcomes.
 */
export default function ProofPrinciples() {
  return (
    <section id="proof-principles" aria-labelledby="proof-principles-title" className="proof-section">
      <SectionEyebrow index="03" label="Proof & principles" />
      <div className="proof-grid">
        <h2 id="proof-principles-title" className="section-title proof-title">
          <span className="line">AI built</span>{' '}
          <span className="line">around your</span>{' '}
          <span className="line">
            business<span className="title-dot" aria-hidden="true" />
          </span>
        </h2>
        <ol className="proof-columns" aria-label="Three principles: your workflows, your knowledge, your judgement">
          {PRINCIPLES.map(({ num, name, body, Diagram }) => (
            <li key={num} className="proof-item">
              <NumberBadge>{num}</NumberBadge>
              <h3 className="proof-name">
                {name.map((w, i) => (
                  <Fragment key={w}>
                    {i > 0 && ' '}
                    <span className="line">{w}</span>
                  </Fragment>
                ))}
              </h3>
              <p className="proof-body">{body}</p>
              <Diagram />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
