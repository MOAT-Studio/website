# MOAT Studio website

React (Vite) site for [moatstudio](https://github.com/MOAT-Studio/website). Plain JavaScript, no TypeScript.

## Develop

```sh
npm install
npm run dev        # dev server with HMR
```

## Build

```sh
npm run build      # static output in dist/
npm run preview    # serve the production build locally
```

## Structure

- `index.html` — Vite entry (fonts, meta)
- `src/App.jsx` — page composition
- `src/components/` — one component per section (`Hero`, `Approach`, `Divider`, `Programs`, `Founder`, `Contact`, `Footer`) plus shared pieces (`DotCanvas`, `Highlight`, `MoatLogo`)
- `src/index.css` — all styling, including the ≤900px mobile breakpoint
- `public/assets/` — images, served at `/assets/*`

The contact form is presentational — no backend is wired yet.
