/**
 * v3 process rail (PAR-186): the sunken pill across the foot of the
 * hero that names the operating model — MAP → BUILD → LOOP — before the
 * page has explained it. Dotted solar leaders run out to each end.
 *
 * The stage names are real text (the arrows between them are decorative
 * glyphs, hidden from assistive technology), and the rail links down to
 * the process chapter that expands on them.
 */
const STAGES = ['Map', 'Build', 'Loop']

export default function ProcessRail() {
  return (
    <div className="process-rail">
      <span className="rail-leader" aria-hidden="true" />
      <a href="#programs" className="rail-stages">
        {STAGES.map((s, i) => (
          <span key={s} className="rail-stage">
            {i > 0 && <span className="rail-arrow" aria-hidden="true">&#8594;</span>}
            {s}
          </span>
        ))}
      </a>
      <span className="rail-leader" aria-hidden="true" />
    </div>
  )
}
