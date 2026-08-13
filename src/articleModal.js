import { ARTICLES_DATA } from './articlesData.js';
import { navigateWithBlockTransition } from './pageTransition.js';

let activeYear = '2021';
const YEARS_ORDER = ['2021', '2022', '2023', '2024'];

export function initArticleModal() {
  const modal = document.getElementById('wdc-article-modal');
  if (!modal) return;

  // Bind close buttons
  const closeBtn = document.getElementById('wdc-modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeArticleModal);
  }

  const backdrop = modal.querySelector('.wdc-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeArticleModal);
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeArticleModal();
    } else if (e.key === 'ArrowRight') {
      navigateYear(1);
    } else if (e.key === 'ArrowLeft') {
      navigateYear(-1);
    }
  });

  // Prev / Next year buttons inside modal
  const prevBtn = document.getElementById('wdc-prev-year-btn');
  const nextBtn = document.getElementById('wdc-next-year-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateYear(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateYear(1));
  }

  // Bind click handlers to Page 5 Cards
  const cards = document.querySelectorAll('.p5-card');
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const year = card.getAttribute('data-article-year') || '2021';
      const highlight = card.getAttribute('data-highlight') || null;
      openArticleModal(year, highlight);
    });
  });

  // Track modal scroll for progress line
  const scrollContainer = document.getElementById('wdc-modal-body-scroll');
  const progressBar = document.getElementById('wdc-modal-progress-bar');
  if (scrollContainer && progressBar) {
    scrollContainer.addEventListener('scroll', () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    });
  }
}

export function openArticleModal(year, highlightTerm = null) {
  let url = `./article.html?year=${year}`;
  if (highlightTerm) {
    url += `&highlight=${encodeURIComponent(highlightTerm)}`;
  }
  navigateWithBlockTransition(url, 480);
}

export function closeArticleModal() {
  const modal = document.getElementById('wdc-article-modal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateYear(direction) {
  const currentIndex = YEARS_ORDER.indexOf(activeYear);
  let newIndex = currentIndex + direction;

  if (newIndex < 0) newIndex = YEARS_ORDER.length - 1;
  if (newIndex >= YEARS_ORDER.length) newIndex = 0;

  openArticleModal(YEARS_ORDER[newIndex]);
}

function renderArticleContent(data) {
  // Update year badges & title
  const yearBadge = document.getElementById('wdc-modal-year-badge');
  const titleEl = document.getElementById('wdc-modal-title');
  const subtitleEl = document.getElementById('wdc-modal-subtitle');
  const yearNavPill = document.getElementById('wdc-year-nav-pill');

  if (yearBadge) yearBadge.textContent = data.year;
  if (titleEl) titleEl.textContent = data.title;
  if (subtitleEl) subtitleEl.textContent = data.subtitle;
  if (yearNavPill) yearNavPill.textContent = `${data.year} SEASON`;

  // Render Prev / Next Labels
  const currentIndex = YEARS_ORDER.indexOf(data.year);
  const prevYear = YEARS_ORDER[(currentIndex - 1 + YEARS_ORDER.length) % YEARS_ORDER.length];
  const nextYear = YEARS_ORDER[(currentIndex + 1) % YEARS_ORDER.length];

  const prevLbl = document.getElementById('wdc-prev-label');
  const nextLbl = document.getElementById('wdc-next-label');

  if (prevLbl) prevLbl.textContent = `‹ ${prevYear}`;
  if (nextLbl) nextLbl.textContent = `${nextYear} ›`;

  // Render Stat Badges in Header
  const headerStats = document.getElementById('wdc-modal-header-stats');
  if (headerStats && data.stats) {
    const keyStats = data.stats.slice(0, 4);
    headerStats.innerHTML = keyStats
      .map(
        (s) => `
      <div class="wdc-stat-pill">
        <span class="wdc-sp-val">${escapeHtml(s.value)}</span>
        <span class="wdc-sp-lbl">${escapeHtml(s.label)}</span>
      </div>
    `
      )
      .join('');
  }

  // Render Image Gallery Bar
  const galleryEl = document.getElementById('wdc-modal-gallery');
  if (galleryEl && data.images) {
    galleryEl.innerHTML = data.images
      .map(
        (imgSrc, idx) => `
      <div class="wdc-gallery-item ${idx === 0 ? 'wdc-gallery-large' : ''}">
        <img src="${escapeHtml(imgSrc)}" alt="Max Verstappen ${data.year} ${idx + 1}" loading="lazy" />
        <div class="wdc-gallery-overlay">
          <span>MAX VERSTAPPEN • ${data.year}</span>
        </div>
      </div>
    `
      )
      .join('');
  }

  // Render Article Body Sections
  const bodyEl = document.getElementById('wdc-modal-article-sections');
  if (bodyEl && data.sections) {
    bodyEl.innerHTML = data.sections
      .map(
        (sec) => `
      <section class="wdc-article-section">
        <h3 class="wdc-section-heading">${escapeHtml(sec.heading)}</h3>
        ${sec.content
          .map(
            (p) => `
          <p class="wdc-paragraph">${escapeHtml(p)}</p>
        `
          )
          .join('')}
      </section>
    `
      )
      .join('');
  }

  // Render Complete Stats Grid
  const statsGridEl = document.getElementById('wdc-modal-stats-grid');
  if (statsGridEl && data.stats) {
    statsGridEl.innerHTML = data.stats
      .map(
        (s) => `
      <div class="wdc-grid-stat-card">
        <span class="wdc-gstat-label">${escapeHtml(s.label)}</span>
        <span class="wdc-gstat-value">${escapeHtml(s.value)}</span>
      </div>
    `
      )
      .join('');
  }

  // Render Sources List
  const sourcesEl = document.getElementById('wdc-modal-sources-list');
  if (sourcesEl && data.sources) {
    sourcesEl.innerHTML = data.sources
      .map(
        (src) => `
      <li class="wdc-source-item">${escapeHtml(src)}</li>
    `
      )
      .join('');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
