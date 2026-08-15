export default function Founder() {
  return (
    <div id="founder">
      <img
        src="/assets/founder.jpg"
        alt="Francisco Varisco"
        className="founder-photo"
      />
      <div className="founder-body">
        <h2>
          <a href="https://franciscovarisco.com" className="founder-name">
            <span className="founder-name-lines">
              <span>I am</span>
              <span>francisco</span>
            </span>
            <img src="/assets/xico-mark.png" alt="" className="founder-mark" />
          </a>
        </h2>
        <p>
          Twenty years building technology inside real businesses. Still curious enough
          to take things apart to see why they work.
        </p>
        <p>
          Based in Brisbane, Australia.
        </p>
        <span className="founder-links">
          <a href="https://franciscovarisco.com" className="mono-link">franciscovarisco.com</a>
          <span className="sep">•</span>
          <a href="https://linkedin.com/in/xicovarisco" className="mono-link">linkedin.com/in/xicovarisco</a>
        </span>
      </div>
    </div>
  )
}
