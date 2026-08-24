import { useEffect, useMemo, useRef, useState } from 'react'
import {
  QUESTIONS,
  scoreAnswers,
  archetypeFor,
  LOCKED_PREVIEW,
  DISCLAIMER,
} from '../data/moatAssessment.js'

// Full-screen, in-app "Map your Moat" POC (PAR-170). Pure client state:
// no route, no network, no storage — answers live and die in this component.
// Question bank and scoring rules live in src/data/moatAssessment.js.

const TOTAL = QUESTIONS.length
const RESULT_STEP = TOTAL // steps 0..11 are questions; TOTAL = result screen

export default function MapYourMoat({ onClose }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(() => Array(TOTAL).fill(null))
  const headingRef = useRef(null)
  const rootRef = useRef(null)
  const optionRefs = useRef([])

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
        'button:not([disabled]):not([tabindex="-1"])',
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

            <div className="moat-locked" aria-label="Locked: coming in the production assessment">
              <p className="moat-locked-title">
                <span aria-hidden="true">🔒 </span>Coming in the production assessment
              </p>
              <ul className="moat-locked-list">
                {LOCKED_PREVIEW.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="moat-locked-note">
                Not available in this prototype — no sign-up will unlock it yet, and nothing you answered here has been stored or sent.
              </p>
            </div>

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
