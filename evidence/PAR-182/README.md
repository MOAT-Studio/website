# PAR-182 Evidence — v2 process chapter "Map → Build → Loop"

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.
Theme: the v2 single theme (warm paper with the navy inverse process stage);
no light/dark theme pair exists in this design system.

## How these were produced

```
npm run build && node scripts/capture-par-182-evidence.mjs
```

- The page under test is the production build (dist/), served by a plain Node
  static server inside the capture script. No dev server is started.
- The only off-origin resources are the page's own Figtree/Fira Mono web fonts,
  declared in index.html. Every other off-origin request is aborted and
  recorded as a violation; the run fails if any occur.
- Each screenshot is gated on the DOM assertions below; the script exits
  non-zero if any fail.
- The reduced-motion capture emulates `prefers-reduced-motion: reduce`.

## Captures (all verified on disk)

| File | Dimensions | Size | Hash |
| --- | --- | --- | --- |
| desktop-process-1440x900.png | 1440 x 900 | 75652 bytes | sha256:99d603a03b9d91b9… |
| desktop-process-section-1440w.png | 1440 x 2087 | 537704 bytes | sha256:dfb53a4f2ebde1ac… |
| narrow-process-390x844.png | 390 x 844 | 52466 bytes | sha256:e8f40abe5e8e8be9… |
| narrow-process-section-390w.png | 390 x 1547 | 196673 bytes | sha256:a363eacf24564259… |
| desktop-process-reduced-motion-1440x900.png | 1440 x 900 | 78414 bytes | sha256:695daa4c26e437d3… |

## Scenes

- desktop-process-1440x900 — full viewport at 1440px scrolled to the
  process chapter: eyebrow, "Map → Build → Loop." heading, navy inverse
  stage with the three numbered cards and two arrow connectors.
- desktop-process-section-1440w — the #programs section clipped to its
  bounding box at 1440px (stage composition detail).
- narrow-process-390x844 — full viewport at 390px scrolled to the
  chapter: cards stacked in one column, arrows rotated to vertical
  connectors, no horizontal overflow.
- narrow-process-section-390w — the #programs section clipped at 390px.
- desktop-process-reduced-motion-1440x900 — desktop with
  prefers-reduced-motion: reduce; the sequence (cards, numbers, arrows)
  is fully visible and understandable with all animation removed.

## Assertion results (this run)

- Desktop chapter: cards=[{"name":"Map","num":"01","left":120,"top":649},{"name":"Build","num":"02","left":200,"top":649},{"name":"Loop","num":"03","left":324,"top":649}]
- Stage ground: rgb(3, 7, 30) vs body rgb(248, 249, 250)
- Narrow chapter: cards=[{"name":"Map","num":"01","top":573,"inViewport":true},{"name":"Build","num":"02","top":1008,"inViewport":true},{"name":"Loop","num":"03","top":1417,"inViewport":true}]
- Desktop no page-level horizontal overflow: 1440 <= 1440
- Narrow no page-level horizontal overflow: 390 <= 390
- Reduced motion: {"reducedMedia":true,"cardCount":3,"allCardsVisible":true,"numbersVisible":true,"arrowsRendered":true,"noAnimatedConnectorParts":true}
- Promises/meta intact: true / true

Total: 30 passed, 0 failed.
