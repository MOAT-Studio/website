#!/usr/bin/env node
/**
 * PAR-183 evidence capture — v2 proof-principles chapter
 * "Built around your business." (Your workflows / Your knowledge /
 * Your judgement): desktop 1440px and narrow 390px, plus placement
 * and overflow checks.
 *
 * Hermetic by construction (same security model as the
 * capture-par-180/181/182-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server.
 * 2. Every request is intercepted; same-origin and the declared font
 *    hosts pass, anything else is aborted and recorded as egress.
 * 3. No real or private data — the page is the public marketing site.
 * 4. Evidence directory cleanup and server shutdown happen in-process
 *    via node:fs / the child handle — no shell rm/pkill (unattended-safe).
 *
 * Usage: npm run build && node scripts/capture-par-183-evidence.mjs
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
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-183')

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

async function openPage(browser, origin, viewport) {
  const page = await browser.newPage()
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
  await installLocalOnlyNetwork(page, origin)
  await page.goto(origin, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#proof-principles', { timeout: 15000 })
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
 * Chapter placement: the proof-principles section must sit between the
 * process chapter (#programs) and the founder chapter (#founder), with
 * a real H2 and exactly three ordered principles.
 */
async function measurePlacement(page) {
  return page.evaluate(() => {
    const pageEl = document.querySelector('.page')
    const order = [...pageEl.children].map((el) => el.id)
    const programsIdx = order.indexOf('programs')
    const proofIdx = order.indexOf('proof-principles')
    const founderIdx = order.indexOf('founder')
    return {
      order,
      programsIdx,
      proofIdx,
      founderIdx,
      betweenProcessAndFounder:
        programsIdx !== -1 && proofIdx !== -1 && founderIdx !== -1 &&
        proofIdx === programsIdx + 1 && founderIdx === proofIdx + 1,
    }
  })
}

/**
 * Proof chapter structure: labelled section, heading, intro, the three
 * ordered principles (number, name, body) and their diagrams
 * (decorative, hidden from assistive technology).
 */
