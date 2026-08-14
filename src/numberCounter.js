/**
 * Scroll-Activated Number Counter Utility
 * High-performance, 60fps/120fps numeric count-up animation for stats, metrics & badges.
 */

// Custom Easing: Exponential Cubic Out for responsive, silky feel
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Parses numeric text strings into prefix, target value, suffix, decimals, and leading zero padding.
 * Examples:
 *   "429 PTS"      -> { prefix: "", targetNum: 429, suffix: " PTS", decimals: 0, padLen: 0 }
 *   "4.259 KM"     -> { prefix: "", targetNum: 4.259, suffix: " KM", decimals: 3, padLen: 0 }
 *   "234.8 KM/H"   -> { prefix: "", targetNum: 234.8, suffix: " KM/H", decimals: 1, padLen: 0 }
 *   "01"           -> { prefix: "", targetNum: 1, suffix: "", decimals: 0, padLen: 2 }
 *   "ROUND 12"     -> { prefix: "ROUND ", targetNum: 12, suffix: "", decimals: 0, padLen: 0 }
 */
export function parseNumberString(text) {
  if (!text) return null;
  const trimmed = text.trim();

  // Skip date ranges (e.g. "21 – 23 AUG 2026")
  if (/^\d{1,2}\s*–\s*\d{1,2}/.test(trimmed)) {
    return null;
  }

  // Regex to extract optional prefix, signed float/int number, and optional suffix
  const match = trimmed.match(/^([^\d\-.]*)(-?\d+(?:\.\d+)?)([\s\S]*)$/);
  if (!match) return null;

  const prefix = match[1];
  const rawNumStr = match[2];
  const suffix = match[3];

  const targetNum = parseFloat(rawNumStr);
  if (isNaN(targetNum)) return null;

  // Check decimal places
  const dotIdx = rawNumStr.indexOf('.');
  const decimals = dotIdx >= 0 ? rawNumStr.length - dotIdx - 1 : 0;

  // Check leading zeros (e.g., "01", "02")
  const isPadded = /^0\d+$/.test(rawNumStr);
  const padLen = isPadded ? rawNumStr.length : 0;

  return {
    prefix,
    targetNum,
    suffix,
    decimals,
    padLen,
    rawNumStr
  };
}

/**
 * Animates a single DOM element containing numeric data from 0 up to its target value.
 * @param {HTMLElement} el 
 * @param {number} duration Duration in ms (default: 1300ms)
 */
export function animateCounterElement(el, duration = 1300) {
  if (!el) return;

  // Read original target text from data attribute if previously stored, or save current inner text
  let originalText = el.getAttribute('data-counter-target');
  if (!originalText) {
    originalText = el.textContent.trim();
    el.setAttribute('data-counter-target', originalText);
  }

  const parsed = parseNumberString(originalText);
  if (!parsed) return;

  const { prefix, targetNum, suffix, decimals, padLen } = parsed;

  // Cancel any existing running animation on this element
  if (el._counterAnimFrame) {
    cancelAnimationFrame(el._counterAnimFrame);
    el._counterAnimFrame = null;
  }

  const startTime = performance.now();
  const startNum = 0;

  function updateFrame(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = easeOutCubic(progress);

    const currentVal = startNum + (targetNum - startNum) * easedProgress;
    let formattedVal = currentVal.toFixed(decimals);

    if (padLen > 0) {
      const parts = formattedVal.split('.');
      parts[0] = parts[0].padStart(padLen, '0');
      formattedVal = parts.join('.');
    }

    el.textContent = `${prefix}${formattedVal}${suffix}`;

    if (progress < 1) {
      el._counterAnimFrame = requestAnimationFrame(updateFrame);
    } else {
      // Ensure final exact text matches original target string
      el.textContent = originalText;
      el.setAttribute('data-counter-animated', 'true');
      el._counterAnimFrame = null;
    }
  }

  // Set initial 0 state immediately
  let initialFormatted = (0).toFixed(decimals);
  if (padLen > 0) {
    const parts = initialFormatted.split('.');
    parts[0] = parts[0].padStart(padLen, '0');
    initialFormatted = parts.join('.');
  }
  el.textContent = `${prefix}${initialFormatted}${suffix}`;

  el._counterAnimFrame = requestAnimationFrame(updateFrame);
}

// Store global IntersectionObserver instance
let counterObserver = null;

/**
 * Default selectors targeting numeric elements across main dashboard, hall of fame, modal and article pages.
 */
const DEFAULT_COUNTER_SELECTORS = [
  '[data-counter]',
  '.counter-value',
  '.p3-mstat-val',
  '.p3-points-num',
  '.p3-met-val',
  '.p3-s-wins',
  '.p3-s-year',
  '.p3-ttel-val',
  '.p5-meta-year',
  '.am-stat-val',
  '.am-stat-item-val',
  '.am-hero-watermark',
  '.wdc-year-watermark',
  '.wdc-stat-val',
  '.fs-num',
  '.fs-photo-tag'
];

/**
 * Scans document for counter elements and attaches IntersectionObserver.
 * @param {string|string[]} customSelectors Optional additional CSS selectors to observe.
 */
export function initNumberCounters(customSelectors = []) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const selectors = Array.isArray(customSelectors)
    ? [...DEFAULT_COUNTER_SELECTORS, ...customSelectors]
    : [DEFAULT_COUNTER_SELECTORS, customSelectors];

  const queryStr = selectors.join(', ');
  const elements = document.querySelectorAll(queryStr);

  if (!counterObserver) {
    counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            // Animate element if it hasn't animated or needs re-trigger
            if (el.getAttribute('data-counter-animated') !== 'true') {
              animateCounterElement(el);
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -30px 0px'
      }
    );
  }

  elements.forEach((el) => {
    // Store initial target string if not set
    if (!el.getAttribute('data-counter-target')) {
      el.setAttribute('data-counter-target', el.textContent.trim());
    }
    counterObserver.observe(el);
  });
}

/**
 * Resets and re-triggers counter animations on a container (e.g. after dynamic HTML updates).
 * @param {HTMLElement|Document} container 
 */
export function refreshNumberCounters(container = document) {
  const queryStr = DEFAULT_COUNTER_SELECTORS.join(', ');
  const elements = container.querySelectorAll(queryStr);

  elements.forEach((el) => {
    el.removeAttribute('data-counter-animated');
    el.setAttribute('data-counter-target', el.textContent.trim());
    if (counterObserver) {
      counterObserver.observe(el);
    }
    // If element is already in viewport, trigger immediately
    const rect = el.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
      animateCounterElement(el);
    }
  });
}
