/**
 * "Find your starting point" band: the visible entry into the Map your
 * Moat assessment, restored after the PAR-186 rebuild dropped the old
 * hero CTA. A slim full-bleed navy strip between the hero rail and the
 * Approach chapter — solar mono eyebrow, one solid solar action, and
 * the mono cost-of-entry note ("12 questions · 3 minutes · no sign-up")
 * so the ask is priced before the click. The overlay itself stays
 * App-owned state; this band only triggers it, and keeps the historic
 * #map-your-moat-cta id so close can hand focus back here.
 */
export default function MoatBanner({ onOpen }) {
  return (
    <section className="moat-banner" aria-label="Map your moat assessment">
      <div className="moat-banner-inner">
        <p className="moat-banner-eyebrow">
          Find your starting point
          <span className="moat-banner-rule" aria-hidden="true" />
        </p>
        <div className="moat-banner-row">
          <button
            type="button"
            id="map-your-moat-cta"
            className="moat-banner-cta"
            onClick={onOpen}
          >
            Map your moat
          </button>
          <span className="moat-banner-note">12 questions · 3 minutes · no sign-up</span>
        </div>
      </div>
    </section>
  )
}
