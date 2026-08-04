/**
 * MOAT Studio landing — minimal JS.
 * Adds skip-link, respects reduced-motion preference, and wires the contact destination.
 */

(function () {
  'use strict';

  // Contact destination — set this constant to wire a real email or URL.
  // When empty, the placeholder "Contact details coming soon" is shown.
  var CONTACT_URL = ''; // e.g. 'mailto:hello@moatstudio.com' or 'https://calendly.com/...'

  // Skip-to-content link (accessibility)
  var skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Respect prefers-reduced-motion: disable any JS-driven animations
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    document.documentElement.classList.add('reduce-motion');
  }

  // Wire contact CTA — replace placeholder with real link if CONTACT_URL is set
  var placeholder = document.querySelector('.contact-cta-placeholder');
  if (placeholder && CONTACT_URL) {
    var actionEl = placeholder.parentElement;
    actionEl.removeAttribute('role');
    var link = document.createElement('a');
    link.href = CONTACT_URL;
    link.className = 'contact-cta';
    link.textContent = 'Start a conversation';
    actionEl.innerHTML = '';
    actionEl.appendChild(link);
  }
})();
