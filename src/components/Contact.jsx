import DotCanvas from './DotCanvas.jsx'
import Highlight from './Highlight.jsx'

export default function Contact() {
  return (
    <div id="contact">
      <div className="contact-panel">
        <DotCanvas />
        <div className="scrim" />
        <div className="contact-copy">
          <h2>
            Become <Highlight>uncopyable.</Highlight>
          </h2>
          <p>
            Tell us what you're trying to change. We'll tell you whether there's a
            useful first move — and if there isn't one, we'll say so.
          </p>
        </div>
        <div className="contact-form">
          <input placeholder="Name" />
          <input placeholder="Work email" />
          <textarea placeholder="What are you trying to change?" rows={4} />
          <button>Start a conversation</button>
        </div>
      </div>
    </div>
  )
}
