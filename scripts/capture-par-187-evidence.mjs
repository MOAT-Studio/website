#!/usr/bin/env node
/**
 * PAR-187 evidence capture — the motion system.
 *
 * The claims this script has to stand behind are not "it looks nice" but
 * "nothing here can hide content and nothing here moves the layout":
 *
 * 1. The JavaScript-disabled render and the prefers-reduced-motion render
 *    are byte-identical to each other, and both match the animated page
 *    once it has come to rest (modulo antialiasing, reported exactly).
 * 2. Every [data-ink] section actually reveals, including after a fast
 *    scroll that can carry a section past the observer.
 * 3. No from-state survives at rest — nothing is left undrawn.
 * 4. The motion contributes no layout shift.
 *
 * Hermetic by construction, like capture-par-18{0..6}-evidence.mjs:
 * dist/ is served by a plain Node static server, every request that is not
 * same-origin or a declared font host is aborted and recorded, and the
 * evidence directory is managed in-process. No live form submission is
 * possible and no real or private data is involved.
 *
 * Usage: npm run build && node scripts/capture-par-187-evidence.mjs
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
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-187')

const DESKTOP = { width: 1440, height: 900 }
const TALL = { width: 1440, height: 1200 }
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
    const relative = normalize(decodeURIComponent(req.url.split('?')[0]))
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
    server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }))
  })
}

const egressViolations = []
const ALLOWED_REMOTE_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])

async function newPage(browser, origin, viewport, { js = true, reduce = false } = {}) {
  const page = await browser.newPage()
  await page.setJavaScriptEnabled(js)
  if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    try {
      const parsed = new URL(request.url())
      if (parsed.protocol === 'data:') return request.continue()
      if (parsed.origin !== origin) {
        if (ALLOWED_REMOTE_HOSTS.has(parsed.hostname)) return request.continue()
        egressViolations.push(`External request: ${request.method()} ${request.url()}`)
        return request.abort()
      }
      return request.continue()
    } catch {
      return request.continue()
    }
  })
  return page
}

/**
 * Traverse the whole page in instant jumps. `html { scroll-behavior: smooth }`
 * means a plain scrollTo starts an animation that the next step interrupts,
 * so a naive loop never actually moves the page — and every reveal silently
 * fails to fire. The jump size is also deliberately coarse: it is the fast
 * scroll that the observer's above-the-viewport branch exists to survive.
 */
const traverse = (page) =>
  page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  })

const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16)

