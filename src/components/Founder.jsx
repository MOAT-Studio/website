import GestureMark from './GestureMark.jsx'
import OrbMark from './OrbMark.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

/**
 * v2 editorial chapter 04 (PAR-184): "The founder."
 *
 * Recompiles the v1 founder block into the v2 editorial system: a
 * labelled chapter (eyebrow 04 Founder) with one H2 — the approved
 * name, link to the founder's site — a short approved bio and the
 * three preserved external links. The authorised portrait (/assets/
 * founder.jpg) is kept recognisable and is framed by the original
 * yellow-orb mark peeking from its top-right corner; the map → build →
 * loop gesture mark closes the text column.
 *
 * #founder is a semantic <section> labelled by its H2, so it resolves
 * to one labelled region with a real heading. DOM order is
 * eyebrow → portrait → text, which matches reading and focus order at
 * every width (no CSS re-ordering). Every decorative marking (orb,
 * gesture, section rule) is hidden from assistive technology.
 */
export default function Founder() {
  return (
    <section id="founder" aria-labelledby="founder-title" className="founder-section">
      <SectionEyebrow index="04" label="Founder" />
      <div className="founder-grid">
        <div className="founder-media">
          <OrbMark size={200} decorative className="founder-orb" />
          <img
            src="/assets/founder.jpg"
            alt="Francisco Varisco"
            className="founder-photo"
          />
        </div>
        <div className="founder-body">
        <h2 id="founder-title">
          <a href="https://franciscovarisco.com" target="_blank" rel="noopener noreferrer" className="founder-name">
            <span className="founder-name-lines">
              <span>I am</span>
              <span>francisco</span>
            </span>
          </a>
        </h2>
        <p className="founder-bio">
          Twenty years building technology inside real businesses. Still curious enough
          to take things apart to see why they work.
        </p>
        <span className="founder-links">
          <a href="https://franciscovarisco.com" target="_blank" rel="noopener noreferrer" className="mono-link">franciscovarisco.com</a>
          <span className="sep" aria-hidden="true">•</span>
          <a href="https://linkedin.com/in/xicovarisco" target="_blank" rel="noopener noreferrer" className="mono-link">linkedin</a>
          <span className="sep" aria-hidden="true">•</span>
          <a href="mailto:francisco@moatstudio.ai" className="mono-link">email</a>
        </span>
        <GestureMark width={150} decorative className="founder-gesture" />
        </div>
      </div>
    </section>
  )
}