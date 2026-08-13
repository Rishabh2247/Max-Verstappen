// WebGL Liquid Cursor Reveal Shader Engine — Lando Norris Style Large Fluid Smear
// High-performance liquid glass distortion transition with large organic liquid mass merging

export class LiquidRevealEngine {
  constructor(container, img1Src, img2Src) {
    this.container = container;
    this.img1Src = img1Src;
    this.img2Src = img2Src;

    // Create Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hero-liquid-canvas';
    this.container.appendChild(this.canvas);

    // Initialize WebGL context with transparency support
    this.gl = this.canvas.getContext('webgl', { 
      alpha: true, 
      antialias: true, 
      premultipliedAlpha: true 
    });
    
    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }

    // Enable Alpha Blending for transparent PNGs
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

    // Mouse & Physics State
    this.mouse = {
      x: 0.5, y: 0.5,
      targetX: 0.5, targetY: 0.5,
      prevX: 0.5, prevY: 0.5,
      lastSplatX: -1000, lastSplatY: -1000,
      vx: 0, vy: 0,
      isOver: false,
      hoverFactor: 0,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };

    // Splats / Trail Buffer (Max 48 active splats for wide continuous fluid pool)
    this.maxSplats = 48;
    this.splats = [];

    this.time = 0;
    this.isRunning = false;
    this.aspectRatio = 0.72;

