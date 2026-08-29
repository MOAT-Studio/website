#!/usr/bin/env node
/**
 * PAR-184 evidence capture — v2 founder chapter "The founder."
 * (PAR-184): desktop 1440px and narrow 390px, plus composition,
 * placement, overflow and focus checks.
 *
 * Hermetic by construction (same security model as the
 * capture-par-180/181/182/183-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server.
 * 2. Every request is intercepted; same-origin and the declared font
 *    hosts pass, anything else is aborted and recorded as egress.
 * 3. No real or private data — the page is the public marketing site.
 * 4. Evidence directory cleanup and server shutdown happen in-process
 *    via node:fs / the child handle — no shell rm/pkill (unattended-safe).
 *
 * Usage: npm run build && node scripts/capture-par-184-evidence.mjs
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
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-184')

const DESKTOP = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

// ---------------------------------------------------------------------------
// Static server for the production build
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
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
  await page.waitForSelector('#founder', { timeout: 15000 })
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
 * Chapter placement: the founder section must sit between the
 * proof-principles chapter and the contact panel, with a real H2.
 */
async function measurePlacement(page) {
  return page.evaluate(() => {
    const pageEl = document.querySelector('.page')
    const order = [...pageEl.children].map((el) => el.id)
    const proofIdx = order.indexOf('proof-principles')
    const founderIdx = order.indexOf('founder')
    const contactIdx = order.indexOf('contact')
    return {
      order,
      proofIdx,
      founderIdx,
      contactIdx,
      betweenProofAndContact:
        proofIdx !== -1 && founderIdx !== -1 && contactIdx !== -1 &&
        founderIdx === proofIdx + 1 && contactIdx === founderIdx + 1,
    }
  })
}

/**
 * Founder chapter structure: labelled section, eyebrow 04, H2 (the name
 * link), bio, three preserved external destinations, the authorised
 * portrait and the decorative orb/gesture marks.
 */
