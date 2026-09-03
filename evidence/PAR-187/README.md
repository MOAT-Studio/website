# PAR-187 — the motion system

Regenerate with:

```sh
npm run build && node scripts/capture-par-187-evidence.mjs
```

Hermetic: `dist/` is served from a local static server and every request that
is not same-origin or a declared Google Fonts host is aborted and recorded in
`_report.json` under `egressViolations`.

## What this has to prove

The interesting claims about this change are not "it looks nice" — they are
that **nothing here can hide content** and **nothing here moves the layout**.

| Claim | Where |
|---|---|
| The JS-disabled and reduced-motion renders are byte-identical | `finishedPrint.staticPathsIdentical` |
| …and both match the animated page at rest | see *the 670 pixels* below |
| Every `[data-ink]` section reveals, even after a coarse fast scroll | `restingState.stillUndrawn` is `[]` |
| No from-state survives at rest | `restingState.samples` — every value `none` / `1` / `0px` |
| A hairline already on screen at load never flashes | `noArmingFlash` |
| The motion adds no layout shift | `layoutShift.total` |
| No horizontal overflow at 390px | `narrowOverflow` |

## The 670 pixels

`animatedAtRest` does **not** hash-match the two static renders. The whole
difference is 670 pixels out of 5,948,640 (0.011%), in one 70px band, at a
maximum delta of 82/255 — the antialiasing where the dash seam of a
`pathLength="1"` stroke falls on the workflows loop diagram. Crops of the two
are visually indistinguishable. It is recorded here rather than papered over.

## Layout shift

`layoutShift.total` is 0 on a clean run. Some loads show ~0.029 attributed to
`#text` and `NAV.nav` at 30–370ms: that is the webfont swap, and it reproduces
identically on `main` with no motion present. This change contributes none —
everything animates `transform` / `translate` / `scale` / `opacity` /
`stroke-dashoffset`.

## A bug this caught

The observer originally revealed only on intersection. A coarse scroll — the
`traverse()` helper jumps 400px at a time, and an anchor link does far worse —
can carry a section from below the fold to above it without it ever reporting
as intersecting, leaving that section's ink permanently undrawn. The observer
now also reveals anything already above the viewport, with a `scrollend`
backstop. `restingState.stillUndrawn` is the regression test.

Note for anyone extending this: `html { scroll-behavior: smooth }` means a
plain `window.scrollTo(0, y)` loop starts an animation that the next step
interrupts, so the page never actually traverses and every reveal silently
fails to fire. `traverse()` uses `behavior: 'instant'` for that reason.

## Files

| File | What it shows |
|---|---|
| `desktop-hero-400ms.png` | The opening mid-sequence — orb still rising, brushes not yet in |
| `desktop-hero-at-rest.png` | The opening complete |
| `desktop-{slab,proof,contact}-early.png` | Each reveal caught in progress |
| `desktop-{slab,proof,contact}-at-rest.png` | Each reveal complete |
| `desktop-animated-at-rest-full-1440w.png` | Whole page, animated, at rest |
| `desktop-javascript-disabled-full-1440w.png` | Whole page with JS off |
| `desktop-reduced-motion-full-1440w.png` | Whole page under `prefers-reduced-motion: reduce` |
| `tall-1440x1200-40ms.png` | 40ms after load on a display where the Approach hairline is above the fold |
| `narrow-at-rest-full-390w.png` | 390px, at rest |
| `_report.json` | Every measurement above |
