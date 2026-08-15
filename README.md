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
