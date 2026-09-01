# PAR-186 — homepage rebuilt to the editorial-orb concept

Regenerate with:

```sh
npm run build && node scripts/capture-par-186-evidence.mjs
```

The capture is hermetic: `dist/` is served from a local static server and
every request that is not same-origin or a declared Google Fonts host is
aborted and recorded in `_report.json` under `egressViolations`. **No live
contact-form submission is made.**

## What changed

The homepage moved from the v2 surface (navy hero, cool grey `#F8F9FA`
paper, Figtree headings, a system-only condensed stack) to the approved
editorial-orb concept: warm cream paper, Anton display caps, the solar orb
cresting behind the headline, dry-brush ink marks, pill navigation, the
MAP → BUILD → LOOP rail, skewed cream cards on a full-bleed navy slab, a
duotone founder medallion and a cream colophon. Section copy was shortened
to the concept's wording. The `Map your moat` hero CTA was removed, as the
concept has it; the assessment still opens from `/#map-your-moat`.

## Files

| File | What it shows |
|---|---|
| `desktop-home-1440x900.png` | Above the fold at 1440×900 |
| `desktop-home-full-1440w.png` | The whole page at 1440px |
| `narrow-home-390x844.png` | Above the fold at 390×844 |
| `narrow-home-full-390w.png` | The whole page at 390px |
| `desktop-reduced-motion-1440x900.png` | `prefers-reduced-motion: reduce` |
| `desktop-assessment-deeplink-1440x900.png` | `/#map-your-moat` still opens the assessment |
| `_report.json` | Structure, contact contract, focus, overflow and egress |

## What the report asserts

- **No horizontal overflow** at either width (`scrollWidth === innerWidth`).
- **Five labelled chapters**: each `<section>`'s `aria-labelledby` resolves
  to its own `<h2>`, and each heading announces with real word spacing
  (the display lines are block spans, so an explicit space text node sits
  between them).
- **Anton actually resolved** — `h1Family` starts with `Anton`, not the
  `Arial Narrow` fallback.
- **No decorative mark in the accessibility tree**: `undecoratedMarks` is 0
  across every brush stroke, orb, seal, arrow, diagram, title dot and rule.
- **Three process steps and three proof items** — the ink arrows live
  inside the card they leave, so the lists still announce three items.
- **Contact contract intact**: `name` / `email` / `message` all required
  and each still has a real `<label>` in the accessibility tree. The
  concept puts the field name inside the control, so those labels are
  visually hidden rather than removed. The honeypot stays off-screen.
- **Focus is visible on both grounds**: an ink ring on the paper nav pill,
  a solar ring on the navy form field.
- **External links are secure**: every `target="_blank"` carries
  `noopener noreferrer`.
- **The assessment deep link works and returns focus**: closing it leaves
  `document.activeElement` on `#hero-title` rather than `<body>`, which the
  removed hero CTA used to own.
