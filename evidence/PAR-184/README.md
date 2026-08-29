# PAR-184 Evidence — v2 founder chapter "The founder."

Fixtures only: the production build of the public marketing site (no user
input, no real or private finance data). Captured headlessly with Chrome for
Testing. Theme: the v2 single theme (warm paper; the founder chapter stays
light, in the dark / light / light / dark page rhythm after the navy process
stage); no light/dark theme pair exists in this design system.

## How these were produced

```
npm run build && node scripts/capture-par-184-evidence.mjs
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
| desktop-founder-1440x900.png | 1440 x 900 | 87962 bytes | sha256:1916f1d1461ae71a… |
| desktop-founder-section-1440w.png | 1440 x 786 | 107857 bytes | sha256:c81f53dbaf81fc65… |
| narrow-founder-390x844.png | 390 x 844 | 47991 bytes | sha256:3eb48be823a3f530… |
| narrow-founder-section-390w.png | 390 x 980 | 55838 bytes | sha256:de32c04c60dc9cc0… |

## Scenes

- desktop-founder-1440x900 — full viewport at 1440px scrolled to the founder
  chapter: eyebrow 04 "Founder", the authorised portrait framed by the yellow
  orb peeking from its top-right corner, the name H2, bio and three links,
  closed by the map → build → loop gesture.
- desktop-founder-section-1440w — the #founder section clipped to its bounding
  box at 1440px (composition detail).
- narrow-founder-390x844 — full viewport at 390px scrolled to the chapter:
  portrait full-width above the text, no horizontal overflow.
- narrow-founder-section-390w — the #founder section clipped at 390px.

## Assertion results (this run)

- Page section order: ["approach","divider","programs","proof-principles","founder","contact","footer"]
- Chapter between #proof-principles and #contact: desktop true / narrow true
- Desktop portrait: {"src":"/assets/founder.jpg","alt":"Francisco Varisco","left":64,"right":444,"top":1266,"bottom":1646,"width":380,"height":380,"visible":true,"inViewport":true,"naturalWidth":1080,"naturalHeight":1079,"objectFit":"cover","zIndex":"1"}
- Desktop orb (decorative, peeks top-right corner): {"ariaHidden":true,"role":"presentation","visible":true,"left":228,"right":428,"top":1282,"bottom":1482,"coreFill":"none"} orbPeeksCorner=true
- Narrow portrait: {"src":"/assets/founder.jpg","alt":"Francisco Varisco","left":24,"right":366,"top":2010,"bottom":2352,"width":342,"height":342,"visible":true,"inViewport":true,"naturalWidth":1080,"naturalHeight":1079,"objectFit":"cover","zIndex":"1"}
- Narrow orb: {"ariaHidden":true,"role":"presentation","visible":true,"left":204,"right":354,"top":2022,"bottom":2172,"coreFill":"none"} orbPeeksCorner=true
- H2: "I amfrancisco"
- Destinations: [{"text":"franciscovarisco.com","href":"https://franciscovarisco.com","target":"_blank","rel":"noopener noreferrer"},{"text":"linkedin","href":"https://linkedin.com/in/xicovarisco","target":"_blank","rel":"noopener noreferrer"},{"text":"email","href":"mailto:francisco@moatstudio.ai","target":null,"rel":null}]
- Focus order (DOM = tab): ["https://franciscovarisco.com","https://franciscovarisco.com","https://linkedin.com/in/xicovarisco","mailto:francisco@moatstudio.ai"]
- Visible keyboard focus (name link): desktop {"outlineWidth":"2px","outlineStyle":"solid","outlineColor":"rgb(5, 5, 5)","outlineOffset":"3px","matches":true} / narrow {"outlineWidth":"2px","outlineStyle":"solid","outlineColor":"rgb(5, 5, 5)","outlineOffset":"3px","matches":true}
- Desktop no page-level horizontal overflow: 1440 <= 1440
- Narrow no page-level horizontal overflow: 390 <= 390

Total: 45 passed, 0 failed.
