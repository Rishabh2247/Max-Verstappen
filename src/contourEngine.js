// Simplex 3D Noise + Marching Squares Topographic Contour Engine
// High-performance, zero-dependency, ultra-smooth isoline rendering

// --- Fast 3D Simplex Noise Implementation ---
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

const grad3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
];

const p = new Uint8Array(256);
// Deterministic permutation initialization
for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.abs(Math.sin(i + 1) * 10000)) % 256;
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  perm[i] = p[i & 255];
  permMod12[i] = (perm[i] % 12);
}

function noise3D(xin, yin, zin) {
  let n0, n1, n2, n3;
  let s = (xin + yin + zin) * F3;
  let i = Math.floor(xin + s);
  let j = Math.floor(yin + s);
  let k = Math.floor(zin + s);
  let t = (i + j + k) * G3;
  let X0 = i - t;
  let Y0 = j - t;
  let Z0 = k - t;
  let x0 = xin - X0;
  let y0 = yin - Y0;
  let z0 = zin - Z0;

  let i1, j1, k1;
  let i2, j2, k2;

  if (x0 >= y0) {
    if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
    else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
    else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
  } else {
    if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
    else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
  }

  let x1 = x0 - i1 + G3;
  let y1 = y0 - j1 + G3;
  let z1 = z0 - k1 + G3;
  let x2 = x0 - i2 + 2.0 * G3;
  let y2 = y0 - j2 + 2.0 * G3;
  let z2 = z0 - k2 + 2.0 * G3;
  let x3 = x0 - 1.0 + 3.0 * G3;
  let y3 = y0 - 1.0 + 3.0 * G3;
  let z3 = z0 - 1.0 + 3.0 * G3;

  let ii = i & 255;
  let jj = j & 255;
  let kk = k & 255;

  let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
  if (t0 < 0) n0 = 0.0;
  else {
    let gi0 = permMod12[ii + perm[jj + perm[kk]]];
    t0 *= t0;
    n0 = t0 * t0 * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0 + grad3[gi0][2]*z0);
  }

  let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
  if (t1 < 0) n1 = 0.0;
  else {
    let gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    t1 *= t1;
    n1 = t1 * t1 * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1 + grad3[gi1][2]*z1);
  }

  let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
  if (t2 < 0) n2 = 0.0;
  else {
    let gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    t2 *= t2;
    n2 = t2 * t2 * (grad3[gi2][0]*x2 + grad3[gi2][1]*y2 + grad3[gi2][2]*z2);
  }

  let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
  if (t3 < 0) n3 = 0.0;
  else {
    let gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
    t3 *= t3;
    n3 = t3 * t3 * (grad3[gi3][0]*x3 + grad3[gi3][1]*y3 + grad3[gi3][2]*z3);
  }

  return 32.0 * (n0 + n1 + n2 + n3);
}

