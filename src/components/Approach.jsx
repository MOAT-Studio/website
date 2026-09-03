import SectionEyebrow from './SectionEyebrow.jsx'

/**
 * v3 editorial chapter 01 (PAR-186): "We start where you are".
 *
 * The chapter is a semantic <section> labelled by its H2, so #approach
 * resolves to one labelled region. The composition is a three-part
 * editorial row — display headline, a drawn bracket, then the reading
 * column — with a soft solar circle bleeding off the right edge behind
 * it all. The bracket, the circle, the closing rule and the red detail
 * dot are presentation only and never enter the accessibility tree.
 */
export default function Approach() {
  return (
    <section id="approach" aria-labelledby="approach-title" className="approach-section">
      <SectionEyebrow index="01" label="Approach" />
      <div className="approach-circle" aria-hidden="true" />
      <div className="approach-grid">
        <h2 id="approach-title" className="section-title approach-title">
          <span className="line">We start</span>{' '}
          <span className="line">where you are</span>
        </h2>
        <div className="approach-bracket" aria-hidden="true" />
        <div className="approach-copy">
          <p>
            We meet you in the real world of your business — your people, your
            systems, your constraints.
          </p>
          <p>
            Then we design AI that fits the way you work and compounds over time.
          </p>
          <p className="approach-close" aria-hidden="true" data-ink>
            <span className="dot-red" />
            <span className="rule-solar" />
          </p>
        </div>
      </div>
    </section>
  )
}
