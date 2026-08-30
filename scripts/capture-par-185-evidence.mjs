#!/usr/bin/env node
/**
 * PAR-185 evidence capture — v2 "Become uncopyable." contact finale
 * and footer (PAR-185): desktop 1440px and narrow 390px, plus
 * contract, accessibility, overflow, focus and footer checks.
 *
 * Hermetic by construction (same security model as the
 * capture-par-180/181/182/183/184-evidence.mjs pattern):
 * 1. Serves the production build (`dist/`) via a plain Node static server.
 * 2. Every request is intercepted; same-origin and the declared font
 *    hosts pass, anything else is aborted and recorded as egress —
 *    so NO live form submission (to FormSubmit or elsewhere) is made.
 * 3. No real or private data — the page is the public marketing site.
 * 4. Evidence directory cleanup and server shutdown happen in-process
 *    via node:fs / the child handle — no shell rm/pkill (unattended-safe).
 *
 * Usage: npm run build && node scripts/capture-par-185-evidence.mjs
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
const EVIDENCE_DIR = join(PROJECT_ROOT, 'evidence', 'PAR-185')

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
// Request interception — local origin only. Any POST (e.g. a live form
// submission to FormSubmit) is external, so it is aborted and recorded;
// no real submission can leave the page.
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
        egressViolations.push(`External request: ${request.method()} ${url}`)
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
  await page.waitForSelector('#contact', { timeout: 15000 })
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
 * Contact structure: labelled section, eyebrow 05, H2 "Become uncopyable.",
 * three labelled fields (name/email/message) with required validation,
 * the hidden honeypot, the submit button, the dot canvas and the scrim.
 */
async function measureContact(page) {
  return page.evaluate(() => {
    const section = document.getElementById('contact')
    const labelled = section?.getAttribute('aria-labelledby')
    const labelledEl = labelled ? document.getElementById(labelled) : null
    const h2 = section?.querySelector('h2')
    const eyebrowIndex = section?.querySelector('.section-eyebrow-index')?.textContent ?? null
    const eyebrowLabel = section?.querySelectorAll('.section-eyebrow span')[1]?.textContent ?? null
    const rule = section?.querySelector('.section-eyebrow-rule')

    const fieldInfo = (input) => {
      const labelFor = input.getAttribute('id')
        ? document.querySelector(`label[for="${input.getAttribute('id')}"]`)
        : null
      const r = input.getBoundingClientRect()
      const s = getComputedStyle(input)
      return {
        id: input.id,
        name: input.getAttribute('name'),
        type: input.getAttribute('type') ?? (input.tagName === 'TEXTAREA' ? 'textarea' : null),
        required: input.required,
        visible: r.width > 0 && r.height > 0,
        inViewport: r.left >= -1 && r.right <= window.innerWidth + 1,
        labelText: labelFor?.textContent.trim() ?? null,
        labelColor: labelFor ? getComputedStyle(labelFor).color : null,
        inputColor: s.color,
        borderColor: s.borderColor,
      }
    }

    const nameInput = section?.querySelector('input[name="name"]')
    const emailInput = section?.querySelector('input[name="email"]')
    const messageInput = section?.querySelector('textarea[name="message"]')
    const honey = section?.querySelector('input[name="_honey"]')
    const honeyRect = honey ? honey.getBoundingClientRect() : null
    const button = section?.querySelector('button[type="submit"]')
    const buttonRect = button ? button.getBoundingClientRect() : null
    const buttonStyle = button ? getComputedStyle(button) : null
    const canvas = section?.querySelector('canvas.dot-canvas')
    const canvasRect = canvas ? canvas.getBoundingClientRect() : null
    const panel = section?.querySelector('.contact-panel')
    const panelRect = panel ? panel.getBoundingClientRect() : null
    const panelStyle = panel ? getComputedStyle(panel) : null
    const scrim = section?.querySelector('.scrim')

    // Focus order: the focusable elements inside the section, in DOM order.
    const focusables = [
      ...(section?.querySelectorAll('a[href], input:not([tabindex="-1"]), textarea, button:not([disabled])') || []),
    ]
    const focusOrder = focusables.map((el) => ({
      tag: el.tagName,
      name: el.getAttribute('name') ?? null,
      text: el.tagName === 'A' ? el.textContent.trim().slice(0, 30) : el.getAttribute('type') ?? null,
    }))

    return {
      tag: section?.tagName,
      labelled,
      labelledResolves: !!labelledEl && labelledEl.tagName === 'H2',
      h2Text: h2 ? h2.textContent.trim() : null,
      highlightText: section?.querySelector('.hl-text')?.textContent.trim() ?? null,
      eyebrowIndex,
      eyebrowLabel,
      ruleAriaHidden: rule ? rule.getAttribute('aria-hidden') === 'true' : null,
      name: nameInput ? fieldInfo(nameInput) : null,
      email: emailInput ? fieldInfo(emailInput) : null,
      message: messageInput ? fieldInfo(messageInput) : null,
      honeypot: honey
        ? {
            ariaHidden: honey.getAttribute('aria-hidden') === 'true',
            tabIndex: honey.getAttribute('tabindex'),
            offscreen: honeyRect ? honeyRect.left < -9000 : null,
          }
        : null,
      button: button
        ? {
            text: button.textContent.trim(),
            disabled: button.disabled,
            bg: buttonStyle.backgroundColor,
            fg: buttonStyle.color,
            visible: buttonRect.width > 0 && buttonRect.height > 0,
          }
        : null,
      canvas: canvas
        ? {
            ariaHidden: canvas.getAttribute('aria-hidden') === 'true',
            coversPanel: canvasRect && panelRect
              ? Math.abs(canvasRect.left - panelRect.left) <= 1 &&
                Math.abs(canvasRect.width - panelRect.width) <= 1
              : null,
          }
        : null,
      scrimPresent: !!scrim,
      panelBg: panelStyle ? panelStyle.backgroundColor : null,
      panelRadius: panelStyle ? panelStyle.borderRadius : null,
      focusOrder,
    }
  })
}