// --- Topographic Marching Squares Contour Engine Class ---
export class TopographicEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    // Configurable Parameters (Faster & Smoother Aesthetic)
    this.params = {
      gridStep: 10,           // Finer grid step for buttery smooth isoline curves
      levels: 8,              // Clean spacious contour levels
      speed: 0.00048,         // Faster, fluid morphing motion
      noiseScale: 0.0022,     // Smooth spatial terrain frequency
      lineThickness: 1.1,     // Crisp thin lines
      lineColor: '#e10600',   // Red Bull Red lines
      bgColor: '#ffffff',     // Pure White page background
      mouseStrength: 0.25,    // Gentle mouse elevation displacement
      mouseRadius: 220,       // Wide subtle mouse influence
      mouseMode: 'repel',     // 'repel', 'attract', 'off'
      contourOffset: 0
    };

    // State
    this.time = 0;
    this.mouse = { x: -1000, y: -1000, active: false };
    this.isLpScreen = false;
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.isRunning = false;

    // Listeners & Initialization
    this.initEvents();
    this.resize();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Recalculate grid dimensions
    this.cols = Math.ceil(this.width / this.params.gridStep) + 1;
    this.rows = Math.ceil(this.height / this.params.gridStep) + 1;
    this.grid = new Float32Array(this.cols * this.rows);
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  stop() {
    this.isRunning = false;
  }

  // Linear interpolation for smooth isoline edge crossing
  lerp(v0, v1, level) {
    if (Math.abs(v1 - v0) < 1e-6) return 0.5;
    return (level - v0) / (v1 - v0);
  }

  updateGrid() {
    const { cols, rows, params, time, mouse } = this;
    const { gridStep, noiseScale, mouseStrength, mouseRadius, mouseMode } = params;

    const rSq = mouseRadius * mouseRadius;

    for (let r = 0; r < rows; r++) {
      const y = r * gridStep;
      const rowIdx = r * cols;

      for (let c = 0; c < cols; c++) {
        const x = c * gridStep;
        
        // Base 3D Simplex noise value mapped to [-1, 1]
        let val = noise3D(x * noiseScale, y * noiseScale, time);

        // Add smooth secondary octave for continuous terrain motion
        val += 0.3 * noise3D(x * noiseScale * 1.9, y * noiseScale * 1.9, time * 1.1);

        // Mouse displacement effect
        if (mouse.active && mouseMode !== 'off') {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < rSq) {
            const factor = Math.exp(-distSq / (0.35 * rSq));
            const sign = mouseMode === 'repel' ? 1 : -1;
            val += sign * mouseStrength * factor;
          }
        }

        this.grid[rowIdx + c] = val;
      }
    }
  }

  render() {
    const { ctx, dpr, width, height, cols, rows, grid, params } = this;
    const { gridStep, levels, lineThickness, lineColor, bgColor } = params;

    // Clear canvas with white background
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Min and Max values of noise distribution
    const minVal = -1.2;
    const maxVal = 1.2;
    const step = (maxVal - minVal) / (levels + 1);

    ctx.beginPath();

    // Marching Squares loop across each grid square
    for (let r = 0; r < rows - 1; r++) {
      const y0 = r * gridStep;
      const y1 = y0 + gridStep;
      const row0 = r * cols;
      const row1 = (r + 1) * cols;

      for (let c = 0; c < cols - 1; c++) {
        const x0 = c * gridStep;
        const x1 = x0 + gridStep;

        const vTL = grid[row0 + c];
        const vTR = grid[row0 + c + 1];
        const vBR = grid[row1 + c + 1];
        const vBL = grid[row1 + c];

        // Process each isolevel threshold
        for (let l = 1; l <= levels; l++) {
          const level = minVal + l * step;

          // Corner state bitfield
          const bTL = vTL >= level ? 8 : 0;
          const bTR = vTR >= level ? 4 : 0;
          const bBR = vBR >= level ? 2 : 0;
          const bBL = vBL >= level ? 1 : 0;
          const caseIdx = bTL | bTR | bBR | bBL;

          if (caseIdx === 0 || caseIdx === 15) continue;

          // Edge intersection points
          // Edge 0 (Top): between TL and TR
          const tTop = this.lerp(vTL, vTR, level);
          const xTop = x0 + tTop * gridStep;
          const yTop = y0;

          // Edge 1 (Right): between TR and BR
          const tRight = this.lerp(vTR, vBR, level);
          const xRight = x1;
          const yRight = y0 + tRight * gridStep;

          // Edge 2 (Bottom): between BL and BR
          const tBottom = this.lerp(vBL, vBR, level);
          const xBottom = x0 + tBottom * gridStep;
          const yBottom = y1;

          // Edge 3 (Left): between TL and BL
          const tLeft = this.lerp(vTL, vBL, level);
          const xLeft = x0;
          const yLeft = y0 + tLeft * gridStep;

          // Connect edges according to Marching Squares lookup table
          switch (caseIdx) {
            case 1: // BL
            case 14:
              ctx.moveTo(xLeft, yLeft); ctx.lineTo(xBottom, yBottom);
              break;
            case 2: // BR
            case 13:
              ctx.moveTo(xBottom, yBottom); ctx.lineTo(xRight, yRight);
              break;
            case 3: // Bottom edge
            case 12:
              ctx.moveTo(xLeft, yLeft); ctx.lineTo(xRight, yRight);
              break;
            case 4: // TR
            case 11:
              ctx.moveTo(xTop, yTop); ctx.lineTo(xRight, yRight);
              break;
            case 5: // Saddle TL + BR
              ctx.moveTo(xLeft, yLeft); ctx.lineTo(xTop, yTop);
              ctx.moveTo(xBottom, yBottom); ctx.lineTo(xRight, yRight);
              break;
            case 6: // Right edge
            case 9:
              ctx.moveTo(xTop, yTop); ctx.lineTo(xBottom, yBottom);
              break;
            case 7: // Not TL
            case 8: // Only TL
              ctx.moveTo(xLeft, yLeft); ctx.lineTo(xTop, yTop);
              break;
            case 10: // Saddle TR + BL
              ctx.moveTo(xTop, yTop); ctx.lineTo(xRight, yRight);
              ctx.moveTo(xLeft, yLeft); ctx.lineTo(xBottom, yBottom);
              break;
          }
        }
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  loop = () => {
    if (!this.isRunning) return;

    this.time += this.params.speed;
    this.updateGrid();
    this.render();

    // FPS Counter calculation
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
    }

    requestAnimationFrame(this.loop);
  };
}
