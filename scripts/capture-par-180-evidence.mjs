#!/usr/bin/env node
/**
 * PAR-180 evidence capture — v2 editorial hero: shell, orb composition and
 * navigation at 1440px (desktop) and 390px (narrow), plus keyboard focus.
 *
 * Hermetic by construction (same security model as the Finance-control
 * capture-par141-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server —
 *    no Vite dev server, no SPA fallback.
 * 2. Every request is intercepted with Puppeteer setRequestInterception.
 *    Same-origin and data: requests pass; anything else is aborted and
 *    recorded as an egress violation (fonts fall back to system-ui).
 * 3. No real or private data is involved — the page under test is the
 *    public marketing site with no user input.
 * 4. Evidence directory cleanup and server shutdown happen in-process via
 *    node:fs / the child handle — no shell rm/pkill (unattended-safe).
 *
 * Usage: npm run build && node scripts/capture-par-180-evidence.mjs
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, extname, normalize } from 'node:path'
import { createRequire } from 'node:module'

// Puppeteer is a devDependency; resolve it from the local node_modules.
const require = createRequire(import.meta.url)
let puppeteer
try {
  ({ default: puppeteer } = await import('puppeteer'))
} catch {
  // Fallback: the machine-level npx cache (same version, same Chrome).
  puppeteer = require('/Users/paradisebunker/.npm/_npx/594f6727bbd1d0bb/node_modules/puppeteer')
}

const PROJECT_ROOT = join(import.meta.dirname, '..')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-180')

const DESKTOP = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

// ---------------------------------------------------------------------------
// Static server for the production build (dist/ files only, no SPA fallback)
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}

function startStaticServer(root) {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0])
    const relative = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
    const target = join(root, relative === '/' ? 'index.html' : relative)

    if (!target.startsWith(root) || !existsSync(target) || !statSync(target).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('not found')
      return
    }

    res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream' })
    res.end(readFileSync(target))
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })
    })
  })
}

// ---------------------------------------------------------------------------
// Request interception — local origin only
// ---------------------------------------------------------------------------

const egressViolations = []

async function installLocalOnlyNetwork(page, origin) {
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'data:') return request.continue()
      if (parsed.origin !== origin) {
        egressViolations.push(`External request: ${url}`)
        return request.abort()
      }
      return request.continue()
    } catch {
      return request.continue()
    }
  })
}

// ---------------------------------------------------------------------------
// Page setup + in-page measurement helpers
// ---------------------------------------------------------------------------

async function openHero(browser, origin, viewport) {
  const page = await browser.newPage()
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
  await installLocalOnlyNetwork(page, origin)
  await page.goto(origin, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#hero .hero-title', { timeout: 15000 })
  // Let the gesture strokes finish drawing (300ms delay + 300ms duration).
  await new Promise((r) => setTimeout(r, 900))
  return page
}

/** Page-level horizontal overflow check. */
async function measureOverflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
}

/** Nav + CTA visibility and tap-target geometry. */
async function measureNav(page) {
  return page.evaluate(() => {
    const items = [...document.querySelectorAll('#nav a')].map((a) => {
      const r = a.getBoundingClientRect()
      return {
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
        visible: r.width > 0 && r.height > 0,
        width: Math.round(r.width),
        height: Math.round(r.height),
      }
    })
    const logo = document.querySelector('.hero-logo')
    const cta = document.getElementById('map-your-moat-cta')
    return {
      items,
      logo: logo ? (() => { const r = logo.getBoundingClientRect(); return { visible: r.width > 0 && r.height > 0, height: Math.round(r.height) } })() : null,
      cta: cta ? (() => { const r = cta.getBoundingClientRect(); return { visible: r.width > 0 && r.height > 0, width: Math.round(r.width), height: Math.round(r.height) } })() : null,
    }
  })
}

/** All navigation targets resolve to real elements. */
async function measureTargets(page) {
  return page.evaluate(() => {
    const targets = [...document.querySelectorAll('#nav a')].map((a) => a.getAttribute('href'))
    return {
      targets,
      resolved: [...new Set([...targets, '#top'])].map((h) => ({ hash: h, exists: !!document.querySelector(h) })),
    }
  })
}

/** Decorative artwork is hidden from assistive technology. */
async function measureA11y(page) {
  return page.evaluate(() => ({
    orbsHidden: document.querySelector('.hero-orbs')?.getAttribute('aria-hidden') === 'true',
    canvasHidden: document.querySelector('.dot-canvas')?.getAttribute('aria-hidden') === 'true',
    decorativeSvgs: [...document.querySelectorAll('.hero-orbs svg')].every(
      (s) => s.getAttribute('role') === 'presentation' || s.getAttribute('aria-hidden') === 'true',
    ),
    navLabelled: document.querySelector('#nav')?.getAttribute('aria-label') === 'Primary',
  }))
}

