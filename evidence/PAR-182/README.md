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
| desktop-process-1440x900.png | 1440 x 900 | 101777 bytes | sha256:3b35305e0d9c511a… |
| desktop-process-section-1440w.png | 1440 x 974 | 501752 bytes | sha256:c7aa9ed9bcc82a33… |
| narrow-process-390x844.png | 390 x 844 | 50265 bytes | sha256:2add601a2a637db3… |
| narrow-process-section-390w.png | 390 x 1547 | 197723 bytes | sha256:6db06a25d8f0f3d9… |
| desktop-process-reduced-motion-1440x900.png | 1440 x 900 | 98700 bytes | sha256:55f9a5e3fc89995e… |

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

- Desktop chapter: cards=[{"name":"Map","num":"01","left":120,"right":437,"width":317,"top":635},{"name":"Build","num":"02","left":561,"right":879,"width":318,"top":635},{"name":"Loop","num":"03","left":1003,"right":1320,"width":317,"top":635}]
- Desktop arrows (gap placement): [{"left":477,"right":521},{"left":919,"right":963}]
- Stage ground: rgb(3, 7, 30) vs body rgb(248, 249, 250)
- Narrow chapter: cards=[{"name":"Map","num":"01","top":574,"inViewport":true},{"name":"Build","num":"02","top":1009,"inViewport":true},{"name":"Loop","num":"03","top":1418,"inViewport":true}]
- Desktop no page-level horizontal overflow: 1440 <= 1440
- Narrow no page-level horizontal overflow: 390 <= 390
- Reduced motion: {"reducedMedia":true,"cardCount":3,"allCardsVisible":true,"numbersVisible":true,"arrowsRendered":true,"noAnimatedConnectorParts":true}
- Promises/meta intact: true / true

Total: 34 passed, 0 failed.
