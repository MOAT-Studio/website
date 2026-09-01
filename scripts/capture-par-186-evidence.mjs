#!/usr/bin/env node
/**
 * PAR-186 evidence capture — the homepage rebuilt to the editorial-orb
 * concept: desktop 1440px and narrow 390px, full page and above the
 * fold, plus structure, contrast, overflow and focus checks.
 *
 * Hermetic by construction (same security model as the
 * capture-par-180..185-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server.
 * 2. Every request is intercepted; same-origin and the declared font
 *    hosts pass, anything else is aborted and recorded as egress —
 *    so NO live form submission (to FormSubmit or elsewhere) is made.
 * 3. No real or private data — the page is the public marketing site.
 * 4. Evidence directory cleanup and server shutdown happen in-process
 *    via node:fs / the server handle — no shell rm/pkill.
 *
 * Usage: npm run build && node scripts/capture-par-186-evidence.mjs
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
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
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-186')

const DESKTOP = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

function startStaticServer(root) {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0])
    // normalize() folds ".." segments; the startsWith(root) guard below is
    // the authoritative traversal block.
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
        egressViolations.push(`External request: ${request.method()} ${url}`)
        return request.abort()
      }
      return request.continue()
    } catch {
      return request.continue()
    }
  })
}

async function openPage(browser, origin, viewport, { reducedMotion = false, path = '' } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  }
  await installLocalOnlyNetwork(page, origin)
  await page.goto(origin + path, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#footer', { timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 600))
  return page
}

/** Page-level horizontal overflow: nothing may push the body sideways. */
const measureOverflow = (page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))

/**
 * Structure of the five chapters: each is a labelled region whose
 * aria-labelledby resolves to its own H2, the eyebrows read LABEL / 0N,
 * and the display face actually resolved to Anton rather than falling
 * back to the system stack.
 */
const measureStructure = (page) =>
  page.evaluate(() => {
    const sections = ['approach', 'programs', 'proof-principles', 'founder', 'contact']
    const chapters = sections.map((id) => {
      const el = document.getElementById(id)
      const labelled = el?.getAttribute('aria-labelledby')
      const h2 = labelled ? document.getElementById(labelled) : null
      return {
        id,
        tag: el?.tagName ?? null,
        labelledResolvesToH2: h2?.tagName === 'H2',
        heading: h2 ? h2.textContent.trim() : null,
        eyebrow: el?.querySelector('.section-eyebrow-text')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      }
    })

    const h1 = document.querySelector('h1')
    const h1Style = h1 ? getComputedStyle(h1) : null
    const headings = [...document.querySelectorAll('h1, h2, h3')].map((el) => ({
      level: el.tagName,
      text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 46),
    }))

    return {
      chapters,
      h1Text: h1?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      h1Family: h1Style?.fontFamily ?? null,
      h1Size: h1Style?.fontSize ?? null,
      headingOutline: headings,
      // Every decorative mark must be out of the accessibility tree.
      undecoratedMarks: [
        ...document.querySelectorAll('.brush-mark, .hero-orb, .badge-mark, .ink-arrow, .proof-diagram, .title-dot, .section-eyebrow-rule'),
      ].filter((el) => el.getAttribute('aria-hidden') !== 'true').length,
      processSteps: document.querySelectorAll('.process-stage > li').length,
      proofItems: document.querySelectorAll('.proof-columns > li').length,
    }
  })

/**
 * The live contact contract must survive a presentation-only rebuild:
 * three required fields with the original names, a label for each (now
 * visually hidden, per the concept), the honeypot off-screen, and the
 * submit button.
 */
