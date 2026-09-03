import { useEffect } from 'react'

/**
 * The page's single reveal observer (PAR-187). Called once, from App.
 *
 * The contract is the important part. **The DOM default is the finished
 * state**: every from-state in index.css is authored as
 *
 *     html.ink-armed [data-ink]:not(.is-inked) { …undrawn… }
 *
 * and only this hook adds `ink-armed`. So with JavaScript off, failed, or
 * a reduced-motion preference, the page is simply the finished print —
 * there is no fallback path to get wrong and nothing can hang invisible.
 *
 * Arming happens without a flash. useEffect runs after paint, so arming an
 * element that is already on screen would snap it to the undrawn state and
 * flash it. Everything currently in the viewport is therefore marked
 * `is-inked` first, in the same synchronous block, before `ink-armed` goes
 * on — both mutations land before the next paint. (This matters: #approach
 * starts at y≈830, so its eyebrow rule is on screen at load on any display
 * taller than about 900px.)
 *
 * One observer for the whole page, one shot per element, no scroll handler.
 */
export default function useInkReveal({ threshold = 0.35 } = {}) {
  useEffect(() => {
    // Production HTML is prerendered, so this must never run during render.
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    const targets = [...document.querySelectorAll('[data-ink]')]
    if (targets.length === 0) return

    const pending = []
    for (const el of targets) {
      // Already seen — leave it at rest rather than replaying it at the reader.
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-inked')
      else pending.push(el)
    }
    document.documentElement.classList.add('ink-armed')

    const remaining = new Set(pending)
    const reveal = (el) => {
      el.classList.add('is-inked')
      remaining.delete(el)
      io.unobserve(el)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal on intersection — or if the element is already above the
          // viewport. A fast scroll or an anchor jump can carry a section
          // past without it ever reporting as intersecting, and a target
          // that is never revealed would keep its undrawn state forever.
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) reveal(entry.target)
        }
      },
      // The 0 threshold catches any appear/disappear crossing; 0.35 is the
      // one that actually times the reveal.
      { threshold: [0, threshold], rootMargin: '0px 0px -6% 0px' },
    )
    for (const el of pending) io.observe(el)

    // Backstop for the one case the observer can miss: a jump so large that
    // a section goes from below the fold to above it without ever crossing a
    // threshold. scrollend fires once per gesture, not per frame.
    const sweep = () => {
      for (const el of [...remaining]) {
        if (el.getBoundingClientRect().top < window.innerHeight) reveal(el)
      }
      if (remaining.size === 0) window.removeEventListener('scrollend', sweep)
    }
    const hasScrollEnd = 'onscrollend' in window
    if (hasScrollEnd) window.addEventListener('scrollend', sweep, { passive: true })

    return () => {
      io.disconnect()
      if (hasScrollEnd) window.removeEventListener('scrollend', sweep)
      document.documentElement.classList.remove('ink-armed')
    }
  }, [threshold])
}
