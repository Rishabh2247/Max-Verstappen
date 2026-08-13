// Staggered 5-Block Vertical Staircase Page Transition Engine

export function initPageTransition() {
  let overlay = document.getElementById('page-staircase-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'page-staircase-overlay';
    overlay.className = 'page-staircase-overlay entering';
    overlay.innerHTML = `
      <div class="staircase-wrapper">
        <div class="staircase-block block-1"></div>
        <div class="staircase-block block-2"></div>
        <div class="staircase-block block-3"></div>
        <div class="staircase-block block-4"></div>
        <div class="staircase-block block-5"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Trigger reveal retract up on load
  requestAnimationFrame(() => {
    setTimeout(() => {
      overlay.classList.remove('entering');
    }, 60);
  });
}

export function navigateWithBlockTransition(targetUrl, delay = 680) {
  let overlay = document.getElementById('page-staircase-overlay');
  if (!overlay) {
    initPageTransition();
    overlay = document.getElementById('page-staircase-overlay');
  }

  overlay.classList.add('active');

  setTimeout(() => {
    window.location.href = targetUrl;
  }, delay);
}
