# PAR-183 Evidence — v2 proof-principles chapter "Built around your business."

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.
Theme: the v2 single theme (warm paper; this chapter is deliberately light,
in contrast to the navy inverse process stage above it); no light/dark theme
pair exists in this design system.

## How these were produced

```
npm run build && node scripts/capture-par-183-evidence.mjs
```

- The page under test is the production build (dist/), served by a plain Node
  static server inside the capture script. No dev server is started.
- The only off-origin resources are the page's own Figtree/Fira Mono web fonts,
  declared in index.html. Every other off-origin request is aborted and
  recorded as a violation; the run fails if any occur.
- Each screenshot is gated on the DOM assertions below; the script exits
  non-zero if any fail.

## Captures (all verified on disk)

| File | Dimensions | Size | Hash |
| --- | --- | --- | --- |
| desktop-proof-1440x900.png | 1440 x 900 | 96516 bytes | sha256:4816fa0f37dce488… |
| desktop-proof-section-1440w.png | 1440 x 767 | 258603 bytes | sha256:f9d3d67f6606d33f… |
| narrow-proof-390x844.png | 390 x 844 | 54176 bytes | sha256:555efa4b9a618efe… |
| narrow-proof-section-390w.png | 390 x 1289 | 100259 bytes | sha256:c484d03c5ce87971… |

## Scenes

- desktop-proof-1440x900 — full viewport at 1440px scrolled to the
  proof chapter: eyebrow 03 "Proof", "Built around your business." heading,
  three numbered principles in a light editorial grid (orbit / overlap /
  focus diagrams).
- desktop-proof-section-1440w — the #proof-principles section clipped to its
  bounding box at 1440px (grid grouping detail).
- narrow-proof-390x844 — full viewport at 390px scrolled to the chapter:
  the three principles stacked in one column, no horizontal overflow.
- narrow-proof-section-390w — the #proof-principles section clipped at 390px.

## Assertion results (this run)

- Page section order: ["approach","divider","programs","proof-principles","founder","contact","footer"]
- Chapter between #programs and #founder: desktop true / narrow true
- Desktop principles: [{"name":"Your workflows","num":"01","left":64,"right":480,"width":416},{"name":"Your knowledge","num":"02","left":512,"right":928,"width":416},{"name":"Your judgement","num":"03","left":960,"right":1376,"width":416}]
- Narrow principles: [{"name":"Your workflows","num":"01","top":1453,"width":342,"inViewport":true},{"name":"Your knowledge","num":"02","top":1750,"width":342,"inViewport":true},{"name":"Your judgement","num":"03","top":2047,"width":342,"inViewport":true}]
- H2: "Built around your business."
- Desktop no page-level horizontal overflow: 1440 <= 1440
- Narrow no page-level horizontal overflow: 390 <= 390

Total: 31 passed, 0 failed.
