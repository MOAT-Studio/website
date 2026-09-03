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

export default function App() {
  const [assessmentOpen, setAssessmentOpen] = useState(false)

  // #map-your-moat deep-links straight into the assessment. Read in an effect
  // only: production HTML is prerendered and has no window.
  useEffect(() => {
    if (window.location.hash === '#map-your-moat') setAssessmentOpen(true)
  }, [])

  const closeAssessment = useCallback(() => {
    setAssessmentOpen(false)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    // The hero CTA that used to open the assessment is gone (PAR-186), so
    // return focus to the top of the page rather than dropping it on <body>.
    document.getElementById('hero-title')?.focus()
  }, [])

  return (
    <>
      <Hero />
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
