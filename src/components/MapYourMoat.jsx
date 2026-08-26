import { useEffect, useMemo, useRef, useState } from 'react'
import {
  QUESTIONS,
  scoreAnswers,
  archetypeFor,
  DISCLAIMER,
  DETAILED_RECOMMENDATIONS,
  GATE_SUBJECT,
  GATE_PRIVACY,
  GATE_ERROR_NOTE,
  MOAT_CONTACT_EMAIL,
  dimensionSummary,
} from '../data/moatAssessment.js'

// Full-screen, in-app "Map your Moat" POC (PAR-170) with the PAR-171 lead
// hand-off: the result screen reveals the free headline (score + archetype),
// then gates the detailed recommendations behind a required, accessible
// email field. Answers live and die in this component; the only transport is
// a browser-side FormSubmit notification to Francisco — no routes, no
// storage, no visitor-visible result email. Question bank, scoring and the
// gate copy live in src/data/moatAssessment.js.

const FORM_ENDPOINT = 'https://formsubmit.co/ajax/francisco@moatstudio.ai'

// Syntactic email check for the gate; the HTML `type="email"` validation is
// the browser's first line and this guards the JS path (keyboard submits,
// programmatic dispatch) so a malformed value can never be sent or reveal
// the detailed section.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TOTAL = QUESTIONS.length
const RESULT_STEP = TOTAL // steps 0..11 are questions; TOTAL = result screen

