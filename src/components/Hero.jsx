import BrushMark from './BrushMark.jsx'
import HeroOrb from './HeroOrb.jsx'
import MoatLogo from './MoatLogo.jsx'
import ProcessRail from './ProcessRail.jsx'
import UncopyableBadge from './UncopyableBadge.jsx'

/**
 * v3 editorial hero (PAR-186): the poster. The core statement is set as
 * display caps across two semantic lines, centred on the warm paper,
 * with the solar orb cresting from behind the second line and dry-brush
 * ink marks at each shoulder. The rosette repeats the promise; the rail
 * across the foot names the operating model and links into the process
 * chapter.
 *
 * The header keeps the logo home link plus Approach / How we work / Get
 * in touch, now as pills — outlined for the two navigational links,
 * solid solar for the one action. On small screens it becomes an
 * intentional two-row composition instead of clipped desktop pills.
 *
 * Every decorative layer (orb, brush marks, rosette) is pure SVG and
 * aria-hidden, and sits behind the type with pointer-events off — the
 * headline stays real, selectable text at every width.
 */
export default function Hero() {
  return (
    <div id="hero" className="hero">
      <div className="hero-inner">
        <header className="hero-bar">
          <a href="#top" className="hero-logo">
            <MoatLogo size={58} tone="ink" />
            <span className="visually-hidden">MOAT Studio — home</span>
          </a>
          <nav id="nav" className="nav" aria-label="Primary">
            <a href="#approach" className="nav-pill">Approach</a>
            <a href="#programs" className="nav-pill">How we work</a>
            <a href="#contact" className="nav-pill nav-pill-solid">Get in touch</a>
          </nav>
        </header>

        <div className="hero-stage">
          {/* Decorative composition — behind the type, never over it. */}
          <div className="hero-marks" aria-hidden="true">
            <HeroOrb size={620} variant="rise" className="hero-orb-rise" />
            <BrushMark shape="squiggle" width={200} className="hero-brush-left" />
            <BrushMark shape="sweep" width={220} className="hero-brush-right" />
          </div>

          <p className="hero-kicker">
            <span className="hero-paren" aria-hidden="true">(</span>
            MOAT Studio builds AI around the way your people actually work.
            <span className="hero-paren" aria-hidden="true">)</span>
          </p>
          <h1 id="hero-title" className="hero-title" tabIndex={-1}>
            <span className="line">AI that compounds</span>{' '}
            <span className="line">into a moat.</span>
          </h1>
          <UncopyableBadge size={150} className="hero-badge" />
        </div>

        <ProcessRail />
      </div>
    </div>
  )
}
