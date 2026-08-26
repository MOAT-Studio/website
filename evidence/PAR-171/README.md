# PAR-171 evidence — Map your Moat email gate

Fixture-only captures of the assessment result screen in a real headless
browser (Chrome for Testing, headless) against the Vite dev server.
FormSubmit is mocked at the page level (fetch intercepted) so no real
submission or external call happens; the email is a fixture value
(`fixture.user@example.com`). No real or private data is shown.

Fixture used throughout: the strongest option on every question, under the
instrument's own value scale — the strongest-moat / lowest-exposure end of
each scale (this is option D for q1–q10, whose strongest option carries
value 3; for the exposure questions q11–q12 the first-listed option is the
lowest-exposure one, also value 3). Scored by the committed
`src/data/moatAssessment.js` (`scoreAnswers` + `archetypeFor`) that is:
**moat strength 100 / 100, AI exposure 0 / 100 → Compounding**
(defended, low exposure). The capture runner and `_manifest.json` derive
the fixture label from that scoring code in-process and assert, before
every screenshot, that the rendered archetype and both scores exactly
match the fixture's expected result — the committed evidence cannot claim
an archetype the scoring code does not actually produce.

| File | Dimensions | Theme | State captured |
|---|---|---|---|
| `result-gate-mobile.png` | 390x844 | night (single v1 theme) | Result screen with score (100/0) + Compounding archetype free, email gate shown, email filled, no submission yet |
| `result-revealed-mobile.png` | 390x844 | night | Gate submitted with mocked success (HTTP 200); detailed recommendations revealed in-browser, no reload |
| `result-gate-error-mobile.png` | 390x844 | night | Gate submitted with mocked failure (HTTP 500); honest failure note with the MOAT contact email shown; detailed section stays hidden |
| `result-gate-desktop.png` | 1440x900 | night | Result screen with score (100/0) + Compounding archetype free, email gate, empty email, no submission |
| `result-revealed-desktop.png` | 1440x900 | night | Gate submitted with mocked success; detailed recommendations revealed |

`_manifest.json` holds the machine-readable version of this table, including
the actual PNG pixel dimensions (verified from the PNG headers) and the
no-horizontal-overflow check (`documentElement.scrollWidth <= innerWidth`)
recorded for every viewport — all five captures passed it.

Captured with `node scripts/capture-par-171-evidence.mjs`.