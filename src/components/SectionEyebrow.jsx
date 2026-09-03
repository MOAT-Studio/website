/**
 * v3 section eyebrow (PAR-186): the chapter marker — `LABEL / 0N` in
 * mono caps over a hairline rule that runs the width of the chapter.
 * Colour follows the ground it sits on (red detail on paper, solar on
 * the navy slab and the contact panel); styling lives on the tokens in
 * index.css. The rule is decorative and hidden from assistive tech.
 */
export default function SectionEyebrow({ index, label }) {
  return (
    <div className="section-eyebrow">
      <span className="section-eyebrow-text">
        {label} <span className="section-eyebrow-slash" aria-hidden="true">/</span> {index}
      </span>
      <span className="section-eyebrow-rule" aria-hidden="true" />
    </div>
  )
}
