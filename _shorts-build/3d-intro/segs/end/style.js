// e3 — 엔딩 문장(「72시간」). 원본 부품 embossed__ending-store-search 를 문장·주소만 바꿔 씀.
// (옛 주석) s9 — 엔딩 문장. 화풍: embossed(두꺼운 면 종이 활판 + 구리 박). 원본 embossed.js 를 세로 카드로 옮겼다.
// 카드에 찍히는 것: 1·2줄(1차 활자판), 3·5줄 + 앱 아이콘 타일 + '안부'(2차 활자판), 4줄(가열 다이로 박 찍기).
// v2: 11.7초. 박 16–20 카메라가 아래 두 번째 카드로 내려가고 3차 활자판이 아이콘·안부·문구·'스토어에서 ‘Anbu’ 검색'을 찍는다. 박 20–24 완전 정지.
// 3D 분위기: 키 조명 쪽 빛줄기 + 그 안의 먼지, 뒤쪽 림 라이트, 광택 탁자, 먼 보케. 박 8 찍기는 리본·레버 시계만 0.6배 느리게.
(function () {
  const B = ANBU.B, bt = (n) => n * B;   // 원본 부품의 박자(초) 그대로
  const LINES = [
    // 언어별(lang/<lang>.json end): 0·1 = 첫 문장 두 줄, 2·4 = 굵은 잉크, 3 = 구리 박 강조(빈 칸 허용)
    { text: ANBU.S().end[0], w: 700, ch: 'ink1' },
    { text: ANBU.S().end[1], w: 700, ch: 'ink1' },
    { text: ANBU.S().end[2], w: 900, ch: 'ink2' },
    { text: ANBU.S().end[3], w: 900, ch: 'foil' },
    { text: ANBU.S().end[4], w: 900, ch: 'ink2' },
  ];
  const BRAND = ANBU.S().brand;   // 한국어 '안부', 그 밖 'Anbu'
  const CARD1_BRAND = false;
  const CARD1_DY = CARD1_BRAND ? 0 : 1.85;   // 박 줄이 내려간 만큼 박 찍기 카메라도 내린다   // 3차 피드백: 첫 카드에서 아이콘·'안부'를 뺐다(아이콘은 마지막 카드에만)
  const TAG = 'https://averic.co.kr';   // 스토어 검색 문구 아래 줄(홈페이지 주소)
  const STORE = ANBU.RTL() ? ANBU.S().store.slice().reverse() : ANBU.S().store;   // 'Anbu' 만 호박색 잉크(가운데 조각). 아랍어는 오른쪽부터 읽으므로 조각 순서를 뒤집어 왼쪽부터 찍는다
  const AMBER = '#ffa024';
  const C2W = 9, C2H = 8.2, Y2 = -(16 / 2 + 0.9 + C2H / 2);   // 두 번째 카드(첫 카드 아래)
  const ART2_W = 2304, ART2_H = Math.round(ART2_W * C2H / C2W);
  const DBG = false;
  const PAPER = '#c9ba9c', INK = '#34445f', FOIL = '#ffae3a';
  const CARD_W = 9, CARD_H = 16;
  const ART_H = 4096, ART_W = Math.round(ART_H * CARD_W / CARD_H), U = ART_H / CARD_H;   // 256 px / unit
  const ax = (x) => (x + CARD_W / 2) * U, ay = (y) => (CARD_H / 2 - y) * U;            // page -> art px

  // 박자 시각표(그림·소리 공통)
  const T = {
    hit1: bt(1), lift1: bt(1.7), open1: bt(2.7), gone1: bt(3.6),
    downB: bt(2.3), hit2: bt(4), lift2: bt(4.7), open2: bt(5.7), gone2: bt(6.5),
    strip: bt(6), laid: bt(7), stamp: bt(8), stampLift: bt(8.6), stampGone: bt(9.5),
    peel: bt(9.2), peeled: bt(10.4), sweep: bt(10), flash: bt(11), rest: bt(12),
    inC: bt(15.4), downC: bt(16.6), hit3: bt(18), lift3: bt(18.55), open3: bt(19.2), gone3: bt(19.85), end: bt(20),
  };
  // 박 8 찍기 순간만 느리게(리본·레버 시계). 박 8 과 창 양 끝은 고정점, 가운데 0.6배, 가장자리에서 보충.
  const SW_L = bt(0.6), SW_R = bt(1.6);
  const slow = (t) => { const d = t - T.stamp, W = d < 0 ? SW_L : SW_R, x = d / W; return Math.abs(x) >= 1 ? t : T.stamp + d - 0.4 * d * (1 - x * x) * (1 - x * x); };
  const unslow = (s) => { let a = s - 1.5, b = s + 1.5; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (slow(m) < s) a = m; else b = m; } return (a + b) / 2; };

  // 글자 배치(page 좌표, y 위쪽). 1·2줄은 2줄 폭이 7.3 이 되게 크기를 맞춘다.
  function layout() {
    const m = document.createElement('canvas').getContext('2d');
    const width = (txt, wgt, px, ls) => { m.font = `${wgt} ${px}px "Noto Sans KR"`; m.letterSpacing = (ls || 0) + 'px'; return m.measureText(txt).width; };
    const LS = -0.02;   // 1·2줄 자간(em)
    let em12 = Math.min(0.74 * U, 1000 * (CARD1_BRAND ? 7.3 : 8.0) * U / Math.max(width(LINES[0].text, 700, 1000, LS * 1000), width(LINES[1].text, 700, 1000, LS * 1000)));
    const em3 = Math.min(0.98 * U, 1000 * 7.6 * U / Math.max(1, width(LINES[2].text, 900, 1000)));   // 긴 언어는 폭에 맞춰 줄인다
    let em4 = Math.min(0.82 * U, 1000 * 7.4 * U / Math.max(1, width(LINES[3].text, 900, 1000)));
    const em5 = Math.min(0.8 * U, 1000 * 7.6 * U / Math.max(1, width(LINES[4].text, 900, 1000)));
    const ys = CARD1_BRAND ? [5.55, 4.6, 2.65, 1.15, -0.3] : [5.4, 4.35, 1.6, -0.75, -3.1];
    const ems = [em12, em12, em3, em4, em5];
    const tile = { s: 1.75, cx: -1.3, cy: -2.95 };
    const emBrand = 1.12 * U;
    const brandW = width(BRAND, 900, emBrand) / U;
    // 아이콘 타일과 '안부'를 한 덩어리로 가운데
    const gap = 0.35, total = tile.s + gap + brandW, x0 = -total / 2;
    tile.cx = x0 + tile.s / 2;
    const brand = { x: x0 + tile.s + gap + brandW / 2, y: tile.cy, em: emBrand, w: brandW };
    // 실제 글자 잉크 높이(검증용)
    m.font = `700 ${em12}px "Noto Sans KR"`; m.letterSpacing = '0px';
    const mt = m.measureText('가족의 마음');
    return { ys, ems, LS, tile, brand, ink12: (mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent) / U, w2: width(LINES[1].text, 700, em12, LS * em12) / U, w4: width(LINES[3].text, 900, em4) / U };
  }
  function drawArt(ctx, layer, L) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    LINES.forEach((ln, i) => {
      if (ln.ch !== layer) return;
      ctx.font = `${ln.w} ${L.ems[i]}px "Noto Sans KR"`; ctx.letterSpacing = (i < 2 ? L.LS * L.ems[i] : 0) + 'px';
      ctx.fillText(ln.text, ax(0), ay(L.ys[i]));
    });
    ctx.letterSpacing = '0px';
    if (layer === 'ink2' && CARD1_BRAND) {
      ctx.font = `900 ${L.brand.em}px "Noto Sans KR"`; ctx.fillText(BRAND, ax(L.brand.x), ay(L.brand.y) + 0.03 * U);
      // 아이콘이 인쇄될 타일 자리: 60% 회색 = 얕게 눌림 + 잉크 없음
      const s = L.tile.s * U; ctx.save(); ctx.fillStyle = '#999'; ctx.beginPath(); ctx.roundRect(ax(L.tile.cx) - s / 2, ay(L.tile.cy) - s / 2, s, s, s * 0.23); ctx.fill(); ctx.restore();
    }
  }

  // 두 번째 카드 배치(카드 중심 좌표, y 위쪽). 아이콘+안부 / 문구 / 스토어 검색(가장 큼)
  function layout2() {
    const U2 = ART2_W / C2W, m = document.createElement('canvas').getContext('2d');
    const width = (txt, wgt, px) => { m.font = `${wgt} ${px}px "Noto Sans KR"`; return m.measureText(txt).width; };
    const emS = 1000 * 7.3 * U2 / width(STORE.join(''), 900, 1000);
    const emT = Math.min(0.62 * U2, 1000 * 6.2 * U2 / width(TAG, 700, 1000));
    const tile = { s: 1.45 }, emB = 0.98 * U2, brandW = width(BRAND, 900, emB) / U2, gap = 0.3, tot = tile.s + gap + brandW, x0 = -tot / 2;
    const ys = { lock: 2.0, store: 0.15, tag: -1.8 };
    // 다국어: 한 줄로는 글자가 너무 작아지는 긴 스토어 문구는 두 줄로(‘Anbu’ 강조는 그대로). 아랍어는 한 줄 유지
    let rows = null, emR = 0;
    if (ANBU.S().lang !== 'ko' && emS < 0.62 * U2 && !ANBU.RTL()) {
      const toks = []; STORE.forEach((p, i) => ANBU.tokens(p).forEach((t) => toks.push({ s: t, hl: i === 1 })));
      const W2 = (arr, em) => arr.reduce((a, t) => a + width(t.s, 900, em), 0);
      let best = null;
      for (let i = 1; i < toks.length; i++) { const a = toks.slice(0, i), b = toks.slice(i), w = Math.max(W2(a, 1000), W2(b, 1000)); if (!best || w < best.w) best = { a, b, w }; }
      if (best) {
        const trim = (arr) => { arr = arr.map((t) => ({ ...t })); arr[0].s = arr[0].s.replace(/^ /, ''); arr[arr.length - 1].s = arr[arr.length - 1].s.replace(/ $/, ''); return arr; };
        rows = [trim(best.a), trim(best.b)]; emR = Math.min(0.78 * U2, 1000 * 7.6 * U2 / Math.max(W2(rows[0], 1000), W2(rows[1], 1000)));
        ys.store = 0.6; ys.store2 = -0.45; ys.tag = -1.95;
      }
    }
    tile.cx = x0 + tile.s / 2; tile.cy = ys.lock;
    const brand = { x: x0 + tile.s + gap + brandW / 2, y: ys.lock, em: emB, w: brandW };
    const parts = STORE.map((s) => width(s, 900, emS) / U2);
    m.font = `900 ${emS}px "Noto Sans KR"`; const ms = m.measureText(STORE.join(''));
    m.font = `700 ${emT}px "Noto Sans KR"`; const mtg = m.measureText(TAG);
    return { U2, emS, emT, tile, brand, ys, parts, rows, emR, wS: parts.reduce((a, b) => a + b, 0), wT: mtg.width / U2,
      inkS: [ms.actualBoundingBoxAscent / U2, ms.actualBoundingBoxDescent / U2], inkT: [mtg.actualBoundingBoxAscent / U2, mtg.actualBoundingBoxDescent / U2] };
  }
  function drawArt2(ctx, layer, L) {
    const U2 = L.U2, bx = (x) => (x + C2W / 2) * U2, by = (y) => (C2H / 2 - y) * U2;
    ctx.textBaseline = 'middle';
    if (layer === 'ink1') {
      ctx.textAlign = 'center';
      ctx.font = `900 ${L.brand.em}px "Noto Sans KR"`; ctx.fillText(BRAND, bx(L.brand.x), by(L.brand.y) + 0.03 * U2);
      ctx.font = `700 ${L.emT}px "Noto Sans KR"`; ctx.fillText(TAG, bx(0), by(L.ys.tag));
      const s = L.tile.s * U2; ctx.save(); ctx.fillStyle = '#999'; ctx.beginPath(); ctx.roundRect(bx(L.tile.cx) - s / 2, by(L.tile.cy) - s / 2, s, s, s * 0.23); ctx.fill(); ctx.restore();
    }
    ctx.textAlign = 'left';
    if (L.rows) {   // 두 줄
      ctx.font = `900 ${L.emR}px "Noto Sans KR"`;
      L.rows.forEach((row, r) => {
        const w = row.reduce((a, t) => a + ctx.measureText(t.s).width, 0) / U2; let x = -w / 2;
        row.forEach((t) => { if (t.hl === (layer === 'foil') && layer !== 'ink2') ctx.fillText(t.s, bx(x), by(r ? L.ys.store2 : L.ys.store)); x += ctx.measureText(t.s).width / U2; });
      });
      return;
    }
    ctx.font = `900 ${L.emS}px "Noto Sans KR"`;
    let x = -L.wS / 2;
    STORE.forEach((part, i) => { if ((i === 1) === (layer === 'foil') && layer !== 'ink2') ctx.fillText(part, bx(x), by(L.ys.store)); x += L.parts[i]; });
  }

  // ---- 원본 그대로: 평면 그림 -> 부조 지도 (R = 1차 잉크, G = 박, B = 2차 잉크)
  function reliefMaps(K, W, H, draw) {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const layers = ['ink1', 'foil', 'ink2'].map((name) => { const c = mk(W, H), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = x.strokeStyle = '#fff'; draw(x, name); return c; });
    const tmp = mk(W, H), tx = tmp.getContext('2d');
    const pack = (w, h, blur) => K.canvasTex(w, h, (ctx) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      layers.forEach((src, i) => {
        tx.globalCompositeOperation = 'source-over'; tx.filter = 'none'; tx.fillStyle = '#000'; tx.fillRect(0, 0, W, H);
        tx.filter = `blur(${blur}px)`; tx.drawImage(src, 0, 0, w, h); tx.filter = 'none';
        tx.globalCompositeOperation = 'multiply'; tx.fillStyle = ['#f00', '#0f0', '#00f'][i]; tx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(tmp, 0, 0, w, h, 0, 0, w, h);
      });
    }, { data: true });
    return { shape: pack(W, H, 0.7), soft: pack(W, H, 2.6), halo: pack(W >> 2, H >> 2, 9), layers };
  }
  function fibreMaps(THREE, K) {
    const N = 1024, r = K.rng(3);
    const bump = K.canvasTex(N, N, (ctx) => {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, N, N); ctx.lineCap = 'round';
      const wrap = (x, y, pad, fn) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) if (x + ox > -pad && x + ox < N + pad && y + oy > -pad && y + oy < N + pad) fn(x + ox, y + oy); };
      for (let i = 0; i < 52000; i++) { const v = r.chance(0.5) ? 255 : 0, rad = r.range(1.2, 4.5); ctx.fillStyle = `rgba(${v},${v},${v},${r.range(0.05, 0.22)})`; wrap(r.range(0, N), r.range(0, N), 6, (x, y) => { ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill(); }); }
      for (let i = 0; i < 2600; i++) {
        const a = r.range(0, 6.283), len = r.range(8, 44), b = a + r.range(-1, 1), v = r.chance(0.6) ? 255 : 0;
        ctx.strokeStyle = `rgba(${v},${v},${v},${r.range(0.08, 0.3)})`; ctx.lineWidth = r.range(0.7, 1.8);
        wrap(r.range(0, N), r.range(0, N), 50, (x, y) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(b) * len * 0.5, y + Math.sin(b) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke(); });
      }
    }, { data: true, repeat: [1, 1] });
    const src = bump.ctx.getImageData(0, 0, N, N).data, out = new Uint8Array(N * N * 4), h = (x, y) => src[(((y + N) % N) * N + ((x + N) % N)) * 4] / 255;
    const waves = Array.from({ length: 14 }, () => [r.int(-5, 5), r.int(-5, 5), r.range(0, 6.283), r.range(0.4, 1)]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const o = ((N - 1 - y) * N + x) * 4;
      out[o] = K.clamp(0.5 + (h(x - 1, y) - h(x + 1, y)) * 1.6) * 255; out[o + 1] = K.clamp(0.5 + (h(x, y + 1) - h(x, y - 1)) * 1.6) * 255; out[o + 2] = h(x, y) * 255;
      let c = 0; for (const [kx, ky, ph, am] of waves) c += am * Math.cos((kx * x + ky * y) / N * 6.283 + ph);
      out[o + 3] = K.clamp(0.5 + c * 0.085) * 255;
    }
    const tex = new THREE.DataTexture(out, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 8; tex.needsUpdate = true;
    return { tex, bump };
  }
  // ---- 원본 그대로: 깊이가 보이는 부조 재질(시차 추적 + 자기 그림자)
  function reliefMaterial(THREE, mat, o) {
    const uniforms = Object.assign({ tShape: { value: o.maps.shape }, tSoft: { value: o.maps.soft }, tHalo: { value: o.maps.halo }, tFibre: { value: o.fibre },
      uSize: { value: new THREE.Vector2(o.size[0], o.size[1]) }, uTop: { value: o.top }, uLow: { value: o.low }, uLightL: { value: new THREE.Vector3(0, 0, 10) } }, o.uniforms);
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRl, vRt, vRb, vRn;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRl = position; vRt = normalMatrix * vec3(1.0, 0.0, 0.0); vRb = normalMatrix * vec3(0.0, 1.0, 0.0); vRn = normalMatrix * vec3(0.0, 0.0, 1.0);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform sampler2D tShape, tSoft, tHalo, tFibre; uniform vec2 uSize; uniform float uTop, uLow; uniform vec3 uLightL;
        varying vec3 vRl, vRt, vRb, vRn;
        float rShadow = 1.0, rSpec = 1.0;
        vec2 rPx, rPy;
        #define ART(tex, p) textureGrad(tex, (p) / uSize + 0.5, rPx / uSize, rPy / uSize)
        vec4 fibre(vec2 q, vec2 s) { return textureGrad(tFibre, q * s, rPx * s, rPy * s); }
        ${o.height}
        vec2 reliefTrace(vec2 p, vec3 V) {
          vec2 slide = -V.xy / max(V.z, 0.15); float range = uTop - uLow, d0 = 0.0, g0 = uTop - reliefH(p), d = range;
          for (int i = 1; i <= 24; i++) {
            float di = range * float(i) / 24.0, g = uTop - reliefH(p + slide * di) - di;
            if (g <= 0.0) { d = mix(d0, di, g0 / max(g0 - g, 1e-5)); break; }
            d0 = di; g0 = g;
          }
          return p + slide * d;
        }
        vec3 reliefNormal(vec2 p, float e) {
          return normalize(vec3(reliefH(p - vec2(e, 0.0)) - reliefH(p + vec2(e, 0.0)), reliefH(p - vec2(0.0, e)) - reliefH(p + vec2(0.0, e)), 2.0 * e));
        }
        float reliefShadow(vec2 p, float h0, vec3 L, float reach, float soft) {
          if (L.z <= 0.0) return 1.0;
          float slope = L.z / max(length(L.xy), 1e-4), occ = 0.0; vec2 dir = normalize(L.xy);
          for (int i = 1; i <= 14; i++) { float d = reach * float(i) / 14.0; occ = max(occ, reliefH(p + dir * d) - h0 - d * slope); }
          return 1.0 - smoothstep(0.0, soft, occ);
        }`)
        .replace('#include <normal_fragment_maps>', `{
          rPx = dFdx(vRl.xy); rPy = dFdy(vRl.xy);
          vec2 p = reliefTrace(vRl.xy, normalize(vec3(dot(vViewPosition, vRt), dot(vViewPosition, vRb), dot(vViewPosition, vRn))));
          vec3 shape = ART(tShape, p).rgb, soft = ART(tSoft, p).rgb, halo = ART(tHalo, p).rgb;
          float h0 = reliefH(p); vec3 n = reliefNormal(p, 0.005), toLight = normalize(uLightL - vec3(p, h0 - uTop));
          ${o.surface}
          normal = normalize(vRt * n.x + vRb * n.y + vRn * n.z);
        }`)
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse *= rShadow; reflectedLight.directSpecular *= rShadow * rSpec; reflectedLight.indirectSpecular *= rSpec;');
    };
    mat.customProgramCacheKey = () => o.height + o.surface;
    mat.userData.u = uniforms;
    return mat;
  }

  registerStyle({
    id: 'end', duration: 24 * ANBU.B,
    fonts: ['700 300px "Noto Sans KR"', '900 300px "Noto Sans KR"'],
    koText: LINES.map((l) => l.text).join('') + BRAND + TAG + STORE.join('') + 'Anbu‘’“”?',
    render: { samples: 48, shutter: 0.3, tone: 'filmic', exposure: 0.5, bloom: 0.32, bloomThreshold: 1.1, bloomRadius: 1, vignette: 0.3, grain: 0.02, fov: 24, background: ANBU.PAL.bg },

    async build(S) {
      const { THREE, K, scene, camera } = S;
      const icon = await ANBU.loadIcon();
      const L = layout(), maps = reliefMaps(K, ART_W, ART_H, (ctx, layer) => drawArt(ctx, layer, L)), fibre = fibreMaps(THREE, K);
      const MARK = [0, L.ys[3]];
      const PAPER_T = 0.09;
      const table = new THREE.Group(); table.rotation.x = -Math.PI / 2; scene.add(table);
      const world = (p) => [p[0], p[2], -p[1]];

      // ---- 조명: 공통 규칙(어둠 속 따뜻한 키 하나 + 옆의 옅은 차가운 보조광). 키는 원본처럼 낮게 비추는 레이킹 램프.
      K.env(S, { top: '#100f0e', horizon: '#1e1b18', bottom: '#060607', intensity: 0.55, panels: [
        { pos: world([0, 40, 20]), size: [56, 16], color: '#ffe2bf', power: 1.4 },
        { pos: world([-8, -44, 9]), size: [46, 12], color: '#ffe2bf', power: 2.4 },
        { pos: world([0, 8, 40]), size: [24, 24], color: '#ffd6a0', power: 2.2 },     // 위에서 내려다볼 때 박이 반사할 판
        { pos: world([-5, -22, -30]), size: [22, 30], color: '#ffd6a0', power: 2.6 },
        { pos: world([32, -8, 14]), size: [14, 20], color: '#7f9cc7', power: 1.3 },
      ] });
      const key = K.spot(S, { target: world([0.5, 0.5, 0]), color: '#ffd6a0', power: 36000, angle: 0.32, penumbra: 1, soft: 1.4, far: 140 });
      const keyPos = K.path([[0, [-48, -15, 10]], [T.sweep, [-49, -11, 10.4]], [T.rest, [-41, 27, 12.5]]]);
      const cool = new THREE.DirectionalLight('#7f9cc7', 0.32); cool.position.set(...world([30, -6, 9])); scene.add(cool, cool.target);
      const glint = K.spot(S, { color: '#fff0da', power: 380, angle: 0.3, penumbra: 1, shadow: false });
      const glintOff = K.path([[T.sweep, -10], [T.flash, -0.3], [T.rest, 1.7]]);

      // ---- 종이: 거친 가장자리 두꺼운 면 종이
      const paper = reliefMaterial(THREE, new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.94 }), {
        maps, fibre: fibre.tex, size: [CARD_W, CARD_H], top: 0.0, low: -0.034,
        uniforms: { uIn1: { value: 0 }, uIn2: { value: 0 }, uFoilIn: { value: 0 }, uWet: { value: 0 }, uInk: { value: new THREE.Color(INK) }, uFoil: { value: new THREE.Color(FOIL) },
          tIcon: { value: icon }, uIconRect: { value: CARD1_BRAND ? new THREE.Vector4(L.tile.cx - L.tile.s / 2, L.tile.cy - L.tile.s / 2, L.tile.s, L.tile.s) : new THREE.Vector4(60, 60, 1, 1) } },
        height: `uniform float uIn1, uIn2, uFoilIn, uWet; uniform vec3 uInk, uFoil; uniform sampler2D tIcon; uniform vec4 uIconRect;
          float reliefH(vec2 p) {
            vec3 s = ART(tSoft, p).rgb;
            return -0.03 * (smoothstep(0.08, 0.92, s.r) * uIn1 + smoothstep(0.08, 0.92, s.b) * uIn2) - 0.022 * smoothstep(0.08, 0.92, s.g) * uFoilIn;
          }`,
        surface: `
          vec4 fine = fibre(p, vec2(0.3)), coarse = fibre(p.yx + 2.8, vec2(0.11));
          float cloud = coarse.a, pressed = smoothstep(0.15, 0.85, max(max(soft.r * uIn1, soft.b * uIn2), soft.g * uFoilIn));
          float dip = max(max(halo.r * uIn1, halo.b * uIn2), halo.g * uFoilIn);
          vec2 rim = 0.5 * uSize - abs(p); float edge = smoothstep(0.4, 0.0, min(rim.x, rim.y));
          vec2 tooth = (fine.rg - 0.5) * 0.4 + (coarse.rg - 0.5) * 0.38;
          n = normalize(vec3(n.xy + tooth * mix(0.5, 0.1, pressed) * (1.0 + 2.0 * edge) + sign(p) * step(rim, rim.yx) * edge * edge * 0.5, n.z));
          rShadow = reliefShadow(p, h0, toLight, 0.3, 0.004);
          diffuseColor.rgb *= (0.95 + 0.1 * cloud) * (1.0 - 0.07 * dip) * (1.0 - 0.07 * smoothstep(0.62, 0.8, coarse.b)) + 0.05 * edge;
          roughnessFactor = 0.95 - 0.16 * pressed; rSpec = 0.6;
          float salt = smoothstep(0.36, 0.30, fibre(p + 3.3, vec2(0.21)).b) + 0.4 * smoothstep(0.35, 0.29, fine.b);
          float inkS = max(soft.r * uIn1, soft.b * uIn2);
          float ink = smoothstep(0.62, 0.74, inkS) * (1.0 - 0.4 * min(salt, 1.0));
          vec3 inkC = uInk * (0.6 + 0.8 * cloud) * (1.0 + 0.5 * smoothstep(0.85, 1.0, inkS));
          diffuseColor.rgb = mix(diffuseColor.rgb, inkC, ink);
          roughnessFactor = mix(roughnessFactor, mix(0.8, 0.34, uWet) + 0.14 * (cloud - 0.5), ink); rSpec = mix(rSpec, mix(0.25, 1.0, uWet), ink);
          // 실제 앱 아이콘이 눌린 타일 바닥에 인쇄된다(그림은 그대로)
          vec2 iuv = (p - uIconRect.xy) / uIconRect.zw;
          float inTile = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0) * smoothstep(0.3, 0.5, shape.b) * uIn2;
          vec2 suv = mix(vec2(0.12), vec2(0.884), iuv);
          vec3 ic = textureGrad(tIcon, suv, rPx / uIconRect.zw * 0.764, rPy / uIconRect.zw * 0.764).rgb;
          diffuseColor.rgb = mix(diffuseColor.rgb, ic * (0.94 + 0.08 * cloud), inTile);
          roughnessFactor = mix(roughnessFactor, 0.55, inTile); rSpec = mix(rSpec, 0.7, inTile);
          float foil = smoothstep(0.4, 0.6, shape.g) * uFoilIn;
          diffuseColor.rgb = mix(diffuseColor.rgb, uFoil, foil); metalnessFactor = foil; roughnessFactor = mix(roughnessFactor, 0.2 + 0.1 * cloud, foil); rSpec = mix(rSpec, 1.0, foil);`,
      });
      const side = new THREE.MeshStandardMaterial({ color: '#efe6d4', roughness: 1, bumpMap: fibre.bump, bumpScale: 3 });
      function makeSheet(parent, CW, CH, mat, seed) {
        const n = K.noise(seed), pts = [], hw = CW / 2, hh = CH / 2, per = 2 * (CW + CH), step = 0.012;
        for (let s = 0; s < per; s += step) {
          const q = s < CW ? [-hw + s, -hh, 0, 1] : s < CW + CH ? [hw, -hh + s - CW, -1, 0] : s < 2 * CW + CH ? [hw - (s - CW - CH), hh, 0, -1] : [-hw, hh - (s - 2 * CW - CH), 1, 0];
          const off = 0.12 + 0.08 * n.fbm(s * 0.8, 1.3) + 0.04 * n.fbm(s * 3.5, 4.1, 0, 3) + 0.06 * Math.max(0, n.n2(s * 1.9, 9.2) - 0.4);
          pts.push(new THREE.Vector2(q[0] + q[2] * off, q[1] + q[3] * off));
        }
        for (let pass = 0; pass < 3; pass++) { const c = pts.map((v) => v.clone()), N = c.length; pts.forEach((v, i) => v.copy(c[(i + N - 2) % N]).add(c[(i + N - 1) % N]).add(c[i]).add(c[(i + 1) % N]).add(c[(i + 2) % N]).multiplyScalar(0.2)); }
        const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: PAPER_T - 0.07, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.05, bevelSegments: 3 }); geo.translate(0, 0, -PAPER_T + 0.035);
        const sheet = new THREE.Mesh(geo, [mat, side]); sheet.castShadow = true; sheet.receiveShadow = true; parent.add(sheet); return sheet;
      }
      makeSheet(table, CARD_W, CARD_H, paper, 7);
      const bedTex = fibre.bump.clone(); bedTex.repeat.set(26, 26); bedTex.needsUpdate = true;
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ color: '#121317', roughness: 0.5, metalness: 0.1, bumpMap: bedTex, bumpScale: 0.7 }));
      bed.position.z = -PAPER_T; bed.receiveShadow = true; table.add(bed);

      // ---- 활자판 두 개: 거울상 활자가 선 황동 다이 + 강철 판. A 는 위쪽 경첩(1·2줄), B 는 오른쪽 경첩(3·5줄·아이콘·안부)
      const steel = new THREE.MeshStandardMaterial({ color: '#46494f', roughness: 0.5, metalness: 0.6 });
      const brassMat = new THREE.MeshStandardMaterial({ color: '#d9ac5f', roughness: 0.36, metalness: 1 });
      const part = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
      const plateMat = (mp, size, ch) => { const sx = ch === 'rg' ? 'max(s.r, s.g)' : 's.' + ch, hx = ch === 'rg' ? 'max(shape.r, shape.g)' : 'shape.' + ch; return reliefMaterial(THREE, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 1 }), {
        maps: mp, fibre: fibre.tex, size: [size[0], -size[1]], top: 0.04, low: 0.0,
        uniforms: { uUsed: { value: 0 }, uInk: { value: new THREE.Color(INK) } },
        height: `uniform float uUsed; uniform vec3 uInk;
          float reliefH(vec2 p) { vec3 s = ART(tSoft, p).rgb; return 0.04 * smoothstep(0.3, 0.7, ${sx}); }`,
        surface: `
          vec4 lines = fibre(p, vec2(0.017, 0.8)), pit = fibre(p, vec2(0.31));
          float up = smoothstep(0.4, 0.6, ${hx});
          n = normalize(vec3(n.xy + mix((pit.rg - 0.5) * 0.4, vec2(0.0, (lines.g - 0.5) * 0.2), up), n.z));
          rShadow = reliefShadow(p, h0, toLight, 0.35, 0.01);
          diffuseColor.rgb = mix(vec3(0.62, 0.40, 0.16), vec3(0.98, 0.76, 0.38), up); roughnessFactor = mix(0.42, 0.24 + 0.1 * lines.b, up);
          float film = up * mix(1.0, 0.25 + 0.6 * pit.a, uUsed);
          diffuseColor.rgb = mix(diffuseColor.rgb, uInk * 0.5, film); metalnessFactor = 1.0 - film; roughnessFactor = mix(roughnessFactor, 0.22, film); rSpec = 1.0 - 0.6 * film;`,
      }); };
      // 판 하나 만들기: 다이 영역 [x0,x1]×[y0,y1](page), 경첩 위치 hp, 경첩 축('x' 위쪽 경첩 / 'y' 옆 경첩)
      function makePlate(ch, rect, hp, axis, parent = table, mp = maps, size = [CARD_W, CARD_H]) {
        const [x0, x1, y0, y1] = rect, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const hinge = new THREE.Group(); hinge.position.set(hp[0], hp[1], hp[2]); parent.add(hinge);
        const forme = new THREE.Group(); forme.position.set(-hp[0], -hp[1], -hp[2]); hinge.add(forme);
        part(forme, K.roundedBox(w, h, 0.34, 0.03, 3), brassMat, cx, cy, 0.174);
        part(forme, K.roundedBox(w + 0.5, h + 0.5, 0.6, 0.07, 4), steel, cx, cy, 0.64);
        const nr = Math.max(2, Math.round(h / 2.4));
        for (let i = 0; i < nr; i++) part(forme, K.roundedBox(w + 0.5, 0.45, 0.3, 0.06, 4), steel, cx, y0 + (i + 0.5) * h / nr, 1.05);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) part(forme, new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24), brassMat, cx + sx * (w / 2 - 0.5), cy + sy * (h / 2 - 0.4), 1.0).rotation.x = Math.PI / 2;
        // 경첩 봉과 판을 잇는 팔
        if (axis === 'x') { part(hinge, new THREE.CylinderGeometry(0.3, 0.3, w + 3, 32), steel, 0, 0, 0).rotation.z = Math.PI / 2; for (const sx of [-1, 1]) part(forme, K.roundedBox(0.4, hp[1] - y1 + 0.3, 0.3, 0.06, 4), steel, cx + sx * (w / 2 - 0.2), (y1 + hp[1]) / 2, 0.8); }
        else { part(hinge, new THREE.CylinderGeometry(0.3, 0.3, h + 3, 32), steel, 0, 0, 0); for (const sy of [-1, 1]) part(forme, K.roundedBox(hp[0] - x1 + 0.3, 0.4, 0.3, 0.06, 4), steel, (x1 + hp[0]) / 2, cy + sy * (h / 2 - 0.2), 0.8); }
        const mat = plateMat(mp, size, ch);
        const g = new THREE.PlaneGeometry(w, h); g.translate(cx, -cy, 0);   // 로컬 좌표 = page 좌표(뒤집힘 포함)
        const face = part(forme, g, mat, 0, 0, 0.003); face.rotation.x = Math.PI; face.castShadow = false;
        return { hinge, face, mat };
      }
      const pA = makePlate('r', [-4.15, 4.15, 3.85, 6.25], [0, CARD_H / 2 + 1.0, 0.75], 'x');
      const pB = makePlate('b', [-4.15, 4.15, -4.0, 3.35], [CARD_W / 2 + 1.2, -0.3, 0.75], 'y');
      const angA = (t) => (t < T.hit1 ? 0.62 * (1 - Math.pow(K.clamp(t / T.hit1), 2.0)) : 1.42 * K.seg(t, T.lift1, T.open1, K.ease.inOut));
      const angB = (t) => (t < T.hit2 ? 1.45 * (1 - Math.pow(K.seg(t, T.downB, T.hit2), 2.3)) : 1.45 * K.seg(t, T.lift2, T.open2, K.ease.inOut));

      // ---- 두 번째 카드(엔딩 끝): 3차 활자판 하나로 아이콘·안부·문구(남색 잉크) + 'Anbu'(호박색 잉크)
      const L2 = layout2(), maps2 = reliefMaps(K, ART2_W, ART2_H, (ctx, layer) => drawArt2(ctx, layer, L2));
      const card2 = new THREE.Group(); card2.position.set(0, Y2, 0); table.add(card2);
      const paper2 = reliefMaterial(THREE, new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.94 }), {
        maps: maps2, fibre: fibre.tex, size: [C2W, C2H], top: 0.0, low: -0.034,
        uniforms: { uIn3: { value: 0 }, uWet3: { value: 0 }, uInk: { value: new THREE.Color(INK) }, uAmb: { value: new THREE.Color(AMBER) },
          tIcon: { value: icon }, uIconRect: { value: new THREE.Vector4(L2.tile.cx - L2.tile.s / 2, L2.tile.cy - L2.tile.s / 2, L2.tile.s, L2.tile.s) } },
        height: `uniform float uIn3, uWet3; uniform vec3 uInk, uAmb; uniform sampler2D tIcon; uniform vec4 uIconRect;
          float reliefH(vec2 p) { vec3 s = ART(tSoft, p).rgb; return -0.03 * smoothstep(0.08, 0.92, max(s.r, s.g)) * uIn3; }`,
        surface: `
          vec4 fine = fibre(p + 5.1, vec2(0.3)), coarse = fibre(p.yx + 7.3, vec2(0.11));
          float cloud = coarse.a, sAll = max(soft.r, soft.g) * uIn3, pressed = smoothstep(0.15, 0.85, sAll);
          float dip = max(halo.r, halo.g) * uIn3;
          vec2 rim = 0.5 * uSize - abs(p); float edge = smoothstep(0.4, 0.0, min(rim.x, rim.y));
          vec2 tooth = (fine.rg - 0.5) * 0.4 + (coarse.rg - 0.5) * 0.38;
          n = normalize(vec3(n.xy + tooth * mix(0.5, 0.1, pressed) * (1.0 + 2.0 * edge) + sign(p) * step(rim, rim.yx) * edge * edge * 0.5, n.z));
          rShadow = reliefShadow(p, h0, toLight, 0.3, 0.004);
          diffuseColor.rgb *= (0.95 + 0.1 * cloud) * (1.0 - 0.07 * dip) * (1.0 - 0.07 * smoothstep(0.62, 0.8, coarse.b)) + 0.05 * edge;
          roughnessFactor = 0.95 - 0.16 * pressed; rSpec = 0.6;
          float salt = smoothstep(0.36, 0.30, fibre(p + 3.3, vec2(0.21)).b) + 0.4 * smoothstep(0.35, 0.29, fine.b);
          float ink = smoothstep(0.62, 0.74, soft.r * uIn3) * (1.0 - 0.4 * min(salt, 1.0));
          float amb = smoothstep(0.62, 0.74, soft.g * uIn3) * (1.0 - 0.35 * min(salt, 1.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, uInk * (0.6 + 0.8 * cloud), ink);
          diffuseColor.rgb = mix(diffuseColor.rgb, uAmb * (0.95 + 0.3 * cloud), amb);
          float anyInk = max(ink, amb);
          roughnessFactor = mix(roughnessFactor, mix(0.8, 0.34, uWet3) + 0.14 * (cloud - 0.5), anyInk); rSpec = mix(rSpec, mix(0.25, 1.0, uWet3), anyInk);
          vec2 iuv = (p - uIconRect.xy) / uIconRect.zw;
          float inTile = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0) * smoothstep(0.3, 0.5, shape.r) * uIn3;
          vec2 suv = mix(vec2(0.12), vec2(0.884), iuv);
          vec3 ic = textureGrad(tIcon, suv, rPx / uIconRect.zw * 0.764, rPy / uIconRect.zw * 0.764).rgb;
          diffuseColor.rgb = mix(diffuseColor.rgb, ic * (0.94 + 0.08 * cloud), inTile);
          roughnessFactor = mix(roughnessFactor, 0.55, inTile); rSpec = mix(rSpec, 0.7, inTile);`,
      });
      makeSheet(card2, C2W, C2H, paper2, 11);
      const pC = makePlate('rg', [-4.15, 4.15, -3.35, 3.25], [0, C2H / 2 + 0.95, 0.75], 'x', card2, maps2, [C2W, C2H]);
      const angC = (t) => (t < T.hit3 ? 1.42 * (1 - Math.pow(K.seg(t, T.downC, T.hit3), 2.2)) : 1.42 * K.seg(t, T.lift3, T.open3, K.ease.inOut));

      // ---- 분위기: 키 조명 빛줄기 + 그 안의 먼지, 뒤쪽 림 라이트, 먼 보케
      const LAMP = new THREE.Color('#ffd6a0');
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 3.4, 1, 48, 1, true), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uC: { value: LAMP.clone() }, uG: { value: 0.05 } },
        vertexShader: 'varying vec3 vN, vV; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vA = 0.5 - position.y; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 uC; uniform float uG; varying vec3 vN, vV; varying float vA; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.5); float a = smoothstep(0.0, 0.35, vA) * (1.0 - smoothstep(0.6, 1.0, vA)); gl_FragColor = vec4(uC * uG * f * a, 1.0); }',
      }));
      shaft.frustumCulled = false; scene.add(shaft);
      const ND = 220, dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), ND);
      dust.frustumCulled = false; scene.add(dust);
      const dr = K.rng(91), DP = Array.from({ length: ND }, () => ({ x: dr.range(-7, 7), y: dr.range(Y2 - 6, 10), z: dr.range(0.3, 2.8), r: dr.range(0.01, 0.026), p: [dr.range(0, 6.28), dr.range(0, 6.28), dr.range(0, 6.28)], w: dr.range(0.6, 1.4) }));
      const dir = new THREE.Vector3(), dm = new THREE.Matrix4(), dq = new THREE.Quaternion(), dsv = new THREE.Vector3(), dpv = new THREE.Vector3(), dc = new THREE.Color();
      const rim = K.spot(S, { color: '#a9b9d2', power: 2400, angle: 0.5, penumbra: 1, shadow: false });
      const bokeh = [[-14, 46, 4, '#ffb02e', 4], [9, 52, 6, '#ffd6a0', 3], [-4, 62, 3, '#ffb02e', 3.5], [18, 40, 8, '#ffd6a0', 2.5], [-22, 56, 7, '#ff9a3c', 3], [4, 44, 10, '#7f9cc7', 2]];
      for (const [x, y, z, c, pw] of bokeh) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(pw) })); b.position.set(...world([x, y, z])); scene.add(b); }
      // 박 12–20 카메라·조명 진행도: 박 12–16 아주 느리게 흐르다 박 16–20 두 번째 카드로 내려가 박 20 에 멈춘다
      const PG = (() => { const N = 800, a = T.rest, b = T.end, v = [], c = [0]; for (let i = 0; i <= N; i++) { const t = a + (b - a) * i / N; v.push((0.05 + Math.exp(-Math.pow((t - bt(17.3)) / 0.62, 2))) * K.smooth(a, a + 0.8, t) * K.smooth(b, b - 0.55, t)); }
        for (let i = 1; i <= N; i++) c.push(c[i - 1] + (v[i] + v[i - 1]) / 2); const tot = c[N]; return (t) => { if (t <= a) return 0; if (t >= b) return 1; const f = (t - a) / (b - a) * N, i = Math.floor(f); return K.lerp(c[i], c[Math.min(N, i + 1)], f - i) / tot; }; })();

      // ---- 박: 구리 박 리본 + 레버 끝 가열 다이
      const ROLL = 0, SW = 1.35, S0 = 5.2, SL = 10.8, NS = 96, NW = 12;
      const stripGeo = new THREE.PlaneGeometry(SL, SW, NS, NW);
      const hole = K.canvasTex(2048, Math.round(2048 * SW / SL), (ctx, w, h) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'difference';
        const sx0 = ax(MARK[0] - S0), sy0 = ay(MARK[1] + SW / 2);
        ctx.drawImage(maps.layers[1], sx0, sy0, SL * U, SW * U, 0, 0, w, h);
      }, { data: true });
      const foilMat = (top, spent) => new THREE.MeshStandardMaterial(Object.assign({ color: top ? '#e09a42' : '#b98a6c', metalness: top ? 1 : 0.3, roughness: top ? 0.24 : 0.6, side: top ? THREE.FrontSide : THREE.BackSide }, spent ? { alphaMap: hole, alphaTest: 0.5 } : {}));
      const strips = [true, false].map((top) => { const m = new THREE.Mesh(stripGeo, null); m.userData.mats = [foilMat(top, false), foilMat(top, true)]; m.position.set(MARK[0], MARK[1], 0); m.rotation.z = ROLL; m.castShadow = top; m.receiveShadow = true; m.frustumCulled = false; table.add(m); return m; });
      const CURL = 0.45, TURN = 2.5, PEEL = 0.55, pc = Math.cos(PEEL), ps = Math.sin(PEEL);
      const Q0 = -S0 * pc - SW / 2 * ps, Q1 = (SL - S0) * pc + SW / 2 * ps;
      function poseStrip(t) {
        const p = stripGeo.attributes.position, laid = K.seg(t, T.strip, T.laid, K.ease.outQuint), off = K.seg(t, T.peeled - 0.3, T.peeled + 0.4, K.ease.in);
        const u = K.seg(t, T.peel, T.peeled), front = K.lerp(Q0 - 0.1, Q1 + 0.5, 0.6 * u + 0.4 * u * u * (3 - 2 * u));
        for (let j = 0; j <= NW; j++) for (let i = 0; i <= NS; i++) {
          const x0 = i / NS * SL - S0, y0 = SW / 2 - j * SW / NW, r = -x0 * ps + y0 * pc, d = front - (x0 * pc + y0 * ps);
          let q = x0 * pc + y0 * ps, z = 0.04 + 0.01 * Math.sin(x0 * 2.1 + y0 * 1.7) + 0.014 * Math.sin(y0 * 6.5 + x0 * 0.7) + 0.05 * y0 * y0 * (1 - laid) + (1 - laid) * (0.7 + 0.35 * Math.sin(x0 * 0.9));
          if (d > 0) { const a = Math.min(d / CURL, TURN), ex = Math.max(0, d - CURL * TURN); q = front - CURL * Math.sin(a) - ex * Math.cos(TURN); z += CURL * (1 - Math.cos(a)) + ex * Math.sin(TURN); }
          p.setXYZ(j * (NS + 1) + i, q * pc - r * ps + (1 - laid) * 13 + off * 14, q * ps + r * pc + off * 3, z + off * 6);
        }
        p.needsUpdate = true; stripGeo.computeVertexNormals();
        for (const m of strips) { m.visible = t > T.strip && t < T.peeled + 0.4; m.material = m.userData.mats[t >= T.stamp ? 1 : 0]; }
      }
      const ARM = 11, ARM_Z = 1.25, ARM_UP = 0.85;
      const arm = new THREE.Group(); arm.position.set(MARK[0] + ARM, MARK[1], ARM_Z); table.add(arm);
      part(arm, K.roundedBox(8.6, 1.5, 0.75, 0.06, 4), brassMat, -ARM, 0, 0.405 - ARM_Z);
      for (const x of [-2.6, 0, 2.6]) part(arm, new THREE.CylinderGeometry(0.5, 0.5, 0.24, 40), steel, -ARM + x, 0, 0.9 - ARM_Z).rotation.x = Math.PI / 2;
      part(arm, K.roundedBox(ARM + 6.5, 0.9, 0.5, 0.1, 4), steel, -ARM / 2 - 1.8, 0, 0);
      for (const x of [-3.9, 3.9]) part(arm, new THREE.CylinderGeometry(0.13, 0.13, 0.1, 20), brassMat, -ARM + x, 0, 0.28).rotation.x = Math.PI / 2;

      // ---- 카메라: 한 번의 이어지는 움직임. 열린 판 아래 낮게 → 1·2줄 위를 지나 → 아래로 내려가 두 번째 판 → 박 작업 → 위로 빠져 카드 전체
      const cam = {
        pos: K.path([[0, [-3.0, -4.6, 3.1]], [T.hit1, [-2.8, -4.1, 3.6]], [bt(2.6), [-1.6, -3.0, 4.7]], [T.hit2, [-4.0, -10.6, 5.0]], [bt(5.8), [-3.0, -9.6, 6.8]], [T.stamp, [-4.6, -6.2 - CARD1_DY, 4.8]], [bt(9.9), [-2.0, -5.0 - CARD1_DY, 3.8]], [T.rest, [0, -8.4, 41.5]]]),
        aim: K.path([[0, [-0.3, 4.6, 1.4]], [T.hit1, [-0.2, 4.4, 0.4]], [bt(2.6), [0, 4.7, 0]], [T.hit2, [0.3, -3.4, 0.4]], [bt(5.8), [0, -0.8, 0]], [T.stamp, [0.2, 1.1 - CARD1_DY, 0.4]], [bt(9.9), [-0.3, 1.1 - CARD1_DY, 0]], [T.rest, [0, 0.35, 0]]]),
        ap: K.track([[0, 0.1], [T.hit1, 0.12], [bt(2.4), 0.06], [bt(9.9), 0.06], [T.rest, 0.02]]),
      };
      const v = new THREE.Vector3();
      const CAM_F = [0, Y2 - 8.4, 41.5], AIM_F = [0, Y2 - 0.9];

      const api = {
        update(t) {
          const tc = Math.min(t, T.end);    // 박 20 이후는 모든 것이 완전히 멈춘다
          const ts = slow(t);                // 박 8 찍기 순간 느린 시계(리본·레버)
          const g = PG(tc), dy = Y2 * g;
          const kp = keyPos(Math.min(tc, T.rest)).slice(); kp[1] += dy;
          key.position.set(...world(kp)); key.target.position.set(...world([0.5, 0.5 + dy, 0]));
          // 판 A
          pA.hinge.rotation.x = -angA(t); pA.hinge.position.z = 0.75 + 14 * K.seg(t, T.open1, T.gone1, K.ease.in); pA.hinge.visible = t < T.gone1;
          // 판 B (오른쪽 경첩에서 내려와 누르고 올라감)
          pB.hinge.rotation.y = angB(t); pB.hinge.position.z = 0.75 + 14 * (1 - K.seg(t, T.downB - bt(0.9), T.downB, K.ease.out)) + 14 * K.seg(t, T.open2, T.gone2, K.ease.in);
          pB.hinge.visible = t > T.downB - bt(0.9) && t < T.gone2;
          // 판 C (두 번째 카드, 위쪽 경첩): 위에서 내려와 박 18 에 누르고 들려 위로 빠짐
          pC.hinge.rotation.x = -angC(t);
          pC.hinge.position.z = 0.75 + 12 * (1 - K.seg(t, T.inC, T.downC + bt(0.2), K.ease.out)) + 14 * K.seg(t, T.open3, T.gone3, K.ease.in);
          pC.hinge.position.y = C2H / 2 + 0.95 - 14 * (1 - K.seg(t, T.inC, T.downC + bt(0.2), K.ease.out)) + 7 * K.seg(t, T.open3, T.gone3, K.ease.in);   // 화면 아래 밖에서 들어옴
          pC.hinge.visible = t > T.inC && t < T.gone3;
          table.updateMatrixWorld(true);
          for (const pl of [pA, pB, pC]) { pl.mat.userData.u.uLightL.value.copy(pl.face.worldToLocal(v.copy(key.position))); }
          pA.mat.userData.u.uUsed.value = t >= T.hit1 ? 1 : 0; pB.mat.userData.u.uUsed.value = t >= T.hit2 ? 1 : 0; pC.mat.userData.u.uUsed.value = t >= T.hit3 ? 1 : 0;
          const pu = paper.userData.u;
          table.worldToLocal(pu.uLightL.value.copy(key.position));
          pu.uIn1.value = t >= T.hit1 ? 1 : 0; pu.uIn2.value = t >= T.hit2 ? 1 : 0; pu.uFoilIn.value = t >= T.stamp ? 1 : 0;
          pu.uWet.value = 1 - K.seg(tc, T.lift1, T.rest);
          const p2 = paper2.userData.u; card2.worldToLocal(p2.uLightL.value.copy(key.position));
          p2.uIn3.value = t >= T.hit3 ? 1 : 0; p2.uWet3.value = 1 - K.seg(tc, T.lift3, T.end);
          poseStrip(ts);
          arm.rotation.y = ARM_UP * (1 - K.seg(ts, T.laid - 0.25, T.stamp, K.ease.in) + K.seg(ts, T.stampLift, T.stampGone, K.ease.inOut));
          arm.visible = ts > T.laid - 0.25 && ts < T.stampGone;
          const tq = Math.min(tc, T.rest), c = cam.pos(tq).slice(), a = cam.aim(tq).slice();
          c[0] = K.lerp(c[0], CAM_F[0], g); c[1] = K.lerp(c[1], CAM_F[1], g); c[2] = K.lerp(c[2], CAM_F[2], g);
          a[0] = K.lerp(a[0], AIM_F[0], g); a[1] = K.lerp(a[1], AIM_F[1], g);
          K.look(camera, world(c), world(a)); K.focus(camera, world([a[0], a[1], 0]), K.lerp(cam.ap(tq), 0.012, g));
          // 빛줄기: 키 조명에서 카드 쪽으로(카드 위를 덮지 않게 끝은 흐려짐). 엔딩으로 갈수록 약하게
          const kw = key.position, tw = key.target.position, len = kw.distanceTo(tw) * 0.92;
          shaft.position.copy(kw).lerp(tw, 0.46); shaft.scale.set(1, len, 1);
          dq.setFromUnitVectors(dsv.set(0, -1, 0), dpv.copy(tw).sub(kw).normalize()); shaft.quaternion.copy(dq);
          shaft.material.uniforms.uG.value = 0.09 * (1 - 0.6 * g);
          // 먼지: t 만의 함수로 떠돌고, 빛줄기 축 가까이에서만 밝다
          dir.copy(tw).sub(kw).normalize();
          for (let i = 0; i < ND; i++) {
            const d = DP[i];
            const pw = world([d.x + 0.35 * Math.sin(tc * 0.23 * d.w + d.p[0]), d.y + 0.4 * Math.sin(tc * 0.17 * d.w + d.p[1]) + 0.06 * tc, d.z + 0.18 * Math.sin(tc * 0.31 * d.w + d.p[2])]);
            v.set(pw[0], pw[1], pw[2]); dsv.copy(v).sub(kw); const along = dsv.dot(dir); dsv.addScaledVector(dir, -along);
            const rad = 0.3 + along * 0.06, b = Math.exp(-Math.pow(dsv.length() / Math.max(rad, 0.5), 2)) * (0.55 + 0.45 * Math.sin(tc * 1.3 * d.w + d.p[0] * 3)) * (0.35 + 0.65 * (1 - g));
            dm.compose(v, dq.identity(), dpv.set(d.r, d.r, d.r)); dust.setMatrixAt(i, dm); dust.setColorAt(i, dc.copy(LAMP).multiplyScalar(2.2 * b));
          }
          dust.instanceMatrix.needsUpdate = true; dust.instanceColor.needsUpdate = true;
          rim.position.set(...world([2, 30 + dy, 5.5])); rim.target.position.set(...world([0, -2 + dy, 0]));
          const m = [MARK[0] - c[0], MARK[1] - c[1], c[2]], k = 30 / Math.hypot(...m);
          glint.position.set(...world([MARK[0] + m[0] * k + glintOff(tc), MARK[1] + m[1] * k, m[2] * k])); glint.target.position.set(...world([MARK[0], MARK[1], 0]));
          glint.visible = t > T.sweep;
        },
      };
      // 검증: 마지막 정지 화면에서 각 줄이 화면 어디에 오는지(픽셀). DBG=true 일 때만
      if (DBG) {
        api.update(11.2); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
        const proj = (x, y) => { const w = world([x, y, 0]); v.set(w[0], w[1], w[2]).project(camera); return [Math.round((v.x + 1) / 2 * S.W), Math.round((1 - v.y) / 2 * S.H)]; };
        const rows = [];
        const box = (name, x0, x1, ytop, ybot) => { const a = proj(x0, ytop), b = proj(x1, ybot); rows.push(`${name} x ${a[0]}-${b[0]} y ${a[1]}-${b[1]} (h ${b[1] - a[1]})`); };
        box('lock', L2.tile.cx - L2.tile.s / 2, L2.brand.x + L2.brand.w / 2, Y2 + L2.ys.lock + L2.tile.s / 2, Y2 + L2.ys.lock - L2.tile.s / 2);
        box('tag', -L2.wT / 2, L2.wT / 2, Y2 + L2.ys.tag + L2.inkT[0], Y2 + L2.ys.tag - L2.inkT[1]);
        box('store', -L2.wS / 2, L2.wS / 2, Y2 + L2.ys.store + L2.inkS[0], Y2 + L2.ys.store - L2.inkS[1]);
        box('card2', -C2W / 2, C2W / 2, Y2 + C2H / 2, Y2 - C2H / 2);
        box('card1lock', -2, 2, L.tile.cy + L.tile.s / 2, L.tile.cy - L.tile.s / 2);
        console.warn('[s9 bbox] ' + rows.join(' | '));
      }
      return api;
    },

    sound(k) {
      k.play('whoosh', 0.02, { gain: 0.35, dur: 0.4, top: 900 });                                                   // 판이 내려옴
      k.play('press', T.hit1, { gain: 1.0 }); k.play('thud', T.hit1 + 0.01, { gain: 0.6, f: 70 }); k.play('paper', T.hit1 + 0.03, { gain: 0.35, dur: 0.2 });
      k.play('tock', T.lift1, { gain: 0.45, f: 300 }); k.play('paper', T.lift1 + 0.05, { gain: 0.45, dur: 0.45 });
      k.play('whoosh', T.downB + bt(0.6), { gain: 0.35, dur: 0.5, top: 800 });
      k.play('press', T.hit2, { gain: 1.0 }); k.play('stamp', T.hit2 + 0.005, { gain: 0.55 }); k.play('paper', T.hit2 + 0.03, { gain: 0.35, dur: 0.2 });
      k.play('tock', T.lift2, { gain: 0.45, f: 280 }); k.play('paper', T.lift2 + 0.05, { gain: 0.45, dur: 0.45 });
      k.play('swish', T.strip + 0.05, { gain: 0.5, dur: 0.35 }); k.play('tape', T.laid - 0.2, { gain: 0.4, dur: 0.25 }); k.play('paper', T.laid - 0.1, { gain: 0.3, dur: 0.15 });
      k.play('stamp', T.stamp, { gain: 0.95 }); k.play('impact', T.stamp + 0.005, { gain: 0.45 }); k.play('tock', T.stamp + 0.02, { gain: 0.35, f: 520 });
      k.noise(T.stamp + 0.04, { dur: unslow(T.stampLift) - T.stamp, filter: 'highpass', f: 6500, gain: 0.05, a: 0.02 });   // 가열 다이가 박 위에서 지글거림
      k.play('tick', unslow(T.stampLift), { gain: 0.5, f: 2600 });
      k.play('tape', unslow(T.peel), { gain: 0.85, dur: unslow(T.peeled) - unslow(T.peel) - 0.1 }); k.play('swish', unslow(T.peeled) - 0.15, { gain: 0.3, dur: 0.3 });
      k.play('sparkle', T.flash - 0.15, { gain: 0.45, n: 5 });
      k.play('ding', T.rest, { gain: 0.16, f: 'E6' });
      // 엔딩 끝: 두 번째 카드 활자판
      k.play('whoosh', T.inC + 0.1, { gain: 0.3, dur: 0.55, top: 800 });
      k.play('press', T.hit3, { gain: 1.0 }); k.play('thud', T.hit3 + 0.01, { gain: 0.55, f: 66 }); k.play('paper', T.hit3 + 0.03, { gain: 0.35, dur: 0.2 });
      k.play('tock', T.lift3, { gain: 0.42, f: 290 }); k.play('paper', T.lift3 + 0.05, { gain: 0.42, dur: 0.45 });
      k.play('swish', T.open3, { gain: 0.25, dur: 0.4 });
      k.play('ding', T.end - 0.04, { gain: 0.26, f: 'B5' }); k.play('tick', T.end - 0.02, { gain: 0.25, f: 3200 });   // 정지 직전 작은 마무리
    },
  });
})();
