/**
 * v2 section eyebrow: mono index + label + hairline rule (PAR-179).
 * Replaces the bare .section-label text in v2 sections; styling lives
 * on the tokens in index.css.
 */
export default function SectionEyebrow({ index, label }) {
  return (
    <div className="section-eyebrow">
      <span className="section-eyebrow-index">{index}</span>
      <span>{label}</span>
      <span className="section-eyebrow-rule" aria-hidden="true" />
    </div>
  )
}