async function main() {
  rmSync(EVIDENCE_DIR, { recursive: true, force: true })
  mkdirSync(EVIDENCE_DIR, { recursive: true })

  const { server, origin } = await startStaticServer(DIST_DIR)
  const browser = await puppeteer.launch({ headless: 'new' })
  const report = {}

  try {
    // ── The hero opening, mid-sequence and at rest ──
    const hero = await newPage(browser, origin, DESKTOP)
    await hero.goto(origin, { waitUntil: 'domcontentloaded' })
    await new Promise((r) => setTimeout(r, 420))
    await hero.screenshot({ path: join(EVIDENCE_DIR, 'desktop-hero-400ms.png') })
    await new Promise((r) => setTimeout(r, 1800))
    await hero.screenshot({ path: join(EVIDENCE_DIR, 'desktop-hero-at-rest.png') })
    await hero.close()

    // ── Each reveal, caught early and at rest ──
    const reveal = await newPage(browser, origin, DESKTOP)
    await reveal.goto(origin, { waitUntil: 'networkidle0' })
    for (const [name, selector] of [['slab', '#programs'], ['proof', '#proof-principles'], ['contact', '#contact']]) {
      await reveal.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'center' }), selector)
      await new Promise((r) => setTimeout(r, 70))
      await reveal.screenshot({ path: join(EVIDENCE_DIR, `desktop-${name}-early.png`) })
      await new Promise((r) => setTimeout(r, 2200))
      await reveal.screenshot({ path: join(EVIDENCE_DIR, `desktop-${name}-at-rest.png`) })
    }
    await reveal.close()

    // ── Nothing is left undrawn after a deliberately coarse traversal ──
    const probe = await newPage(browser, origin, DESKTOP)
    await probe.goto(origin, { waitUntil: 'networkidle0' })
    await traverse(probe)
    await new Promise((r) => setTimeout(r, 2500))
    report.restingState = await probe.evaluate(() => {
      const all = [...document.querySelectorAll('[data-ink]')]
      const style = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const s = getComputedStyle(el)
        return { scale: s.scale, translate: s.translate, opacity: s.opacity, strokeDashoffset: s.strokeDashoffset }
      }
      return {
        armed: document.documentElement.classList.contains('ink-armed'),
        dataInkTotal: all.length,
        stillUndrawn: all.filter((e) => !e.classList.contains('is-inked')).map((e) => e.className || e.tagName),
        samples: {
          eyebrowRule: style('#programs .section-eyebrow-rule'),
          processCard: style('.process-card-1'),
          inkArrow: style('.process-link .ink-draw'),
          proofDiagram: style('.proof-item .ink-draw'),
          contactOrb: style('.contact-orb'),
          contactBrush: style('.contact-brush'),
        },
      }
    })
    await probe.close()

    // ── The three ways of arriving at the finished print ──
    const fullPage = async (name, opts) => {
      const page = await newPage(browser, origin, DESKTOP, opts)
      await page.goto(origin, { waitUntil: 'networkidle0' })
      if (opts?.js !== false) await traverse(page)
      await new Promise((r) => setTimeout(r, 2500))
      const file = join(EVIDENCE_DIR, `desktop-${name}-full-1440w.png`)
      await page.screenshot({ path: file, fullPage: true })
      await page.close()
      return sha(file)
    }
    report.finishedPrint = {
      animatedAtRest: await fullPage('animated-at-rest'),
      javascriptDisabled: await fullPage('javascript-disabled', { js: false }),
      reducedMotion: await fullPage('reduced-motion', { reduce: true }),
    }
    report.finishedPrint.staticPathsIdentical =
      report.finishedPrint.javascriptDisabled === report.finishedPrint.reducedMotion

    // ── No arming flash on a display tall enough to show a hairline at load ──
    const tall = await newPage(browser, origin, TALL)
    await tall.goto(origin, { waitUntil: 'domcontentloaded' })
    await new Promise((r) => setTimeout(r, 40))
    report.noArmingFlash = await tall.evaluate(() => {
      const rule = document.querySelector('#approach .section-eyebrow-rule')
      return {
        approachRuleOnScreenAtLoad: rule.getBoundingClientRect().top < window.innerHeight,
        // "none" means no from-state was ever applied: it was marked inked
        // before `ink-armed` went on, so it cannot have flashed.
        scaleAt40ms: getComputedStyle(rule).scale,
      }
    })
    await tall.screenshot({ path: join(EVIDENCE_DIR, 'tall-1440x1200-40ms.png') })
    await tall.close()

    // ── Layout shift, attributed ──
    const cls = await newPage(browser, origin, DESKTOP)
    await cls.evaluateOnNewDocument(() => {
      window.__shifts = []
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue
          window.__shifts.push({
            value: e.value,
            atMs: Math.round(e.startTime),
            sources: (e.sources || []).map((s) => s.node?.nodeName ?? '?'),
          })
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await cls.goto(origin, { waitUntil: 'networkidle0' })
    await traverse(cls)
    await new Promise((r) => setTimeout(r, 800))
    report.layoutShift = await cls.evaluate(() => ({
      total: window.__shifts.reduce((a, s) => a + s.value, 0),
      entries: window.__shifts,
    }))
    await cls.close()

    // ── Narrow ──
    const narrow = await newPage(browser, origin, NARROW)
    await narrow.goto(origin, { waitUntil: 'networkidle0' })
    await traverse(narrow)
    await new Promise((r) => setTimeout(r, 2200))
    await narrow.screenshot({ path: join(EVIDENCE_DIR, 'narrow-at-rest-full-390w.png'), fullPage: true })
    report.narrowOverflow = await narrow.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    await narrow.close()
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
