import { Fragment } from 'react'
import SectionEyebrow from './SectionEyebrow.jsx'

const PROGRAMS = [
  {
    num: '01',
    name: 'Map',
    body: 'Discovery from the top down. Leadership and the people doing the work each see a different half of the problem, so we work with both to find where AI creates real advantage, and where it doesn’t. You leave with a ranked map you own either way.',
    meta: '1–3 weeks · fixed scope · yours either way',
  },
  {
    num: '02',
    name: 'Build',
    body: 'We implement what the Map decided: our engineers embedded in your team, or building alongside your own. Working software against your real systems, done when it runs in production, not when the deck is delivered.',
    meta: 'by scope · a working system, not a pilot',
  },
  {
    num: '03',
    name: 'Loop',
    body: 'A system left alone decays: models move, data shifts, edge cases surface. So we measure everything we build in production and make it improve. The numbers are reported, not asserted. Hand the loop to your team whenever you want; it’s yours.',
    meta: 'ongoing · improvement you can see',
  },
]

/**
 * Original process arrow (PAR-182): one line, one arrowhead and three
 * dots, all pure SVG — no external assets or icon library. It reads as a
 * continuous hand-off between the three stages. On narrow screens the
 * same geometry is rotated 90° by CSS (see index.css), so the horizontal
 * desktop arrow becomes a vertical mobile connector without a second
 * drawing. It is decorative: hidden from assistive technology.
 */
function ProcessArrow() {
  return (
    <svg
      viewBox="0 0 44 16"
      className="process-arrow"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="2" y1="8" x2="30" y2="8" />
      <path d="M30 3 L38 8 L30 13" />
      <circle cx="6" cy="8" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="26" cy="8" r="2" />
    </svg>
  )
}

/**
 * v2 process chapter (PAR-182): "How we work" rebuilt as the
 * Map → Build → Loop operating model.
 *
 * #programs is a semantic <section> labelled by its H2 ("Map → Build →
 * Loop."), so it resolves to one labelled region with a clear heading.
 * The three numbered cards live inside a single dark navy inverse panel
 * (the "process stage"), which sits deliberately between the warm-paper
 * Approach and Founder chapters so the stage is visually distinct from
 * its adjacent paper sections. Order and meaning are carried by the
 * number, the name, the position and the arrow — never by colour alone.
 * Card copy is unchanged from the existing proposition; the list
 * treatment is replaced by the staged cards. No links are retained in
 * the cards, so there is nothing to focus here; the page nav's
 * "How we work" anchor is the keyboard entry point.
 */
export default function Programs() {
  return (
    <section id="programs" aria-labelledby="programs-title" className="programs-section">
      <SectionEyebrow index="02" label="How we work" />
      <h2 id="programs-title" className="section-title">Map → Build → Loop.</h2>
      <div className="process-stage" role="list" aria-label="Our process: Map, Build, Loop">
        {PROGRAMS.map((p, i) => (
          <Fragment key={p.num}>
            {i > 0 && <ProcessArrow />}
            <article className="process-card" role="listitem">
              <div className="process-card-top">
                <h3 className="process-name">{p.name}</h3>
                <span className="process-num">{p.num}</span>
              </div>
              <p className="process-body">{p.body}</p>
              <p className="process-meta">{p.meta}</p>
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  )
}