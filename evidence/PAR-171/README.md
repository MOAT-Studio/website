# PAR-171 evidence — Map your Moat email gate

Fixture-only captures of the assessment result screen in a real headless
browser (Chrome for Testing 150, headless) against the Vite dev server.
FormSubmit is mocked at the page level (fetch intercepted) so no real
submission or external call happens; the email is a fixture value
(`fixture.user@example.com`). No real or private data is shown.

Fixture used throughout: all 12 questions answered with the first option
(option A). On the moat dimensions that scores 3/3 (max) → moat strength
100; on the exposure questions option A is the *low-exposure* end of each
scale (value 3) → AI exposure 0. The result screen therefore shows the
**Compounding** archetype (defended, low exposure).

| File | Dimensions | Theme | State captured |
|---|---|---|---|
| `result-gate-mobile.png` | 390x844 | night (single v1 theme) | Result screen with score + archetype free, email gate shown, email filled, no submission yet |
| `result-revealed-mobile.png` | 390x844 | night | Gate submitted with mocked success (HTTP 200); detailed recommendations revealed in-browser, no reload |
| `result-gate-error-mobile.png` | 390x844 | night | Gate submitted with mocked failure (HTTP 500); honest failure note with the MOAT contact email shown; detailed section stays hidden |
| `result-gate-desktop.png` | 1440x900 | night | Result screen with email gate, empty email, no submission |
| `result-revealed-desktop.png` | 1440x900 | night | Gate submitted with mocked success; detailed recommendations revealed |

`_manifest.json` holds the machine-readable version of this table, including
the actual PNG pixel dimensions (verified from the PNG headers) and the
no-horizontal-overflow check (`documentElement.scrollWidth <= innerWidth`)
recorded for every viewport — all five captures passed it.

Captured with `node scripts/capture-par-171-evidence.mjs`.