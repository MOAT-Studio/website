import { useCallback, useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Hero from './components/Hero.jsx'
import Approach from './components/Approach.jsx'
import Programs from './components/Programs.jsx'
import ProofPrinciples from './components/ProofPrinciples.jsx'
import Founder from './components/Founder.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import MapYourMoat from './components/MapYourMoat.jsx'
import MoatBanner from './components/MoatBanner.jsx'

export default function App() {
  const [assessmentOpen, setAssessmentOpen] = useState(false)

  // #map-your-moat deep-links straight into the assessment. Read in an effect
  // only: production HTML is prerendered and has no window.
  useEffect(() => {
    if (window.location.hash === '#map-your-moat') setAssessmentOpen(true)
  }, [])

  const openAssessment = useCallback(() => setAssessmentOpen(true), [])

  const closeAssessment = useCallback(() => {
    setAssessmentOpen(false)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    // Hand focus back to the banner CTA that opens the assessment; the
    // hero title is the fallback for the #map-your-moat deep-link path.
    const trigger =
      document.getElementById('map-your-moat-cta') || document.getElementById('hero-title')
    trigger?.focus()
  }, [])

  return (
    <>
      <Hero />
      <MoatBanner onOpen={openAssessment} />
      <div className="page">
        <Approach />
      </div>
      {/* The process slab is full-bleed: it sits outside .page so the navy
          runs edge to edge, and manages its own max-width inside. */}
      <Programs />
      <div className="page">
        <ProofPrinciples />
        <Founder />
        <Contact />
        <Footer />
      </div>
      {assessmentOpen && <MapYourMoat onClose={closeAssessment} />}
      <Analytics />
    </>
  )
}