async function measureChapter(page) {
  return page.evaluate(() => {
    const section = document.getElementById('proof-principles')
    const labelled = section?.getAttribute('aria-labelledby')
    const labelledEl = labelled ? document.getElementById(labelled) : null
    const h2 = section?.querySelector('h2')
    const intro = section?.querySelector('.proof-intro')
    const list = section?.querySelector('ol.proof-grid')
    const items = [...(section?.querySelectorAll('li.proof-item') || [])]
    const itemsData = items.map((el, i) => {
      const r = el.getBoundingClientRect()
      const diagram = el.querySelector('.proof-diagram')
      const diagramRect = diagram ? diagram.getBoundingClientRect() : null
      const body = el.querySelector('.proof-body')
      return {
        domIndex: i,
        num: el.querySelector('.proof-num')?.textContent.trim() ?? null,
        name: el.querySelector('.proof-name')?.textContent.trim() ?? null,
        bodyText: body?.textContent.trim() ?? '',
        bodyLen: body ? body.textContent.trim().length : 0,
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        width: Math.round(r.right - r.left),
        visible: r.width > 0 && r.height > 0,
        inViewport: r.left >= -1 && r.right <= window.innerWidth + 1,
        diagramCount: el.querySelectorAll('svg.proof-diagram').length,
        diagramVisible: diagramRect ? diagramRect.width > 0 && diagramRect.height > 0 : false,
        diagramAriaHidden: diagram?.getAttribute('aria-hidden') === 'true',
        diagramRole: diagram?.getAttribute('role') ?? null,
        nameColor: getComputedStyle(el.querySelector('.proof-name')).color,
        bodyColor: getComputedStyle(el.querySelector('.proof-body')).color,
      }
    })
    return {
      tag: section?.tagName,
      labelled,
      labelledResolves: !!labelledEl && labelledEl.tagName === 'H2',
      h2Text: h2 ? h2.textContent.trim() : null,
      introPresent: !!intro,
      listPresent: !!list,
      listAriaLabel: list?.getAttribute('aria-label') ?? null,
      itemCount: items.length,
      items: itemsData,
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

/** Full-page section capture: clip to the #proof-principles bounding box. */
async function captureSection(page, name) {
  const clip = await page.evaluate(() => {
    const r = document.getElementById('proof-principles').getBoundingClientRect()
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
    // ---- Scene 1: desktop proof chapter (1440px) ----
    console.log('Scene 1 — desktop proof-principles chapter (1440x900)')
    const desktop = await openPage(browser, origin, DESKTOP)
    try {
      await desktop.evaluate(() => document.getElementById('proof-principles').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.desktopOverflow = await measureOverflow(desktop)
      results.desktopPlacement = await measurePlacement(desktop)
      results.desktopChapter = await measureChapter(desktop)
      await capture(desktop, 'desktop-proof-1440x900')
      await captureSection(desktop, 'desktop-proof-section-1440w')
    } finally {
      await desktop.close()
    }

    // ---- Scene 2: narrow proof chapter (390px) ----
    console.log('Scene 2 — narrow proof-principles chapter (390x844)')
    const narrow = await openPage(browser, origin, NARROW)
    try {
      await narrow.evaluate(() => document.getElementById('proof-principles').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.narrowOverflow = await measureOverflow(narrow)
      results.narrowPlacement = await measurePlacement(narrow)
      results.narrowChapter = await measureChapter(narrow)
      await capture(narrow, 'narrow-proof-390x844')
      await captureSection(narrow, 'narrow-proof-section-390w')
    } finally {
      await narrow.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  // ---------------------------------------------------------------------------
  // Assertions (PAR-183 acceptance criteria)
  // ---------------------------------------------------------------------------

  console.log('\n=== PAR-183 Evidence Assertions ===')
  let passed = 0
  let failed = 0
  const assert = (name, condition) => {
    if (condition) { passed++; console.log(`  PASS: ${name}`) } else { failed++; console.log(`  FAIL: ${name}`) }
  }

  const orderByLeft = (items) => items.every((it, i) => i === 0 || it.left >= items[i - 1].left)
  const orderByTop = (items) => items.every((it, i) => i === 0 || it.top >= items[i - 1].top)
  const namesInOrder = (items) => items.map((it) => it.name).join(',') === 'Your workflows,Your knowledge,Your judgement'
  const numsInOrder = (items) => items.map((it) => it.num).join(',') === '01,02,03'
  const noOverlapLeft = (items) => items.every((it, i) => i === 0 || it.left > items[i - 1].right)

  // AC1: one semantically labelled proof/principles section between the
  // process and founder sections, with a real heading and three
  // ordered concepts.
  assert('desktop: #proof-principles is a <section>', results.desktopChapter.tag === 'SECTION')
  assert('desktop: section labelled by its H2', results.desktopChapter.labelledResolves === true)
  assert('desktop: real H2 heading present', typeof results.desktopChapter.h2Text === 'string' && results.desktopChapter.h2Text.length > 0)
  assert('desktop: chapter sits directly between #programs and #founder', results.desktopPlacement.betweenProcessAndFounder === true)
  assert('narrow: section labelled by its H2', results.narrowChapter.labelledResolves === true)
  assert('narrow: chapter sits directly between #programs and #founder', results.narrowPlacement.betweenProcessAndFounder === true)
  assert('desktop: principles form an ordered list (<ol> with aria-label)', results.desktopChapter.listPresent === true && typeof results.desktopChapter.listAriaLabel === 'string' && results.desktopChapter.listAriaLabel.length > 0)
  assert('desktop: exactly three ordered principles', results.desktopChapter.itemCount === 3)
  assert('desktop: principles named in order (workflows, knowledge, judgement)', namesInOrder(results.desktopChapter.items))
  assert('desktop: numbers 01, 02, 03 in order', numsInOrder(results.desktopChapter.items))
  assert('narrow: exactly three ordered principles', results.narrowChapter.itemCount === 3)
  assert('narrow: principles named in order (workflows, knowledge, judgement)', namesInOrder(results.narrowChapter.items))
  assert('narrow: numbers 01, 02, 03 in order', numsInOrder(results.narrowChapter.items))

  // AC2: each principle keeps meaningful explanatory text in the DOM;
  // diagrams are decorative and hidden from assistive technology.
  assert('desktop: every principle keeps meaningful body text (>120 chars)', results.desktopChapter.items.every((it) => it.bodyLen > 120))
  assert('narrow: every principle keeps meaningful body text (>120 chars)', results.narrowChapter.items.every((it) => it.bodyLen > 120))
  assert('desktop: each principle has exactly one SVG diagram', results.desktopChapter.items.every((it) => it.diagramCount === 1))
  assert('narrow: each principle has exactly one SVG diagram', results.narrowChapter.items.every((it) => it.diagramCount === 1))
  assert('desktop: all diagrams hidden from assistive technology (aria-hidden, role=presentation)',
    results.desktopChapter.items.every((it) => it.diagramAriaHidden && it.diagramRole === 'presentation'))
  assert('narrow: all diagrams hidden from assistive technology (aria-hidden, role=presentation)',
    results.narrowChapter.items.every((it) => it.diagramAriaHidden && it.diagramRole === 'presentation'))

  // AC3: at 1440px the grid has clear visual grouping (three equal
  // non-overlapping columns, comparable widths); at 390px the three
  // principles form a readable single-column sequence with no
  // horizontal overflow.
  const widths = (items) => items.map((it) => it.width)
  assert('desktop: all three principles visible', results.desktopChapter.items.every((it) => it.visible))
  assert('desktop: principles read left-to-right in order', orderByLeft(results.desktopChapter.items))
  assert('desktop: three distinct non-overlapping columns (right[i] < left[i+1])', noOverlapLeft(results.desktopChapter.items))
  assert('desktop: column widths comparable (max/min ratio <= 1.15)',
    (() => { const w = widths(results.desktopChapter.items); return w.length === 3 && Math.max(...w) / Math.min(...w) <= 1.15 })())
  assert('desktop: every column has a meaningful width (>= 280px at 1440px)',
    widths(results.desktopChapter.items).every((w) => w >= 280))
  assert('desktop: all diagrams visible', results.desktopChapter.items.every((it) => it.diagramVisible))
  assert('desktop: ink + muted text (readable on the paper)',
    results.desktopChapter.items.every((it) => it.nameColor === 'rgb(5, 5, 5)' && it.bodyColor === 'rgb(108, 117, 125)'))
  assert('desktop: no page-level horizontal overflow', results.desktopOverflow.scrollWidth <= results.desktopOverflow.innerWidth + 1)
  assert('narrow: all three principles visible', results.narrowChapter.items.every((it) => it.visible))
  assert('narrow: principles stack top-to-bottom in a single-column sequence',
    orderByTop(results.narrowChapter.items) && results.narrowChapter.items.every((it) => it.width >= 300))
  assert('narrow: no principle clipped horizontally at 390px', results.narrowChapter.items.every((it) => it.inViewport))
  assert('narrow: no page-level horizontal overflow', results.narrowOverflow.scrollWidth <= results.narrowOverflow.innerWidth + 1)

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
  const readme = `# PAR-183 Evidence — v2 proof-principles chapter "Built around your business."

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.
Theme: the v2 single theme (warm paper; this chapter is deliberately light,
in contrast to the navy inverse process stage above it); no light/dark theme
pair exists in this design system.

## How these were produced

\`\`\`
npm run build && node scripts/capture-par-183-evidence.mjs
\`\`\`

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
${rows.join('\n')}

## Scenes

- desktop-proof-1440x900 — full viewport at 1440px scrolled to the
  proof chapter: eyebrow 03 "Proof", "Built around your business." heading,
  three numbered principles in a light editorial grid (orbit / overlap /
  focus diagrams).
- desktop-proof-section-1440w — the #proof-principles section clipped to its
  bounding box at 1440px (grid grouping detail).
- narrow-proof-390x844 — full viewport at 390px scrolled to the chapter:
  the three principles stacked in one column, no horizontal overflow.
- narrow-proof-section-390w — the #proof-principles section clipped at 390px.

## Assertion results (this run)

- Page section order: ${JSON.stringify(results.desktopPlacement.order)}
- Chapter between #programs and #founder: desktop ${results.desktopPlacement.betweenProcessAndFounder} / narrow ${results.narrowPlacement.betweenProcessAndFounder}
- Desktop principles: ${JSON.stringify(results.desktopChapter.items.map((it) => ({ name: it.name, num: it.num, left: it.left, right: it.right, width: it.width })))}
- Narrow principles: ${JSON.stringify(results.narrowChapter.items.map((it) => ({ name: it.name, num: it.num, top: it.top, width: it.width, inViewport: it.inViewport })))}
- H2: "${results.desktopChapter.h2Text}"
- Desktop no page-level horizontal overflow: ${results.desktopOverflow.scrollWidth} <= ${results.desktopOverflow.innerWidth}
- Narrow no page-level horizontal overflow: ${results.narrowOverflow.scrollWidth} <= ${results.narrowOverflow.innerWidth}

Total: ${passed} passed, ${failed} failed.
`
  writeFileSync(join(EVIDENCE_DIR, 'README.md'), readme)
  console.log(`\nWrote ${join(EVIDENCE_DIR, 'README.md')}`)
}

main().catch((err) => {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
})