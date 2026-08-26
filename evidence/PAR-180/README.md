# PAR-180 Evidence — v2 editorial hero: shell, orb composition and navigation

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.

## How these were produced

```
npm run build && node scripts/capture-par-180-evidence.mjs
```

- The page under test is the production build (dist/), served by a plain Node
  static server inside the capture script. No dev server is started.
- The only off-origin resources are the page's own Figtree/Fira Mono web fonts,
  declared in index.html and on the lint allowlist. Every other off-origin
  request (analytics, unknown third parties) is aborted and recorded as a
  violation; the run fails if any occur.
- Each screenshot is gated on the DOM assertions below; the script exits
  non-zero if any fail.

## Captures (all verified on disk)

| File | Dimensions | Size | Hash |
| --- | --- | --- | --- |
| desktop-hero-1440x900.png | 1440 x 900 | 531178 bytes | sha256:c69a8a74c49c3d80… |
| narrow-hero-390x844.png | 390 x 844 | 154252 bytes | sha256:dc1413e9810f1264… |
| desktop-nav-focus-1440x900.png | 1440 x 900 | 493285 bytes | sha256:91ea45249ac191b0… |
| narrow-nav-focus-390x844.png | 390 x 844 | 155247 bytes | sha256:3ca71190a34a657f… |

## Scenes

- desktop-hero-1440x900 — opening at 1440px: logo + wordmark, primary
  navigation (Approach / How we work / Get in touch), editorial heading with
  semantic line breaks, yellow-orb composition behind the text.
- narrow-hero-390x844 — opening at 390px: two-row header (logo row, full
  navigation row), heading and primary action; no horizontal overflow.
- desktop-nav-focus-1440x900 — keyboard focus (Tab x3) on the "How we work"
  nav link; solar :focus-visible ring on the night ground.
- narrow-nav-focus-390x844 — keyboard focus (Tab x4) on the "Get in touch"
  nav CTA at 390px.

## Assertion results (this run)

- Desktop no page-level horizontal overflow: 1440 <= 1440
- Narrow no page-level horizontal overflow: 390 <= 390
- Desktop nav links visible: ["Approach","How we work","Get in touch"]
- Narrow nav links visible: ["Approach (61x32)","How we work (85x32)","Get in touch (73x31)"]
- Narrow CTA tap target: 170x51
- Navigation targets resolved: [{"hash":"#approach","exists":true},{"hash":"#programs","exists":true},{"hash":"#contact","exists":true},{"hash":"#top","exists":true}]
- Text obscured by orb cores: none
- Decorative artwork aria-hidden / presentation-only: {"orbsHidden":true,"canvasHidden":true,"decorativeSvgs":true,"navLabelled":true}
- Desktop focus (Tab x3): {"tag":"A","text":"How we work","matchesFocusVisible":true,"outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgb(255, 225, 0)"}
- Narrow focus (Tab x4): {"tag":"A","text":"Get in touch","matchesFocusVisible":true,"outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgb(255, 225, 0)"}

Total: 19 passed, 0 failed.
