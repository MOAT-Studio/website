import OrbMark from './OrbMark.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

/**
 * v2 editorial chapter 01 (PAR-181): "We start where you are".
 *
 * The section is a semantic <section> labelled by its H2, so #approach
 * resolves to one labelled region. Above the headline: the chapter
 * eyebrow (mono index + label + rule) and a large ghosted chapter
 * number for a deliberate editorial composition. Below the copy: a
 * small decorative orb accent (presentation-only — it never enters the
 * accessibility tree). On narrow screens the accent drops from the
 * side into flow below the copy, keeping hierarchy before decoration.
 * The copy is unchanged from the existing proposition.
 */
export default function Approach() {
  return (
    <section id="approach" aria-labelledby="approach-title" className="approach-section">
      <SectionEyebrow index="01" label="Approach" />
      <div className="approach-chapter">
        <div className="approach-number" aria-hidden="true">01</div>
        <h2 id="approach-title" className="section-title">We start where you are</h2>
        <div className="approach-copy">
          <p>
            MOAT Studio is an AI consultancy based in Brisbane, Australia, working
            with expert-led businesses. Every organisation is at a different place with AI. Some are choosing a first
            project. Some have pilots that stalled. Some are ready to scale what already
            works. So every engagement starts with discovery, inside your operation and
            with your people. We only build once we know where AI genuinely pays.
          </p>
          <p>
            We work as consultants, deployment engineers and adoption partners, in
            organisations of every size. We're vendor-neutral: the right tool for the
            workflow, including none at all. We build with your team in the room, so
            the capability stays when we leave. The goal was never AI for its own sake.
            It's AI as your competitive advantage.
          </p>
        </div>
        <OrbMark size={64} tone="ink" decorative className="approach-orb" />
      </div>
    </section>
  )
}