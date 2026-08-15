import { useEffect, useRef } from 'react'

/**
 * Interactive dot-grid canvas: a slow idle wave plus a pointer-proximity
 * glow that fades out over `fade` seconds. Fills its positioned parent.
 */
export default function DotCanvas({ step = 16, fade = 5 }) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const t0 = performance.now()
    const hold = Math.pow(0.012, 1 / (fade * 60))
    const R = 130
    let W, H, g, raf = 0
    let dots = []
    let mx = -999, my = -999

    function size() {
      W = cv.clientWidth
      H = cv.clientHeight
      cv.width = W * dpr
      cv.height = H * dpr
      g = cv.getContext('2d')
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function build() {
      dots = []
      for (let y = step / 2; y < H; y += step)
        for (let x = step / 2; x < W; x += step) dots.push({ x, y, e: 0 })
    }
    size()
    build()

    const onMove = (ev) => {
      const r = cv.getBoundingClientRect()
      mx = ev.clientX - r.left
      my = ev.clientY - r.top
    }
    const onLeave = () => { mx = -999; my = -999 }
    const onResize = () => { size(); build() }
    window.addEventListener('pointermove', onMove)
    cv.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)

    function draw(now) {
      const t = (now - t0) / 1000
      g.clearRect(0, 0, W, H)
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        if (mx > -900) {
          const dist = Math.hypot(d.x - mx, d.y - my)
          if (dist < R) d.e = Math.min(1, d.e + (1 - dist / R) * 0.09)
        }
        d.e *= hold
        const idle = 0.5 + 0.5 * Math.sin(d.x * 0.017 + d.y * 0.011 - t * 1.1)
        const lit = Math.min(1, idle * 0.42 + d.e)
        g.beginPath()
        g.arc(d.x, d.y, 1.2 + lit * 2.2, 0, 6.2832)
        g.fillStyle = 'rgba(255,' + Math.round(248 - 23 * lit) + ',' + Math.round(225 - 225 * lit) + ',' + (0.16 + 0.7 * lit) + ')'
        g.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw(performance.now())

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      cv.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [step, fade])

  return <canvas ref={ref} className="dot-canvas" />
}
