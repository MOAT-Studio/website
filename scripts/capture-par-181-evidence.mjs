#!/usr/bin/env node
/**
 * PAR-181 evidence capture — v2 editorial approach chapter:
 * "We start where you are" at 1440px (desktop) and 390px (narrow).
 *
 * Hermetic by construction (same security model as the
 * capture-par-180-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server.
 * 2. Every request is intercepted; same-origin and the declared font
 *    hosts pass, anything else is aborted and recorded as egress.
 * 3. No real or private data — the page is the public marketing site.
 * 4. Evidence directory cleanup and server shutdown happen in-process
 *    via node:fs / the child handle — no shell rm/pkill (unattended-safe).
 *
 * Usage: npm run build && node scripts/capture-par-181-evidence.mjs
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
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-181')

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
  await page.waitForSelector('#approach', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 700)) // let orb drift settle
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
 * Chapter structure: labelled section, heading level, reading order
 * (top y of each chapter block) and focus order vs visual order.
 */
async function measureChapter(page) {
  return page.evaluate(() => {
    const section = document.getElementById('approach')
    const labelled = section?.getAttribute('aria-labelledby')
    const labelledEl = labelled ? document.getElementById(labelled) : null
    const h2 = section?.querySelector('h2')
    const blocks = ['eyebrow', 'number', 'h2', 'p1', 'p2', 'orb'].map((name) => {
      const el =
        name === 'eyebrow' ? section?.querySelector('.section-eyebrow') :
        name === 'number' ? section?.querySelector('.approach-number') :
        name === 'h2' ? h2 :
        name === 'p1' ? section?.querySelector('.approach-copy p') :
        name === 'p2' ? section?.querySelectorAll('.approach-copy p')[1] :
        section?.querySelector('.approach-orb')
      const r = el?.getBoundingClientRect()
      return { name, top: r ? Math.round(r.top) : null, visible: r ? r.width > 0 && r.height > 0 : false }
    })
    // Focus order: the only focusable element in the chapter is… none expected.
    const focusables = section
      ? [...section.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')].map((el) => {
          const r = el.getBoundingClientRect()
          return { tag: el.tagName, top: Math.round(r.top) }
        })
      : []
    // Reading order check: top y strictly non-decreasing for content blocks.
    const contentOrder = blocks.filter((b) => b.name !== 'orb').map((b) => b.top).filter((t) => t !== null)
    const readingOrderMatches = contentOrder.every((t, i) => i === 0 || t >= contentOrder[i - 1])
    // Focus order vs visual order: focusables sorted by DOM (focus) order
    // should have non-decreasing top y.
    const focusOrderMatches = focusables.every((f, i) => i === 0 || f.top >= focusables[i - 1].top)
    const orb = section?.querySelector('.approach-orb')
    const orbStyle = orb ? getComputedStyle(orb) : null
    return {
      tag: section?.tagName,
      labelled,
      labelledResolves: !!labelledEl && labelledEl.tagName === 'H2',
      h2Text: h2 ? h2.textContent.trim() : null,
      blocks,
      focusables,
      readingOrderMatches,
      focusOrderMatches,
      orbPosition: orbStyle ? orbStyle.position : null,
      orbAria: orb ? { role: orb.getAttribute('role'), ariaHidden: orb.getAttribute('aria-hidden') } : null,
      propIntact: section?.textContent.includes('We only build once we know where AI genuinely pays') &&
        section?.textContent.includes("It's AI as your competitive advantage"),
    }
  })
}

/** Decorative elements must not enter the accessibility tree. */
async function measureA11y(page) {
  return page.evaluate(() => {
    const svgs = [...document.querySelectorAll('#approach svg')]
    const decorSvgs = svgs.every((s) => s.getAttribute('role') === 'presentation' || s.getAttribute('aria-hidden') === 'true')
    const number = document.querySelector('#approach .approach-number')
    const rule = document.querySelector('#approach .section-eyebrow-rule')
    return {
      decorativeSvgs: decorSvgs,
      svgCount: svgs.length,
      numberAriaHidden: number ? number.getAttribute('aria-hidden') === 'true' : null,
      ruleAriaHidden: rule ? rule.getAttribute('aria-hidden') === 'true' : null,
    }
  })
}

