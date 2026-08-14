import { ARTICLES_DATA } from './articlesData.js';
import { initPageTransition, navigateWithBlockTransition } from './pageTransition.js';
import { initNumberCounters, refreshNumberCounters } from './numberCounter.js';

const YEARS_ORDER = ['2021', '2022', '2023', '2024'];
let activeYear = '2021';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Scroll-Activated Number Counter Engine
  initNumberCounters();

  // Initialize Staggered 5-Block Page Transition Overlay
  initPageTransition();

  // Intercept Back to Homepage links to trigger 5-Block Vertical Staircase transition
  const returnLinks = document.querySelectorAll('.am-back-link, .am-home-btn');
  returnLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        navigateWithBlockTransition(href, 480);
      }
    });
  });

  // Read URL parameters (e.g., ?year=2021&highlight=monaco)
  const params = new URLSearchParams(window.location.search);
  const yearParam = params.get('year') || '2021';
  const highlightParam = params.get('highlight') || null;

  activeYear = ARTICLES_DATA[yearParam] ? yearParam : '2021';

  // Render Initial Article
  renderArticle(activeYear, highlightParam);

  // Bind Header Year Tabs
  const tabBtns = document.querySelectorAll('.am-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedYear = btn.getAttribute('data-year');
      if (selectedYear && selectedYear !== activeYear) {
        switchYear(selectedYear);
      }
    });
  });

  // Bind Bottom Season Navigation Buttons
  const prevBtn = document.getElementById('am-prev-season-btn');
  const nextBtn = document.getElementById('am-next-season-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateYear(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateYear(1));
  }

  // Window Scroll Reading Progress Bar
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const bar = document.getElementById('am-progress-bar');
    if (bar) bar.style.width = `${progress}%`;
  });
});

function switchYear(newYear) {
  activeYear = newYear;
  
  // Update URL without reloading page
  const newUrl = `${window.location.pathname}?year=${newYear}`;
  window.history.pushState({ year: newYear }, '', newUrl);

  renderArticle(newYear);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateYear(direction) {
  const idx = YEARS_ORDER.indexOf(activeYear);
  let nextIdx = idx + direction;
  if (nextIdx < 0) nextIdx = YEARS_ORDER.length - 1;
  if (nextIdx >= YEARS_ORDER.length) nextIdx = 0;

  switchYear(YEARS_ORDER[nextIdx]);
}

function renderArticle(year, highlightTerm = null) {
  const data = ARTICLES_DATA[year];
  if (!data) return;

  // Document Title
  document.title = `Max Verstappen — ${data.year} World Champion Editorial`;

  // Watermark, Title, Subtitle, Season Badge
  const watermark = document.getElementById('am-watermark-year');
  const titleEl = document.getElementById('am-article-title');
  const subtitleEl = document.getElementById('am-article-subtitle');
  const seasonPill = document.getElementById('am-season-pill');

  if (watermark) watermark.textContent = data.year;
  if (titleEl) titleEl.textContent = data.title;
  if (subtitleEl) subtitleEl.textContent = data.subtitle;
  if (seasonPill) seasonPill.textContent = `${data.year} SEASON`;

  // Header Active Tab Highlight
  const tabBtns = document.querySelectorAll('.am-tab-btn');
  tabBtns.forEach((btn) => {
    if (btn.getAttribute('data-year') === year) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hero Telemetry Summary Pills (first 4 stats)
  const heroStatsEl = document.getElementById('am-hero-stats');
  if (heroStatsEl && data.stats) {
    const keyStats = data.stats.slice(0, 4);
    heroStatsEl.innerHTML = keyStats
      .map(
        (s) => `
      <div class="am-hero-stat-card">
        <span class="am-stat-val">${escapeHtml(s.value)}</span>
        <span class="am-stat-lbl">${escapeHtml(s.label)}</span>
      </div>
    `
      )
      .join('');
  }

  // Photo Gallery Section
  const galleryEl = document.getElementById('am-photo-gallery');
  if (galleryEl && data.images) {
    galleryEl.innerHTML = data.images
      .map(
        (imgSrc, idx) => `
      <div class="am-gallery-card">
        <img src="${escapeHtml(imgSrc)}" alt="Max Verstappen ${data.year} ${idx + 1}" />
        <div class="am-gallery-caption">
          <span>MAX VERSTAPPEN • ${data.year}</span>
        </div>
      </div>
    `
      )
      .join('');
  }

  // Main Article Body Sections
  const sectionsEl = document.getElementById('am-sections-container');
  if (sectionsEl && data.sections) {
    sectionsEl.innerHTML = data.sections
      .map(
        (sec) => `
      <section class="am-section">
        <h2 class="am-heading">${escapeHtml(sec.heading)}</h2>
        ${sec.content
          .map(
            (p) => `
          <p class="am-paragraph">${escapeHtml(p)}</p>
        `
          )
          .join('')}
      </section>
    `
      )
      .join('');
  }

  // Sidebar Season Telemetry Grid
  const sidebarStatsEl = document.getElementById('am-sidebar-stats');
  if (sidebarStatsEl && data.stats) {
    sidebarStatsEl.innerHTML = data.stats
      .map(
        (s) => `
      <div class="am-stat-item">
        <span class="am-stat-item-lbl">${escapeHtml(s.label)}</span>
        <span class="am-stat-item-val">${escapeHtml(s.value)}</span>
      </div>
    `
      )
      .join('');
  }

  // Sidebar Sources List
  const sidebarSourcesEl = document.getElementById('am-sidebar-sources');
  if (sidebarSourcesEl && data.sources) {
    sidebarSourcesEl.innerHTML = data.sources
      .map(
        (src) => `
      <li class="am-source-item">${escapeHtml(src)}</li>
    `
      )
      .join('');
  }

  // Bottom Prev/Next Season Nav Labels
  const currIdx = YEARS_ORDER.indexOf(year);
  const prevYear = YEARS_ORDER[(currIdx - 1 + YEARS_ORDER.length) % YEARS_ORDER.length];
  const nextYear = YEARS_ORDER[(currIdx + 1) % YEARS_ORDER.length];

  const prevLbl = document.getElementById('am-prev-year-lbl');
  const nextLbl = document.getElementById('am-next-year-lbl');

  if (prevLbl) prevLbl.textContent = `${prevYear} SEASON`;
  if (nextLbl) nextLbl.textContent = `${nextYear} SEASON`;

  // Refresh number counter animation for telemetry & stats on the page
  refreshNumberCounters();

  // Initialize smooth scroll reveal for sections
  initSectionObserver();

  // Auto-scroll highlight term if provided
  if (highlightTerm) {
    setTimeout(() => {
      const headings = document.querySelectorAll('.am-heading');
      for (const h of headings) {
        if (h.textContent.toLowerCase().includes(highlightTerm.toLowerCase())) {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
          h.classList.add('am-highlight-flash');
          setTimeout(() => h.classList.remove('am-highlight-flash'), 2500);
          break;
        }
      }
    }, 450);
  }
}

function initSectionObserver() {
  const sections = document.querySelectorAll('.am-section');
  if (!('IntersectionObserver' in window)) {
    sections.forEach((s) => s.classList.add('am-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('am-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  sections.forEach((sec) => observer.observe(sec));
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