/** No text is obscured by the orb cores (circle-rect intersection). */
async function measureTextClearance(page) {
  return page.evaluate(() => {
    const cores = [...document.querySelectorAll('.hero-orb-main, .hero-orb-satellite')].map((el) => {
      const r = el.getBoundingClientRect()
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: (r.width * 34) / 120 }
    })
    const texts = []
    for (const el of document.querySelectorAll('.hero-title .line, .hero-prop')) {
      const range = document.createRange()
      range.selectNodeContents(el)
      for (const rect of range.getClientRects()) {
        if (rect.width === 0 || rect.height === 0) continue
        for (const core of cores) {
          const px = Math.max(rect.left, Math.min(core.cx, rect.right))
          const py = Math.max(rect.top, Math.min(core.cy, rect.bottom))
          if (Math.hypot(px - core.cx, py - core.cy) <= core.radius * 1.02) {
            texts.push({ obscured: true, el: el.className })
          }
        }
      }
    }
    return { obscured: texts.filter((t) => t.obscured), coreCount: cores.length }
  })
}

/** Keyboard focus: Tab n times, report the focused element's ring. */
async function measureFocus(page, tabs) {
  for (let i = 0; i < tabs; i++) await page.keyboard.press('Tab')
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el) return null
    const style = window.getComputedStyle(el)
    return {
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 40),
      matchesFocusVisible: el.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    }
  })
}

// ---------------------------------------------------------------------------
// Capture logic
// ---------------------------------------------------------------------------

const captures = []

