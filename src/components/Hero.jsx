import DotCanvas from './DotCanvas.jsx'
import Highlight from './Highlight.jsx'
import MoatLogo from './MoatLogo.jsx'

export default function Hero() {
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
            <a href="#programs" className="nav-link">Programs</a>
            <a href="#contact" className="nav-cta">Get in touch</a>
          </nav>
        </div>

        <div className="hero-copy">
          <h1>
            AI systems that compound into an advantage your competitors{' '}
            <Highlight>cannot copy.</Highlight>
          </h1>
          <p>
            MOAT Studio helps expert-led businesses improve internal performance with AI
            systems built around their own workflows and knowledge—then, where privacy,
            data control or independence matters, deploy them on infrastructure they control.
          </p>
        </div>
      </div>
    </div>
  )
}
