// Injects the server-rendered app into dist/index.html so the full page
// content is present in the raw HTML (AI crawlers don't execute JS).
// Runs after `vite build` + `vite build --ssr`; see the build script.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const ssrDir = fileURLToPath(new URL('../dist-ssr/', import.meta.url))

const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url))
const appHtml = render()

const htmlPath = dist + 'index.html'
const template = readFileSync(htmlPath, 'utf8')
const marker = '<div id="root"></div>'
if (!template.includes(marker)) {
  throw new Error(`prerender: marker ${marker} not found in dist/index.html`)
}
writeFileSync(htmlPath, template.replace(marker, `<div id="root">${appHtml}</div>`))
rmSync(ssrDir, { recursive: true, force: true })

console.log(`prerender: injected ${appHtml.length} chars of HTML into dist/index.html`)
