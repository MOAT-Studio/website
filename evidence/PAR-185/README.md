# PAR-185 Evidence — v2 "Become uncopyable." contact finale and footer

Fixtures only: the production build of the public marketing site (no user
input, no real or private finance data, no live form submission — every
request to a non-local origin is intercepted and aborted). Captured
headlessly with Chrome for Testing.

Theme: the v2 single theme (warm paper + deep-navy inverse). The contact
finale is the page's closing dark panel; the footer sits on the paper
ground. No light/dark theme pair exists in this design system.

## How these were produced

```
npm run build && node scripts/capture-par-185-evidence.mjs
```

## Captures

| file | dimensions | size | hash |
| --- | --- | --- | --- |
| desktop-contact-1440x900.png | 1440 x 900 | 89740 bytes | sha256:d66ac69466678feb… |
| desktop-contact-section-1440w.png | 1440 x 621 | 73581 bytes | sha256:9fc7cfedb8aeb30e… |
| narrow-contact-390x844.png | 390 x 844 | 47357 bytes | sha256:4f7e63da1f6b2df9… |
| narrow-contact-section-390w.png | 390 x 799 | 52078 bytes | sha256:ebfd7703e5166e66… |

## What each shows

- `desktop-contact-1440x900.png` — 1440×900 viewport, scrolled to the
  contact finale: the deep-navy inverse panel, the "Become uncopyable."
  editorial heading and the labelled high-contrast form.
- `desktop-contact-section-1440w.png` — the #contact section clipped to
  its bounding box at 1440px (two-column: copy left, form right).
- `narrow-contact-390x844.png` — 390×844 viewport, scrolled to the
  contact finale: single-column composition, visible focus state on the
  name field.
- `narrow-contact-section-390w.png` — the #contact section clipped to its
  bounding box at 390px (single-column, copy above form).
