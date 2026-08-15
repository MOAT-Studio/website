const COLORS = ['#FFBA08', '#FFC917', '#FFE100', '#DC2F02', '#D00000']
const DOTS = 13

/** Row of hue-cycling dots aligned with the content column. */
export default function Divider() {
  return (
    <div id="divider">
      <div className="spacer" />
      <svg viewBox="0 0 382 22" width="382" height="22" role="presentation">
        {Array.from({ length: DOTS }, (_, i) => (
          <circle
            key={i}
            cx={11 + i * 30}
            cy="11"
            r="11"
            fill={COLORS[i % COLORS.length]}
            style={{ animationDelay: `${(-1.15 * i).toFixed(2)}s` }}
          />
        ))}
      </svg>
    </div>
  )
}
