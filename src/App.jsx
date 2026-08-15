import Hero from './components/Hero.jsx'
import Approach from './components/Approach.jsx'
import Divider from './components/Divider.jsx'
import Programs from './components/Programs.jsx'
import Founder from './components/Founder.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <Hero />
      <div className="page">
        <Approach />
        <Divider />
        <Programs />
        <Founder />
        <Contact />
        <Footer />
      </div>
    </>
  )
}
