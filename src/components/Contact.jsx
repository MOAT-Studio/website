import { useState } from 'react'
import BrushMark from './BrushMark.jsx'
import HeroOrb from './HeroOrb.jsx'
import SectionEyebrow from './SectionEyebrow.jsx'

const FORM_ENDPOINT = 'https://formsubmit.co/ajax/francisco@moatstudio.ai'

/**
 * v3 editorial chapter 05 (PAR-186): "Become uncopyable."
 *
 * The closing conversion: a deep-navy panel with the solar body
 * cresting out of its bottom-left corner, an editorial display heading,
 * and the form as three outlined fields over one solar action. The live
 * contact contract (FormSubmit endpoint, JSON field names, honeypot,
 * loading/sent/error states, success reset and the direct-email failure
 * fallback) is preserved exactly — only the presentation is rebuilt.
 *
 * #contact is a semantic <section> labelled by its H2. Every field
 * still has its own <label> in the DOM; the concept places the field
 * name inside the control, so the label is visually hidden rather than
 * removed — screen readers announce every field, and the placeholder
 * repeats the same words for everyone else. The sending/sent/error
 * states are signalled in text (button copy plus an announced error
 * note), never colour alone. The orb, brush mark and dot canvas are
 * decorative layers behind the content and never sit over a label.
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
      <BrushMark shape="sweep" width={210} className="contact-brush" />
      <div className="contact-panel">
        <div className="contact-marks" aria-hidden="true">
          <HeroOrb size={420} variant="sphere" className="contact-orb" />
        </div>
        <div className="contact-copy">
          <SectionEyebrow index="05" label="Contact" />
          <h2 id="contact-title" className="section-title contact-title">
            <span className="line">Become</span>{' '}
            <span className="line">
              uncopyable<span className="title-dot" aria-hidden="true" />
            </span>
          </h2>
          <p>Tell us what you&rsquo;re trying to change.</p>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-field">
            <label className="visually-hidden" htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" placeholder="Name" required />
          </div>
          <div className="contact-field">
            <label className="visually-hidden" htmlFor="contact-email">Work email</label>
            <input id="contact-email" name="email" type="email" placeholder="Work email" required />
          </div>
          <div className="contact-field">
            <label className="visually-hidden" htmlFor="contact-message">What are you trying to change?</label>
            <textarea id="contact-message" name="message" placeholder="What are you trying to change?" rows={4} required />
          </div>
          <input name="_honey" type="text" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true" />
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent — talk soon' : 'Start a conversation'}
            <span className="link-glyph" aria-hidden="true">&#8594;</span>
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