/** Text clearance: no copy line intersects the orb accent (circle-rect). */
async function measureTextClearance(page) {
  return page.evaluate(() => {
    const orb = document.querySelector('#approach .approach-orb')
    if (!orb) return { obscured: [], coreCount: 0 }
    const r = orb.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const radius = (r.width * 34) / 120 // core circle radius in viewBox units
    const texts = []
    for (const el of document.querySelectorAll('#approach h2, #approach .approach-copy p, #approach .section-eyebrow')) {
      const range = document.createRange()
      range.selectNodeContents(el)
      for (const rect of range.getClientRects()) {
        if (rect.width === 0 || rect.height === 0) continue
        const px = Math.max(rect.left, Math.min(cx, rect.right))
        const py = Math.max(rect.top, Math.min(cy, rect.bottom))
        if (Math.hypot(px - cx, py - cy) <= radius * 1.05) {
          texts.push({ obscured: true, el: el.tagName + '.' + (el.className || '').toString().slice(0, 24) })
        }
      }
    }
    return { obscured: texts, coreCount: 1 }
  })
}

/** Keyboard focus: Tab to the "Approach" nav link, report its ring. */
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

/** Full-page section capture: clip to the #approach bounding box. */
async function captureSection(page, name) {
  const clip = await page.evaluate(() => {
    const r = document.getElementById('approach').getBoundingClientRect()
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
    // ---- Scene 1: desktop approach chapter (1440px) ----
    console.log('Scene 1 — desktop approach chapter (1440x900)')
    const desktop = await openPage(browser, origin, DESKTOP)
    try {
      await desktop.evaluate(() => document.getElementById('approach').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.desktopOverflow = await measureOverflow(desktop)
      results.desktopChapter = await measureChapter(desktop)
      results.a11y = await measureA11y(desktop)
      results.clearance = await measureTextClearance(desktop)
      await capture(desktop, 'desktop-approach-1440x900')
      await captureSection(desktop, 'desktop-approach-section-1440w')
    } finally {
      await desktop.close()
    }

    // ---- Scene 2: narrow approach chapter (390px) ----
    console.log('Scene 2 — narrow approach chapter (390x844)')
    const narrow = await openPage(browser, origin, NARROW)
    try {
      await narrow.evaluate(() => document.getElementById('approach').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.narrowOverflow = await measureOverflow(narrow)
      results.narrowChapter = await measureChapter(narrow)
      results.narrowClearance = await measureTextClearance(narrow)
      await capture(narrow, 'narrow-approach-390x844')
      await captureSection(narrow, 'narrow-approach-section-390w')
    } finally {
      await narrow.close()
    }

    // ---- Scene 3: keyboard focus on the "Approach" nav link ----
    // First focusable is the #top logo link, so the "Approach" nav link
    // is the second in tab order (Tab x2).
    console.log('Scene 3 — keyboard focus on "Approach" nav link (desktop, Tab x2)')
    const focusPage = await openPage(browser, origin, DESKTOP)
    try {
      results.focus = await measureFocus(focusPage, 2)
      await capture(focusPage, 'desktop-approach-focus-1440x900')
    } finally {
      await focusPage.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  // ---------------------------------------------------------------------------
  // Assertions (PAR-181 acceptance criteria)
  // ---------------------------------------------------------------------------

  console.log('\n=== PAR-181 Evidence Assertions ===')
  let passed = 0
  let failed = 0
  const assert = (name, condition) => {
    if (condition) { passed++; console.log(`  PASS: ${name}`) } else { failed++; console.log(`  FAIL: ${name}`) }
  }

  // AC1: #approach resolves to one semantically labelled section with a
  // clear H2 heading and the existing proposition intact.
  assert('desktop: #approach is a <section>', results.desktopChapter.tag === 'SECTION')
  assert('desktop: section labelled by its H2', results.desktopChapter.labelledResolves === true)
  assert('desktop: H2 reads "We start where you are"', results.desktopChapter.h2Text === 'We start where you are')
  assert('desktop: existing proposition intact', results.desktopChapter.propIntact === true)
  assert('narrow: section labelled by its H2', results.narrowChapter.labelledResolves === true)

  // AC2: desktop conveys chapter label, headline, number, copy and the
  // original visual accent without visual collision.
  assert('desktop: eyebrow/number/headline/copy all visible',
    results.desktopChapter.blocks.filter((b) => b.name !== 'orb').every((b) => b.visible))
  assert('desktop: decorative orb accent present and visible', results.desktopChapter.blocks.find((b) => b.name === 'orb')?.visible === true)
  assert('desktop: no copy line intersects the orb accent', results.clearance.obscured.length === 0)

  // AC3: at 390px reading order and focus order match visual order,
  // and no page-level horizontal overflow.
  assert('narrow: reading order matches visual order', results.narrowChapter.readingOrderMatches === true)
  assert('narrow: focus order matches visual order', results.narrowChapter.focusOrderMatches === true)
  assert('narrow: no focusable elements hidden from order', results.narrowChapter.focusables.length === 0)
  assert('desktop: no page-level horizontal overflow', results.desktopOverflow.scrollWidth <= results.desktopOverflow.innerWidth + 1)
  assert('narrow: no page-level horizontal overflow', results.narrowOverflow.scrollWidth <= results.narrowOverflow.innerWidth + 1)
  assert('narrow: no copy line intersects the orb accent', results.narrowClearance.obscured.length === 0)

  // AC4: decorative elements do not enter the accessibility tree.
  assert('decorative SVGs presentation-only in #approach', results.a11y.decorativeSvgs === true && results.a11y.svgCount === 1)
  assert('chapter number aria-hidden', results.a11y.numberAriaHidden === true)
  assert('eyebrow hairline rule aria-hidden', results.a11y.ruleAriaHidden === true)

  assert('keyboard focus visible on "Approach" nav link (Tab x2)', results.focus?.matchesFocusVisible === true && results.focus?.text === 'Approach')

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
  const readme = `# PAR-181 Evidence — v2 editorial approach chapter "We start where you are"

Fixtures only: the production build of the public marketing site (no user
input, no real or private data). Captured headlessly with Chrome for Testing.

## How these were produced

\`\`\`
npm run build && node scripts/capture-par-181-evidence.mjs
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

- desktop-approach-1440x900 — full viewport at 1440px scrolled to the
  approach chapter: eyebrow, ghosted chapter number, H2, two-paragraph
  copy in a 620px measure, decorative orb accent at the right margin.
- desktop-approach-section-1440w — the #approach section clipped to its
  bounding box at 1440px (chapter composition detail).
- narrow-approach-390x844 — full viewport at 390px scrolled to the
  chapter: single-column reading order, orb accent below the copy.
- narrow-approach-section-390w — the #approach section clipped at 390px.
- desktop-approach-focus-1440x900 — keyboard focus (Tab x2) on the
  "Approach" nav link; solar :focus-visible ring on the night ground.

## Assertion results (this run)

- Desktop chapter structure: ${JSON.stringify(results.desktopChapter.blocks)}
- Narrow chapter structure: ${JSON.stringify(results.narrowChapter.blocks)}
- Reading order matches visual order (narrow): ${results.narrowChapter.readingOrderMatches}
- Focus order matches visual order (narrow): ${results.narrowChapter.focusOrderMatches}
- Desktop no page-level horizontal overflow: ${results.desktopOverflow.scrollWidth} <= ${results.desktopOverflow.innerWidth}
- Narrow no page-level horizontal overflow: ${results.narrowOverflow.scrollWidth} <= ${results.narrowOverflow.innerWidth}
- Text obscured by orb accent (desktop): ${results.clearance.obscured.length === 0 ? 'none' : JSON.stringify(results.clearance.obscured)}
- Text obscured by orb accent (narrow): ${results.narrowClearance.obscured.length === 0 ? 'none' : JSON.stringify(results.narrowClearance.obscured)}
- Decorative elements out of a11y tree: ${JSON.stringify(results.a11y)}
- Focus (Tab x2) on "Approach" nav link: ${JSON.stringify(results.focus)}

Total: ${passed} passed, ${failed} failed.
`
  writeFileSync(join(EVIDENCE_DIR, 'README.md'), readme)
  console.log(`\nWrote ${join(EVIDENCE_DIR, 'README.md')}`)
}

main().catch((err) => {
  console.error(`\nCAPTURE FAILED: ${err.message}`)
  process.exit(1)
})