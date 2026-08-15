const PROGRAMS = [
  {
    num: '01',
    name: 'Moat Map',
    body: 'Identify performance opportunities and classify each by data sensitivity, integration need, reliability requirement and fit for cloud, hybrid or local deployment.',
    meta: '1–3 weeks · fixed scope · you keep the roadmap either way',
  },
  {
    num: '02',
    name: 'Moat Build',
    body: 'Implement the selected workflow against your real systems, with the deployment path chosen in the Map.',
    meta: 'by scope · a working system, not a pilot deck',
  },
  {
    num: '03',
    name: 'Moat Keep',
    body: 'Monitor, improve and retain control — or equip your team to run it themselves and step away.',
    meta: 'ongoing · your call which one',
  },
]

export default function Programs() {
  return (
    <div id="programs" className="section">
      <div className="section-label">Programs</div>
      <div>
        <h2 className="section-title">Three steps. You own the output of each.</h2>
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
