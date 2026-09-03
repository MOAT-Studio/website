import BrushMark from './BrushMark.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

/**
 * v3 editorial chapter 04 (PAR-186): "I am Francisco."
 *
 * A labelled chapter with one H2 — the approved name, linking to the
 * founder's site — a short approved bio and the three preserved
 * external links, now carrying their own direction glyphs. The
 * authorised portrait (/assets/founder.jpg) is composed as the concept
 * has it: a painted cream ground, a solar disc behind the head, and the
 * photo itself reduced to a navy duotone. The duotone is CSS only and
 * sits behind an @supports guard, so a browser without blend modes
 * simply shows the plain, recognisable photograph.
 *
 * #founder is a semantic <section> labelled by its H2. DOM order is
 * eyebrow → text → portrait, which matches reading and focus order at
 * every width (no CSS re-ordering). Every decorative marking is hidden
 * from assistive technology.
 */
export default function Founder() {
  return (
    <section id="founder" aria-labelledby="founder-title" className="founder-section">
      <SectionEyebrow index="04" label="Founder" />
      <div className="founder-grid">
        <h2 id="founder-title" className="section-title founder-title">
          <a href="https://franciscovarisco.com" target="_blank" rel="noopener noreferrer" className="founder-name">
            <span className="line">I am</span>{' '}
            <span className="line">
              Francisco<span className="title-dot" aria-hidden="true" />
            </span>
          </a>
        </h2>

        <div className="founder-body">
          <p className="founder-bio">Twenty years building technology inside real businesses.</p>
          <p className="founder-close" aria-hidden="true">
            <span className="dot-red" />
            <span className="rule-solar" />
          </p>
          <ul className="founder-links">
            <li>
              <a href="https://franciscovarisco.com" target="_blank" rel="noopener noreferrer" className="mono-link">
                franciscovarisco.com<span className="link-glyph" aria-hidden="true">&#8599;</span>
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/xicovarisco" target="_blank" rel="noopener noreferrer" className="mono-link">
                linkedin<span className="link-glyph" aria-hidden="true">&#8599;</span>
              </a>
            </li>
            <li>
              <a href="mailto:francisco@moatstudio.ai" className="mono-link">
                email<span className="link-glyph" aria-hidden="true">&#8594;</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="founder-media">
          {/* Duotone ramp: the photograph's darks become navy and its
              lights become solar, so the portrait joins the page's two
              colours instead of introducing a third. Referenced from
              .founder-photo in index.css behind an @supports guard. */}
          <svg className="founder-duotone-defs" aria-hidden="true" focusable="false">
            <filter id="moat-duotone" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.33 0.33 0.33 0 0
                        0.33 0.33 0.33 0 0
                        0.33 0.33 0.33 0 0
                        0    0    0    1 0"
              />
              <feComponentTransfer>
                <feFuncR type="table" tableValues="0.012 0.992" />
                <feFuncG type="table" tableValues="0.027 0.843" />
                <feFuncB type="table" tableValues="0.118 0" />
              </feComponentTransfer>
            </filter>
          </svg>
          <BrushMark shape="wash" width={340} tone="sand" strokeWidth={46} className="founder-wash" />
          <span className="founder-disc" aria-hidden="true" />
          <div className="founder-frame">
            <img src="/assets/founder.jpg" alt="Francisco Varisco" className="founder-photo" />
          </div>
        </div>
      </div>
    </section>
  )
}
