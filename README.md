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

## MOAT v2 design tokens (PAR-179)

The editorial-orb visual foundation lives in `src/index.css` as
`--moat-*` custom properties: warm paper surface, ink/navy inverse, one
solar accent (`#FFE100`) and one red detail (`#D00000`), plus spacing,
radii, a condensed-display system font stack (no fonts downloaded) and a
single motion easing/duration pair.

Contrast (WCAG 2.x): ink on paper 18.0:1, cream on navy 18.8:1, solar on
navy 15.2:1 (all AAA); red and muted text on paper ~5:1 (AA). Solar is
never used for text on the paper surface — fills, rules and marks only.

Motion: state changes use 200–300ms on `--moat-ease`; the only
long-running animations are decorative (orb drift, divider hue). Under
`prefers-reduced-motion: reduce` every non-essential animation and
transition is removed, `DotCanvas` renders a single static frame, and no
content is trapped or obscured.

Reusable v2 primitives in `src/components/`: `SectionEyebrow` (mono
index + label + hairline rule), `OrbMark` (solar core, dashed orbit, red
satellite) and `GestureMark` (ink/solar/red map → build → loop strokes).
All render original CSS/SVG only — no external image or font fetches.

## Deploy

The site is a fully static build, deployed on [Vercel](https://vercel.com). Vercel auto-detects the Vite framework preset — no configuration needed:

- **Build command:** `npm run build`
- **Output directory:** `dist`

Any static host (Netlify, Cloudflare Pages, GitHub Pages) works the same way.

## Project structure

- `index.html` — Vite entry (fonts, meta)
- `src/App.jsx` — page composition
- `src/components/` — one component per section (`Hero`, `Approach`, `Divider`, `Programs`, `Founder`, `Contact`, `Footer`) plus shared pieces (`DotCanvas`, `Highlight`, `MoatLogo`)
- `src/index.css` — all styling, including the ≤900px mobile breakpoint
- `public/assets/` — images, served at `/assets/*`

The contact form is presentational — no backend is wired yet.

## License

The source code is [MIT licensed](LICENSE). The MOAT Studio name, logo, brand assets, site copy, and images are not licensed for reuse — feel free to learn from the code, but please don't republish the site or its content as your own.
