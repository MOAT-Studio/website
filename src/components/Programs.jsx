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

export default function Programs() {
  return (
    <div id="programs" className="section">
      <div className="section-label">Programs</div>
      <div>
        <h2 className="section-title">Map → Build → Loop. Three ways to start, or one arc through all three.</h2>
        {PROGRAMS.map((p) => (
          <div className="program" key={p.num}>
            <div className="program-head">
              <div className="program-name">{p.name}</div>
              <div className="program-num">{p.num}</div>
            </div>
            <p>{p.body}</p>
            <div className="program-meta">{p.meta}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
