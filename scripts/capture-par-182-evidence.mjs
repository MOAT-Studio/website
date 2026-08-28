#!/usr/bin/env node
/**
 * PAR-182 evidence capture — v2 process chapter "Map → Build → Loop":
 * desktop 1440px, narrow 390px, and a reduced-motion desktop pass.
 *
 * Hermetic by construction (same security model as the
 * capture-par-180/181-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server.
 * 2. Every request is intercepted; same-origin and the declared font
 *    hosts pass, anything else is aborted and recorded as egress.
 * 3. No real or private data — the page is the public marketing site.
 * 4. Evidence directory cleanup and server shutdown happen in-process
 *    via node:fs / the child handle — no shell rm/pkill (unattended-safe).
 *
 * Usage: npm run build && node scripts/capture-par-182-evidence.mjs
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, extname, normalize } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let puppeteer
try {
  ({ default: puppeteer } = await import('puppeteer'))
} catch {
  puppeteer = require('/Users/paradisebunker/.npm/_npx/594f6727bbd1d0bb/node_modules/puppeteer')
}

const PROJECT_ROOT = join(import.meta.dirname, '..')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-182')

const DESKTOP = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

// ---------------------------------------------------------------------------
// Static server for the production build
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
    // normalize() folds ".." segments; the startsWith(root) guard below is
    // the authoritative traversal block, so no extra regex is needed here.
    const relative = normalize(urlPath)
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

const ALLOWED_REMOTE_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])

async function installLocalOnlyNetwork(page, origin) {
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'data:') return request.continue()
      if (parsed.origin !== origin) {
        if (ALLOWED_REMOTE_HOSTS.has(parsed.hostname)) return request.continue()
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

async function openPage(browser, origin, viewport, { reducedMotion = false } = {}) {
  const page = await browser.newPage()
  if (reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
  await installLocalOnlyNetwork(page, origin)
  await page.goto(origin, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#programs', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 500)) // let fonts/decode settle
  return page
}

/** Page-level horizontal overflow check. */
async function measureOverflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
}

/**
 * Process chapter structure: labelled section, heading, the three
 * numbered cards in DOM order, the stage ground colour, and card
 * readability (night text on the navy stage).
 */
async function measureChapter(page) {
  return page.evaluate(() => {
    const section = document.getElementById('programs')
    const labelled = section?.getAttribute('aria-labelledby')
    const labelledEl = labelled ? document.getElementById(labelled) : null
    const h2 = section?.querySelector('h2')
    const stage = section?.querySelector('.process-stage')
    const cards = [...(section?.querySelectorAll('.process-card') || [])]
    const cardData = cards.map((el) => {
      const r = el.getBoundingClientRect()
      return {
        name: el.querySelector('.process-name')?.textContent.trim() ?? null,
        num: el.querySelector('.process-num')?.textContent.trim() ?? null,
        role: el.getAttribute('role'),
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        visible: r.width > 0 && r.height > 0,
        nameColor: getComputedStyle(el.querySelector('.process-name')).color,
        bodyColor: getComputedStyle(el.querySelector('.process-body')).color,
        inViewport: r.left >= -1 && r.right <= window.innerWidth + 1,
      }
    })
    const stageStyle = stage ? getComputedStyle(stage) : null
    const bodyBg = getComputedStyle(document.body).backgroundColor
    const arrows = [...(section?.querySelectorAll('.process-arrow') || [])]
    const arrowRects = arrows.map((el) => {
      const r = el.getBoundingClientRect()
      return {
        visible: r.width > 0 && r.height > 0,
        ariaHidden: el.getAttribute('aria-hidden') === 'true',
        role: el.getAttribute('role') ?? null,
        transform: getComputedStyle(el).transform,
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
      }
    })
    // ARIA list children must be listitem, presentation or none; count the
    // ones that are still raw elements (would break the list semantics).
    const stageEl = section?.querySelector('.process-stage') ?? null
    const listChildren = stageEl
      ? [...stageEl.children].map((el) => el.getAttribute('role'))
      : []
    const leakedChildren = listChildren.filter((r) => r === null).length
    return {
      tag: section?.tagName,
      labelled,
      labelledResolves: !!labelledEl && labelledEl.tagName === 'H2',
      h2Text: h2 ? h2.textContent.trim() : null,
      stageRole: stage?.getAttribute('role') ?? null,
      stageAriaLabel: stage?.getAttribute('aria-label') ?? null,
      stageBg: stageStyle ? stageStyle.backgroundColor : null,
      bodyBg,
      cardCount: cards.length,
      cards: cardData,
      arrows: arrowRects,
      listChildRoles: listChildren,
      leakedChildren,
      promisesIntact:
        section?.textContent.includes('You leave with a ranked map you own either way.') &&
        section?.textContent.includes('done when it runs in production, not when the deck is delivered.') &&
        section?.textContent.includes('it’s yours'),
      metaIntact:
        section?.textContent.includes('1–3 weeks · fixed scope · yours either way') &&
        section?.textContent.includes('by scope · a working system, not a pilot') &&
        section?.textContent.includes('ongoing · improvement you can see'),
    }
  })
}

