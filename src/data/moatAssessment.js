// Map your Moat — assessment configuration (PAR-170 POC).
// Question bank, dimension mapping, weights and archetype rules live here,
// out of JSX, so the instrument can be tuned without touching components.
//
// Two axes, per the research frame (Research/map-your-moat-research.md §5):
//   moat  — five defensibility dimensions, behavioural markers, 0–3 per answer
//   exposure — inverse reading: how much of today's revenue an LLM already erodes
//
// Everything here is a prototype instrument: unvalidated, uncalibrated, no
// benchmark claim. The result screen must keep saying so.

export const DIMENSIONS = {
  proprietaryData: { label: 'Proprietary data', axis: 'moat' },
  workflowDepth: { label: 'Workflow depth', axis: 'moat' },
  distribution: { label: 'Distribution & attention', axis: 'moat' },
  pointOfView: { label: 'Point of view', axis: 'moat' },
  deliveryLeverage: { label: 'Delivery leverage', axis: 'moat' },
  exposure: { label: 'Exposure', axis: 'exposure' },
}

// Equal dimension weights for the POC; per-dimension weights kept explicit so
// the production instrument can tune them without structural change.
export const WEIGHTS = {
  proprietaryData: 1,
  workflowDepth: 1,
  distribution: 1,
  pointOfView: 1,
  deliveryLeverage: 1,
}

// 12 one-screen behavioural questions. Observable/factual prompts only —
// never "rate your maturity". Option values run 0 (weakest moat / highest
// exposure signal) to 3 (strongest moat / lowest exposure signal); exposure
// questions are asked in their natural direction and inverted in scoring.
export const QUESTIONS = [
  {
    id: 'q1',
    dimension: 'proprietaryData',
    prompt: 'If your top three clients left tomorrow, how long would it take a competitor to rebuild what you know about them?',
    options: [
      { label: 'A few days — most of it is on their website or in our proposals', value: 0 },
      { label: 'A few weeks of onboarding conversations', value: 1 },
      { label: 'Months — the history and context run deep', value: 2 },
      { label: 'Years — we hold data and patterns nobody else has recorded', value: 3 },
    ],
  },
  {
    id: 'q2',
    dimension: 'proprietaryData',
    prompt: 'What do you hold that a competitor could not buy, scrape, or get from a well-written AI prompt?',
    options: [
      { label: 'Honestly, nothing I could point to', value: 0 },
      { label: 'Some internal templates and past project files', value: 1 },
      { label: 'A structured body of client or market data we maintain', value: 2 },
      { label: 'Unique datasets or records that grow with every engagement', value: 3 },
    ],
  },
  {
    id: 'q3',
    dimension: 'workflowDepth',
    prompt: 'If your service switched off next Monday, what would actually break inside your clients’ week?',
    options: [
      { label: 'Nothing visible — they would find a substitute quickly', value: 0 },
      { label: 'Some inconvenience, a scramble for a replacement', value: 1 },
      { label: 'Key routines would stall until we were replaced', value: 2 },
      { label: 'Parts of their operation simply stop — we are load-bearing', value: 3 },
    ],
  },
  {
    id: 'q4',
    dimension: 'workflowDepth',
    prompt: 'How much of your clients’ day-to-day work runs through systems, templates or processes you built?',
    options: [
      { label: 'None — we deliver outputs, they run their own process', value: 0 },
      { label: 'One or two touchpoints', value: 1 },
      { label: 'Several recurring workflows depend on our setup', value: 2 },
      { label: 'Our systems are the way their team does that work', value: 3 },
    ],
  },
  {
    id: 'q5',
    dimension: 'distribution',
    prompt: 'Where did your last ten clients actually come from?',
    options: [
      { label: 'Mostly paid ads or marketplace platforms', value: 0 },
      { label: 'Mostly one referral source or partner we don’t control', value: 1 },
      { label: 'A mix of referrals and people who already followed our work', value: 2 },
      { label: 'Mostly our own audience — list, community, or inbound reputation', value: 3 },
    ],
  },
  {
    id: 'q6',
    dimension: 'distribution',
    prompt: 'How many people could you reach tomorrow morning without paying a platform — your own list, community or subscribers?',
    options: [
      { label: 'None, or I don’t know', value: 0 },
      { label: 'Under a hundred', value: 1 },
      { label: 'A few hundred', value: 2 },
      { label: 'Thousands, and it grows month on month', value: 3 },
    ],
  },
  {
    id: 'q7',
    dimension: 'pointOfView',
    prompt: 'If we asked your last five clients what your business is known for, how would their answers line up?',
    options: [
      { label: 'Five different answers, mostly "they’re reliable"', value: 0 },
      { label: 'Roughly the same service category, nothing sharper', value: 1 },
      { label: 'A consistent strength or specialty most would name', value: 2 },
      { label: 'The same distinct stance, in almost the same words', value: 3 },
    ],
  },
  {
    id: 'q8',
    dimension: 'pointOfView',
    prompt: 'Have you published a position your competitors would be unwilling — not just unable — to put their name to?',
    options: [
      { label: 'We don’t really publish opinions', value: 0 },
      { label: 'We publish, but it’s safe, agreeable content', value: 1 },
      { label: 'One or two stances that genuinely divide the market', value: 2 },
      { label: 'Yes — a known position that filters who calls us', value: 3 },
    ],
  },
  {
    id: 'q9',
    dimension: 'deliveryLeverage',
    prompt: 'If your client count doubled next month, what would have to happen to headcount?',
    options: [
      { label: 'It would roughly double — delivery is hours', value: 0 },
      { label: 'Significant hiring, with some efficiency gains', value: 1 },
      { label: 'Modest hiring — systems absorb a lot of the load', value: 2 },
      { label: 'Little to none — delivery is mostly systematised', value: 3 },
    ],
  },
  {
    id: 'q10',
    dimension: 'deliveryLeverage',
    prompt: 'Where does AI sit in your delivery today?',
    options: [
      { label: 'We don’t use it in delivery', value: 0 },
      { label: 'Individual experiments, person by person', value: 1 },
      { label: 'Embedded in a few standard workflows we control', value: 2 },
      { label: 'Built into how we deliver — it widens our margin, not a rival’s', value: 3 },
    ],
  },
  // Exposure — asked in natural direction (higher option index = more exposed).
  {
    id: 'q11',
    dimension: 'exposure',
    prompt: 'Of the work you invoiced last quarter, how much could a client now get to an acceptable standard from a general AI tool?',
    options: [
      { label: 'Under 10% — the judgement is the product', value: 3 },
      { label: '10–30% — the routine edges', value: 2 },
      { label: '30–60% — a worrying middle', value: 1 },
      { label: 'More than 60%, or I’ve avoided checking', value: 0 },
    ],
  },
  {
    id: 'q12',
    dimension: 'exposure',
    prompt: 'In the past year, has a client shrunk or ended an engagement because they did the work with AI instead?',
    options: [
      { label: 'No, and it’s hard to see how they could', value: 3 },
      { label: 'No, but I can see exactly how they would', value: 2 },
      { label: 'Once', value: 1 },
      { label: 'More than once', value: 0 },
    ],
  },
]

