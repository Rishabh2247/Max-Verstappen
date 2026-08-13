import { TopographicEngine } from './contourEngine.js';
import { LiquidRevealEngine } from './liquidShader.js';
import { initArticleModal } from './articleModal.js';
import { initPageTransition, navigateWithBlockTransition } from './pageTransition.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Staggered 5-Block Page Transition Overlay
  initPageTransition();

  // Intercept Page 5 card clicks to trigger 5-Block Vertical Staircase transition
  const cardLinks = document.querySelectorAll('.p5-card-link');
  cardLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        navigateWithBlockTransition(href, 480);
      }
    });
  });

  // Initialize Page 5 WDC Season Article Modal
  initArticleModal();
  // Register GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Initialize Lenis Fast 60fps Smooth Scroll Engine
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.1, // Ultra-silky smooth glide
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // High-responsiveness acceleration curve
      smoothWheel: true,
      wheelMultiplier: 2.6, // Covers 2.6x more distance per single scroll tick!
      touchMultiplier: 2.5,
      lerp: 0.1 // Fluid inertia
    });

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // Handle Hash Scroll when returning from Article Page (e.g. #page-5-section)
  if (window.location.hash) {
    setTimeout(() => {
      const targetEl = document.querySelector(window.location.hash);
      if (targetEl) {
        if (lenis) {
          lenis.scrollTo(targetEl, { offset: 0, immediate: false });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 400);
  }

  // 1a. Light Red Topography Background Canvas (Page 1 Composition)
  const bgCanvas = document.getElementById('contour-canvas');
  if (bgCanvas) {
    const bgEngine = new TopographicEngine(bgCanvas);
    bgEngine.params.lineColor = 'rgba(225, 6, 0, 0.28)';
    bgEngine.params.lineThickness = 1.0;
    bgEngine.start();
  }

  // 1b. Global Continuous Marching Squares Red Isolines Canvas (Entire Page Background)
  let globalEngine = null;
  const globalCanvas = document.getElementById('global-contour-canvas');
  if (globalCanvas) {
    globalEngine = new TopographicEngine(globalCanvas);
    globalEngine.params.lineColor = 'rgba(225, 6, 0, 0.55)';
    globalEngine.params.bgColor = '#061325';
    globalEngine.params.lineThickness = 1.25;
    globalEngine.params.levels = 10;
    globalEngine.params.speed = 0.00052;
    globalEngine.start();
  }

  // 2. Transparent Foreground Hero Character WebGL Liquid Engine
  const heroWrapper = document.getElementById('hero-character-wrapper');
  if (heroWrapper) {
    const img1 = encodeURI('./Max Pictures/Max 1.png');
    const img2 = encodeURI('./Max Pictures/Max 2.png');

    const heroEngine = new LiquidRevealEngine(heroWrapper, img1, img2);
    heroEngine.start();
  }

  // 3. Full-Screen Dropdown Menu & MENU Toggle
  const menuBtn = document.getElementById('menu-toggle-btn');
  const menuText = document.getElementById('menu-btn-text');
  const fsOverlay = document.getElementById('fullscreen-menu-overlay');
  const fsNavItems = document.querySelectorAll('.fs-nav-item');
  const photoCards = document.querySelectorAll('.fs-photo-card');

  // Modal Drawer Elements
  const modal = document.getElementById('section-modal');
  const modalContent = document.getElementById('modal-body-content');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  let isToggling = false;

  function toggleFullscreenMenu(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    if (isToggling) return;
    isToggling = true;
    setTimeout(() => { isToggling = false; }, 300);

    if (!menuBtn || !fsOverlay) return;

    // Trigger click tyre spin animation
    menuBtn.classList.remove('spin-click');
    void menuBtn.offsetWidth; // Force reflow
    menuBtn.classList.add('spin-click');

    const isOpen = fsOverlay.classList.contains('active');

    if (isOpen) {
      fsOverlay.classList.remove('active');
      menuBtn.classList.remove('active');
    } else {
      fsOverlay.classList.add('active');
      menuBtn.classList.add('active');
    }
  }

  window.toggleMenuApp = toggleFullscreenMenu;

  if (menuBtn) {
    menuBtn.addEventListener('click', toggleFullscreenMenu);
    menuBtn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        toggleFullscreenMenu(e);
      }
    });
  }

  // Synchronized Hover Interactions between Left 2x2 Photo Cards & Right Nav Links
  photoCards.forEach((card) => {
    const key = card.getAttribute('data-key');
    const correspondingLink = document.querySelector(`.fs-nav-item[data-key="${key}"]`);

    card.addEventListener('mouseenter', () => {
      if (correspondingLink) correspondingLink.classList.add('highlight');
    });
    card.addEventListener('mouseleave', () => {
      if (correspondingLink) correspondingLink.classList.remove('highlight');
    });

    card.addEventListener('click', (e) => {
      handleMenuSelection(key, e);
    });
  });

  fsNavItems.forEach((item) => {
    const key = item.getAttribute('data-key');
    const correspondingCard = document.querySelector(`.fs-photo-card[data-key="${key}"]`);

    item.addEventListener('mouseenter', () => {
      if (correspondingCard) correspondingCard.classList.add('highlight');
    });
    item.addEventListener('mouseleave', () => {
      if (correspondingCard) correspondingCard.classList.remove('highlight');
    });

    item.addEventListener('click', (e) => {
      handleMenuSelection(key, e);
    });
  });

  // Footer Navigation Link Click Handlers
  const footerNavLinks = document.querySelectorAll('.footer-nav-link');
  footerNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const key = link.getAttribute('data-key');
      if (key) {
        handleMenuSelection(key, e);
      }
    });
  });

  // Modal Content Data for HOME, CAREER, RACES, OFFTRACK
  const modalData = {
    career: `
      <h2 class="modal-title">02 / CAREER STATS & HONOURS</h2>
      <div style="margin-bottom:1rem; border-radius:14px; overflow:hidden; border:1px solid #e0e0e0;">
        <img src="./Max Pictures/Career.jpeg" alt="Career" style="width:100%; height:220px; object-fit:cover; display:block;" />
      </div>
      <p style="color:#555; font-weight:500;">Max Verstappen's historic Formula 1 racing milestones.</p>
      <div class="grid-2col">
        <div class="data-box">
          <div class="data-label">WORLD CHAMPIONSHIPS</div>
          <div class="data-val">3X (2021, 2022, 2023)</div>
        </div>
        <div class="data-box">
          <div class="data-label">GRAND PRIX VICTORIES</div>
          <div class="data-val">60+ WINS</div>
        </div>
        <div class="data-box">
          <div class="data-label">PODIUM FINISHES</div>
          <div class="data-val">100+ PODIUMS</div>
        </div>
        <div class="data-box">
          <div class="data-label">SINGLE SEASON RECORD</div>
          <div class="data-val">19 VICTORIES (2023)</div>
        </div>
      </div>
    `,
    races: `
      <h2 class="modal-title">03 / GRAND PRIX VICTORIES & RACES</h2>
      <div style="margin-bottom:1rem; border-radius:14px; overflow:hidden; border:1px solid #e0e0e0;">
        <img src="./Max Pictures/Races.jpeg" alt="Races" style="width:100%; height:220px; object-fit:cover; display:block;" />
      </div>
      <p style="color:#555; font-weight:500;">Live circuit telemetry and upcoming race schedules.</p>
      <div class="grid-2col">
        <div class="data-box">
          <div class="data-label">NEXT RACE</div>
          <div class="data-val">DUTCH GP (ZANDVOORT)</div>
        </div>
        <div class="data-box">
          <div class="data-label">TRACK LENGTH</div>
          <div class="data-val">4.259 KM</div>
        </div>
        <div class="data-box">
          <div class="data-label">TOP CIRCUIT SPEED</div>
          <div class="data-val">342.6 KM/H</div>
        </div>
        <div class="data-box">
          <div class="data-label">POLE POSITIONS</div>
          <div class="data-val">38+ POLES</div>
        </div>
      </div>
    `,
    offtrack: `
      <h2 class="modal-title">04 / OFFTRACK LIFESTYLE & SIM RACING</h2>
      <div style="margin-bottom:1rem; border-radius:14px; overflow:hidden; border:1px solid #e0e0e0;">
        <img src="./Max Pictures/Offtrack.jpeg" alt="Offtrack" style="width:100%; height:220px; object-fit:cover; display:block;" />
      </div>
      <p style="color:#555; font-weight:500;">Team Redline sim racing setup and personal off-track passion.</p>
      <div class="grid-2col">
        <div class="data-box">
          <div class="data-label">SIM RACING TEAM</div>
          <div class="data-val">TEAM REDLINE</div>
        </div>
        <div class="data-box">
          <div class="data-label">VIRTUAL RACES</div>
          <div class="data-val">24 HOURS OF NÜRBURGRING</div>
        </div>
        <div class="data-box">
          <div class="data-label">CAR NUMBER</div>
          <div class="data-val">#1 / #33</div>
        </div>
        <div class="data-box">
          <div class="data-label">NATIONALITY</div>
          <div class="data-val">DUTCH (NETHERLANDS)</div>
        </div>
      </div>
    `
  };

  function handleMenuSelection(targetKey, e) {
    if (e) e.preventDefault();

    if (fsOverlay && fsOverlay.classList.contains('active')) {
      toggleFullscreenMenu();
    }

    let targetSectionId = null;

    if (targetKey === 'home') {
      if (lenis) {
        lenis.scrollTo(0, { duration: 0.8 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    } else if (targetKey === 'races') {
      targetSectionId = 'page-3-section'; // Directs to RACE & SEASON DASHBOARD
    } else if (targetKey === 'career') {
      targetSectionId = 'page-5-section'; // Directs to CAREER WINS & HALL OF FAME
    } else if (targetKey === 'offtrack') {
      targetSectionId = 'page-7-section'; // Directs to OFF TRACK VERSTAPPEN STORE
    }

    if (targetSectionId) {
      const elem = document.getElementById(targetSectionId);
      if (elem) {
        setTimeout(() => {
          if (lenis) {
            lenis.scrollTo(elem, { offset: -20, duration: 0.8 });
          } else {
            const yOffset = -20; // 20px padding offset from header top
            const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 350);
      }
    }
  }

  // Close Modal Handler
  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Close menu & modal on Escape key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
      } else if (fsOverlay && fsOverlay.classList.contains('active')) {
        toggleFullscreenMenu(e);
      }
    }
  });

  // 4. Cinematic Full Page 1 Composition Scroll Sequence
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const heroPinSection = document.getElementById('hero-pin-section');
    const heroComposition = document.getElementById('hero-composition-wrapper');
    const f1Card = document.getElementById('f1-card-container');

    if (heroPinSection && heroComposition) {
      const heroTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-pin-section',
          start: 'top top',
          end: '+=180%',
          scrub: 0.6,
          pin: true,
          anticipatePin: 1
        }
      });

      // Step 0: Fade out bottom-left F1 race card immediately when scrolling begins (0% -> 15%)
      if (f1Card) {
        heroTimeline.to('#f1-card-container', {
          opacity: 0,
          y: -15,
          ease: 'none',
          duration: 0.15
        }, 0);
      }

      // Step 1: Smooth Zoom Out of ENTIRE Page 1 Composition with 4 rounded corners as you scroll
      heroTimeline.to('#hero-composition-wrapper', {
        scale: 0.48,
        borderRadius: '32px',
        borderColor: 'transparent',
        boxShadow: 'none',
        ease: 'none',
        duration: 1.0
      }, 0);
    }
  }



  // 5. Scroll-Driven Background Color Transition to White on Page 3
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && globalEngine) {
    const globalBgContainer = document.getElementById('global-bg-container');
    const colorObj = {
      bg: '#061325',
      line: 'rgba(225, 6, 0, 0.55)'
    };

    gsap.timeline({
      scrollTrigger: {
        trigger: '#page-3-section',
        start: 'top bottom',
        end: 'top center',
        scrub: 0.5
      }
    })
    .to(colorObj, {
      bg: '#ffffff',
      line: 'rgba(225, 6, 0, 0.38)',
      ease: 'none',
      onUpdate: () => {
        globalEngine.params.bgColor = colorObj.bg;
        globalEngine.params.lineColor = colorObj.line;
        if (globalBgContainer) {
          globalBgContainer.style.backgroundColor = colorObj.bg;
        }
      }
    });
  }

  // 6. Page 4 Video Playback & Performance Optimization
  const page4Video = document.getElementById('page4-video');
  const page4Section = document.getElementById('page-4-section');

  if (page4Video && page4Section && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          page4Video.play().catch(() => {});
          if (globalEngine) globalEngine.stop();
        } else {
          page4Video.pause();
          if (globalEngine) globalEngine.start();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(page4Section);
  }

  // 7. Glassmorphism Video Sound Mute/Unmute Toggle Handler
  const volumeBtn = document.getElementById('video-volume-btn');
  const volumeIcon = document.getElementById('volume-icon');
  const volumeText = document.getElementById('volume-text');

  if (volumeBtn && page4Video) {
    volumeBtn.addEventListener('click', () => {
      page4Video.muted = !page4Video.muted;
      if (page4Video.muted) {
        if (volumeIcon) volumeIcon.textContent = '🔇';
        if (volumeText) volumeText.textContent = 'SOUND OFF';
      } else {
        if (volumeIcon) volumeIcon.textContent = '🔊';
        if (volumeText) volumeText.textContent = 'SOUND ON';
      }
    });
  }

  // 8. Sticky Pinned Page Transition (Page 3 locks in place when bottom is reached, Page 4 scrolls upward over Page 3)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const page3Section = document.getElementById('page-3-section');

    if (page3Section) {
      ScrollTrigger.create({
        trigger: '#page-3-section',
        start: 'bottom bottom',
        end: '+=100%',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1
      });
    }
  }

  // 9. Page 6 RB19 4K Ultra-Smooth 300-Frame Canvas Scroll Sequence Animation
  const rb19Canvas = document.getElementById('rb19-canvas');
  const rb19Section = document.getElementById('rb19-scroll-section');

  if (rb19Canvas && rb19Section && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const ctx = rb19Canvas.getContext('2d', { alpha: false });
    const frameCount = 300;
    const images = [];
    const sequence = { frame: 0 };

    // Ultra-High 4K Pixel Density Ratio (3x buffer density)
    const dpr = Math.max(window.devicePixelRatio || 1, 3);

    // Format frame filename with encodeURI for Vercel / Linux path safety e.g. 0 -> "ezgif-frame-001.jpg"
    const currentFrame = (index) => {
      const paddedIndex = String(index + 1).padStart(3, '0');
      return encodeURI(`./Max Pictures/RB19/ezgif-1b4819bf5308af8e-jpg/ezgif-frame-${paddedIndex}.jpg`);
    };

    // Preload 300 frames in memory with immediate render on first loaded frame
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.onload = () => {
        if (i === 0 || Math.round(sequence.frame) === i) {
          render();
        }
      };
      img.src = currentFrame(i);
      images.push(img);
    }

    function resizeCanvas() {
      if (!rb19Canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Safe DPR ratio for canvas buffer stability across all viewports
      const safeDpr = Math.min(window.devicePixelRatio || 1, 2);

      rb19Canvas.width = Math.round(w * safeDpr);
      rb19Canvas.height = Math.round(h * safeDpr);
      rb19Canvas.style.width = w + 'px';
      rb19Canvas.style.height = h + 'px';

      render();
    }

    function render() {
      if (!ctx || !rb19Canvas) return;
      let frameIndex = Math.min(Math.max(0, Math.round(sequence.frame)), frameCount - 1);
      let img = images[frameIndex];

      // Fallback: If target frame is still downloading over network, render nearest loaded frame!
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < 40; offset++) {
          const prevIdx = Math.max(0, frameIndex - offset);
          const nextIdx = Math.min(frameCount - 1, frameIndex + offset);
          if (images[prevIdx] && images[prevIdx].complete && images[prevIdx].naturalWidth > 0) {
            img = images[prevIdx];
            break;
          }
          if (images[nextIdx] && images[nextIdx].complete && images[nextIdx].naturalWidth > 0) {
            img = images[nextIdx];
            break;
          }
        }
      }

      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = rb19Canvas.width;
      const ch = rb19Canvas.height;

      // Enable high quality image smoothing & contrast enhancement filter
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'contrast(1.12) saturate(1.10) brightness(1.03)';

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cw, ch);

      // Scale image width to fit 100% of the page width
      const ratio = cw / img.naturalWidth;
      const centerShiftY = (ch - img.naturalHeight * ratio) / 2;

      ctx.drawImage(
        img,
        0, 0, img.naturalWidth, img.naturalHeight,
        0, centerShiftY, cw, img.naturalHeight * ratio
      );
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Ultra-smooth GSAP ScrollTrigger timeline
    gsap.timeline({
      scrollTrigger: {
        trigger: '#rb19-scroll-section',
        start: 'top top',
        end: '+=280%',
        scrub: 0.08,
        pin: true,
        anticipatePin: 1,
        onUpdate: () => render()
      }
    })
    .to(sequence, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      onUpdate: () => render()
    });
  }

  // 10. Page 6 RB19 Engine Sound Audio Handler
  const engineAudio = document.getElementById('rb19-engine-audio');
  const engineBtn = document.getElementById('engine-sound-btn');
  const engineIcon = document.getElementById('engine-sound-icon');
  const engineText = document.getElementById('engine-sound-text');

  if (engineBtn && engineAudio) {
    engineBtn.addEventListener('click', () => {
      if (engineAudio.paused) {
        engineAudio.play().then(() => {
          engineBtn.classList.add('playing');
          if (engineIcon) engineIcon.textContent = '🔊';
          if (engineText) engineText.textContent = 'ENGINE SOUND ON';
        }).catch((err) => {
          console.error('Audio play error:', err);
        });
      } else {
        engineAudio.pause();
        engineBtn.classList.remove('playing');
        if (engineIcon) engineIcon.textContent = '🔊';
        if (engineText) engineText.textContent = 'ENGINE SOUND';
      }
    });

    // Automatically pause engine audio when Page 6 leaves viewport
    if (rb19Section && 'IntersectionObserver' in window) {
      const audioObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !engineAudio.paused) {
            engineAudio.pause();
            engineBtn.classList.remove('playing');
            if (engineIcon) engineIcon.textContent = '🔊';
            if (engineText) engineText.textContent = 'ENGINE SOUND';
          }
        });
      }, { threshold: 0.1 });
      audioObserver.observe(rb19Section);
    }
  }

  // 11. Page 8 Interactive Hover Fan Cards Engine
  const fanWrapper = document.getElementById('p8-fan-wrapper');
  if (fanWrapper) {
    const cards = Array.from(fanWrapper.querySelectorAll('.p8-fan-card'));

    // Base Fan Transformations matching reference layout geometry (7 cards)
    const baseTransforms = [
      { tx: -360, ty: 45, rot: -20, scale: 0.92, z: 1 },
      { tx: -240, ty: 24, rot: -13, scale: 0.95, z: 2 },
      { tx: -120, ty: 8,  rot: -6.5, scale: 0.98, z: 3 },
      { tx: 0,    ty: 0,  rot: 0,    scale: 1.05, z: 4 },
      { tx: 120,  ty: 8,  rot: 6.5,  scale: 0.98, z: 3 },
      { tx: 240,  ty: 24, rot: 13,   scale: 0.95, z: 2 },
      { tx: 360,  ty: 45, rot: 20,   scale: 0.92, z: 1 }
    ];

    // Apply default fan positioning
    function applyDefaultFan() {
      cards.forEach((card, i) => {
        const t = baseTransforms[i];
        card.style.transform = `translate3d(${t.tx}px, ${t.ty}px, 0px) rotate(${t.rot}deg) scale(${t.scale})`;
        card.style.zIndex = t.z;
        card.style.boxShadow = '0 16px 45px rgba(6, 19, 37, 0.18)';
        card.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      });
    }

    // Apply hover state: hovered card moves to prominent front, others push outward
    function applyHoverState(hoveredIdx) {
      cards.forEach((card, i) => {
        const base = baseTransforms[i];

        if (i === hoveredIdx) {
          // Prominent Center / Front position
          card.style.transform = `translate3d(${base.tx}px, -25px, 0px) rotate(0deg) scale(1.15)`;
          card.style.zIndex = 50;
          card.style.boxShadow = '0 30px 70px rgba(6, 19, 37, 0.35)';
          card.style.borderColor = '#ffffff';
        } else if (i < hoveredIdx) {
          // Push surrounding cards on left further left
          const offset = (hoveredIdx - i) * -55;
          const extraRot = base.rot - 4;
          card.style.transform = `translate3d(${base.tx + offset}px, ${base.ty + 10}px, 0px) rotate(${extraRot}deg) scale(${base.scale * 0.96})`;
          card.style.zIndex = base.z;
          card.style.boxShadow = '0 10px 30px rgba(6, 19, 37, 0.12)';
          card.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        } else {
          // Push surrounding cards on right further right
          const offset = (i - hoveredIdx) * 55;
          const extraRot = base.rot + 4;
          card.style.transform = `translate3d(${base.tx + offset}px, ${base.ty + 10}px, 0px) rotate(${extraRot}deg) scale(${base.scale * 0.96})`;
          card.style.zIndex = base.z;
          card.style.boxShadow = '0 10px 30px rgba(6, 19, 37, 0.12)';
          card.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }
      });
    }

    // Attach event listeners for each card
    cards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => applyHoverState(i));
    });

    fanWrapper.addEventListener('mouseleave', () => applyDefaultFan());

    // Initialize default fan arrangement
    applyDefaultFan();
  }

  // 12. Page 3 Dynamic 12 Upcoming 2026 F1 Races, Live Race Day Telemetry & 3D Circuit Morphing Engine
  const trackCanvas = document.getElementById('p3-track-3d-canvas');

  // Official Upcoming 2026 F1 Grands Prix Database (Rounds 12–23 from formula1.com)
  const f1Calendar2026 = [
    {
      id: 'dutch-gp',
      round: 'ROUND 12',
      isNextRace: true,
      name: 'DUTCH GP',
      circuit: 'Circuit Zandvoort, Netherlands',
      date: '21 – 23 AUG 2026',
      laps: 72,
      length: '4.259 KM',
      corners: 14,
      drs: 2,
      topSpeed: '325 KM/H',
      lapRecord: '1:11.097 (M. VERSTAPPEN)',
      maxLivePos: 'P1 (HOME HERO)',
      liveLap: 'LAP 68 / 72',
      gapP2: '+21.410s',
      resultPos: 'P1 🥇 (HOME VICTORY)',
      resultPts: '+26 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 140 + Math.cos(t * 2) * 30);
          const z = (Math.sin(t) * 140 + Math.sin(t * 3) * 25);
          const y = Math.sin(t * 4) * 24;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'italian-gp',
      round: 'ROUND 13',
      isNextRace: false,
      name: 'ITALIAN GP',
      circuit: 'Autodromo Nazionale Monza, Italy',
      date: '04 – 06 SEP 2026',
      laps: 53,
      length: '5.793 KM',
      corners: 11,
      drs: 2,
      topSpeed: '354 KM/H',
      lapRecord: '1:21.046 (R. BARRICHELLO)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 41 / 53',
      gapP2: '+11.820s',
      resultPos: 'P1 🥇 (MONZA VICTORY)',
      resultPts: '+25 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 195 + Math.sin(t * 2) * 15);
          const z = (Math.sin(t) * 75 + Math.cos(t * 4) * 15);
          const y = Math.sin(t) * 10;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'spanish-gp',
      round: 'ROUND 14',
      isNextRace: false,
      name: 'SPANISH GP',
      circuit: 'Madring Circuit, Madrid',
      date: '11 – 13 SEP 2026',
      laps: 66,
      length: '5.474 KM',
      corners: 20,
      drs: 3,
      topSpeed: '338 KM/H',
      lapRecord: '1:16.330 (M. VERSTAPPEN)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 50 / 66',
      gapP2: '+15.302s',
      resultPos: 'P1 🥇 (MADRID VICTORY)',
      resultPts: '+25 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 170 + Math.cos(t * 4) * 25);
          const z = (Math.sin(t) * 105 + Math.sin(t * 3) * 30);
          const y = Math.sin(t * 2) * 15;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'azerbaijan-gp',
      round: 'ROUND 15',
      isNextRace: false,
      name: 'AZERBAIJAN GP',
      circuit: 'Baku City Circuit, Baku',
      date: '24 – 26 SEP 2026',
      laps: 51,
      length: '6.003 KM',
      corners: 20,
      drs: 2,
      topSpeed: '350 KM/H',
      lapRecord: '1:43.009 (C. LECLERC)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 39 / 51',
      gapP2: '+8.410s',
      resultPos: 'P1 🥇 (BAKU VICTORY)',
      resultPts: '+26 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 190 + Math.sin(t * 4) * 18);
          const z = (Math.sin(t) * 85 + Math.cos(t * 3) * 22);
          const y = Math.sin(t * 3) * 14;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'bahrain-gp',
      round: 'ROUND 16',
      isNextRace: false,
      name: 'BAHRAIN GP',
      circuit: 'Bahrain International Circuit, Sakhir',
      date: '02 – 04 OCT 2026',
      laps: 57,
      length: '5.412 KM',
      corners: 15,
      drs: 3,
      topSpeed: '332 KM/H',
      lapRecord: '1:31.447 (P. DE LA ROSA)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 34 / 57',
      gapP2: '+8.912s',
      resultPos: 'P1 🥇 (SAKHIR VICTORY)',
      resultPts: '+25 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 155 + Math.sin(t * 2) * 45);
          const z = (Math.sin(t) * 125 + Math.cos(t * 3) * 30);
          const y = Math.cos(t * 2) * 14;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'singapore-gp',
      round: 'ROUND 17',
      isNextRace: false,
      name: 'SINGAPORE GP',
      circuit: 'Marina Bay Street Circuit',
      date: '09 – 11 OCT 2026',
      laps: 62,
      length: '4.940 KM',
      corners: 19,
      drs: 3,
      topSpeed: '320 KM/H',
      lapRecord: '1:35.867 (D. RICCIARDO)',
      maxLivePos: 'P1 (NIGHT LEADER)',
      liveLap: 'LAP 51 / 62',
      gapP2: '+7.920s',
      resultPos: 'P1 🥇 (NIGHT VICTORY)',
      resultPts: '+25 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 160 + Math.sin(t * 6) * 15);
          const z = (Math.sin(t) * 120 + Math.cos(t * 5) * 15);
          const y = Math.sin(t * 2) * 10;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'us-gp',
      round: 'ROUND 18',
      isNextRace: false,
      name: 'UNITED STATES GP',
      circuit: 'Circuit of the Americas, Austin',
      date: '23 – 25 OCT 2026',
      laps: 56,
      length: '5.513 KM',
      corners: 20,
      drs: 2,
      topSpeed: '341 KM/H',
      lapRecord: '1:36.169 (C. LECLERC)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 43 / 56',
      gapP2: '+13.210s',
      resultPos: 'P1 🥇 (COTA VICTORY)',
      resultPts: '+26 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 175 + Math.sin(t * 3) * 30);
          const z = (Math.sin(t) * 115 + Math.cos(t * 2) * 35);
          const y = Math.sin(t * 2) * 26;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'mexico-gp',
      round: 'ROUND 19',
      isNextRace: false,
      name: 'MEXICO GP',
      circuit: 'Autódromo Hermanos Rodríguez, Mexico City',
      date: '30 OCT – 01 NOV 2026',
      laps: 71,
      length: '4.304 KM',
      corners: 17,
      drs: 3,
      topSpeed: '350 KM/H',
      lapRecord: '1:17.774 (V. BOTTAS)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 59 / 71',
      gapP2: '+10.540s',
      resultPos: 'P1 🥇 (MEXICO VICTORY)',
      resultPts: '+25 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 165 + Math.cos(t * 2) * 25);
          const z = (Math.sin(t) * 125 + Math.sin(t * 3) * 20);
          const y = Math.sin(t * 3) * 12;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'brazil-gp',
      round: 'ROUND 20',
      isNextRace: false,
      name: 'BRAZIL GP',
      circuit: 'Autódromo José Carlos Pace, Interlagos',
      date: '06 – 08 NOV 2026',
      laps: 71,
      length: '4.309 KM',
      corners: 15,
      drs: 2,
      topSpeed: '334 KM/H',
      lapRecord: '1:10.540 (V. BOTTAS)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 61 / 71',
      gapP2: '+14.902s',
      resultPos: 'P1 🥇 (INTERLAGOS VICTORY)',
      resultPts: '+26 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 150 + Math.sin(t * 2) * 40);
          const z = (Math.sin(t) * 135 + Math.cos(t * 3) * 25);
          const y = Math.sin(t * 4) * 22;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'vegas-gp',
      round: 'ROUND 21',
      isNextRace: false,
      name: 'LAS VEGAS GP',
      circuit: 'Las Vegas Strip Circuit, Nevada',
      date: '19 – 21 NOV 2026',
      laps: 50,
      length: '6.201 KM',
      corners: 17,
      drs: 2,
      topSpeed: '350 KM/H',
      lapRecord: '1:35.490 (O. PIASTRI)',
      maxLivePos: 'P1 (STRIP LEADER)',
      liveLap: 'LAP 44 / 50',
      gapP2: '+9.810s',
      resultPos: 'P1 🥇 (VEGAS VICTORY)',
      resultPts: '+25 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 200 + Math.sin(t * 4) * 15);
          const z = (Math.sin(t) * 70 + Math.cos(t * 5) * 15);
          const y = Math.sin(t * 2) * 8;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'qatar-gp',
      round: 'ROUND 22',
      isNextRace: false,
      name: 'QATAR GP',
      circuit: 'Lusail International Circuit, Lusail',
      date: '27 – 29 NOV 2026',
      laps: 57,
      length: '5.419 KM',
      corners: 16,
      drs: 1,
      topSpeed: '338 KM/H',
      lapRecord: '1:24.319 (M. VERSTAPPEN)',
      maxLivePos: 'P1 (LEADER)',
      liveLap: 'LAP 48 / 57',
      gapP2: '+12.640s',
      resultPos: 'P1 🥇 (LUSAIL VICTORY)',
      resultPts: '+26 PTS',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 170 + Math.sin(t * 3) * 30);
          const z = (Math.sin(t) * 115 + Math.cos(t * 2) * 25);
          const y = Math.sin(t * 2) * 12;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    },
    {
      id: 'abu-dhabi-gp',
      round: 'ROUND 23',
      isNextRace: false,
      name: 'ABU DHABI GP',
      circuit: 'Yas Marina Circuit, Yas Island',
      date: '04 – 06 DEC 2026',
      laps: 58,
      length: '5.281 KM',
      corners: 16,
      drs: 2,
      topSpeed: '334 KM/H',
      lapRecord: '1:26.103 (M. VERSTAPPEN)',
      maxLivePos: 'P1 (CHAMPION)',
      liveLap: 'LAP 55 / 58',
      gapP2: '+14.821s',
      resultPos: 'P1 🥇 (FINALE VICTORY)',
      resultPts: '+26 PTS (WORLD CHAMPION)',
      getPoints3D: (numPoints) => {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          const x = (Math.cos(t) * 170 + Math.cos(t * 3) * 35);
          const z = (Math.sin(t) * 110 + Math.sin(t * 2) * 30);
          const y = Math.sin(t * 3) * 14;
          pts.push({ x, y, z, index: i });
        }
        return pts;
      }
    }
  ];

  let currentRaceIdx = 0;
  let currentStatusMode = 'UPCOMING';

  if (trackCanvas) {
    const ctx = trackCanvas.getContext('2d');
    let angleY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let pulseProgress = 0;

    const numPoints = 180;
    const roadWidth = 22;
    let points3D = f1Calendar2026[0].getPoints3D(numPoints);

    // Update UI elements based on selected race and mode
    function updateRaceDashboard() {
      const race = f1Calendar2026[currentRaceIdx];
      points3D = race.getPoints3D(numPoints);

      // DOM Elements
      const cardLabelMode = document.getElementById('p3-card-race-mode-label');
      const badgeIndex = document.getElementById('p3-race-index-badge');
      const nameEl = document.getElementById('p3-display-race-name');
      const circuitEl = document.getElementById('p3-display-circuit-name');
      const dateEl = document.getElementById('p3-display-date');
      
      const stat1Val = document.getElementById('p3-stat-1-val');
      const stat1Lbl = document.getElementById('p3-stat-1-lbl');
      const stat2Val = document.getElementById('p3-stat-2-val');
      const stat2Lbl = document.getElementById('p3-stat-2-lbl');

      // 3D Track Card Elements
      const trackTitle = document.getElementById('p3-3d-track-title');
      const trackSub = document.getElementById('p3-3d-track-subtitle');
      const ttelSpeed = document.getElementById('p3-ttel-speed');
      const ttelRecord = document.getElementById('p3-ttel-record');
      const ttelCorners = document.getElementById('p3-ttel-corners');

      if (cardLabelMode) cardLabelMode.textContent = `${race.round} • ${currentStatusMode}`;
      if (badgeIndex) {
        if (race.isNextRace) {
          badgeIndex.textContent = `NEXT RACE (${currentRaceIdx + 1}/12)`;
          badgeIndex.classList.add('p3-badge-red');
        } else {
          badgeIndex.textContent = `${currentRaceIdx + 1} / ${f1Calendar2026.length}`;
          badgeIndex.classList.remove('p3-badge-red');
        }
      }

      if (nameEl) nameEl.textContent = race.name;
      if (circuitEl) circuitEl.textContent = race.circuit;
      if (dateEl) dateEl.textContent = race.date;

      if (trackTitle) trackTitle.textContent = `${race.name} — 3D TELEMETRY`;
      if (trackSub) trackSub.textContent = `${race.circuit.toUpperCase()} • ${race.length} • ${race.corners} CORNERS • DRS: ${race.drs}`;
      if (ttelSpeed) ttelSpeed.textContent = race.topSpeed;
      if (ttelRecord) ttelRecord.textContent = race.lapRecord;
      if (ttelCorners) ttelCorners.textContent = `${race.corners} CORNERS`;

      // Update Card 1 Stats based on selected Mode (UPCOMING vs LIVE vs RESULT)
      if (currentStatusMode === 'UPCOMING') {
        if (stat1Val) stat1Val.textContent = race.laps;
        if (stat1Lbl) stat1Lbl.textContent = 'TOTAL LAPS';
        if (stat2Val) stat2Val.textContent = race.length;
        if (stat2Lbl) stat2Lbl.textContent = 'CIRCUIT LENGTH';
      } else if (currentStatusMode === 'LIVE') {
        if (stat1Val) stat1Val.textContent = race.maxLivePos;
        if (stat1Lbl) stat1Lbl.textContent = 'LIVE MAX POSITION';
        if (stat2Val) stat2Val.textContent = race.gapP2;
        if (stat2Lbl) stat2Lbl.textContent = `GAP P2 (${race.liveLap})`;
      } else if (currentStatusMode === 'RESULT') {
        if (stat1Val) stat1Val.textContent = race.resultPos;
        if (stat1Lbl) stat1Lbl.textContent = 'FINAL RESULT';
        if (stat2Val) stat2Val.textContent = race.resultPts;
        if (stat2Lbl) stat2Lbl.textContent = 'POINTS EARNED';
      }
    }

    // Attach Prev / Next Race Navigation Buttons
    const prevBtn = document.getElementById('p3-prev-race-btn');
    const nextBtn = document.getElementById('p3-next-race-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentRaceIdx = (currentRaceIdx - 1 + f1Calendar2026.length) % f1Calendar2026.length;
        updateRaceDashboard();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentRaceIdx = (currentRaceIdx + 1) % f1Calendar2026.length;
        updateRaceDashboard();
      });
    }

    // Attach Status Mode Filter Pills
    const modePills = document.querySelectorAll('.p3-status-pill');
    modePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        modePills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        currentStatusMode = e.target.getAttribute('data-mode') || 'UPCOMING';
        updateRaceDashboard();
      });
    });

    function resize() {
      if (!trackCanvas) return;
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const rect = trackCanvas.getBoundingClientRect();
      trackCanvas.width = rect.width * dpr;
      trackCanvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resize);
    resize();

    // Mouse drag rotation handlers
    trackCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        angleY += deltaX * 0.008;
        lastMouseX = e.clientX;
      }
    });

    function project(p3, rotY) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Rotate Y axis
      const x1 = p3.x * cosY - p3.z * sinY;
      const z1 = p3.x * sinY + p3.z * cosY;

      // Isometric Pitch X axis (35deg)
      const pitch = 0.55;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const y2 = p3.y * cosP - z1 * sinP;
      const z2 = p3.y * sinP + z1 * cosP;

      const rect = trackCanvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2 + 10;
      const scale = 360 / (360 + z2);

      return {
        x: cx + x1 * scale,
        y: cy + y2 * scale,
        z: z2,
        scale: scale
      };
    }

    function animate() {
      if (!isDragging) {
        angleY += 0.006; // Continuous smooth 3D rotation
      }
      pulseProgress = (pulseProgress + 0.008) % 1;

      const rect = trackCanvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Compute 3D Left and Right Track Boundaries
      const trackQuads = [];
      for (let i = 0; i < numPoints; i++) {
        const curr = points3D[i];
        const next = points3D[(i + 1) % numPoints];

        const dx = next.x - curr.x;
        const dz = next.z - curr.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        
        // Normal vector perpendicular to track direction in XZ
        const nx = -dz / len;
        const nz = dx / len;

        const halfW = roadWidth / 2;
        const leftPt = { x: curr.x + nx * halfW, y: curr.y, z: curr.z + nz * halfW };
        const rightPt = { x: curr.x - nx * halfW, y: curr.y, z: curr.z - nz * halfW };

        const centerProj = project(curr, angleY);
        const leftProj = project(leftPt, angleY);
        const rightProj = project(rightPt, angleY);

        trackQuads.push({
          index: i,
          center: centerProj,
          left: leftProj,
          right: rightProj,
          zDepth: centerProj.z
        });
      }

      // 1. Draw 3D Ground Road Shadow
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 19, 37, 0.12)';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      trackQuads.forEach((q, idx) => {
        const shadowY = q.center.y + 22;
        if (idx === 0) ctx.moveTo(q.center.x, shadowY);
        else ctx.lineTo(q.center.x, shadowY);
      });
      ctx.closePath();
      ctx.stroke();

      // 2. Render 3D Asphalt Roadway Surface (Quads)
      for (let i = 0; i < numPoints; i++) {
        const q1 = trackQuads[i];
        const q2 = trackQuads[(i + 1) % numPoints];

        ctx.beginPath();
        ctx.moveTo(q1.left.x, q1.left.y);
        ctx.lineTo(q1.right.x, q1.right.y);
        ctx.lineTo(q2.right.x, q2.right.y);
        ctx.lineTo(q2.left.x, q2.left.y);
        ctx.closePath();

        // Dark F1 Asphalt Road Surface
        ctx.fillStyle = '#1c202a';
        ctx.fill();
      }

      // 3. Draw Outer Track Boundary Lines (White Curbs)
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      trackQuads.forEach((q, idx) => {
        if (idx === 0) ctx.moveTo(q.left.x, q.left.y);
        else ctx.lineTo(q.left.x, q.left.y);
      });
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      trackQuads.forEach((q, idx) => {
        if (idx === 0) ctx.moveTo(q.right.x, q.right.y);
        else ctx.lineTo(q.right.x, q.right.y);
      });
      ctx.closePath();
      ctx.stroke();

      // 4. Draw Racing Kerbs (Alternating Red & White at Corner Apexes)
      const cornerApexes = [0, 35, 75, 115, 150];
      cornerApexes.forEach((apexIdx) => {
        for (let k = -4; k <= 4; k++) {
          const idx = (apexIdx + k + numPoints) % numPoints;
          const q1 = trackQuads[idx];
          const q2 = trackQuads[(idx + 1) % numPoints];

          ctx.beginPath();
          ctx.moveTo(q1.right.x, q1.right.y);
          ctx.lineTo(q2.right.x, q2.right.y);
          ctx.lineWidth = 4;
          ctx.strokeStyle = (k % 2 === 0) ? '#e10600' : '#ffffff';
          ctx.stroke();
        }
      });

      // 5. Draw Racing Line Trace (Glowing Red Bull Red)
      ctx.beginPath();
      ctx.strokeStyle = '#e10600';
      ctx.lineWidth = 2;
      trackQuads.forEach((q, idx) => {
        if (idx === 0) ctx.moveTo(q.center.x, q.center.y);
        else ctx.lineTo(q.center.x, q.center.y);
      });
      ctx.closePath();
      ctx.stroke();

      // 6. Draw RACE START GRID POINT (Index 0)
      const startQuad = trackQuads[0];
      if (startQuad) {
        // White Start Line across road
        ctx.beginPath();
        ctx.moveTo(startQuad.left.x, startQuad.left.y);
        ctx.lineTo(startQuad.right.x, startQuad.right.y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 3D Start Grid Badge
        ctx.save();
        ctx.fillStyle = '#061325';
        ctx.strokeStyle = '#22c55e'; // Green Start Badge border
        ctx.lineWidth = 1.5;
        const bx = startQuad.center.x - 38;
        const by = startQuad.center.y - 28;
        ctx.beginPath();
        ctx.roundRect(bx, by, 76, 18, 9);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#22c55e';
        ctx.fillText('🟢 START GRID', bx + 6, by + 12);
        ctx.restore();
      }

      // 7. Draw CHECKERED FLAG FINISH POINT (Index 6)
      const finishQuad = trackQuads[6];
      if (finishQuad) {
        // Checkered Finish Line (Black & White Blocks across road)
        const numBlocks = 6;
        for (let b = 0; b < numBlocks; b++) {
          const ratio1 = b / numBlocks;
          const ratio2 = (b + 1) / numBlocks;
          const p1x = finishQuad.left.x + (finishQuad.right.x - finishQuad.left.x) * ratio1;
          const p1y = finishQuad.left.y + (finishQuad.right.y - finishQuad.left.y) * ratio1;
          const p2x = finishQuad.left.x + (finishQuad.right.x - finishQuad.left.x) * ratio2;
          const p2y = finishQuad.left.y + (finishQuad.right.y - finishQuad.left.y) * ratio2;

          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.strokeStyle = (b % 2 === 0) ? '#ffffff' : '#000000';
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        // 3D Checkered Flag Badge
        ctx.save();
        ctx.fillStyle = '#061325';
        ctx.strokeStyle = '#dfff00'; // Neon Yellow Finish Badge
        ctx.lineWidth = 1.5;
        const fx = finishQuad.center.x - 45;
        const fy = finishQuad.center.y - 48;
        ctx.beginPath();
        ctx.roundRect(fx, fy, 90, 18, 9);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#dfff00';
        ctx.fillText('🏁 CHECKERED FLAG', fx + 6, fy + 12);
        ctx.restore();
      }

      // 8. Draw 3D Telemetry Pulse Dot (Max's RB20 Car travelling along 3D track)
      const pulseIdx = Math.floor(pulseProgress * numPoints);
      const carQuad = trackQuads[pulseIdx];

      if (carQuad) {
        // Glowing Red Bull Red Halo
        ctx.beginPath();
        ctx.arc(carQuad.center.x, carQuad.center.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(225, 6, 0, 0.3)';
        ctx.fill();

        // Core Pulse Dot
        ctx.beginPath();
        ctx.arc(carQuad.center.x, carQuad.center.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#dfff00'; // Neon Yellow Car Marker
        ctx.fill();
        ctx.strokeStyle = '#e10600';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 9. Draw Corner Turn Labels (T1, T2, T3, T4, T5)
      cornerApexes.forEach((cIdx, turnNo) => {
        const cp = trackQuads[cIdx];
        if (cp && cIdx !== 0) {
          ctx.beginPath();
          ctx.arc(cp.center.x, cp.center.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.font = '800 9px "Space Grotesk", sans-serif';
          ctx.fillStyle = 'rgba(6, 19, 37, 0.7)';
          ctx.fillText(`T${turnNo + 1}`, cp.center.x + 6, cp.center.y - 6);
        }
      });

      requestAnimationFrame(animate);
    }

    // Initialize UI on page load
    updateRaceDashboard();
    animate();
  }
});
