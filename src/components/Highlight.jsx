/** Yellow rotated marker behind a phrase (hero "moat.", contact "uncopyable."). */
export default function Highlight({ children }) {
  return (
    <span className="hl">
      <span className="hl-bg" />
      <span className="hl-text">{children}</span>
    </span>
  )
}
