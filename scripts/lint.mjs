// Zero-dependency lint for the MOAT Studio site (PAR-179).
// The repo has no ESLint and the ticket forbids new dependencies, so this
// script uses only Node built-ins plus esbuild (already present via Vite)
// for JSX syntax checking. Run with `npm run lint`.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0

function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// 1. JSX/JS syntax — every source file must parse.
const srcFiles = walk(join(root, 'src')).filter((f) => /\.(jsx?|mjs)$/.test(f))
for (const f of srcFiles) {
  const loader = f.endsWith('.jsx') ? 'jsx' : 'js'
  try {
    transformSync(readFileSync(f, 'utf8'), { loader })
    check(`syntax ${relative(root, f)}`, true)
  } catch (err) {
    check(`syntax ${relative(root, f)}`, false, err.message.split('\n')[0])
  }
}

// 2. CSS structure — balanced braces, no unclosed comments in index.css.
const css = readFileSync(join(root, 'src', 'index.css'), 'utf8')
{
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const open = (noComments.match(/{/g) || []).length
  const close = (noComments.match(/}/g) || []).length
  check('css braces balanced', open === close, `open ${open} vs close ${close}`)
  check('css comments closed', !/\/\*(?![\s\S]*?\*\/)/.test(css))
}

// 3. No new external fetches — every http(s) host referenced by the app
//    must be on the allowlist (fonts, form endpoint, canonical/OG URLs).
const ALLOWED_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'formsubmit.co',
  'schema.org',
  'moatstudio.ai',
  'franciscovarisco.com',
  'linkedin.com',
  // JSON-LD sameAs reference in index.html (metadata, not a fetch).
  'github.com',
])
{
  const files = [...srcFiles, join(root, 'index.html')]
  const hosts = new Set()
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
      hosts.add(m[1].toLowerCase())
    }
  }
  const unknown = [...hosts].filter((h) => !ALLOWED_HOSTS.has(h))
  check('no external fetches outside allowlist', unknown.length === 0, `unexpected hosts: ${unknown.join(', ')}`)
}

// 4. Reduced-motion default is present (acceptance criterion).
check('prefers-reduced-motion block', css.includes('@media (prefers-reduced-motion: reduce)'))

// 5. v2 tokens exist and the primitives consume them (acceptance criterion).
for (const token of ['--moat-paper', '--moat-navy', '--moat-solar', '--moat-red', '--moat-ease']) {
  check(`token ${token}`, css.includes(`${token}:`))
}
// The SVG marks carry their colours inline, so they must use the tokens
// directly. SectionEyebrow is styled from index.css, so instead check that
// its classes are token-styled there.
for (const prim of ['BrushMark.jsx', 'HeroOrb.jsx', 'InkArrow.jsx']) {
  const code = readFileSync(join(root, 'src', 'components', prim), 'utf8')
  check(`${prim} uses v2 tokens`, code.includes('var(--moat-'))
}
{
  const start = css.indexOf('.section-eyebrow {')
  const end = css.indexOf('/* Numeral disc', start)
  const eyebrow = css.slice(start, end === -1 ? undefined : end)
  check('SectionEyebrow classes use v2 tokens', eyebrow.includes('var(--moat-'))
}
// 6. The display face must be loaded, not merely named — v2 relied on a
//    system condensed stack that most readers did not have (PAR-186).
{
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  check('Anton display face is loaded', /fonts\.googleapis\.com\/css2\?[^"']*family=Anton/.test(html))
  check('display token points at Anton', /--moat-font-display:\s*Anton/.test(css))
}

// 7. Motion safety (PAR-187). The reduced-motion block must be the
//    catch-all, not a list of selectors that silently falls behind the next
//    keyframe; and no scroll-reveal from-state may exist outside the
//    JS-applied `.ink-armed` scope, or content could hang undrawn with
//    JavaScript disabled.
{
  const reduceBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
  check('reduced-motion collapses all animation', reduceBlock.includes('animation-duration: .01ms'))
  check('reduced-motion collapses all transitions', reduceBlock.includes('transition-duration: .01ms'))

  const undrawn = [...css.matchAll(/^[^\n{]*\[data-ink\]:not\(\.is-inked\)[^\n{]*\{/gm)]
  const unscoped = undrawn.filter((m) => !m[0].includes('html.ink-armed'))
  check(
    'every [data-ink] from-state is scoped to .ink-armed',
    unscoped.length === 0,
    `unscoped: ${unscoped.map((m) => m[0].trim()).join(' | ')}`,
  )
}

console.log(failures === 0 ? '\nlint: all checks passed' : `\nlint: ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