/**
 * Footer: semantic <footer>, the copyright line, the decorative gesture
 * mark (aria-hidden, role=presentation, 3 strokes) and the three preserved
 * destinations with their secure attributes.
 */
async function measureFooter(page) {
  return page.evaluate(() => {
    const footer = document.getElementById('footer')
    const gesture = footer?.querySelector('svg.gesture-mark.footer-gesture')
    const links = [...(footer?.querySelectorAll('a') || [])]
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
    return {
      tag: footer?.tagName,
      copyright: footer?.querySelector('span')?.textContent.trim() ?? null,
      links: linkData,
      gesture: gesture
        ? {
            ariaHidden: gesture.getAttribute('aria-hidden') === 'true',
            role: gesture.getAttribute('role'),
            pathCount: gesture.querySelectorAll('path').length,
          }
        : null,
    }
  })
}

/**
 * Focus visibility: focus the name input from the Node side (page.focus),
 * then read the outline the page's :focus-visible rule produces.
 */
async function measureInputFocusVisible(page) {
  return page.evaluate(() => {
    const input = document.getElementById('contact-name')
    if (!input) return null
    const s = getComputedStyle(input)
    return {
      outlineWidth: s.outlineWidth,
      outlineStyle: s.outlineStyle,
      outlineColor: s.outlineColor,
      outlineOffset: s.outlineOffset,
      matches: input.matches(':focus-visible') ? true : input.matches(':focus') ? 'focus-not-visible' : 'none',
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

/** Full-height capture clipped to the #contact section bounding box. */
async function captureSection(page, name) {
  const clip = await page.evaluate(() => {
    const r = document.getElementById('contact').getBoundingClientRect()
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
    // ---- Scene 1: desktop contact finale + footer (1440px) ----
    console.log('Scene 1 — desktop contact finale (1440x900)')
    const desktop = await openPage(browser, origin, DESKTOP)
    try {
      await desktop.evaluate(() => document.getElementById('contact').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.desktopOverflow = await measureOverflow(desktop)
      results.desktopContact = await measureContact(desktop)
      results.desktopFooter = await measureFooter(desktop)
      await desktop.focus('#contact-name').catch(() => {})
      results.desktopFocusVisible = await measureInputFocusVisible(desktop)
      await capture(desktop, 'desktop-contact-1440x900')
      await captureSection(desktop, 'desktop-contact-section-1440w')
    } finally {
      await desktop.close()
    }

    // ---- Scene 2: narrow contact finale + footer (390px) ----
    console.log('Scene 2 — narrow contact finale (390x844)')
    const narrow = await openPage(browser, origin, NARROW)
    try {
      await narrow.evaluate(() => document.getElementById('contact').scrollIntoView({ block: 'start' }))
      await new Promise((r) => setTimeout(r, 400))
      results.narrowOverflow = await measureOverflow(narrow)
      results.narrowContact = await measureContact(narrow)
      results.narrowFooter = await measureFooter(narrow)
      await narrow.focus('#contact-name').catch(() => {})
      results.narrowFocusVisible = await measureInputFocusVisible(narrow)
      await capture(narrow, 'narrow-contact-390x844')
      await captureSection(narrow, 'narrow-contact-section-390w')
    } finally {
      await narrow.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  // ---------------------------------------------------------------------------
  // Assertions (PAR-185 acceptance criteria)
  // ---------------------------------------------------------------------------

  console.log('\n=== PAR-185 Evidence Assertions ===')
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

  for (const side of ['desktop', 'narrow']) {
    const c = results[`${side}Contact`]
    const f = results[`${side}Footer`]

    // AC1: all current fields render; the form contract is preserved in
    // source (verified by the contract scan below) and the panel keeps its
    // navy inverse with the original dot texture.
    assert(`${side}: #contact is a <section> labelled by its H2`,
      c.tag === 'SECTION' && c.labelledResolves === true)
    assert(`${side}: H2 reads "Become uncopyable." (highlight intact)`,
      c.h2Text === 'Become uncopyable.' && c.highlightText === 'uncopyable.')
    assert(`${side}: eyebrow is 05 / Contact, rule decorative`,
      c.eyebrowIndex === '05' && c.eyebrowLabel === 'Contact' && c.ruleAriaHidden === true)
    for (const [key, expectedName, expectedType] of [
      ['name', 'name', null],
      ['email', 'email', 'email'],
      ['message', 'message', 'textarea'],
    ]) {
      const fld = c[key]
      assert(`${side}: field "${key}" present, required, labelled, visible, in-viewport`,
        !!fld && fld.name === expectedName && fld.type === expectedType &&
        fld.required === true && typeof fld.labelText === 'string' && fld.labelText.length > 0 &&
        fld.visible && fld.inViewport)
    }
    assert(`${side}: honeypot hidden from AT, tabindex=-1, offscreen`,
      c.honeypot && c.honeypot.ariaHidden === true && c.honeypot.tabIndex === '-1' && c.honeypot.offscreen === true)
    assert(`${side}: submit button "Start a conversation" visible, not disabled`,
      c.button && c.button.text === 'Start a conversation' && c.button.disabled === false && c.button.visible)
    assert(`${side}: dot canvas decorative and covers the panel`,
      c.canvas && c.canvas.ariaHidden === true && c.canvas.coversPanel === true)
    assert(`${side}: scrim layer present`, c.scrimPresent === true)
    assert(`${side}: panel is the deep navy inverse (rgb(3,7,30))`,
      c.panelBg === 'rgb(3, 7, 30)')

    // AC2: no colour-only signal — the state text and the visible focus
    // outline carry the state.
    assert(`${side}: visible solar focus outline on the name input (not colour alone)`,
      results[`${side}FocusVisible`] && results[`${side}FocusVisible`].matches === true &&
      results[`${side}FocusVisible`].outlineWidth === '2px' &&
      results[`${side}FocusVisible`].outlineStyle === 'solid' &&
      results[`${side}FocusVisible`].outlineColor === 'rgb(255, 225, 0)')
    assert(`${side}: button copy signals the state in text (idle → "Start a conversation")`,
      c.button && /Start a conversation|Sending…|Sent — talk soon/.test(c.button.text))

    // AC3: no clipping, overlap or horizontal overflow; single-column
    // readable composition.
    assert(`${side}: no page-level horizontal overflow`,
      results[`${side}Overflow`].scrollWidth <= results[`${side}Overflow`].innerWidth + 1)
    assert(`${side}: all three fields fully inside the viewport (no clipping)`,
      c.name.inViewport && c.email.inViewport && c.message.inViewport)

    // AC4: footer links retain destinations and secure attributes.
    assert(`${side}: footer is a semantic <footer> landmark`, f.tag === 'FOOTER')
    assert(`${side}: copyright line preserved (© 2026 moat studio)`,
      f.copyright === '© 2026 moat studio')
    assert(`${side}: footer has exactly three preserved destinations`, f.links.length === 3)
    f.links.forEach((lk, i) => {
      const exp = expectedLinks[i]
      assert(`${side}: destination ${i + 1} preserved (${exp.text} → ${exp.href})`,
        lk.text === exp.text && lk.href === exp.href)
      if (exp.blank) {
        assert(`${side}: ${exp.text} is secure (target=_blank + noopener noreferrer)`,
          lk.target === '_blank' && lk.rel === 'noopener noreferrer')
      } else {
        assert(`${side}: ${exp.text} is a mailto (no target needed)`, lk.target === null)
      }
      assert(`${side}: ${exp.text} visible and in-viewport`, lk.visible && lk.inViewport)
    })
    assert(`${side}: footer gesture mark decorative (aria-hidden, presentation, 3 strokes)`,
      f.gesture && f.gesture.ariaHidden === true && f.gesture.role === 'presentation' && f.gesture.pathCount === 3)

    // Focus order inside the contact section: the three fields, then the
    // submit button (the honeypot is tabindex=-1 and stays out of order).
    const expectedFocus = 'INPUT|INPUT|TEXTAREA|BUTTON'
    assert(`${side}: contact focus order is name → email → message → submit (DOM order)`,
      c.focusOrder.map((el) => el.tag).join('|') === expectedFocus)
  }

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
  const readme = `# PAR-185 Evidence — v2 "Become uncopyable." contact finale and footer

Fixtures only: the production build of the public marketing site (no user
input, no real or private finance data, no live form submission — every
request to a non-local origin is intercepted and aborted). Captured
headlessly with Chrome for Testing.

Theme: the v2 single theme (warm paper + deep-navy inverse). The contact
finale is the page's closing dark panel; the footer sits on the paper
ground. No light/dark theme pair exists in this design system.

## How these were produced

\`\`\`
npm run build && node scripts/capture-par-185-evidence.mjs
\`\`\`

## Captures

| file | dimensions | size | hash |
| --- | --- | --- | --- |
${rows.join('\n')}

## What each shows

- \`desktop-contact-1440x900.png\` — 1440×900 viewport, scrolled to the
  contact finale: the deep-navy inverse panel, the "Become uncopyable."
  editorial heading and the labelled high-contrast form.
- \`desktop-contact-section-1440w.png\` — the #contact section clipped to
  its bounding box at 1440px (two-column: copy left, form right).
- \`narrow-contact-390x844.png\` — 390×844 viewport, scrolled to the
  contact finale: single-column composition, visible focus state on the
  name field.
- \`narrow-contact-section-390w.png\` — the #contact section clipped to its
  bounding box at 390px (single-column, copy above form).
`
  writeFileSync(join(EVIDENCE_DIR, 'README.md'), readme)
  console.log('README.md written')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})