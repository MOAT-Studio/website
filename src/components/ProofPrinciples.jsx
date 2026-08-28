import SectionEyebrow from './SectionEyebrow.jsx'

/**
 * Original principle diagram for "Your workflows" (PAR-183): three
 * dashed loops in horizontal orbit around one solid solar core. The
 * loops are the work that turns; the core is the advantage that stays.
 * Pure SVG, pure v2 tokens — no external assets. Decorative: hidden
 * from assistive technology in markup.
 */
function WorkflowsDiagram() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="proof-diagram"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="60" cy="60" r="15" />
      <ellipse cx="60" cy="60" rx="46" ry="18" />
      <ellipse cx="60" cy="60" rx="46" ry="18" transform="rotate(60 60 60)" />
      <ellipse cx="60" cy="60" rx="46" ry="18" transform="rotate(120 60 60)" />
      <circle cx="106" cy="60" r="3" />
    </svg>
  )
}

/**
 * Original principle diagram for "Your knowledge" (PAR-183): two
 * overlapping rings (two circles, even-odd fill so the lens reads as
 * the shared centre) with one solar point where they meet. Pure SVG,
 * pure v2 tokens. Decorative: hidden from assistive technology.
 */
function KnowledgeDiagram() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="proof-diagram"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M60 22a38 38 0 1 0 0 76 38 38 0 1 0 0-76Z M60 22a38 38 0 1 1 0 76 38 38 0 1 1 0-76Z"
        fillRule="evenodd"
      />
      <circle cx="60" cy="60" r="4.5" />
    </svg>
  )
}

/**
 * Original principle diagram for "Your judgement" (PAR-183): concentric
 * focus rings — dashed outer field, solid inner target — one solar
 * point at the centre of gravity. Pure SVG, pure v2 tokens.
 * Decorative: hidden from assistive technology.
 */
function JudgementDiagram() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="proof-diagram"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="60" cy="60" r="46" />
      <circle cx="60" cy="60" r="30" />
      <circle cx="60" cy="60" r="14" />
      <circle cx="60" cy="60" r="4.5" />
    </svg>
  )
}

const PRINCIPLES = [
  {
    num: '01',
    name: 'Your workflows',
    body: 'The work starts from your operations, not a template. We map the workflows you already run — the steps, the hand-offs, the moments where a decision is made — and build only where they create advantage.',
    Diagram: WorkflowsDiagram,
  },
  {
    num: '02',
    name: 'Your knowledge',
    body: 'The advantage you hold — your market, your customers, your craft — is the raw material we work from. We encode it with your team, in your terms, so the system keeps understanding the business long after the build.',
    Diagram: KnowledgeDiagram,
  },
  {
    num: '03',
    name: 'Your judgement',
    body: 'You stay the one who decides. The system surfaces what it has learned; the call stays yours. Judgement is what a model can’t offer — which is exactly why we build around yours.',
    Diagram: JudgementDiagram,
  },
]

/**
 * v2 editorial chapter 03 (PAR-183): "AI built around your business."
 *
 * The proof-principles chapter is the editorial bridge between the
 * process chapter (#programs) and the founder: three numbered
 * principles — Your workflows, Your knowledge, Your judgement — that
 * show the work is grounded in the client's operation rather than
 * generic AI theatre. Each principle's supporting copy is derived from
 * the site's existing proposition (the hero's core statement) and says
 * nothing unverifiable: no client claims, no benchmarks, no outcomes.
 *
 * #proof-principles is a semantic <section> labelled by its H2 ("Built
 * around your business."), so it resolves to one labelled region with a
 * real heading. The three principles form an ordered list; each item
 * keeps its number, heading and explanatory text in the DOM. Each
 * principle carries one original decorative diagram (orbit, overlap,
 * focus — pure SVG, aria-hidden in markup), presented as a light
 * editorial grid on the warm paper, in contrast to the navy inverse
 * process stage directly above it.
 */
export default function ProofPrinciples() {
  return (
    <section
      id="proof-principles"
      aria-labelledby="proof-principles-title"
      className="proof-section"
    >
      <SectionEyebrow index="03" label="Proof" />
      <h2 id="proof-principles-title" className="section-title">
        Built around your business.
      </h2>
      <p className="proof-intro">
        The proof of the approach sits in three places the tools never touch:
        the work you do, the knowledge you hold, and the calls you make.
      </p>
      <ol className="proof-grid" aria-label="Three principles: your workflows, your knowledge, your judgement">
        {PRINCIPLES.map(({ num, name, body, Diagram }) => (
          <li key={num} className="proof-item">
            <Diagram />
            <div className="proof-item-head">
              <h3 className="proof-name">{name}</h3>
              <span className="proof-num">{num}</span>
            </div>
            <p className="proof-body">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}