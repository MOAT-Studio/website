# MOAT Studio website

Marketing site for MOAT Studio — AI systems that compound into an advantage your competitors cannot copy.

Built with React 19 and Vite. Plain JavaScript, no TypeScript, no CSS framework — a single stylesheet and a handful of components.

## Getting started

Requires Node.js 18+.

```sh
npm install
npm run dev        # dev server with HMR at http://localhost:5173
```

## Build

```sh
npm run build      # static output in dist/
npm run preview    # serve the production build locally
```

## Lint

```sh
npm run lint       # zero-dependency checks: JSX syntax, CSS structure, external fetches, v2 tokens
```

## MOAT v3 design system (PAR-186)

The editorial-orb visual system lives in `src/index.css` as `--moat-*`
custom properties: a warm paper surface (`#FCF6EA`), an ink/navy inverse
(`#03071E` / `#FDF7EB`), one solar body (`#FDD700`, plus a pale crown, a
soft midtone and a deep foot) and one red detail (`#D00000`), alongside
spacing, radii, a page gutter and a single motion easing/duration pair.

Type: body is Figtree, mono detail is Fira Mono, and display is **Anton**
— a caps-only poster face loaded from the same Google Fonts stylesheet
(v2 relied on whatever condensed font the reader happened to have
installed, which is why the headline used to look different on every
machine). Every display style sets `text-transform: uppercase`.

Contrast (WCAG 2.x): ink on paper 19.7:1, muted on paper 7.0:1, cream on
navy 18.5:1, solar on navy and navy on solar 13.4:1 (all AAA); red on
paper 5.2:1 (AA). Solar is never used for text on the paper surface —
fills, rules and marks only.

Motion (PAR-187): the page is already printed — motion is the pressroom.
Only three things move. The sun rises once, on load. The ink draws itself
the first time you see it. Paper lands with the weight of a stamp. Nothing
fades in: opacity may assist a physical gesture but never carries an
entrance alone, so no word and no control is ever invisible.

Scroll reveals are authored as `html.ink-armed [data-ink]:not(.is-inked)`
and only `src/useInkReveal.js` — one `IntersectionObserver` for the whole
page — adds `ink-armed`. The DOM default is therefore the finished state:
with JavaScript off, failed, or `prefers-reduced-motion: reduce`, the page
renders exactly as it does at rest, with no fallback path to get wrong.
Everything animates `transform` / `translate` / `scale` / `opacity` /
`stroke-dashoffset` only, so CLS stays at zero.

Every mark on the page is original SVG rendered from the tokens — no
image assets beyond the founder photograph, and no icon library.
Reusable primitives in `src/components/`: `SectionEyebrow` (`LABEL / 0N`
over a hairline), `HeroOrb` (the solar body, `rise` and `sphere`),
`BrushMark` (dry-brush ink, roughened by an SVG turbulence filter),
`InkArrow`, `NumberBadge` and `ProcessRail`.

## Evidence

`node scripts/capture-par-186-evidence.mjs` (after `npm run build`)
captures desktop and narrow screenshots plus a structure, contrast,
overflow and focus report into `evidence/PAR-186/`. It serves `dist/`
from a local static server and aborts every non-font external request,
so no live contact-form submission can leave the page.

## Deploy

The site is a fully static build, deployed on [Vercel](https://vercel.com). Vercel auto-detects the Vite framework preset — no configuration needed:

- **Build command:** `npm run build`
- **Output directory:** `dist`

Any static host (Netlify, Cloudflare Pages, GitHub Pages) works the same way.

## Project structure

- `index.html` — Vite entry (fonts, meta)
- `src/App.jsx` — page composition
- `src/components/` — one component per section (`Hero`, `Approach`, `Programs`, `ProofPrinciples`, `Founder`, `Contact`, `Footer`) plus the shared marks (`SectionEyebrow`, `HeroOrb`, `BrushMark`, `UncopyableBadge`, `InkArrow`, `NumberBadge`, `ProcessRail`, `MoatLogo`) and the `MapYourMoat` assessment
- `src/index.css` — all styling, including the ≤900px narrow breakpoint
- `public/assets/` — images, served at `/assets/*`

The contact form posts to FormSubmit. The `Map your moat` assessment has no
button in the page; it opens from the `/#map-your-moat` deep link on load.

## License

The source code is [MIT licensed](LICENSE). The MOAT Studio name, logo, brand assets, site copy, and images are not licensed for reuse — feel free to learn from the code, but please don't republish the site or its content as your own.