const measureContactContract = (page) =>
  page.evaluate(() => {
    const section = document.getElementById('contact')
    const field = (sel) => {
      const el = section.querySelector(sel)
      if (!el) return null
      const label = document.querySelector(`label[for="${el.id}"]`)
      const r = el.getBoundingClientRect()
      return {
        name: el.getAttribute('name'),
        required: el.required,
        labelText: label?.textContent.trim() ?? null,
        labelInA11yTree: !!label && label.getAttribute('aria-hidden') !== 'true',
        placeholder: el.getAttribute('placeholder'),
        visible: r.width > 0 && r.height > 0,
        inViewport: r.left >= -1 && r.right <= window.innerWidth + 1,
      }
    }
    const honey = section.querySelector('input[name="_honey"]')
    const button = section.querySelector('button[type="submit"]')
    return {
      name: field('input[name="name"]'),
      email: field('input[name="email"]'),
      message: field('textarea[name="message"]'),
      honeypotOffscreen: honey ? honey.getBoundingClientRect().right < 0 : null,
      buttonText: button?.textContent.trim() ?? null,
      externalLinksSecure: [...document.querySelectorAll('a[target="_blank"]')].every(
        (a) => (a.getAttribute('rel') || '').includes('noopener') && (a.getAttribute('rel') || '').includes('noreferrer'),
      ),
    }
  })

/** Focus ring visibility on both grounds: paper nav pill, night form field. */
const measureFocus = (page) =>
  page.evaluate(() => {
    const probe = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      el.focus()
      const s = getComputedStyle(el)
      return { sel, outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, outlineColor: s.outlineColor }
    }
    return [probe('.nav-pill'), probe('#contact-name'), probe('.rail-stages')].filter(Boolean)
  })

async function main() {
  rmSync(EVIDENCE_DIR, { recursive: true, force: true })
  mkdirSync(EVIDENCE_DIR, { recursive: true })

  const { server, origin } = await startStaticServer(DIST_DIR)
  const browser = await puppeteer.launch({ headless: 'new' })
  const report = {}

  try {
    const desktop = await openPage(browser, origin, DESKTOP)
    await desktop.screenshot({ path: join(EVIDENCE_DIR, 'desktop-home-1440x900.png') })
    await desktop.screenshot({ path: join(EVIDENCE_DIR, 'desktop-home-full-1440w.png'), fullPage: true })
    report.desktopOverflow = await measureOverflow(desktop)
    report.structure = await measureStructure(desktop)
    report.contactContract = await measureContactContract(desktop)
    report.focus = await measureFocus(desktop)
    await desktop.close()

    const narrow = await openPage(browser, origin, NARROW)
    await narrow.screenshot({ path: join(EVIDENCE_DIR, 'narrow-home-390x844.png') })
    await narrow.screenshot({ path: join(EVIDENCE_DIR, 'narrow-home-full-390w.png'), fullPage: true })
    report.narrowOverflow = await measureOverflow(narrow)
    report.narrowContact = await measureContactContract(narrow)
    await narrow.close()

    const reduced = await openPage(browser, origin, DESKTOP, { reducedMotion: true })
    await reduced.screenshot({ path: join(EVIDENCE_DIR, 'desktop-reduced-motion-1440x900.png') })
    await reduced.close()

    // The assessment must still open from its deep link and hand focus back
    // to the H1 on close, now that the hero CTA that used to own it is gone.
    // The hash is read once on mount, so this has to be a fresh load at the
    // deep-link URL rather than a same-document hash change.
    const assess = await openPage(browser, origin, DESKTOP, { path: '/#map-your-moat' })
    await assess.waitForSelector('.moat-assess', { timeout: 10000 })
    await assess.screenshot({ path: join(EVIDENCE_DIR, 'desktop-assessment-deeplink-1440x900.png') })
    await assess.click('.moat-assess-exit')
    await new Promise((r) => setTimeout(r, 300))
    report.assessment = await assess.evaluate(() => ({
      closed: !document.querySelector('.moat-assess'),
      focusedId: document.activeElement?.id ?? null,
      hash: window.location.hash,
    }))
    await assess.close()
  } finally {
    await browser.close()
    server.close()
  }

  report.egressViolations = egressViolations
  writeFileSync(join(EVIDENCE_DIR, '_report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  console.log(`\nevidence written to ${EVIDENCE_DIR}`)
}

await main()
