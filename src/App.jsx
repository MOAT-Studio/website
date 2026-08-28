import { useCallback, useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Hero from './components/Hero.jsx'
import Approach from './components/Approach.jsx'
import Divider from './components/Divider.jsx'
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

  const openAssessment = useCallback(() => {
    setAssessmentOpen(true)
    history.replaceState(null, '', '#map-your-moat')
  }, [])

  const closeAssessment = useCallback(() => {
    setAssessmentOpen(false)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    document.getElementById('map-your-moat-cta')?.focus()
  }, [])

  return (
    <>
      <Hero onOpenAssessment={openAssessment} />
      <div className="page">
        <Approach />
        <Divider />
        <Programs />
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