// ── Scoring ──────────────────────────────────────────────────────────────
// answers: array of option indexes (same order as QUESTIONS).
// Returns 0–100 on both axes. Moat = weighted mean of the five defensibility
// dimensions. Exposure = inverse of the exposure questions' 0–3 values.
export function scoreAnswers(answers) {
  const byDimension = {}
  QUESTIONS.forEach((q, i) => {
    const idx = answers[i]
    if (idx == null) return
    const value = q.options[idx].value
    if (!byDimension[q.dimension]) byDimension[q.dimension] = []
    byDimension[q.dimension].push(value)
  })
  let weighted = 0
  let weightSum = 0
  for (const [dim, weight] of Object.entries(WEIGHTS)) {
    const values = byDimension[dim] || []
    if (!values.length) continue
    weighted += (values.reduce((a, b) => a + b, 0) / values.length) * weight
    weightSum += weight
  }
  const moat = weightSum ? Math.round(((weighted / weightSum) / 3) * 100) : 0
  const exposureValues = byDimension.exposure || []
  const exposureStrength = exposureValues.length
    ? exposureValues.reduce((a, b) => a + b, 0) / exposureValues.length
    : 3
  const exposure = Math.round((1 - exposureStrength / 3) * 100)
  return { moat, exposure }
}

// ── Archetype rules (two-axis quadrant) ─────────────────────────────────
// Threshold 50 on each axis for the POC. Copy must keep the two axes distinct:
// exposure is what AI takes from today's revenue; moat is what defends tomorrow's.
export const ARCHETYPE_THRESHOLD = 50

export const ARCHETYPES = {
  compounding: {
    name: 'Compounding',
    reading: 'Defended, low exposure',
    summary:
      'Your answers point to real defensible assets — data, embedded workflows, or an owned audience — while little of your current revenue looks directly replaceable by a general AI tool. In this reading, AI is leverage on top of an already-defended position: each engagement should deepen the moat rather than race the tools.',
  },
  sheltered: {
    name: 'Sheltered',
    reading: 'Low exposure, thin defences',
    summary:
      'Little of your current revenue looks AI-replaceable today — but that safety comes from the kind of work you do, not from defences you have built. Low exposure is not the same as a strong moat: if the tools move up-market, there is not yet proprietary data, workflow depth or owned attention to hold your ground.',
  },
  contested: {
    name: 'Contested',
    reading: 'Defended, but under fire',
    summary:
      'You have genuine moat ingredients, yet a meaningful share of what you invoice today is work AI already does acceptably. Strength and exposure are different axes — you hold defensible ground and you are being attacked on it. The play this reading suggests: move revenue toward the defended work before the exposed share is repriced.',
  },
  exposed: {
    name: 'Exposed',
    reading: 'High exposure, thin defences',
    summary:
      'A large share of current revenue looks reachable by general AI tools, and the defensive assets that would make you hard to substitute are still thin. That is an uncomfortable reading, and a provisional one — but it is exactly the position where deliberate moat-building changes the trajectory fastest.',
  },
}

