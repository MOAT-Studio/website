import DotCanvas from './DotCanvas.jsx'
import Highlight from './Highlight.jsx'
import MoatLogo from './MoatLogo.jsx'

export default function Hero({ onOpenAssessment }) {
  return (
    <div id="hero" className="hero">
      <DotCanvas />
      <div className="scrim" />

      <div className="hero-inner">
        <div className="hero-bar">
          <a href="#top" className="hero-logo">
            <MoatLogo />
          </a>
          <nav id="nav" className="nav">
            <a href="#approach" className="nav-link">Approach</a>
            <a href="#programs" className="nav-link">How we work</a>
            <a href="#contact" className="nav-cta">Get in touch</a>
          </nav>
        </div>

        <div className="hero-copy">
          <h1>
            AI that compounds into a <Highlight>moat.</Highlight>
          </h1>
          <p>
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
