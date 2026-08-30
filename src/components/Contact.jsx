import { useState } from 'react'
import DotCanvas from './DotCanvas.jsx'
import Highlight from './Highlight.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

const FORM_ENDPOINT = 'https://formsubmit.co/ajax/francisco@moatstudio.ai'

/**
 * v2 editorial chapter 05 (PAR-185): "Become uncopyable."
 *
 * The closing contact conversion: a deep-navy inverse panel carrying the
 * original yellow dot texture and an editorial heading, paired with a
 * high-contrast, labelled, single-column form. The live contact contract
 * (FormSubmit endpoint, JSON field names, honeypot, loading/sent/error
 * states, success reset and the direct-email failure fallback) is preserved
 * exactly — only the presentation is rebuilt.
 *
 * #contact is a semantic <section> labelled by its H2. Every field has a
 * visible <label>; the sending/sent/error states are signalled in text
 * (button copy + an announced error note), never colour alone. The dot
 * canvas and scrim are decorative layers behind the content, hidden from
 * assistive technology.
 */
export default function Contact() {
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.target))
    if (data._honey) return // bot filled the hidden field
    setStatus('sending')
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
          _subject: 'New enquiry — moatstudio.ai',
          _captcha: 'false',
        }),
      })
      if (!res.ok) throw new Error(`FormSubmit responded ${res.status}`)
      setStatus('sent')
      e.target.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title">
      <div className="contact-panel">
        <DotCanvas />
        <div className="scrim" />
        <div className="contact-copy">
          <SectionEyebrow index="05" label="Contact" />
          <h2 id="contact-title">
            Become <Highlight>uncopyable.</Highlight>
          </h2>
          <p>
            Tell us what you're trying to change. We'll tell you whether there's a
            useful first move. If there isn't one, we'll say so.
          </p>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-field">
            <label className="contact-label" htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" placeholder="Your name" required />
          </div>
          <div className="contact-field">
            <label className="contact-label" htmlFor="contact-email">Work email</label>
            <input id="contact-email" name="email" type="email" placeholder="you@company.com" required />
          </div>
          <div className="contact-field">
            <label className="contact-label" htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" placeholder="What are you trying to change?" rows={4} required />
          </div>
          <input name="_honey" type="text" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true" />
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent — talk soon' : 'Start a conversation'}
          </button>
          {status === 'error' && (
            <p className="form-note" role="alert">
              Something went wrong. Email us directly at{' '}
              <a href="mailto:francisco@moatstudio.ai">francisco@moatstudio.ai</a>.
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
