  // ---------------------------------------------------------------- 블록 만들기 (toy-blocks 원본 그대로, 글자 인쇄만 깨끗하게)
  const poly = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
  function makeToyBox(S) {
    const { THREE, K } = S, cache = new Map();
    const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
    const tint = (mask, css) => { const cv = canvas(mask.width, mask.height), c = cv.getContext('2d'); c.fillStyle = css; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, 0, 0); return cv; };
    function wood(c, d, W, H, seed, dir, tone = MAPLE, rough = 150, s = PX / 380) {
      const r = K.rng(seed);
      c.fillStyle = tone.base; c.fillRect(0, 0, W, H); d.fillStyle = `rgb(128,${rough},0)`; d.fillRect(0, 0, W, H);
      const both = (path, a, lw) => { c.strokeStyle = `rgba(${tone.line},${a})`; c.lineWidth = lw; c.stroke(path); d.strokeStyle = `rgba(92,${rough + 30},0,${Math.min(1, a * 2.2)})`; d.lineWidth = lw; d.stroke(path); };
      if (dir === 'end') {
        const cx = W * r.range(-0.3, 1.3), cy = H * r.range(1.15, 2.1), far = Math.hypot(Math.max(cx, W - cx), cy);
        for (let rad = Math.max(8, cy - H) * 0.6; rad < far; rad += r.range(3.5, 9) * s) { const p = new Path2D(); p.arc(cx, cy, rad, 0, 7); both(p, r.range(0.1, 0.3), r.range(0.8, 2.6) * s); }
        for (let i = 0; i < 260 * s * s; i++) { c.fillStyle = `rgba(${tone.line},${r.range(0.1, 0.3)})`; c.fillRect(r() * W, r() * H, 1.3 * s, 1.3 * s); }
        return;
      }
      const L = dir === 'v' ? H : W, T = dir === 'v' ? W : H;
      for (const x of [c, d]) { x.save(); if (dir === 'v') x.transform(0, 1, 1, 0, 0, 0); }
      const ph = r.range(0, 6.28), amp = r.range(2, 6) * s, kx = r.range(0.5, 1.3) * 6.28 / L, wave = (x) => amp * (Math.sin(x * kx + ph) + 0.4 * Math.sin(x * kx * 2.3 + ph * 2));
      for (let i = 0; i < 8; i++) { c.fillStyle = `rgba(${tone.line},${r.range(0.03, 0.09)})`; c.fillRect(0, r.range(-0.1, 1) * T, L, r.range(0.04, 0.16) * T); }
      for (let y = -8 * s; y < T + 8 * s; y += r.range(1.6, 6.5) * s) {
        const p = new Path2D(), j = r.range(0, 6.28);
        for (let x = 0; x <= L + 16; x += 16) p.lineTo(x, y + wave(x) + Math.sin(x * 0.011 / s + j) * 0.9 * s);
        both(p, r.range(0.05, 0.24), r.range(0.6, 1.9) * s);
      }
      for (let i = 0; i < 420 * s * s; i++) { const x = r() * L; c.fillStyle = `rgba(${tone.line},${r.range(0.1, 0.26)})`; c.fillRect(x, r() * T + wave(x), r.range(3, 13) * s, 1.1 * s); }
      for (let i = 0; i < 7; i++) { const x = r() * L, w = r.range(20, 70) * s, g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, `rgba(${tone.light},0)`); g.addColorStop(0.5, `rgba(${tone.light},${r.range(0.04, 0.1)})`); g.addColorStop(1, `rgba(${tone.light},0)`); c.fillStyle = g; c.fillRect(x, 0, w, T); }
      for (const x of [c, d]) x.restore();
    }
    function paintLayer(W, H, seed, edge, wear = 1) {
      const r = K.rng(seed + 500), n = K.noise(seed + 3), cv = canvas(W, H), c = cv.getContext('2d');
      const pts = [[0, 0], [W, 0], [W, H], [0, H]];
      c.fillStyle = '#fff'; poly(c, pts);
      c.globalCompositeOperation = 'destination-out';
      let run = 0;
      pts.forEach((a, i) => {
        const b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let u = 0; u < len; u += 2, run += 2) {
          const corner = 1 + 1.1 * (1 - K.smooth(0, edge * 2.4, Math.min(u, len - u)));
          const rad = edge * wear * (0.22 + 0.5 * K.clamp(0.5 + 1.2 * n.fbm(run * 0.013, seed * 0.37, 0, 3))) * corner;
          c.beginPath(); c.arc(a[0] + (b[0] - a[0]) * u / len, a[1] + (b[1] - a[1]) * u / len, Math.max(1, rad), 0, 7); c.fill();
        }
      });
      for (let i = 0; i < 5 * wear; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = r.range(0.06, 0.3) * W; c.globalAlpha = r.range(0.25, 0.6); c.lineWidth = r.range(0.7, 1.6); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
      for (let i = 0; i < 26 * wear; i++) { c.globalAlpha = r.range(0.3, 1); c.beginPath(); c.arc(r() * W, r() * H, r.range(0.5, 2.4), 0, 7); c.fill(); }
      return cv;
    }
    const paintColour = (mask, css, seed) => {
      const r = K.rng(seed + 77), cv = tint(mask, css), c = cv.getContext('2d'), W = cv.width, H = cv.height;
      c.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 46; i++) { const x = r() * W, y = r() * H, rad = r.range(0.08, 0.3) * W, g = c.createRadialGradient(x, y, 0, x, y, rad), k = r() < 0.5 ? '255,250,235' : '20,14,8'; g.addColorStop(0, `rgba(${k},${r.range(0.03, 0.075)})`); g.addColorStop(1, `rgba(${k},0)`); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      return cv;
    };
    // 인쇄: 살짝 비뚤고 아주 적은 핀홀(글자가 폰에서 깨지지 않게 원본보다 깨끗하게). straight = 눈금자처럼 정확히
    function printLayer(W, H, seed, art, straight) {
      const r = K.rng(seed + 900), cv = canvas(W, H), c = cv.getContext('2d');
      if (straight) c.translate(W / 2, H / 2);
      else { c.translate(W / 2 + r.range(-1, 1) * W * 0.006, H / 2 + r.range(-1, 1) * H * 0.006); c.rotate(r.range(-0.012, 0.012)); }
      c.fillStyle = c.strokeStyle = '#fff'; c.lineJoin = c.lineCap = 'round';
      art(c, W, H);
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
      for (let i = 0; i < W * H / 9000; i++) { c.globalAlpha = r.range(0.3, 0.8); c.beginPath(); c.arc(r() * W, r() * H, r.range(0.4, 1.3), 0, 7); c.fill(); }
      return cv;
    }
    function face(o) {
      const W = Math.round(o.w * PX), H = Math.round(o.h * PX), key = (o.art || o.art2 || o.glow) ? null : [W, H, o.dir, o.paint, o.seed % 3].join('|');
      if (key && cache.has(key)) return cache.get(key);
      const data = K.canvasTex(W, H, null, { data: true }), d = data.ctx;
      const map = K.canvasTex(W, H, (c) => {
        wood(c, d, W, H, o.seed, o.dir || 'h', o.tone);
        if (o.paint) {
          const m = paintLayer(W, H, o.seed, EDGE * PX, o.wear == null ? 1 : o.wear);
          c.drawImage(paintColour(m, o.paint, o.seed), 0, 0);
          d.globalAlpha = 0.86; d.drawImage(tint(m, 'rgb(142,228,0)'), 0, 0); d.globalAlpha = 1;
        }
        if (o.art) {
          const m = printLayer(W, H, o.seed, o.art, o.straight);
          c.globalAlpha = 0.97; c.drawImage(tint(m, o.ink || INK), 0, 0); c.globalAlpha = 1;
          d.filter = `blur(${(PX / 260).toFixed(2)}px)`; d.drawImage(tint(m, 'rgb(70,205,0)'), 0, 0); d.filter = 'none';
        }
        if (o.art2) {                                           // 색 인쇄(앱 아이콘·색 제목): 잉크 한 색이 아닌 그림
          const cv = canvas(W, H), c2 = cv.getContext('2d'); c2.translate(W / 2, H / 2); o.art2(c2, W, H);
          c.drawImage(cv, 0, 0);
          d.filter = `blur(${(PX / 260).toFixed(2)}px)`; d.drawImage(tint(cv, 'rgb(70,205,0)'), 0, 0); d.filter = 'none';
        }
      });
      const mat = new THREE.MeshStandardMaterial({ map, bumpMap: data, bumpScale: 5, roughnessMap: data, roughness: 1 });
      if (o.glow) { mat.emissive = new THREE.Color(o.glow); mat.emissiveMap = map; mat.emissiveIntensity = o.glowK || 0.1; }
      if (key) cache.set(key, mat);
      return mat;
    }
    const shadowed = (m) => { m.castShadow = m.receiveShadow = true; return m; };
    function block({ size, grain = 'x', seed = 1, faces = {} }) {
      const [w, h, d] = size, dir = { x: ['end', 'h', 'h'], y: ['v', 'end', 'v'], z: ['h', 'v', 'end'] }[grain];
      const sides = [['right', d, h, dir[0]], ['left', d, h, dir[0]], ['top', w, d, dir[1]], ['bottom', w, d, dir[1]], ['front', w, h, dir[2]], ['back', w, h, dir[2]]];
      return shadowed(new THREE.Mesh(K.roundedBox(w, h, d, EDGE, 5), sides.map(([name, fw, fh, fd], i) => face({ w: fw, h: fh, dir: fd, seed: seed * 7 + i, ...(faces[name] || {}) }))));
    }
    return { block, face, wood };
  }