/**
 * Reduced-motion pass: with the motion removed, the sequence must still be
 * fully understandable — cards, numbers and order all visible; the arrow
 * connectors still render (the arrows carry no animation of their own, but
 * we assert they are present and visible).
 */
async function measureReducedMotion(page) {
  return page.evaluate(() => {
    const section = document.getElementById('programs')
    const cards = [...(section?.querySelectorAll('.process-card') || [])]
    const animated = [...document.querySelectorAll('.process-arrow line, .process-arrow path')].some((el) => {
      const a = getComputedStyle(el).animationName
      return a && a !== 'none'
    })
    const arrowSvgs = [...(section?.querySelectorAll('.process-arrow') || [])]
    return {
      reducedMedia: matchMedia('(prefers-reduced-motion: reduce)').matches,
      cardCount: cards.length,
      allCardsVisible: cards.every((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      }),
      numbersVisible: cards.every((el) => {
        const n = el.querySelector('.process-num')
        const r = n?.getBoundingClientRect()
        return !!r && r.width > 0 && r.height > 0
      }),
      arrowsRendered: arrowSvgs.every((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      }),
      noAnimatedConnectorParts: !animated,
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

/** Full-page section capture: clip to the #programs bounding box. */
async function captureSection(page, name) {
  const clip = await page.evaluate(() => {
    const r = document.getElementById('programs').getBoundingClientRect()
    return { x: 0, y: Math.max(0, r.top), width: window.innerWidth, height: r.height }
  })
  const path = join(EVIDENCE_DIR, `${name}.png`)
  await page.screenshot({ path, clip })
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
    // ---- Scene 1: desktop process chapter (1440px) ----
    console.log('Scene 1 — desktop process chapter (1440x900)')
    const desktop = await openPage(browser, origin, DESKTOP)
    try {
      await desktop.evaluate(() => document.getElementById('programs').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.desktopOverflow = await measureOverflow(desktop)
      results.desktopChapter = await measureChapter(desktop)
      await capture(desktop, 'desktop-process-1440x900')
      await captureSection(desktop, 'desktop-process-section-1440w')
    } finally {
      await desktop.close()
    }

    // ---- Scene 2: narrow process chapter (390px) ----
    console.log('Scene 2 — narrow process chapter (390x844)')
    const narrow = await openPage(browser, origin, NARROW)
    try {
      await narrow.evaluate(() => document.getElementById('programs').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.narrowOverflow = await measureOverflow(narrow)
      results.narrowChapter = await measureChapter(narrow)
      await capture(narrow, 'narrow-process-390x844')
      await captureSection(narrow, 'narrow-process-section-390w')
    } finally {
      await narrow.close()
    }

    // ---- Scene 3: reduced-motion desktop pass ----
    console.log('Scene 3 — reduced-motion desktop (1440x900)')
    const reduced = await openPage(browser, origin, DESKTOP, { reducedMotion: true })
    try {
      await reduced.evaluate(() => document.getElementById('programs').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.reduced = await measureReducedMotion(reduced)
      await capture(reduced, 'desktop-process-reduced-motion-1440x900')
    } finally {
      await reduced.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  // ---------------------------------------------------------------------------
  // Assertions (PAR-182 acceptance criteria)
  // ---------------------------------------------------------------------------

  console.log('\n=== PAR-182 Evidence Assertions ===')
  let passed = 0
  let failed = 0
  const assert = (name, condition) => {
    if (condition) { passed++; console.log(`  PASS: ${name}`) } else { failed++; console.log(`  FAIL: ${name}`) }
  }

  const orderByLeft = (cards) => cards.every((c, i) => i === 0 || c.left >= cards[i - 1].left)
  const orderByTop = (cards) => cards.every((c, i) => i === 0 || c.top >= cards[i - 1].top)
  const namesInOrder = (cards) => cards.map((c) => c.name).join(',') === 'Map,Build,Loop'
  const numsInOrder = (cards) => cards.map((c) => c.num).join(',') === '01,02,03'

  // AC1: #programs contains a semantic heading and three numbered
  // Map/Build/Loop items in the current logical order.
  assert('desktop: #programs is a <section>', results.desktopChapter.tag === 'SECTION')
  assert('desktop: section labelled by its H2', results.desktopChapter.labelledResolves === true)
  assert('desktop: H2 reads "Map → Build → Loop."', results.desktopChapter.h2Text === 'Map → Build → Loop.')
  assert('desktop: stage is role=list with an accessible name',
    results.desktopChapter.stageRole === 'list' && typeof results.desktopChapter.stageAriaLabel === 'string' && results.desktopChapter.stageAriaLabel.length > 0)
  assert('desktop: exactly three cards, role=listitem',
    results.desktopChapter.cardCount === 3 && results.desktopChapter.cards.every((c) => c.role === 'listitem'))
  assert('desktop: cards named Map, Build, Loop in order', namesInOrder(results.desktopChapter.cards))
  assert('desktop: numbers 01, 02, 03 in order', numsInOrder(results.desktopChapter.cards))
  assert('desktop: original promises intact', results.desktopChapter.promisesIntact === true)
  assert('desktop: original meta lines intact', results.desktopChapter.metaIntact === true)
  assert('narrow: section labelled by its H2', results.narrowChapter.labelledResolves === true)
  assert('narrow: cards named Map, Build, Loop in order', namesInOrder(results.narrowChapter.cards))
  assert('narrow: numbers 01, 02, 03 in order', numsInOrder(results.narrowChapter.cards))

  // AC2: at desktop width the process stage is visibly distinct from the
  // adjacent paper sections and all three cards remain readable.
  assert('desktop: stage ground is navy (distinct from paper body)',
    results.desktopChapter.stageBg === 'rgb(3, 7, 30)' && results.desktopChapter.bodyBg === 'rgb(248, 249, 250)')
  assert('desktop: all three cards visible', results.desktopChapter.cards.every((c) => c.visible))
  assert('desktop: cards read left-to-right in Map/Build/Loop order', orderByLeft(results.desktopChapter.cards))
  // AC2 hardening (Alex review): non-decreasing-left is not enough — each
  // desktop card must have a meaningful width and strictly non-overlapping
  // ordered bounds, and each arrow must sit inside the gap between the
  // cards it connects (card / arrow / card / arrow / card).
  const widths = (cards) => cards.map((c) => c.right - c.left)
  assert('desktop: every card has a meaningful width (>= 280px at 1440px)',
    widths(results.desktopChapter.cards).every((w) => w >= 280))
  assert('desktop: card widths are comparable (max/min ratio <= 1.5)',
    (() => { const w = widths(results.desktopChapter.cards); return Math.max(...w) / Math.min(...w) <= 1.5 })())
  assert('desktop: card bounds are ordered and non-overlapping (right[i] < left[i+1])',
    results.desktopChapter.cards.every((c, i) => i === 0 || c.left > results.desktopChapter.cards[i - 1].right))
  assert('desktop: each arrow sits strictly inside the gap between its two cards',
    results.desktopChapter.arrows.every((a, i) => {
      const from = results.desktopChapter.cards[i]
      const to = results.desktopChapter.cards[i + 1]
      return a.left > from.right && a.right < to.left && a.left >= from.right - 1 && a.top <= a.bottom
    }))
  assert('desktop: night text on the stage (readable cream copy)',
    results.desktopChapter.cards.every((c) => c.nameColor === 'rgb(255, 248, 225)' && c.bodyColor === 'rgba(255, 248, 225, 0.72)'))
  assert('desktop: two arrow connectors between cards, decorative',
    results.desktopChapter.arrows.length === 2 && results.desktopChapter.arrows.every((a) => a.visible && a.ariaHidden))
  assert('desktop: list semantics intact — no non-listitem children leak into the stage',
    results.desktopChapter.leakedChildren === 0 &&
    results.desktopChapter.listChildRoles.length === 5 &&
    results.desktopChapter.listChildRoles.every((r) => r === 'listitem' || r === 'presentation'))
  assert('desktop: no page-level horizontal overflow', results.desktopOverflow.scrollWidth <= results.desktopOverflow.innerWidth + 1)

  // AC3: at 390px cards stack/reflow without clipped content or
  // page-level overflow; colour is not the sole carrier of order.
  assert('narrow: all three cards visible', results.narrowChapter.cards.every((c) => c.visible))
  assert('narrow: cards stack top-to-bottom in Map/Build/Loop order', orderByTop(results.narrowChapter.cards))
  assert('narrow: no card clipped horizontally at 390px', results.narrowChapter.cards.every((c) => c.inViewport))
  assert('narrow: no page-level horizontal overflow', results.narrowOverflow.scrollWidth <= results.narrowOverflow.innerWidth + 1)
  assert('narrow: arrows present and rotated to vertical connectors',
    results.narrowChapter.arrows.length === 2 && results.narrowChapter.arrows.every((a) => a.visible && a.transform !== 'none'))
  assert('narrow: number + name + position carry order (not colour alone)',
    namesInOrder(results.narrowChapter.cards) && numsInOrder(results.narrowChapter.cards) && orderByTop(results.narrowChapter.cards))

  // AC4: prefers-reduced-motion leaves the sequence fully understandable.
  assert('reduced: media query active', results.reduced.reducedMedia === true)
  assert('reduced: all three cards visible', results.reduced.allCardsVisible === true && results.reduced.cardCount === 3)
  assert('reduced: all three numbers visible', results.reduced.numbersVisible === true)
  assert('reduced: arrow connectors still render', results.reduced.arrowsRendered === true)
  assert('reduced: no animation on connector parts', results.reduced.noAnimatedConnectorParts === true)

  console.log(`\nAssertions: ${passed} passed, ${failed} failed`)
  if (egressViolations.length) console.log(`VIOLATIONS: ${[...new Set(egressViolations)].join('; ')}`)

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
  const readme = `# PAR-182 Evidence — v2 process chapter "Map → Build → Loop"

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.
Theme: the v2 single theme (warm paper with the navy inverse process stage);
no light/dark theme pair exists in this design system.

## How these were produced

\`\`\`
npm run build && node scripts/capture-par-182-evidence.mjs
\`\`\`

- The page under test is the production build (dist/), served by a plain Node
  static server inside the capture script. No dev server is started.
- The only off-origin resources are the page's own Figtree/Fira Mono web fonts,
  declared in index.html. Every other off-origin request is aborted and
  recorded as a violation; the run fails if any occur.
- Each screenshot is gated on the DOM assertions below; the script exits
  non-zero if any fail.
- The reduced-motion capture emulates \`prefers-reduced-motion: reduce\`.

## Captures (all verified on disk)

| File | Dimensions | Size | Hash |
| --- | --- | --- | --- |
${rows.join('\n')}

## Scenes

- desktop-process-1440x900 — full viewport at 1440px scrolled to the
  process chapter: eyebrow, "Map → Build → Loop." heading, navy inverse
  stage with the three numbered cards and two arrow connectors.
- desktop-process-section-1440w — the #programs section clipped to its
  bounding box at 1440px (stage composition detail).
- narrow-process-390x844 — full viewport at 390px scrolled to the
  chapter: cards stacked in one column, arrows rotated to vertical
  connectors, no horizontal overflow.
- narrow-process-section-390w — the #programs section clipped at 390px.
- desktop-process-reduced-motion-1440x900 — desktop with
  prefers-reduced-motion: reduce; the sequence (cards, numbers, arrows)
  is fully visible and understandable with all animation removed.

## Assertion results (this run)

- Desktop chapter: cards=${JSON.stringify(results.desktopChapter.cards.map((c) => ({ name: c.name, num: c.num, left: c.left, right: c.right, width: c.right - c.left, top: c.top })))}
- Desktop arrows (gap placement): ${JSON.stringify(results.desktopChapter.arrows.map((a) => ({ left: a.left, right: a.right })))}
- Stage ground: ${results.desktopChapter.stageBg} vs body ${results.desktopChapter.bodyBg}
- Narrow chapter: cards=${JSON.stringify(results.narrowChapter.cards.map((c) => ({ name: c.name, num: c.num, top: c.top, inViewport: c.inViewport })))}
- Desktop no page-level horizontal overflow: ${results.desktopOverflow.scrollWidth} <= ${results.desktopOverflow.innerWidth}
- Narrow no page-level horizontal overflow: ${results.narrowOverflow.scrollWidth} <= ${results.narrowOverflow.innerWidth}
- Reduced motion: ${JSON.stringify(results.reduced)}
- Promises/meta intact: ${results.desktopChapter.promisesIntact} / ${results.desktopChapter.metaIntact}

Total: ${passed} passed, ${failed} failed.
`
  writeFileSync(join(EVIDENCE_DIR, 'README.md'), readme)
  console.log(`\nWrote ${join(EVIDENCE_DIR, 'README.md')}`)
}

main().catch((err) => {
  console.error(`\nCAPTURE FAILED: ${err.message}`)
  process.exit(1)
})