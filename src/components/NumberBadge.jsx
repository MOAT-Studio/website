/**
 * v3 index badge (PAR-186): a solar disc carrying the chapter or step
 * number in display caps. It is the primary order marker on the process
 * cards and the proof columns — sequence is read from the numeral, never
 * from colour alone. The number is real text, so it is announced and
 * stays legible when the page is zoomed.
 */
export default function NumberBadge({ children, className }) {
  return <span className={`number-badge${className ? ` ${className}` : ''}`}>{children}</span>
}
