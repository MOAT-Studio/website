import DotCanvas from './DotCanvas.jsx'
import GestureMark from './GestureMark.jsx'
import Highlight from './Highlight.jsx'
import MoatLogo from './MoatLogo.jsx'
import OrbMark from './OrbMark.jsx'

/**
 * v2 editorial hero (PAR-180): the approved core statement composed as
 * display typography with semantic line breaks, over an original
 * yellow-orb composition. The orb artwork is layered behind the text —
 * pointer-events stay off it, and every decorative element is hidden
 * from assistive technology. The header keeps the logo home link plus
 * Approach / How we work / Get in touch; on small screens it becomes an
 * intentional two-row composition instead of clipped desktop pills.
 */
export default function Hero({ onOpenAssessment }) {
  return (
    <div id="hero" className="hero">
      <DotCanvas />
      <div className="scrim" aria-hidden="true" />

      {/* Orb composition — original SVG artwork, decorative only. */}
      <div className="hero-orbs" aria-hidden="true">
        <OrbMark size={560} tone="cream" decorative className="hero-orb-main" />
        <OrbMark size={150} tone="cream" decorative className="hero-orb-satellite" />
        <GestureMark width={230} tone="cream" decorative className="hero-gesture" />
      </div>

      <div className="hero-inner">
        <header className="hero-bar">
          <a href="#top" className="hero-logo">
            <MoatLogo />
            <span className="hero-wordmark">MOAT Studio</span>
          </a>
          <nav id="nav" className="nav" aria-label="Primary">
            <a href="#approach" className="nav-link">Approach</a>
            <a href="#programs" className="nav-link">How we work</a>
            <a href="#contact" className="nav-cta">Get in touch</a>
          </nav>
        </header>

        <div className="hero-copy">
          <p className="hero-kicker">MOAT Studio · AI consultancy, Brisbane</p>
          <h1 className="hero-title">
            <span className="line">AI that compounds</span>
            <span className="line">into a <Highlight>moat.</Highlight></span>
          </h1>
          <p className="hero-prop">
            MOAT Studio builds AI around the way your people actually work: your
            workflows, your knowledge, your judgement. What compounds is yours.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              id="map-your-moat-cta"
              className="hero-cta"
              onClick={onOpenAssessment}
            >
              Map your moat
            </button>
            <span className="hero-cta-note">12 questions · 3 minutes · no sign-up</span>
          </div>
        </div>
      </div>
    </div>
  )
}
