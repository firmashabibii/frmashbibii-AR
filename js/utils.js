/* ═══════════════════════════════════════════════════════
   utils.js — Helper functions shared across pages
   ═══════════════════════════════════════════════════════ */

/**
 * Set AR status bar text & state
 * @param {string} text
 * @param {'searching'|'found'|'lost'} state
 */
function setARStatus(text, state = 'searching') {
  const el = document.getElementById('ar-status');
  if (!el) return;
  const dot = el.querySelector('.pulse');
  const msg = el.querySelector('.ar-msg');
  if (msg) msg.textContent = text;
  if (dot) dot.className = 'pulse' + (state === 'found' ? ' on' : '');
  el.className = 'ar-status' + (state === 'found' ? ' found' : '');
}

/**
 * Stop all active camera streams
 */
function stopCamera() {
  document.querySelectorAll('video').forEach(v => {
    if (v.srcObject) {
      v.srcObject.getTracks().forEach(t => t.stop());
      v.srcObject = null;
    }
  });
}

/**
 * Check if camera is accessible
 * @returns {Promise<boolean>}
 */
async function checkCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

/**
 * Load external script dynamically
 * @param {string} src
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Show/hide element
 */
function show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function toggle(id, cls) { document.getElementById(id)?.classList.toggle(cls); }

/**
 * Animate number counter
 */
function animateCount(el, from, to, duration = 400) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * t);
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/**
 * Debounce
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
