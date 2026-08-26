# PAR-181 Evidence — v2 editorial approach chapter "We start where you are"

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.

## How these were produced

```
npm run build && node scripts/capture-par-181-evidence.mjs
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
| desktop-approach-1440x900.png | 1440 x 900 | 113966 bytes | sha256:48ba4fa40176d953… |
| desktop-approach-section-1440w.png | 1440 x 1052 | 504282 bytes | sha256:04c207efe7186e93… |
| narrow-approach-390x844.png | 390 x 844 | 72826 bytes | sha256:48652ff53d6d9606… |
| narrow-approach-section-390w.png | 390 x 1079 | 166370 bytes | sha256:4c11c387c2d5da04… |
| desktop-approach-focus-1440x900.png | 1440 x 900 | 494417 bytes | sha256:74826db5b90fe78c… |

## Scenes

- desktop-approach-1440x900 — full viewport at 1440px scrolled to the
  approach chapter: eyebrow, ghosted chapter number, H2, two-paragraph
  copy in a 620px measure, decorative orb accent at the right margin.
- desktop-approach-section-1440w — the #approach section clipped to its
  bounding box at 1440px (chapter composition detail).
- narrow-approach-390x844 — full viewport at 390px scrolled to the
  chapter: single-column reading order, orb accent below the copy.
- narrow-approach-section-390w — the #approach section clipped at 390px.
- desktop-approach-focus-1440x900 — keyboard focus (Tab x2) on the
  "Approach" nav link; solar :focus-visible ring on the night ground.

## Assertion results (this run)

- Desktop chapter structure: [{"name":"eyebrow","top":231,"visible":true},{"name":"number","top":245,"visible":true},{"name":"h2","top":381,"visible":true},{"name":"p1","top":466,"visible":true},{"name":"p2","top":675,"visible":true},{"name":"orb","top":859,"visible":true}]
- Narrow chapter structure: [{"name":"eyebrow","top":138,"visible":true},{"name":"number","top":152,"visible":true},{"name":"h2","top":251,"visible":true},{"name":"p1","top":352,"visible":true},{"name":"p2","top":652,"visible":true},{"name":"orb","top":929,"visible":true}]
- Reading order matches visual order (narrow): true
- Focus order matches visual order (narrow): true
- Desktop no page-level horizontal overflow: 1440 <= 1440
- Narrow no page-level horizontal overflow: 390 <= 390
- Text obscured by orb accent (desktop): none
- Text obscured by orb accent (narrow): none
- Decorative elements out of a11y tree: {"decorativeSvgs":true,"svgCount":1,"numberAriaHidden":true,"ruleAriaHidden":true}
- Focus (Tab x2) on "Approach" nav link: {"tag":"A","text":"Approach","matchesFocusVisible":true,"outlineStyle":"solid","outlineWidth":"2px"}

Total: 18 passed, 0 failed.
