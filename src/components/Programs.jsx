import InkArrow from './InkArrow.jsx'
import NumberBadge from './NumberBadge.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

const PROGRAMS = [
  { num: '01', name: 'Map', body: 'Find the advantage.' },
  { num: '02', name: 'Build', body: 'Build it into the work.' },
  { num: '03', name: 'Loop', body: 'Measure. Learn. Improve.' },
]

/**
 * v3 process chapter (PAR-186): the Map → Build → Loop operating model,
 * staged on a full-bleed navy slab between the two warm-paper chapters
 * so the method reads as its own act.
 *
 * #programs is a semantic <section> labelled by its H2, so it resolves
 * to one labelled region with a real heading. The three steps are an
 * ordered list of exactly three cream cards, each skewed a little off
 * square with its content counter-skewed back to level — the
 * printed-and-pasted look of the concept, without ever tilting the text
 * itself. Order and meaning are carried by the numeral, the name and
 * the position, never by colour alone; the ink arrow that hands each
 * card to the next lives inside the card it leaves and is decorative,
 * so the list still announces three items. On narrow screens the skew
 * is removed, the cards stack, and the same arrow geometry is rotated
 * into a vertical connector (see index.css).
 */
export default function Programs() {
  return (
    <section id="programs" aria-labelledby="programs-title" className="programs-section">
      <div className="programs-inner">
        <SectionEyebrow index="02" label="Process" />
        <h2 id="programs-title" className="section-title programs-title">
          <span className="title-pair">
            Map <span className="title-arrow" aria-hidden="true">&#8594;</span>
          </span>{' '}
          <span className="title-pair">
            Build <span className="title-arrow" aria-hidden="true">&#8594;</span>
          </span>{' '}
          <span className="title-pair">
            Loop<span className="title-dot" aria-hidden="true" />
          </span>
        </h2>
        <ol className="process-stage" aria-label="Our process: Map, Build, Loop">
          {PROGRAMS.map((p, i) => (
            <li key={p.num} className={`process-card process-card-${i + 1}`}>
              <div className="process-card-inner">
                <NumberBadge>{p.num}</NumberBadge>
                <h3 className="process-name">{p.name}</h3>
                <span className="process-underline" aria-hidden="true" />
                <p className="process-body">{p.body}</p>
                {i < PROGRAMS.length - 1 && <InkArrow width={96} className="process-link" />}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
