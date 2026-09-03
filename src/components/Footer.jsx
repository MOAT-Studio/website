import MoatLogo from './MoatLogo.jsx'

/**
 * v3 footer (PAR-186): the colophon as a single line of mono meta on
 * the warm paper — the tile logo, the copyright, where we are, and the
 * two preserved external destinations, divided by short solar ticks.
 * Text and destinations are unchanged: the two external links keep
 * target=_blank with noopener noreferrer, and the mailto is untouched.
 *
 * <footer> is a semantic landmark (implicit role contentinfo), so the
 * colophon reads as the page's closing region rather than a plain div.
 */
export default function Footer() {
  return (
    <footer id="footer">
      <a href="#top" className="footer-logo">
        <MoatLogo size={54} tone="ink" />
        <span className="visually-hidden">MOAT Studio — back to top</span>
      </a>
      <span className="footer-tick" aria-hidden="true" />
      <span className="footer-item">&copy; 2026 MOAT Studio</span>
      <span className="footer-tick" aria-hidden="true" />
      <span className="footer-item">Brisbane, Australia</span>
      <span className="footer-tick" aria-hidden="true" />
      <a href="https://linkedin.com/in/xicovarisco" target="_blank" rel="noopener noreferrer" className="footer-item footer-link">
        LinkedIn
      </a>
      <a href="mailto:francisco@moatstudio.ai" className="footer-item footer-link">
        Email
      </a>
    </footer>
  )
}