    // Build WebGL Shaders & Buffers
    this.initWebGL();
    this.loadTextures();
    this.initEvents();
    this.resize();
  }

  initWebGL() {
    const { gl } = this;

    // Vertex Shader
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_uv;
      void main() {
        v_uv = a_texCoord;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader supporting Large Organic Liquid Pool Merging & Velocity Streaks
    const fsSource = `
      precision highp float;

      varying vec2 v_uv;

      uniform sampler2D u_tex1;
      uniform sampler2D u_tex2;
      uniform float u_time;
      uniform float u_aspect;
      uniform float u_hover;
      uniform int u_splatCount;
      
      uniform vec2 u_splatPos[48];
      uniform vec2 u_splatVel[48];
      uniform vec4 u_splatMeta[48]; // x: radius, y: intensity, z: stretch

      // --- 2D Simplex Noise ---
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = v_uv;
        
        float rawFluidSum = 0.0;

        // Aspect ratio correction
        vec2 st = vec2(uv.x * u_aspect, uv.y);

        // Accumulate active fluid splats into continuous metaball field
        for (int i = 0; i < 48; i++) {
          if (i >= u_splatCount) break;

          vec2 pos = u_splatPos[i];
          vec2 posAspect = vec2(pos.x * u_aspect, pos.y);
          vec2 vel = u_splatVel[i];
          float radius = u_splatMeta[i].x;
          float intensity = u_splatMeta[i].y;

          vec2 delta = st - posAspect;
          float speed = length(vel);
          
          // Strong velocity stretching along movement vector
          vec2 velNorm = speed > 1e-4 ? vel / speed : vec2(1.0, 0.0);
          float proj = dot(delta, velNorm);
          float stretch = 1.0 + speed * 26.0;
          
          vec2 stretchedDelta = delta - velNorm * proj * (1.0 - 1.0 / stretch);
          float dist = length(stretchedDelta);

          // Organic Simplex noise edge deformation (creates liquid pool contours)
          float n = snoise(uv * 4.5 + vec2(u_time * 0.5, u_time * 0.3)) * 0.12;
          n += snoise(uv * 11.0 - vec2(u_time * 0.8)) * 0.05;

          float effectiveDist = dist + n * radius;
          float splatVal = smoothstep(radius * 1.2, radius * 0.1, effectiveDist) * intensity;

          rawFluidSum += splatVal;
        }

        // Smoothly fade fluid influence on mouse hover
        rawFluidSum = rawFluidSum * u_hover;

        // Smoothstep thresholding forces overlapping splats to merge into ONE CONTINUOUS LIQUID POOL
        float fluidMask = smoothstep(0.12, 0.55, rawFluidSum);

        // Glass refraction offset (warps Max 1 around liquid pool boundary)
        float edgeStrength = smoothstep(0.05, 0.45, fluidMask) * (1.0 - smoothstep(0.6, 0.95, fluidMask));
        vec2 refractOffset = vec2(
          snoise(uv * 8.0 + vec2(u_time, 0.0)),
          snoise(uv * 8.0 + vec2(0.0, u_time))
        ) * 0.035 * edgeStrength;

        // Displace UVs for Max 1 near fluid edge boundary
        vec2 uvDistorted1 = clamp(uv + refractOffset, 0.0, 1.0);
        vec2 uvDistorted2 = uv; // Pixel-perfect alignment for revealed Max 2

        vec4 col1 = texture2D(u_tex1, uvDistorted1);
        vec4 col2 = texture2D(u_tex2, uvDistorted2);

        // Soft organic reveal blending
        float revealFactor = smoothstep(0.1, 0.7, fluidMask);

        // Premultiplied Alpha blending for transparent PNGs
        vec4 finalCol = mix(col1, col2, revealFactor);

        gl_FragColor = finalCol;
      }
    `;

    const compileShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    const positions = new Float32Array([
      -1, -1,  0, 1,
       1, -1,  1, 1,
      -1,  1,  0, 0,
      -1,  1,  0, 0,
       1, -1,  1, 1,
       1,  1,  1, 0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    const aTex = gl.getAttribLocation(this.program, 'a_texCoord');

    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

    this.uniforms = {
      u_tex1: gl.getUniformLocation(this.program, 'u_tex1'),
      u_tex2: gl.getUniformLocation(this.program, 'u_tex2'),
      u_time: gl.getUniformLocation(this.program, 'u_time'),
      u_aspect: gl.getUniformLocation(this.program, 'u_aspect'),
      u_hover: gl.getUniformLocation(this.program, 'u_hover'),
      u_splatCount: gl.getUniformLocation(this.program, 'u_splatCount')
    };

    this.splatLocs = { pos: [], vel: [], meta: [] };
    for (let i = 0; i < 48; i++) {
      this.splatLocs.pos.push(gl.getUniformLocation(this.program, `u_splatPos[${i}]`));
      this.splatLocs.vel.push(gl.getUniformLocation(this.program, `u_splatVel[${i}]`));
      this.splatLocs.meta.push(gl.getUniformLocation(this.program, `u_splatMeta[${i}]`));
    }
  }

  loadTextures() {
    const { gl } = this;
    this.isReady = false;
    this.img1Loaded = false;
    this.img2Loaded = false;

    const createTexture = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // Pre-fill texture with 1x1 transparent 0-alpha pixel to eliminate black box flash on reload
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      return tex;
    };

    this.tex1 = createTexture();
    this.tex2 = createTexture();

    const processImg1 = () => {
      if (this.img1Loaded) return;
      this.img1Loaded = true;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img1);
      if (img1.naturalHeight > 0) {
        this.naturalRatio = img1.naturalWidth / img1.naturalHeight;
        this.aspectRatio = this.naturalRatio;
        if (this.container) {
          this.container.style.aspectRatio = `${img1.naturalWidth} / ${img1.naturalHeight}`;
        }
      }
      this.resize();
      this.isReady = true;
    };

    const img1 = new Image();
    img1.onload = processImg1;
    img1.src = this.img1Src;
    if (img1.complete && img1.naturalWidth > 0) {
      processImg1();
    }

    const processImg2 = () => {
      if (this.img2Loaded) return;
      this.img2Loaded = true;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex2);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
    };

    const img2 = new Image();
    img2.onload = processImg2;
    img2.src = this.img2Src;
    if (img2.complete && img2.naturalWidth > 0) {
      processImg2();
    }
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isTouch) return;
      const rect = this.container.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      ) {
        this.mouse.targetX = (e.clientX - rect.left) / rect.width;
        this.mouse.targetY = (e.clientY - rect.top) / rect.height;
        this.mouse.isOver = true;
      } else {
        this.mouse.isOver = false;
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.isOver = false;
    });
  }

  resize() {
    if (!this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.container.getBoundingClientRect();

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    if (rect.height > 0) {
      this.aspectRatio = rect.width / rect.height;
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  updatePhysics() {
    const { mouse } = this;

    // Strong viscous lerp for silky smooth cursor lag
    const lerpSpeed = 0.16;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    mouse.x += (mouse.targetX - mouse.x) * lerpSpeed;
    mouse.y += (mouse.targetY - mouse.y) * lerpSpeed;

    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
    const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

    const targetHover = mouse.isOver ? 1.0 : 0.0;
    mouse.hoverFactor += (targetHover - mouse.hoverFactor) * 0.1;

    // Fluid splat injection ONLY on intentional mouse motion (eliminates stationary/micro-jitter heartbeat blinking)
    const distFromLastSplat = Math.hypot(mouse.x - mouse.lastSplatX, mouse.y - mouse.lastSplatY);

    if (mouse.isOver && speed > 0.0022 && distFromLastSplat > 0.015) {
      mouse.lastSplatX = mouse.x;
      mouse.lastSplatY = mouse.y;

      const radius = Math.min(0.24 + speed * 3.6, 0.52);
      const intensity = Math.min(0.95 + speed * 4.5, 1.4);

      this.splats.unshift({
        x: mouse.x,
        y: mouse.y,
        vx: mouse.vx,
        vy: mouse.vy,
        radius: radius,
        intensity: intensity,
        age: 0,
        maxAge: 40
      });

      if (this.splats.length > this.maxSplats) {
        this.splats.pop();
      }
    }

    // Update splats: smooth advection in velocity direction & viscous decay
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i];
      s.age++;
      s.x += s.vx * 0.28;
      s.y += s.vy * 0.28;

      const ageRatio = s.age / s.maxAge;
      s.intensity *= (1.0 - Math.pow(ageRatio, 1.3));

      if (s.age >= s.maxAge || s.intensity <= 0.01) {
        this.splats.splice(i, 1);
      }
    }
  }

  render() {
    const { gl, program, uniforms, splatLocs } = this;
    if (!gl || !program) return;

    this.time += 0.016;

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!this.isReady) return;

    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex1);
    gl.uniform1i(uniforms.u_tex1, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tex2);
    gl.uniform1i(uniforms.u_tex2, 1);

    gl.uniform1f(uniforms.u_time, this.time);
    gl.uniform1f(uniforms.u_aspect, this.aspectRatio);
    gl.uniform1f(uniforms.u_hover, this.mouse.hoverFactor);
    gl.uniform1i(uniforms.u_splatCount, this.splats.length);

    for (let i = 0; i < 48; i++) {
      if (i < this.splats.length) {
        const s = this.splats[i];
        gl.uniform2f(splatLocs.pos[i], s.x, s.y);
        gl.uniform2f(splatLocs.vel[i], s.vx, s.vy);
        gl.uniform4f(splatLocs.meta[i], s.radius, s.intensity, 0, 0);
      } else {
        gl.uniform2f(splatLocs.pos[i], -1, -1);
        gl.uniform2f(splatLocs.vel[i], 0, 0);
        gl.uniform4f(splatLocs.meta[i], 0, 0, 0, 0);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  loop = () => {
    if (!this.isRunning) return;
    this.updatePhysics();
    this.render();
    requestAnimationFrame(this.loop);
  };
}