export default function MapYourMoat({ onClose }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(() => Array(TOTAL).fill(null))
  const headingRef = useRef(null)
  const rootRef = useRef(null)
  const optionRefs = useRef([])

  // PAR-171 lead gate: required email + explicit optional marketing
  // consent (default off). The detailed recommendations stay hidden until
  // a syntactically valid email is submitted successfully.
  const [gateEmail, setGateEmail] = useState('')
  const [gateConsent, setGateConsent] = useState(false)
  const [gateStatus, setGateStatus] = useState('idle') // idle|sending|sent|error
  const [gateError, setGateError] = useState('')
  const [revealed, setRevealed] = useState(false)
  const emailRef = useRef(null)

  const atResult = step === RESULT_STEP
  const question = atResult ? null : QUESTIONS[step]
  const answered = !atResult && answers[step] != null

  // Endowed progress: the bar starts at ~12% on question 1 and reaches 100% at the result.
  const progressPct = atResult ? 100 : Math.round(12 + (step / TOTAL) * 88)

  const result = useMemo(
    () => (atResult ? scoreAnswers(answers) : null),
    [atResult, answers],
  )
  const archetype = result ? archetypeFor(result) : null

  // Lock page scroll behind the overlay; restore on close.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape returns to the site; Tab is trapped inside the dialog so focus
  // can never land on the page hidden behind the overlay. Heading takes focus
  // on every step so keyboard and screen-reader position follows the flow.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !rootRef.current) return
      const focusables = rootRef.current.querySelectorAll(
        'button:not([disabled]):not([tabindex="-1"]), input:not([tabindex="-1"]), [tabindex="0"]',
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !rootRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !rootRef.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const choose = (optionIndex) => {
    setAnswers((prev) => {
      const next = prev.slice()
      next[step] = optionIndex
      return next
    })
  }

  // Radio-group keyboard pattern: arrows move (and select) within the group,
  // and only the selected option — or the first, before any answer — is in
  // the tab order.
  const onOptionsKey = (e) => {
    const count = question.options.length
    const current = answers[step]
    let target
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      target = current == null ? 0 : (current + 1) % count
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      target = current == null ? count - 1 : (current - 1 + count) % count
    } else if (e.key === 'Home') {
      target = 0
    } else if (e.key === 'End') {
      target = count - 1
    } else {
      return
    }
    e.preventDefault()
    choose(target)
    optionRefs.current[target]?.focus()
  }

  const goNext = () => {
    if (answered) setStep((s) => Math.min(s + 1, RESULT_STEP))
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0))
  const restart = () => {
    setAnswers(Array(TOTAL).fill(null))
    setStep(0)
  }

  // PAR-171: a separate Map your Moat submission handler — the Contact form
  // keeps its own untouched FormSubmit flow. Sends Francisco one concise
  // notification: captured email, timestamp, provisional score, archetype
  // and per-dimension summary. Never the raw answer text.
  async function handleGateSubmit(e) {
    e.preventDefault()
    const email = gateEmail.trim()
    if (!EMAIL_RE.test(email)) {
      setGateError('Enter a syntactically valid email so we can follow up.')
      emailRef.current?.focus()
      return
    }
    if (gateStatus === 'sending') return
    setGateError('')
    setGateStatus('sending')
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          marketingConsent: gateConsent ? 'yes' : 'no',
          timestamp: new Date().toISOString(),
          provisionalScore: `${result.moat} / 100 moat strength, ${result.exposure} / 100 AI exposure`,
          archetype: `${archetype.name} (${archetype.reading})`,
          dimensionSummary: Object.values(dimensionSummary(answers))
            .map((d) => `${d.label}: ${d.score} / 100`)
            .join('; '),
          _subject: GATE_SUBJECT,
          _template: 'table',
          _captcha: 'false',
        }),
      })
      if (!res.ok) throw new Error(`FormSubmit responded ${res.status}`)
      setGateStatus('sent')
      setRevealed(true)
    } catch {
      setGateStatus('error')
    }
  }

  return (
    <div ref={rootRef} className="moat-assess" role="dialog" aria-modal="true" aria-label="Map your Moat assessment">
      <div className="moat-assess-inner">
        <div className="moat-assess-bar">
          <span className="moat-assess-brand">Map your <span className="moat-assess-accent">moat</span></span>
          <button type="button" className="moat-assess-exit" onClick={onClose}>
            Return to site
          </button>
        </div>

        <div
          className="moat-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Assessment progress"
        >
          <div className="moat-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {!atResult && (
          <div className="moat-question" key={question.id}>
            <p className="moat-step-label">Question {step + 1} of {TOTAL}</p>
            <h2 ref={headingRef} tabIndex={-1} className="moat-prompt">
              {question.prompt}
            </h2>
            <div
              className="moat-options"
              role="radiogroup"
              aria-label={question.prompt}
              onKeyDown={onOptionsKey}
            >
              {question.options.map((option, i) => (
                <button
                  key={option.label}
                  ref={(el) => { optionRefs.current[i] = el }}
                  type="button"
                  role="radio"
                  aria-checked={answers[step] === i}
                  tabIndex={(answers[step] ?? 0) === i ? 0 : -1}
                  className={answers[step] === i ? 'moat-option selected' : 'moat-option'}
                  onClick={() => choose(i)}
                >
                  <span className="moat-option-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="moat-controls">
              <button type="button" className="moat-back" onClick={goBack} disabled={step === 0}>
                Back
              </button>
              <button type="button" className="moat-next" onClick={goNext} disabled={!answered}>
                {step === TOTAL - 1 ? 'See your reading' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {atResult && (
          <div className="moat-result">
            <p className="moat-step-label">Provisional reading</p>
            <h2 ref={headingRef} tabIndex={-1} className="moat-archetype">
              {archetype.name}
            </h2>
            <p className="moat-archetype-reading">{archetype.reading}</p>

            <div className="moat-scores">
              <div className="moat-score">
                <span className="moat-score-num">{result.moat}</span>
                <span className="moat-score-label">Moat strength / 100</span>
              </div>
              <div className="moat-score">
                <span className="moat-score-num">{result.exposure}</span>
                <span className="moat-score-label">AI exposure / 100</span>
              </div>
            </div>

            <p className="moat-summary">{archetype.summary}</p>
            <p className="moat-disclaimer">{DISCLAIMER}</p>

            {revealed && (
              <section className="moat-detailed" aria-label="Detailed recommendations">
                <h3 className="moat-detailed-title">Your detailed reading</h3>
                <p className="moat-detailed-intro">
                  Three things the production assessment opens with, on the back of the provisional reading above:
                </p>
                <ul className="moat-detailed-list">
                  {DETAILED_RECOMMENDATIONS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {!revealed && (
              <section
                className="moat-gate"
                aria-label="Unlock your detailed recommendations"
              >
                <h3 className="moat-gate-title">
                  <span aria-hidden="true">🔓 </span>See your detailed recommendations
                </h3>
                <p className="moat-gate-copy">
                  The free reading above is the headline. The detailed recommendations —
                  your per-dimension breakdown, benchmark context and prioritised next move —
                  unlock here. Enter your email to receive your reading.
                </p>
                <form className="moat-gate-form" onSubmit={handleGateSubmit}>
                  <label className="moat-gate-label" htmlFor="moat-gate-email">
                    Your email <span className="moat-gate-req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="moat-gate-email"
                    ref={emailRef}
                    className="moat-gate-input"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    aria-describedby="moat-gate-privacy"
                    disabled={gateStatus === 'sending'}
                  />
                  {gateError && (
                    <p className="moat-gate-field-error" role="alert">
                      {gateError}
                    </p>
                  )}
                  <label className="moat-gate-consent">
                    <input
                      type="checkbox"
                      className="moat-gate-checkbox"
                      checked={gateConsent}
                      onChange={(e) => setGateConsent(e.target.checked)}
                      disabled={gateStatus === 'sending'}
                    />
                    <span>
                      Optional — also send me occasional Moat Studio marketing. You can
                      unsubscribe anytime.
                    </span>
                  </label>
                  <p id="moat-gate-privacy" className="moat-gate-privacy">
                    {GATE_PRIVACY}
                  </p>
                  <button
                    type="submit"
                    className="moat-next moat-gate-submit"
                    disabled={gateStatus === 'sending'}
                  >
                    {gateStatus === 'sending' ? 'Sending…' : 'Unlock my detailed reading'}
                  </button>
                  {gateStatus === 'error' && (
                    <p className="moat-gate-error" role="alert">
                      {GATE_ERROR_NOTE.replace('{email}', MOAT_CONTACT_EMAIL)}
                    </p>
                  )}
                </form>
              </section>
            )}

            <div className="moat-controls">
              <button type="button" className="moat-back" onClick={restart}>
                Restart
              </button>
              <button type="button" className="moat-next" onClick={onClose}>
                Return to site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
