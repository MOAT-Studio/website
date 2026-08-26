// PAR-171 evidence capture — fixture-only PNG captures of the Map your Moat
// result screen at the email gate and after unlock, at 390px (mobile) and
// 1440px (desktop). Drives a real headless Chrome (Chrome for Testing, from
// the local puppeteer cache) against the Vite dev server with fetch mocked
// to succeed or fail. No real data, no network submission: the mock
// intercepts at the page level, so FormSubmit is never contacted.
//
// Run: node scripts/capture-par-171-evidence.mjs
// Cleanup is in-process (node fs) — no shell rm/pkill — and the dev server
// is shut down via the child process handle this script owns.

import { spawn, execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import http from 'node:http'

const httpGet = (url, cb) => http.get(url, (res) => cb(res))

const require = createRequire(import.meta.url)
const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const REPO = path.resolve(ROOT)
const OUT = path.join(REPO, 'evidence', 'PAR-171')
const DEPS = path.join(REPO, 'node_modules')

// ── Resolve the local Chrome for Testing binary (puppeteer cache) ──
function findChrome() {
  const base = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome')
  if (!fs.existsSync(base)) return null
  const versions = fs.readdirSync(base).sort().reverse()
  for (const v of versions) {
    const candidate = path.join(
      base, v, 'chrome-mac-arm64',
      'Google Chrome for Testing.app', 'Contents', 'MacOS',
      'Google Chrome for Testing',
    )
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

const CHROME = findChrome()
if (!CHROME) {
  console.error('FATAL: no Chrome for Testing found in ~/.cache/puppeteer/chrome')
  process.exit(2)
}

// ── In-process evidence-directory reset (node fs, never shell rm) ──
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

// ── Start the Vite dev server on a fixed port; we own the child handle ──
const server = spawn('node', [
  DEPS + '/vite/bin/vite.js',
  '--port', '4171', '--strictPort',
], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] })

let serverReady = false
let serverLog = ''
server.stdout.on('data', (d) => {
  serverLog += d.toString()
  if (!serverReady && /Local:/.test(serverLog)) serverReady = true
})
server.stderr.on('data', (d) => { serverLog += d.toString() })

const killAll = () => {
  if (!server.killed) server.kill('SIGTERM')
}

const waitReady = async () => {
  const deadline = Date.now() + 45000
  while (Date.now() < deadline) {
    if (server.killed) throw new Error('dev server exited early:\n' + serverLog)
    if (serverReady) {
      const code = await new Promise((resolve) => {
        const req = httpGet(BASE + '/robots.txt', (res) => { resolve(res ? res.statusCode : 0); res && res.resume() })
        req.on('error', () => resolve(0))
      })
      if (code) return
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('dev server did not come up in 45s:\n' + serverLog)
}

const BASE = 'http://[::1]:4171'

// ── Drive the assessment to the result screen ──
async function toResultScreen(page) {
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#map-your-moat-cta')
  // 12 questions; clicking the first option selects it (radio pattern),
  // then the primary control advances.
  for (let i = 0; i < 12; i++) {
    if (await page.$('.moat-result')) break
    await page.waitForSelector('.moat-option', { visible: true, timeout: 10000 })
    await page.click('.moat-option')
    await page.waitForSelector('.moat-next:not([disabled])', { visible: true, timeout: 10000 })
    await page.click('.moat-next')
  }
  await page.waitForSelector('.moat-archetype', { visible: true, timeout: 15000 })
  await page.waitForSelector('.moat-gate', { visible: true, timeout: 15000 })
  await new Promise((r) => setTimeout(r, 300))
}

async function main() {
  const puppeteer = require(DEPS + '/puppeteer-core')
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--force-color-profile=srgb',
      '--hide-scrollbars',
      '--font-render-hinting=none',
    ],
  })

  const manifests = []
  try {
    await waitReady()
    .catch((err) => {
      console.error('READY-TIMEOUT server log:\n' + serverLog)
      throw err
    })
    console.log('dev server ready')

    const shots = [
      { name: 'result-gate-mobile', width: 390, height: 844, mock: 'success', fillEmail: true, submit: false, detailed: false, theme: 'night (v1 single theme)' },
      { name: 'result-revealed-mobile', width: 390, height: 844, mock: 'success', fillEmail: true, submit: true, detailed: true, theme: 'night (v1 single theme)' },
      { name: 'result-gate-error-mobile', width: 390, height: 844, mock: 'failure', fillEmail: true, submit: true, detailed: false, theme: 'night (v1 single theme)' },
      { name: 'result-gate-desktop', width: 1440, height: 900, mock: 'success', fillEmail: false, submit: false, detailed: false, theme: 'night (v1 single theme)' },
      { name: 'result-revealed-desktop', width: 1440, height: 900, mock: 'success', fillEmail: true, submit: true, detailed: true, theme: 'night (v1 single theme)' },
    ]

    for (const shot of shots) {
      const page = await browser.newPage()
      await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 1 })
      // Mock fetch before any app code runs: the FormSubmit endpoint and
      // nothing else (fonts/icons keep real behaviour; the page has no other
      // app fetches at the result screen).
      await page.evaluateOnNewDocument((mode) => {
        const realFetch = window.fetch
        window.fetch = (input, init) => {
          const url = typeof input === 'string' ? input : input.url
          if (url.includes('formsubmit.co')) {
            return Promise.resolve(new Response(
              mode === 'success' ? JSON.stringify({ ok: true }) : 'mock failure',
              {
                status: mode === 'success' ? 200 : 500,
                headers: { 'Content-Type': 'application/json' },
              },
            ))
          }
          return realFetch(input, init)
        }
      }, shot.mock)

      await toResultScreen(page)

      if (shot.fillEmail) {
        await page.click('#moat-gate-email')
        await page.type('#moat-gate-email', 'fixture.user@example.com')
      }

      if (shot.submit) {
        await page.click('.moat-gate-submit')
        // Wait for the terminal state of the gate (sent or error).
        await page.waitForFunction(
          () => {
            const submit = document.querySelector('.moat-gate-submit')
            if (!submit) return true
            return !submit.disabled
          },
          { timeout: 15000 },
        )
        await new Promise((r) => setTimeout(r, 400))
      }

      const pathOut = path.join(OUT, shot.name + '.png')
      await page.screenshot({ path: pathOut, fullPage: false })

      // Assert the expected DOM state actually matches the fixture intent.
      const state = await page.evaluate(() => ({
        detailedVisible: !!document.querySelector('.moat-detailed'),
        gateVisible: !!document.querySelector('.moat-gate-form'),
        errorNote: !!document.querySelector('.moat-gate-error'),
        fieldError: !!document.querySelector('.moat-gate-field-error'),
      }))
      const ok =
        (shot.detailed && state.detailedVisible) ||
        (!shot.detailed && state.gateVisible && (shot.mock === 'failure' ? state.errorNote : !state.errorNote))
      if (!ok) throw new Error(`fixture state mismatch for ${shot.name}: ${JSON.stringify(state)}`)

      const dims = await page.evaluate(() => ({
        w: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      }))
      manifests.push({
        file: pathOut,
        dimensions: `${shot.width}x${shot.height}`,
        theme: shot.theme,
        fixture: `answers = all first options (12x A) → ${'Compounding'} archetype`,
        mock: shot.mock,
        submit: shot.submit,
        detail: shot.name === 'result-revealed-mobile' ? 'detailed section revealed after mocked success'
          : shot.name === 'result-gate-error-mobile' ? 'honest failure note shown after mocked 500'
          : 'gate shown, email ' + (shot.fillEmail ? 'filled' : 'empty') + ', no submission',
        overflowCheck: dims.overflow ? 'OVERFLOW DETECTED' : 'no horizontal overflow',
      })
      console.log(`captured ${shot.name} (${shot.width}x${shot.height}) ${dims.overflow ? 'OVERFLOW!' : 'ok'}`)
      await page.close()
    }
  } finally {
    await browser.close().catch(() => {})
    killAll()
    // Give the child a moment, then confirm it is gone via the handle.
    await new Promise((r) => setTimeout(r, 500))
    if (!server.killed) server.kill('SIGKILL')
  }

  fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify(manifests, null, 2))
  console.log('manifest written: ' + path.join(OUT, '_manifest.json'))
}

main()
  .then(() => { console.log('DONE'); process.exit(0) })
  .catch((err) => { console.error('CAPTURE FAILED:', err.message); killAll(); process.exit(1) })