export function archetypeFor({ moat, exposure }) {
  const defended = moat >= ARCHETYPE_THRESHOLD
  const exposed = exposure >= ARCHETYPE_THRESHOLD
  if (defended && !exposed) return ARCHETYPES.compounding
  if (!defended && !exposed) return ARCHETYPES.sheltered
  if (defended && exposed) return ARCHETYPES.contested
  return ARCHETYPES.exposed
}

// ── Evidence fixture (PAR-171) ────────────────────────────────────────
// Deterministic answer set for the committed evidence captures: the
// strongest option on every question under the instrument's own value
// scale (strongest-moat / lowest-exposure end of each scale). It drives a
// genuine Compounding result — moat 100, exposure 0. The capture runner
// and manifest derive their fixture labels from fixtureExpected() below,
// so the committed evidence can never claim an archetype the scoring code
// does not actually produce (2026-08-26 exact-head review blocker).
export const FIXTURE = {
  id: 'compounding-strongest',
  answers: QUESTIONS.map((q) => {
    let best = 0
    let bestValue = -1
    q.options.forEach((o, i) => {
      if (o.value > bestValue) { bestValue = o.value; best = i }
    })
    return best
  }),
}

export function fixtureExpected(fixture = FIXTURE) {
  const result = scoreAnswers(fixture.answers)
  return { ...result, archetype: archetypeFor(result) }
}

export function fixtureLabel(fixture = FIXTURE) {
  const e = fixtureExpected(fixture)
  return `fixture ${fixture.id}: strongest option on every question (strongest-moat / lowest-exposure end of each scale) → moat ${e.moat}/100, AI exposure ${e.exposure}/100 → ${e.archetype.name} (${e.archetype.reading})`
}

// Locked preview rows — honest placeholder for the production assessment.
// Rendered non-interactive; nothing here collects or sends anything.
export const LOCKED_PREVIEW = [
  'Per-dimension breakdown across the five moat dimensions',
  'Benchmark against comparable Australian businesses',
  'Prioritised recommendations for your weakest dimension',
]

export const DISCLAIMER =
  'This is a prototype reading based on 12 self-reported answers. It is not a benchmark, a validated score, or professional advice — the production assessment is being built.'

// ── Detailed recommendations (PAR-171) ────────────────────────────────
// The production assessment's detailed diagnosis, split from the free
// headline result. Revealed in the browser only after the visitor hands
// over a valid email (see components/MapYourMoat.jsx); never shown before.
export const DETAILED_RECOMMENDATIONS = [
  'Dimension-by-dimension breakdown of your five defensibility scores',
  'Benchmark context against comparable Australian businesses',
  'Prioritised recommendations for your weakest dimension',
]

// Notification subject identifying the Map your Moat process. Francisco
// receives one concise assessment response per completed submission.
export const GATE_SUBJECT = 'Map your Moat — new assessment response'

// Privacy wording for the email gate. Explains the collected email, the
// optional marketing consent, and that the POC result is provisional.
export const GATE_PRIVACY =
  'Your email is collected so a Map your Moat response can be sent to the studio for follow-up. It is stored by our form service; we will only email you about marketing if you tick the box below. This prototype result is provisional and unvalidated — nothing you answer is shared, sold, or benchmarked here.'

// Honest failure state: point at the existing MOAT contact email.
export const MOAT_CONTACT_EMAIL = 'francisco@moatstudio.ai'
export const GATE_ERROR_NOTE =
  'Something went wrong sending your response — no notification went out. Email us directly at {email} with “Map your Moat” in the subject and we will follow up personally.'

// One entry per dimension for the notification's dimension summary.
// Scores are 0–100; exposure is the instrument's own 0–100 exposure
// score (higher = more exposed). Deliberately carries no answer text.
export function dimensionSummary(answers) {
  const byDimension = {}
  QUESTIONS.forEach((q, i) => {
    const idx = answers[i]
    if (idx == null) return
    if (!byDimension[q.dimension]) byDimension[q.dimension] = []
    byDimension[q.dimension].push(q.options[idx].value)
  })
  const out = {}
  for (const [key, meta] of Object.entries(DIMENSIONS)) {
    const values = byDimension[key] || []
    if (!values.length) continue
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const score =
      meta.axis === 'exposure'
        ? Math.round((1 - mean / 3) * 100)
        : Math.round((mean / 3) * 100)
    out[key] = { label: meta.label, score }
  }
  return out
}