function pngDimensions(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function capture(page, name) {
  const path = join(EVIDENCE_DIR, `${name}.png`)
  await page.screenshot({ path })
  const buffer = readFileSync(path)
  captures.push({ name, bytes: buffer.length, ...pngDimensions(buffer), hash: createHash('sha256').update(buffer).digest('hex') })
  console.log(`  captured ${name}.png (${buffer.length} bytes, ${captures.at(-1).width}x${captures.at(-1).height})`)
}

// ---------------------------------------------------------------------------
// Main capture flow
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    throw new Error('dist/index.html missing — run `npm run build` before capturing.')
  }

  // Clean and recreate the evidence directory in-process (unattended-safe).
  if (existsSync(EVIDENCE_DIR)) rmSync(EVIDENCE_DIR, { recursive: true, force: true })
  mkdirSync(EVIDENCE_DIR, { recursive: true })

  const { server, origin } = await startStaticServer(DIST_DIR)
  console.log(`Serving production build from ${origin}`)

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const results = {}
  try {
    // ---- Scene 1: desktop hero (1440px) ----
    console.log('Scene 1 — desktop hero (1440x900)')
    const desktop = await openHero(browser, origin, DESKTOP)
    try {
      results.desktopOverflow = await measureOverflow(desktop)
      results.desktopNav = await measureNav(desktop)
      results.targets = await measureTargets(desktop)
      results.a11y = await measureA11y(desktop)
      results.clearance = await measureTextClearance(desktop)
      await capture(desktop, 'desktop-hero-1440x900')
    } finally {
      await desktop.close()
    }

    // ---- Scene 2: narrow hero (390px) ----
    console.log('Scene 2 — narrow hero (390x844)')
    const narrow = await openHero(browser, origin, NARROW)
    try {
      results.narrowOverflow = await measureOverflow(narrow)
      results.narrowNav = await measureNav(narrow)
      await capture(narrow, 'narrow-hero-390x844')
    } finally {
      await narrow.close()
    }

    // ---- Scene 3: keyboard focus, desktop — "How we work" (Tab x3) ----
    console.log('Scene 3 — keyboard focus on nav link (desktop, Tab x3)')
    const focusDesktop = await openHero(browser, origin, DESKTOP)
    try {
      results.focusDesktop = await measureFocus(focusDesktop, 3)
      await capture(focusDesktop, 'desktop-nav-focus-1440x900')
    } finally {
      await focusDesktop.close()
    }

    // ---- Scene 4: keyboard focus, narrow — "Get in touch" (Tab x4) ----
    console.log('Scene 4 — keyboard focus on nav CTA (narrow, Tab x4)')
    const focusNarrow = await openHero(browser, origin, NARROW)
    try {
      results.focusNarrow = await measureFocus(focusNarrow, 4)
      await capture(focusNarrow, 'narrow-nav-focus-390x844')
    } finally {
      await focusNarrow.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  // ---------------------------------------------------------------------------
  // Assertions (PAR-180 acceptance criteria)
  // ---------------------------------------------------------------------------

  console.log('\n=== PAR-180 Evidence Assertions ===')
  let passed = 0
  let failed = 0
  const assert = (name, condition) => {
    if (condition) { passed++; console.log(`  PASS: ${name}`) } else { failed++; console.log(`  FAIL: ${name}`) }
  }

  assert('desktop: no page-level horizontal overflow', results.desktopOverflow.scrollWidth <= results.desktopOverflow.innerWidth + 1)
  assert('narrow: no page-level horizontal overflow', results.narrowOverflow.scrollWidth <= results.narrowOverflow.innerWidth + 1)

  assert('desktop: all nav links visible', results.desktopNav.items.length === 3 && results.desktopNav.items.every((i) => i.visible))
  assert('narrow: all nav links visible (none hidden)', results.narrowNav.items.length === 3 && results.narrowNav.items.every((i) => i.visible))
  assert('narrow: logo visible', results.narrowNav.logo?.visible === true)
  assert('narrow: primary CTA visible', results.narrowNav.cta?.visible === true)
  assert('narrow: nav links have usable tap height (>=18px)', results.narrowNav.items.every((i) => i.height >= 18))
  assert('narrow: CTA tap target (>=40px tall)', results.narrowNav.cta?.height >= 40)

  assert('all navigation targets resolve', results.targets.resolved.every((t) => t.exists))
  assert('orb composition present (2 orbs + gesture)', results.clearance.coreCount === 2)
  assert('no hero text obscured by orb cores', results.clearance.obscured.length === 0)

  assert('decorative orbs container aria-hidden', results.a11y.orbsHidden === true)
  assert('dot canvas aria-hidden', results.a11y.canvasHidden === true)
  assert('decorative SVGs presentation-only', results.a11y.decorativeSvgs === true)
  assert('nav labelled for assistive tech', results.a11y.navLabelled === true)

  assert('desktop focus: keyboard focus visible on nav link', results.focusDesktop?.matchesFocusVisible === true)
  assert('desktop focus: outline painted (2px solid)', results.focusDesktop?.outlineStyle === 'solid' && parseFloat(results.focusDesktop?.outlineWidth) >= 2)
  assert('narrow focus: keyboard focus visible on nav CTA', results.focusNarrow?.matchesFocusVisible === true)
  assert('narrow focus: outline painted (2px solid)', results.focusNarrow?.outlineStyle === 'solid' && parseFloat(results.focusNarrow?.outlineWidth) >= 2)

  console.log(`\nAssertions: ${passed} passed, ${failed} failed`)
  if (egressViolations.length) console.log(`VIOLATIONS: ${[...new Set(egressViolations)].join('; ')}`)

  // Byte-identity check — no two captures should be identical.
  const byHash = new Map()
  for (const c of captures) {
    if (byHash.has(c.hash)) throw new Error(`FAIL: ${c.name}.png is byte-identical to ${byHash.get(c.hash)}.png`)
    byHash.set(c.hash, c.name)
  }

  if (egressViolations.length > 0) throw new Error(`FAIL: ${egressViolations.length} request(s) left the local origin`)
  if (failed > 0) throw new Error(`FAIL: ${failed} assertion(s) failed`)

  // ---------------------------------------------------------------------------
  // README.md — documents only what actually exists, with real dimensions.
  // ---------------------------------------------------------------------------

  const rows = captures.map((c) => `| ${c.name}.png | ${c.width} x ${c.height} | ${c.bytes} bytes | sha256:${c.hash.slice(0, 16)}… |`)
  const readme = `# PAR-180 Evidence — v2 editorial hero: shell, orb composition and navigation

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.

## How these were produced

\`\`\`
npm run build && node scripts/capture-par-180-evidence.mjs
\`\`\`

- The page under test is the production build (dist/), served by a plain Node
  static server inside the capture script. No dev server is started.
- Every request to another origin (including web fonts) is aborted and
  recorded as a violation; the run fails if any occur. Text therefore renders
  in system-ui fallbacks, not Figtree — layout and overflow assertions are
  unaffected.
- Each screenshot is gated on the DOM assertions below; the script exits
  non-zero if any fail.

## Captures (all verified on disk)

| File | Dimensions | Size | Hash |
| --- | --- | --- | --- |
${rows.join('\n')}

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

- Desktop no page-level horizontal overflow: ${results.desktopOverflow.scrollWidth} <= ${results.desktopOverflow.innerWidth}
- Narrow no page-level horizontal overflow: ${results.narrowOverflow.scrollWidth} <= ${results.narrowOverflow.innerWidth}
- Desktop nav links visible: ${JSON.stringify(results.desktopNav.items.map((i) => i.text))}
- Narrow nav links visible: ${JSON.stringify(results.narrowNav.items.map((i) => `${i.text} (${i.width}x${i.height})`))}
- Narrow CTA tap target: ${results.narrowNav.cta?.width}x${results.narrowNav.cta?.height}
- Navigation targets resolved: ${JSON.stringify(results.targets.resolved)}
- Text obscured by orb cores: ${results.clearance.obscured.length === 0 ? 'none' : JSON.stringify(results.clearance.obscured)}
- Decorative artwork aria-hidden / presentation-only: ${JSON.stringify(results.a11y)}
- Desktop focus (Tab x3): ${JSON.stringify(results.focusDesktop)}
- Narrow focus (Tab x4): ${JSON.stringify(results.focusNarrow)}

Total: ${passed} passed, ${failed} failed.
`
  writeFileSync(join(EVIDENCE_DIR, 'README.md'), readme)
  console.log(`\nWrote ${join(EVIDENCE_DIR, 'README.md')}`)
}

main().catch((err) => {
  console.error(`\nCAPTURE FAILED: ${err.message}`)
  process.exit(1)
})