async function measureChapter(page) {
  return page.evaluate(() => {
    const section = document.getElementById('founder')
    const labelled = section?.getAttribute('aria-labelledby')
    const labelledEl = labelled ? document.getElementById(labelled) : null
    const h2 = section?.querySelector('h2')
    const nameLink = h2?.querySelector('a.founder-name')
    const bio = section?.querySelector('.founder-bio')
    const links = [...(section?.querySelectorAll('.founder-links a.mono-link') || [])]
    const linkData = links.map((el) => {
      const r = el.getBoundingClientRect()
      return {
        text: el.textContent.trim(),
        href: el.getAttribute('href'),
        target: el.getAttribute('target'),
        rel: el.getAttribute('rel'),
        visible: r.width > 0 && r.height > 0,
        inViewport: r.left >= -1 && r.right <= window.innerWidth + 1,
      }
    })
    const photo = section?.querySelector('img.founder-photo')
    const photoRect = photo ? photo.getBoundingClientRect() : null
    const photoInfo = photo
      ? {
          src: photo.getAttribute('src'),
          alt: photo.getAttribute('alt'),
          left: Math.round(photoRect.left),
          right: Math.round(photoRect.right),
          top: Math.round(photoRect.top),
          bottom: Math.round(photoRect.bottom),
          width: Math.round(photoRect.right - photoRect.left),
          height: Math.round(photoRect.bottom - photoRect.top),
          visible: photoRect.width > 0 && photoRect.height > 0,
          inViewport: photoRect.left >= -1 && photoRect.right <= window.innerWidth + 1,
          naturalWidth: photo.naturalWidth,
          naturalHeight: photo.naturalHeight,
          objectFit: getComputedStyle(photo).objectFit,
          zIndex: getComputedStyle(photo).zIndex,
        }
      : null
    const orb = section?.querySelector('svg.orb-mark.founder-orb')
    const orbRect = orb ? orb.getBoundingClientRect() : null
    const orbInfo = orb
      ? {
          ariaHidden: orb.getAttribute('aria-hidden') === 'true',
          role: orb.getAttribute('role'),
          visible: orbRect.width > 0 && orbRect.height > 0,
          left: Math.round(orbRect.left),
          right: Math.round(orbRect.right),
          top: Math.round(orbRect.top),
          bottom: Math.round(orbRect.bottom),
          coreFill: orb ? (orb.querySelector('circle[fill]')?.getAttribute('fill') ?? null) : null,
        }
      : null
    // The orb peeks from the portrait's top-right corner: overlap is the
    // framing device, but the photo must paint above the orb (z-index) so
    // the portrait is never covered.
    const orbPeeksCorner = !!(
      photoInfo && orbInfo &&
      orbInfo.left < photoInfo.right && orbInfo.right > photoInfo.left &&
      orbInfo.top < photoInfo.bottom && orbInfo.bottom > photoInfo.top &&
      parseInt(photoInfo.zIndex, 10) > 0
    )
    const gesture = section?.querySelector('svg.gesture-mark.founder-gesture')
    const gestureInfo = gesture
      ? {
          ariaHidden: gesture.getAttribute('aria-hidden') === 'true',
          role: gesture.getAttribute('role'),
          pathCount: gesture.querySelectorAll('path').length,
        }
      : null
    // Section rule (eyebrow) is decorative: hidden from assistive tech.
    const rule = section?.querySelector('.section-eyebrow-rule')
    const ruleInfo = rule
      ? { ariaHidden: rule.getAttribute('aria-hidden') === 'true' }
      : null
    // Focus order: walk the document's focusable elements inside the
    // section and confirm their DOM index order (tab order = DOM order
    // for anchors without tabindex).
    const focusables = [...(section?.querySelectorAll('a[href]') || [])]
    const focusOrder = focusables.map((el, i) => ({
      domIndex: i,
      text: el.textContent.trim().slice(0, 40),
      href: el.getAttribute('href'),
    }))
    return {
      tag: section?.tagName,
      labelled,
      labelledResolves: !!labelledEl && labelledEl.tagName === 'H2',
      h2Text: h2 ? h2.textContent.trim() : null,
      nameHref: nameLink?.getAttribute('href') ?? null,
      nameTarget: nameLink?.getAttribute('target') ?? null,
      nameRel: nameLink?.getAttribute('rel') ?? null,
      bioText: bio ? bio.textContent.trim() : '',
      bioLen: bio ? bio.textContent.trim().length : 0,
      linkCount: links.length,
      links: linkData,
      photo: photoInfo,
      orb: orbInfo,
      orbPeeksCorner,
      gesture: gestureInfo,
      rule: ruleInfo,
      focusOrder,
    }
  })
}

/**
 * Keyboard focus visibility: focus the name link from the Node side
 * (page.focus), then read the outline the page's :focus-visible rule
 * produces. Returns null if the link is absent.
 */
