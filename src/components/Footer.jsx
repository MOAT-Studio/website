import GestureMark from './GestureMark.jsx'

/**
 * v2 footer (PAR-185): the colophon, brought into the editorial-orb
 * system. Text and external destinations are preserved exactly — the
 * copyright line, the two secure external links (target=_blank +
 * noopener noreferrer) and the mailto. The map → build → loop gesture
 * mark closes the footer as a decorative, aria-hidden mark.
 *
 * <footer> is a semantic landmark (implicit role contentinfo), so the
 * colophon reads as the page's closing region rather than a plain div.
 */
export default function Footer() {
  return (
    <footer id="footer">
      <span>© 2026 moat studio</span>
      <GestureMark width={180} decorative className="footer-gesture" />
      <span className="footer-links">
        <a href="https://franciscovarisco.com" target="_blank" rel="noopener noreferrer" className="mono-link">franciscovarisco.com</a>
        <a href="https://linkedin.com/in/xicovarisco" target="_blank" rel="noopener noreferrer" className="mono-link">linkedin</a>
        <a href="mailto:francisco@moatstudio.ai" className="mono-link">email</a>
      </span>
    </footer>
  )
}