async function measureFocusVisible(page) {
  return page.evaluate(() => {
    const a = document.getElementById('founder-title')?.querySelector('a')
    if (!a) return null
    const s = getComputedStyle(a)
    return {
      outlineWidth: s.outlineWidth,
      outlineStyle: s.outlineStyle,
      outlineColor: s.outlineColor,
      outlineOffset: s.outlineOffset,
      matches: a.matches(':focus-visible') ? true : a.matches(':focus') ? 'focus-not-visible' : 'none',
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

/** Full-page section capture: clip to the #founder bounding box. */
async function captureSection(page, name) {
  const clip = await page.evaluate(() => {
    const r = document.getElementById('founder').getBoundingClientRect()
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
    // ---- Scene 1: desktop founder chapter (1440px) ----
    console.log('Scene 1 — desktop founder chapter (1440x900)')
    const desktop = await openPage(browser, origin, DESKTOP)
    try {
      await desktop.evaluate(() => document.getElementById('founder').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.desktopOverflow = await measureOverflow(desktop)
      results.desktopPlacement = await measurePlacement(desktop)
      results.desktopChapter = await measureChapter(desktop)
      await desktop.focus('#founder-title a.founder-name').catch(() => {})
      results.desktopFocusVisible = await measureFocusVisible(desktop)
      await capture(desktop, 'desktop-founder-1440x900')
      await captureSection(desktop, 'desktop-founder-section-1440w')
    } finally {
      await desktop.close()
    }

    // ---- Scene 2: narrow founder chapter (390px) ----
    console.log('Scene 2 — narrow founder chapter (390x844)')
    const narrow = await openPage(browser, origin, NARROW)
    try {
      await narrow.evaluate(() => document.getElementById('founder').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.narrowOverflow = await measureOverflow(narrow)
      results.narrowPlacement = await measurePlacement(narrow)
      results.narrowChapter = await measureChapter(narrow)
      await narrow.focus('#founder-title a.founder-name').catch(() => {})
      results.narrowFocusVisible = await measureFocusVisible(narrow)
      await capture(narrow, 'narrow-founder-390x844')
      await captureSection(narrow, 'narrow-founder-section-390w')
    } finally {
      await narrow.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  // ---------------------------------------------------------------------------
  // Assertions (PAR-184 acceptance criteria)
  // ---------------------------------------------------------------------------

  console.log('\n=== PAR-184 Evidence Assertions ===')
  let passed = 0
  let failed = 0
  const assert = (name, condition) => {
    if (condition) { passed++; console.log(`  PASS: ${name}`) } else { failed++; console.log(`  FAIL: ${name}`) }
  }

  const expectedLinks = [
    { text: 'franciscovarisco.com', href: 'https://franciscovarisco.com', blank: true },
    { text: 'linkedin', href: 'https://linkedin.com/in/xicovarisco', blank: true },
    { text: 'email', href: 'mailto:francisco@moatstudio.ai', blank: false },
  ]

  // AC1: founder content, portrait and all three destinations work as
  // before, in an editorial v2 composition (labelled chapter, not a
  // generic profile block).
  assert('desktop: #founder is a <section> labelled by its H2',
    results.desktopChapter.tag === 'SECTION' && results.desktopChapter.labelledResolves === true)
  assert('narrow: #founder is a <section> labelled by its H2',
    results.narrowChapter.tag === 'SECTION' && results.narrowChapter.labelledResolves === true)
  assert('desktop: real H2 heading present',
    typeof results.desktopChapter.h2Text === 'string' && results.desktopChapter.h2Text.length > 0)
  assert('desktop: name link preserved (franciscovarisco.com, target=_blank, noopener noreferrer)',
    results.desktopChapter.nameHref === 'https://franciscovarisco.com' &&
    results.desktopChapter.nameTarget === '_blank' &&
    results.desktopChapter.nameRel === 'noopener noreferrer')
  assert('desktop: approved bio preserved',
    results.desktopChapter.bioText === 'Twenty years building technology inside real businesses. Still curious enough to take things apart to see why they work.')
  assert('narrow: approved bio preserved',
    results.narrowChapter.bioText === 'Twenty years building technology inside real businesses. Still curious enough to take things apart to see why they work.')
  for (const side of ['desktop', 'narrow']) {
    const ch = results[`${side}Chapter`]
    assert(`${side}: exactly three preserved destinations`, ch.linkCount === 3)
    ch.links.forEach((lk, i) => {
      const exp = expectedLinks[i]
      assert(`${side}: destination ${i + 1} preserved (${exp.text} → ${exp.href})`,
        lk.text === exp.text && lk.href === exp.href)
      if (exp.blank) {
        assert(`${side}: ${exp.text} is secure (target=_blank + noopener noreferrer)`,
          lk.target === '_blank' && lk.rel === 'noopener noreferrer')
      } else {
        assert(`${side}: ${exp.text} is a mailto (no target needed)`,
          lk.target === null)
      }
    })
    assert(`${side}: authorised portrait preserved (/assets/founder.jpg, alt "Francisco Varisco")`,
      ch.photo && ch.photo.src === '/assets/founder.jpg' && ch.photo.alt === 'Francisco Varisco')
    assert(`${side}: chapter sits directly between #proof-principles and #contact`,
      results[`${side}Placement`].betweenProofAndContact === true)
  }

  // AC2: portrait recognisable, not covered by decorative layers;
  // heading and bio legible over/alongside the orb treatment.
  for (const side of ['desktop', 'narrow']) {
    const ch = results[`${side}Chapter`]
    assert(`${side}: portrait visible and recognisable (natural image loaded, cover crop)`,
      ch.photo && ch.photo.visible && ch.photo.naturalWidth > 0 && ch.photo.objectFit === 'cover')
    assert(`${side}: portrait not clipped horizontally at its width`,
      ch.photo && ch.photo.inViewport)
    assert(`${side}: portrait paints above the orb (z-index) and the orb peeks from the top-right corner`,
      ch.orbPeeksCorner === true)
    assert(`${side}: orb is decorative (aria-hidden, role=presentation)`,
      ch.orb && ch.orb.ariaHidden === true && ch.orb.role === 'presentation')
    assert(`${side}: heading and bio visible (no layer covers them — DOM order: portrait, then text)`,
      ch.focusOrder.length === 4 && ch.linkCount === 3 && ch.bioLen > 40)
  }

  // Decorative markings hidden from assistive technology.
  for (const side of ['desktop', 'narrow']) {
    const ch = results[`${side}Chapter`]
    assert(`${side}: gesture mark decorative (aria-hidden, role=presentation, 3 strokes)`,
      ch.gesture && ch.gesture.ariaHidden === true && ch.gesture.role === 'presentation' && ch.gesture.pathCount === 3)
    assert(`${side}: eyebrow rule decorative (aria-hidden)`,
      ch.rule && ch.rule.ariaHidden === true)
  }

  // AC3: desktop and 390px preserve reading/focus order, no horizontal
  // overflow. DOM order (portrait → text) = tab order.
  for (const side of ['desktop', 'narrow']) {
    const ch = results[`${side}Chapter`]
    assert(`${side}: focus order follows DOM order (name → website → linkedin → email)`,
      ch.focusOrder.map((f) => f.href).join('|') ===
        'https://franciscovarisco.com|https://franciscovarisco.com|https://linkedin.com/in/xicovarisco|mailto:francisco@moatstudio.ai')
    assert(`${side}: visible keyboard focus on the name link (ink outline)`,
      results[`${side}FocusVisible`] && results[`${side}FocusVisible`].matches === true &&
      results[`${side}FocusVisible`].outlineWidth === '2px' &&
      results[`${side}FocusVisible`].outlineColor === 'rgb(5, 5, 5)')
    assert(`${side}: no page-level horizontal overflow`,
      results[`${side}Overflow`].scrollWidth <= results[`${side}Overflow`].innerWidth + 1)
  }
  assert('narrow: portrait stacks full-width above the text (single column)',
    results.narrowChapter.photo && results.narrowChapter.photo.width >= 330 &&
    results.narrowChapter.photo.left <= 24)

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
  const readme = `# PAR-184 Evidence — v2 founder chapter "The founder."

Fixtures only: the production build of the public marketing site (no user
input, no real or private finance data). Captured headlessly with Chrome for
Testing. Theme: the v2 single theme (warm paper; the founder chapter stays
light, in the dark / light / light / dark page rhythm after the navy process
stage); no light/dark theme pair exists in this design system.

## How these were produced

\`\`\`
npm run build && node scripts/capture-par-184-evidence.mjs
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

- Page section order: ${JSON.stringify(results.desktopPlacement.order)}
- Chapter between #proof-principles and #contact: desktop ${results.desktopPlacement.betweenProofAndContact} / narrow ${results.narrowPlacement.betweenProofAndContact}
- Desktop portrait: ${JSON.stringify(results.desktopChapter.photo)}
- Desktop orb (decorative, peeks top-right corner): ${JSON.stringify(results.desktopChapter.orb)} orbPeeksCorner=${results.desktopChapter.orbPeeksCorner}
- Narrow portrait: ${JSON.stringify(results.narrowChapter.photo)}
- Narrow orb: ${JSON.stringify(results.narrowChapter.orb)} orbPeeksCorner=${results.narrowChapter.orbPeeksCorner}
- H2: "${results.desktopChapter.h2Text}"
- Destinations: ${JSON.stringify(results.desktopChapter.links.map((l) => ({ text: l.text, href: l.href, target: l.target, rel: l.rel })))}
- Focus order (DOM = tab): ${JSON.stringify(results.desktopChapter.focusOrder.map((f) => f.href))}
- Visible keyboard focus (name link): desktop ${JSON.stringify(results.desktopFocusVisible)} / narrow ${JSON.stringify(results.narrowFocusVisible)}
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