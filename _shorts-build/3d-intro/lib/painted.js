// 「혼자 산 지 3년」 3D — 공용 수채화 도구 + 세트(원룸·언니 집·도시·폰).
// 바탕 화풍 = painted(원본은 유화). 드라마 시리즈는 '따뜻한 수채화'라 붓을 가늘게(반경 5), 캔버스 대신 수채 종이,
// 색 가장자리가 살짝 짙어지는 번짐(edge darkening)과 종이 결의 안료 알갱이를 더했다.
// 폰 화면처럼 읽혀야 하는 곳은 PAINT.sharp(quad)로 붓을 건너뛴다(화면 네 모서리를 매 프레임 투영).
(function () {
  const BRUSH = `
    uniform float radius; uniform vec4 uQa, uQb; uniform float uQon;
    vec3 px(vec2 o){ return texture2D(tex, vUv + o / res).rgb; }
    float edgeD(vec2 p, vec2 a, vec2 b){ vec2 e = b - a; return (e.x * (p.y - a.y) - e.y * (p.x - a.x)) / max(length(e), 1e-4); }
    float inQuad(vec2 p){
      if (uQon < 0.5) return 0.0;
      vec2 a = uQa.xy, b = uQa.zw, c = uQb.xy, d = uQb.zw;
      float s = sign(edgeD(c, a, b) + 1e-5);
      float m = min(min(edgeD(p, a, b) * s, edgeD(p, b, c) * s), min(edgeD(p, c, d) * s, edgeD(p, d, a) * s));
      return smoothstep(-1.0, 1.5, m);
    }
    void main(){
      vec2 P = vUv * res; float q = inQuad(P);
      if (q > 0.999) { gl_FragColor = vec4(px(vec2(0.0)), 0.5); return; }
      vec3 T = vec3(0.0), mean = vec3(0.0); float wsum = 0.0;
      for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
        vec2 o = vec2(float(i), float(j)) * 3.0; float w = exp(-dot(o, o) / 44.0);
        vec3 a = px(o + vec2(1.5, 0.0)), b = px(o - vec2(1.5, 0.0)), c = px(o + vec2(0.0, 1.5)), d = px(o - vec2(0.0, 1.5));
        vec3 gx = a - b, gy = c - d;
        T += w * vec3(dot(gx, gx), dot(gy, gy), dot(gx, gy)); mean += w * (a + b + c + d) * 0.25; wsum += w;
      }
      T /= wsum; mean /= wsum;
      float root = sqrt((T.x - T.y) * (T.x - T.y) + 4.0 * T.z * T.z), l1 = 0.5 * (T.x + T.y + root), l2 = 0.5 * (T.x + T.y - root);
      vec2 dir = vec2(l1 - T.x, -T.z); dir = length(dir) > 1e-6 ? normalize(dir) : vec2(1.0, 0.0);
      float aniso = l1 + l2 > 1e-7 ? (l1 - l2) / (l1 + l2) : 0.0;
      float ra = radius * clamp(1.0 + aniso, 0.1, 2.0), rb = radius * clamp(1.0 / (1.0 + aniso), 0.1, 2.0);
      int mx = int(sqrt(ra * ra * dir.x * dir.x + rb * rb * dir.y * dir.y)), my = int(sqrt(ra * ra * dir.y * dir.y + rb * rb * dir.x * dir.x));
      float zeta = 2.0 / radius, eta = (zeta + cos(0.58)) / (sin(0.58) * sin(0.58));
      vec4 m[8]; vec3 s[8];
      for (int k = 0; k < 8; k++) { m[k] = vec4(0.0); s[k] = vec3(0.0); }
      for (int y = -my; y <= my; y++) for (int x = -mx; x <= mx; x++) {
        vec2 o = vec2(float(x), float(y));
        vec2 v = 0.5 * vec2(dot(o, dir) / ra, dot(o, vec2(-dir.y, dir.x)) / rb);
        if (dot(v, v) > 0.25) continue;
        vec3 c = px(o);
        float w[8]; float z, vxx = zeta - eta * v.x * v.x, vyy = zeta - eta * v.y * v.y, sum = 0.0;
        z = max(0.0, v.y + vxx); w[0] = z * z; z = max(0.0, -v.x + vyy); w[2] = z * z; z = max(0.0, -v.y + vxx); w[4] = z * z; z = max(0.0, v.x + vyy); w[6] = z * z;
        vec2 qq = 0.70710678 * vec2(v.x - v.y, v.x + v.y); vxx = zeta - eta * qq.x * qq.x; vyy = zeta - eta * qq.y * qq.y;
        z = max(0.0, qq.y + vxx); w[1] = z * z; z = max(0.0, -qq.x + vyy); w[3] = z * z; z = max(0.0, -qq.y + vxx); w[5] = z * z; z = max(0.0, qq.x + vyy); w[7] = z * z;
        for (int k = 0; k < 8; k++) sum += w[k];
        float g = exp(-3.125 * dot(v, v)) / sum;
        for (int k = 0; k < 8; k++) { float wk = w[k] * g; m[k] += vec4(c * wk, wk); s[k] += c * c * wk; }
      }
      vec4 acc = vec4(0.0);
      for (int k = 0; k < 8; k++) {
        vec3 mk = m[k].rgb / m[k].w, sd = abs(s[k] / m[k].w - mk * mk);
        float w = 1.0 / (1.0 + pow(8000.0 * (sd.r + sd.g + sd.b), 4.0));
        acc += vec4(mk * w, w);
      }
      float lm = dot(mean, vec3(0.3, 0.55, 0.15)), detail = (dot(px(vec2(0.0)), vec3(0.3, 0.55, 0.15)) - lm) / (lm + 0.08);
      vec3 col = mix(acc.rgb / acc.w, px(vec2(0.0)), q);
      gl_FragColor = vec4(col, mix(0.5 + clamp(detail, -0.16, 0.16) * 2.5, 0.5, q));
    }`;
  // 수채 종이: 거친 종이 결 + 안료 알갱이(어두운 곳에 고임) + 색 경계가 짙어지는 번짐 + 칠하지 않은 들쭉날쭉한 가장자리
  const SURFACE = `
    uniform vec4 uQa, uQb; uniform float uQon, uPaper;
    float lum(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 7.1) + 0.125 * vnoise(p * 4.11 + 3.7) + 0.0625 * vnoise(p * 8.3 + 1.3); }
    float edgeD(vec2 p, vec2 a, vec2 b){ vec2 e = b - a; return (e.x * (p.y - a.y) - e.y * (p.x - a.x)) / max(length(e), 1e-4); }
    float inQuad(vec2 p){
      if (uQon < 0.5) return 0.0;
      vec2 a = uQa.xy, b = uQa.zw, c = uQb.xy, d = uQb.zw; float s = sign(edgeD(c, a, b) + 1e-5);
      float m = min(min(edgeD(p, a, b) * s, edgeD(p, b, c) * s), min(edgeD(p, c, d) * s, edgeD(p, d, a) * s));
      return smoothstep(-1.0, 1.5, m);
    }
    float thick(vec2 o){ vec4 s = texture2D(tex, vUv + o / res); return 0.2 * lum(s.rgb) + 0.5 * (s.a - 0.5); }
    void main(){
      vec2 p = vUv * res; vec3 c0 = texture2D(tex, vUv).rgb, c = c0; float q = inQuad(p);
      float edge = min(min(p.x, res.x - p.x), min(p.y, res.y - p.y));
      float painted = smoothstep(0.0, 4.0, edge - 10.0 - 22.0 * fbm(p * vec2(0.010, 0.05)) - 8.0 * vnoise(p * 0.09));
      // 번짐: 주변보다 밝기가 크게 바뀌는 경계에서 물감이 고여 살짝 짙어진다
      float lc = lum(c), ln = 0.25 * (lum(texture2D(tex, vUv + vec2(3.0, 0.0) / res).rgb) + lum(texture2D(tex, vUv - vec2(3.0, 0.0) / res).rgb) + lum(texture2D(tex, vUv + vec2(0.0, 3.0) / res).rgb) + lum(texture2D(tex, vUv - vec2(0.0, 3.0) / res).rgb));
      float pool = clamp((ln - lc) * 3.0, 0.0, 0.22);
      c *= 1.0 - pool;
      // 종이 결과 안료 알갱이
      float grain = fbm(p * 0.33), tooth = fbm(p * 0.085);
      vec2 g = vec2(thick(vec2(1.5, 0.0)) - thick(vec2(-1.5, 0.0)), thick(vec2(0.0, 1.5)) - thick(vec2(0.0, -1.5)));
      vec2 gp = vec2(fbm((p + vec2(1.0, 0.0)) * 0.085) - fbm((p - vec2(1.0, 0.0)) * 0.085), fbm((p + vec2(0.0, 1.0)) * 0.085) - fbm((p - vec2(0.0, 1.0)) * 0.085));
      vec3 n = normalize(vec3(-(g * 0.7 + gp * 1.1 * uPaper), 1.0));
      vec3 L = normalize(vec3(-0.5, 0.62, 0.6)); float diff = dot(n, L) / L.z;
      c = c * mix(1.0, diff, 0.2 * uPaper);
      c *= 1.0 - uPaper * 0.10 * (1.0 - lc) * smoothstep(0.45, 0.8, grain);       // 어두운 물감은 종이 홈에 알갱이로 고인다
      c = mix(c, c * 0.9 + 0.1 * vec3(1.0, 0.97, 0.9), uPaper * 0.35 * smoothstep(0.55, 0.75, tooth) * lc);   // 밝은 곳은 종이 흰빛이 비친다
      vec3 paper = vec3(0.95, 0.92, 0.85) * (0.96 + 0.06 * tooth);
      c = mix(paper, c, painted);
      c = mix(c, c0, q);
      gl_FragColor = vec4(c, 1.0);
    }`;

  const PAINT = {};
  window.PAINT = PAINT;
  // 시간 도구: 구간별 카메라 키(시각, [위치], [바라봄], fov, 초점점, 조리개) → 그 사이를 이징으로 잇는다
  PAINT.cam = (keys) => (t) => {
    let i = 0; while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1] || a, u = b === a ? 0 : K.clamp((t - a.t) / (b.t - a.t));
    const e = (b.ease ? (typeof b.ease === 'function' ? b.ease : K.ease[b.ease]) : K.ease.inOut)(u);
    const L = (x, y) => (Array.isArray(x) ? x.map((v, k) => v + (y[k] - v) * e) : x + (y - x) * e);
    return { pos: L(a.pos, b.pos), aim: L(a.aim, b.aim), fov: L(a.fov ?? 40, b.fov ?? a.fov ?? 40), focus: L(a.focus ?? a.aim, b.focus ?? b.aim ?? a.aim), ap: L(a.ap ?? 0, b.ap ?? a.ap ?? 0), roll: L(a.roll ?? 0, b.roll ?? 0) };
  };
  PAINT.applyCam = (camera, c) => { K.look(camera, c.pos, c.aim, c.fov, c.roll); K.focus(camera, c.focus, c.ap); };

  PAINT.init = (S, o = {}) => {
    const { THREE } = S;
    const QU = { uQa: { value: new THREE.Vector4() }, uQb: { value: new THREE.Vector4() }, uQon: { value: 0 } };
    if (o.oil) { S.addFilter(OIL.BRUSH_Q, Object.assign({ radius: { value: o.radius || 8 } }, QU)); S.addFilter(OIL.SURFACE_Q, QU); }
    else if (o.filters !== false) {
      S.addFilter(BRUSH, Object.assign({ radius: { value: o.radius || 5 } }, QU));
      S.addFilter(SURFACE, Object.assign({ uPaper: { value: o.paper == null ? 1 : o.paper } }, QU));
    }
    const lin = (hex) => new THREE.Color(hex), glow = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
    // 붓 자국 결(원본 painted 의 dabField 를 수채용으로 짧고 넓게)
    function dabField(seed, flow) {
      const N = 512, r = K.rng(seed), data = new Uint8Array(N * N * 4).fill(128), LEN = 46, WID = 20;
      for (let n = Math.round(N * N / (LEN * WID) * 3.0); n > 0; n--) {
        const cx = Math.floor(r() * N), cy = Math.floor(r() * N), len = LEN * r.range(0.6, 1.3), wid = WID * r.range(0.7, 1.3);
        const a = flow(cx / N, cy / N) + r.gauss() * 0.3, ca = Math.cos(a), sa = Math.sin(a), tone = r() * 255, ext = Math.ceil(len / 2 + wid);
        for (let dy = -ext; dy <= ext; dy++) for (let dx = -ext; dx <= ext; dx++) {
          const u = dx * ca + dy * sa, v = (-dx * sa + dy * ca) / wid;
          const rr = (u * u) / (len * len / 4) + v * v * 4; if (rr > 1) continue;
          const i = ((((cy + dy) % N) + N) % N * N + (((cx + dx) % N) + N) % N) * 4;
          data[i] = 128 + 40 * ca; data[i + 1] = 128 + 40 * sa; data[i + 2] = tone; data[i + 3] = 255 * K.clamp(0.55 + 0.35 * (1 - rr));
        }
      }
      const tex = new THREE.DataTexture(data, N, N); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
      return tex;
    }
    const DABS = dabField(7, (u, v) => 0.6 * Math.sin(6.283 * (u + 2 * v)));
    // 물감 재질: a~b 사이 색 + 몇 자국 c 강조. size = 붓 자국 크기(세계 단위)
    const paint = (op = {}) => {
      const { a = '#ffffff', b = a, c = b, size = 0.5, tilt = 0.25, ...std } = op;
      const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, std));
      const u = { uDabs: { value: DABS }, uA: { value: lin(a) }, uB: { value: lin(b) }, uC: { value: lin(c) }, uTilt: { value: tilt }, uS: { value: 1 / size } };
      m.userData.pu = u;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uDabs; uniform vec3 uA, uB, uC; uniform float uTilt, uS; varying vec3 vOP; varying vec3 vON; vec4 dab;')
          .replace('#include <color_fragment>', `#include <color_fragment>
            { vec3 w = pow(abs(normalize(vON)), vec3(4.0)); w /= (w.x + w.y + w.z);
              dab = texture2D(uDabs, vOP.yz * uS) * w.x + texture2D(uDabs, vOP.zx * uS + 0.37) * w.y + texture2D(uDabs, vOP.xy * uS + 0.71) * w.z;
              vec3 col = mix(uA, uB, smoothstep(0.15, 0.85, dab.b)); col = mix(col, uC, smoothstep(0.86, 0.96, dab.b));
              diffuseColor.rgb *= col * (0.9 + 0.2 * dab.a); }`)
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + uTilt * vec3(dab.r - 0.5, dab.g - 0.5, 0.0));');
      };
      return m;
    };
    const basic = (color, op = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, op));
    const add = (geo, mat, pos, op = {}) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (op.rot) m.rotation.set(...op.rot); if (op.scale != null) (Array.isArray(op.scale) ? m.scale.set(...op.scale) : m.scale.setScalar(op.scale)); m.castShadow = op.cast !== false; m.receiveShadow = op.recv !== false; (op.parent || S.scene).add(m); return m; };
    const box = (w, h, d, r = 0.02) => K.roundedBox(w, h, d, r, 3);
    // 화면 하나를 붓에서 빼낸다. corners = 화면 픽셀 좌표 4점(아래 원점). null 이면 끈다
    const sharp = (pts) => {
      for (const f of [QU]) { f.uQon.value = pts ? 1 : 0; if (pts) { f.uQa.value.set(pts[0][0], pts[0][1], pts[1][0], pts[1][1]); f.uQb.value.set(pts[2][0], pts[2][1], pts[3][0], pts[3][1]); } }
    };
    const W = 1080, H = 1920, _v = new THREE.Vector3();
    const project = (obj, local) => { _v.set(...local); obj.localToWorld(_v); _v.project(S.camera); return [(_v.x * 0.5 + 0.5) * W, (_v.y * 0.5 + 0.5) * H, _v.z]; };
    return { THREE, paint, basic, add, box, lin, glow, sharp, project, DABS };
  };

  // ---------------------------------------------------------------- 폰(특정 회사 제품처럼 보이지 않게: 균일한 베젤, 가운데 작은 펀치홀)
  // 화면 그림은 390×844pt 기준을 2배(780×1688)로 그린다. draw(ctx, t, W, H) 는 매 프레임 불린다
  PAINT.phone = (P, o = {}) => {
    const { THREE } = P, g = new THREE.Group();
    const w = 0.074, h = 0.156, d = 0.0085, sw = w - 0.006, sh = h - 0.006;
    const body = P.add(K.roundedBox(w, h, d, 0.009, 4), P.paint({ a: o.body || '#2c3038', b: o.body2 || '#3b404a', size: 0.05, roughness: 0.5 }), [0, 0, 0], { parent: g });
    const tex = K.canvasTex(780, 1688, null);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const scr = new THREE.Mesh(K.roundedRect(sw, sh, 0.007, 6), mat); scr.position.z = d / 2 + 0.0004; g.add(scr);
    // 펀치홀
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.0018, 16), new THREE.MeshBasicMaterial({ color: '#05060a' })); hole.position.set(0, sh / 2 - 0.006, d / 2 + 0.0008); g.add(hole);
    const api = {
      group: g, tex, mat, sw, sh,
      redraw(t) { if (o.draw) tex.redraw((ctx, W, H) => o.draw(ctx, t, W, H)); },
      corners() { const x = sw / 2 - 0.002, y = sh / 2 - 0.002, z = d / 2 + 0.0005; return [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]].map((p) => P.project(scr.parent, p)); },
      // 화면이 카메라를 향하고 화면 안에 들어올 때만 선명 처리
      sharpen(on = true) { if (!on) return P.sharp(null); const c = api.corners(); if (c.some((p) => p[2] > 1 || p[2] < -1)) return P.sharp(null); P.sharp(c); },
      setBright(k) { mat.color.setScalar(k); },
    };
    return api;
  };

  // ---------------------------------------------------------------- 화면 그림 도구(앱 화면 · 잠금 화면 · 알림)
  const FONT = '"Noto Sans KR"';
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  PAINT.ui = {
    rr,
    // 잠금 화면 바탕: 시각 + 날짜. tint = 바탕 그라데이션
    lock(ctx, W, H, { time = '18:00', date = '', top = '#1d2a4a', bot = '#3b2c48', dim = 1 } = {}) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,255,255,${0.95 * dim})`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = `300 230px ${FONT}`; ctx.fillText(time, W / 2, 470);
      ctx.font = `500 46px ${FONT}`; ctx.fillStyle = `rgba(255,255,255,${0.8 * dim})`; ctx.fillText(date, W / 2, 230);
    },
    // 알림 카드(안부 앱 푸시). 아이콘 + '안부' + '지금' + 제목 + 본문(줄바꿈). y = 위쪽, k = 등장(0~1)
    push(ctx, W, { icon, y = 620, title, body, k = 1, accent = null, app = '안부', now = '지금' }) {
      if (k <= 0) return 0;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.4); ctx.translate(0, (1 - K.ease.outBack(Math.min(1, k))) * -80);
      const x = 40, w = W - 80;
      ctx.font = `500 44px ${FONT}`; const lines = ANBU.wrap(ctx, body, w - 70);
      const h = 150 + lines.length * 58;
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      rr(ctx, x, y, w, h, 44); ctx.fillStyle = 'rgba(246,244,240,0.97)'; ctx.fill(); ctx.shadowColor = 'transparent';
      if (accent) { rr(ctx, x, y, 14, h, 7); ctx.fillStyle = accent; ctx.fill(); }
      if (icon) { ctx.save(); rr(ctx, x + 34, y + 30, 52, 52, 13); ctx.clip(); ctx.drawImage(icon, x + 34, y + 30, 52, 52); ctx.restore(); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5a5e66'; ctx.font = `500 34px ${FONT}`; ctx.fillText(app, x + 104, y + 56);
      ctx.textAlign = 'right'; ctx.fillText(now, x + w - 36, y + 56);
      ctx.textAlign = 'left'; ctx.fillStyle = '#16181c'; ctx.font = `700 46px ${FONT}`; ctx.fillText(title, x + 36, y + 120);
      ctx.font = `500 42px ${FONT}`; ctx.fillStyle = '#2a2d33'; lines.forEach((l, i) => ctx.fillText(l, x + 36, y + 176 + i * 56));
      ctx.restore(); return h;
    },
  };

  // ---------------------------------------------------------------- 원룸(자취방). 바닥 y=0, 방 x -2.2..2.2 / z -2..2, 천장 2.5
  // 정면(z+)은 트여 있다(카메라가 들어온다). 창 = 뒤 벽(z=-2) x -0.2..1.2. 현관 = 왼쪽 앞, 부엌 = 왼쪽 벽
  PAINT.studio = (P, o = {}) => {
    const { THREE } = P, g = new THREE.Group(), box = P.box;
    const R = {};
    const wallM = P.paint({ a: '#f6f0e6', b: '#ede4d6', c: '#fbf7f0', size: 0.6 });
    const floorM = P.paint({ a: '#d9b48a', b: '#cba57a', c: '#e4c49e', size: 0.35 });
    const woodM = P.paint({ a: '#dcc4a4', b: '#cfb592', c: '#e7d4ba', size: 0.1 });
    const whiteM = P.paint({ a: '#f2efe8', b: '#e6e1d6', size: 0.2 });
    const add = (geo, mat, pos, op = {}) => P.add(geo, mat, pos, Object.assign({ parent: g }, op));
    // 바닥 · 벽(창 구멍을 남기고 조각으로) · 천장
    add(new THREE.BoxGeometry(4.4, 0.1, 4.0), floorM, [0, -0.05, 0]);
    add(new THREE.BoxGeometry(4.4, 0.08, 4.0), wallM, [0, 2.54, 0]);
    const BW = (x0, x1, y0, y1) => add(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.12), wallM, [(x0 + x1) / 2, (y0 + y1) / 2, -2.06]);
    BW(-2.2, -0.2, 0, 2.5); BW(1.2, 2.2, 0, 2.5); BW(-0.2, 1.2, 0, 0.9); BW(-0.2, 1.2, 2.1, 2.5);
    add(new THREE.BoxGeometry(0.12, 2.5, 4.0), wallM, [-2.26, 1.25, 0]);
    add(new THREE.BoxGeometry(0.12, 2.5, 4.0), wallM, [2.26, 1.25, 0]);
    if (o.front !== false) add(new THREE.BoxGeometry(4.4, 2.5, 0.12), wallM, [0, 1.25, 2.06]);
    // 걸레받이
    add(new THREE.BoxGeometry(4.4, 0.08, 0.02), woodM, [0, 0.04, -1.99]);
    // 창틀 + 창살 + 유리(살짝)
    const frM = P.paint({ a: '#f4f1ea', b: '#e7e2d8', size: 0.2 });
    for (const [x, y, w, h] of [[0.5, 0.9, 1.5, 0.06], [0.5, 2.1, 1.5, 0.06], [-0.2, 1.5, 0.06, 1.26], [1.2, 1.5, 0.06, 1.26], [0.5, 1.5, 0.04, 1.2]]) add(new THREE.BoxGeometry(w, h, 0.1), frM, [x, y, -2.02]);
    add(new THREE.BoxGeometry(1.5, 0.04, 0.22), frM, [0.5, 0.88, -1.92]);   // 창턱
    // 창밖: 골목 맞은편 건물 그림(낮/밤/계절은 update 에서 색과 알갱이로)
    const outTex = K.canvasTex(1024, 768, (ctx, w, h) => {
      ctx.fillStyle = '#9fb3c8'; ctx.fillRect(0, 0, w, h);
      const r = K.rng(31);
      for (let i = 0; i < 5; i++) { const x = i * 220 - 40 + r() * 30, top = 140 + r() * 160; ctx.fillStyle = ['#c9b8a6', '#b7a491', '#d4c6b2', '#a99686', '#c2ae9a'][i]; ctx.fillRect(x, top, 230, h); for (let yy = top + 40; yy < h; yy += 110) for (let xx = x + 30; xx < x + 200; xx += 70) { ctx.fillStyle = '#6f7d8c'; ctx.fillRect(xx, yy, 42, 58); } }
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 120); ctx.bezierCurveTo(300, 170, 700, 150, 1024, 110); ctx.stroke();   // 전깃줄
    });
    R.outM = new THREE.MeshBasicMaterial({ map: outTex });
    R.out = add(new THREE.PlaneGeometry(4.2, 3.2), R.outM, [0.5, 1.4, -3.2], { cast: false });
    // 창밖 밤 창문 불빛(밤에만 켠다)
    R.nightWin = []; { const r = K.rng(8); for (let i = 0; i < 12; i++) { const m = add(new THREE.PlaneGeometry(0.12, 0.16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf8a').multiplyScalar(1.6), transparent: true, opacity: 0 }), [-1.3 + r() * 3.6, 0.7 + r() * 1.8, -3.15], { cast: false }); R.nightWin.push(m); } }
    // 계절 알갱이: 벚꽃잎·빗줄기·낙엽·눈 — 창밖 공간(z -2.3..-3.0)에서 떨어진다
    R.flakes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.035, 0.035), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true }), 160);
    R.flakes.castShadow = false; g.add(R.flakes); R.flakeSeed = [...Array(160)].map((_, i) => [K.hash(i, 1), K.hash(i, 2), K.hash(i, 3), K.hash(i, 4)]);
    // ---- 침대(오른쪽 벽)
    add(box(1.0, 0.36, 2.0, 0.04), woodM, [1.68, 0.18, -0.98]);
    R.blanket = add(box(1.02, 0.18, 1.5, 0.08), P.paint({ a: '#8fa7c4', b: '#7b95b7', c: '#a9bdd6', size: 0.3 }), [1.68, 0.45, -0.72]);
    add(box(0.6, 0.12, 0.36, 0.06), whiteM, [1.68, 0.45, -1.72]);   // 베개 하나
    // ---- 1인 식탁 + 의자 하나 + 컵 하나
    const T = R.table = new THREE.Group(); T.position.set(-0.55, 0, -0.55); g.add(T);
    add(box(0.8, 0.04, 0.6, 0.01), woodM, [0, 0.72, 0], { parent: T });
    for (const [x, z] of [[-0.36, -0.26], [0.36, -0.26], [-0.36, 0.26], [0.36, 0.26]]) add(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8), woodM, [x, 0.36, z], { parent: T });
    const chair = new THREE.Group(); chair.position.set(0, 0, 0.52); T.add(chair);
    add(box(0.4, 0.04, 0.4, 0.01), woodM, [0, 0.45, 0], { parent: chair }); add(box(0.4, 0.42, 0.03, 0.01), woodM, [0, 0.68, 0.19], { parent: chair });
    for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) add(new THREE.CylinderGeometry(0.014, 0.014, 0.45, 6), woodM, [x, 0.225, z], { parent: chair });
    R.mug = add(new THREE.CylinderGeometry(0.04, 0.036, 0.095, 18), P.paint({ a: '#e9dcc4', b: '#d8c7a8', size: 0.05 }), [0.22, 0.79, -0.08], { parent: T });
    // 폰(식탁 위, 화면 위로)
    R.phoneSpot = [-0.1, 0.745, 0.05];
    // ---- 부엌(왼쪽 벽): 하부장 + 싱크 + 전기포트 + 칫솔 컵 + 작은 냉장고
    add(box(0.6, 0.86, 1.6, 0.02), whiteM, [-1.9, 0.43, -0.55]);
    add(box(0.62, 0.04, 1.62, 0.01), P.paint({ a: '#a9aaa6', b: '#b7b6b1', size: 0.2 }), [-1.9, 0.88, -0.55]);
    add(new THREE.BoxGeometry(0.4, 0.02, 0.46), P.paint({ a: '#7e848c', b: '#8e949c', size: 0.1, roughness: 0.4, metalness: 0.4 }), [-1.88, 0.895, -0.55]);
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), P.paint({ a: '#cfd3d7', size: 0.05, metalness: 0.6, roughness: 0.3 }), [-2.08, 1.02, -0.55]);
    // 상부장 + 컵라면 두 개
    add(box(0.38, 0.6, 1.4, 0.02), whiteM, [-2.0, 1.85, -0.6]);
    for (const z of [-0.98, -0.86]) add(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 16), P.paint({ a: '#e2584a', b: '#f2efe8', size: 0.04 }), [-1.95, 0.945, z]);
    R.kettle = new THREE.Group(); R.kettle.position.set(-1.86, 0.9, -1.15); g.add(R.kettle);
    add(new THREE.CylinderGeometry(0.075, 0.09, 0.2, 20), P.paint({ a: '#d9d4ca', b: '#c8c2b6', size: 0.05 }), [0, 0.12, 0], { parent: R.kettle });
    add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), P.paint({ a: '#333', size: 0.05 }), [0, 0.015, 0], { parent: R.kettle });
    R.kettleLed = add(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5a3a' }), [0, 0.03, 0.1], { parent: R.kettle, cast: false });
    // 김(작은 반투명 구들이 올라가며 커진다)
    R.steam = []; for (let i = 0; i < 10; i++) { const m = add(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), [0, 0.3, 0], { parent: R.kettle, cast: false }); R.steam.push(m); }
    // 칫솔 컵(칫솔 하나)
    R.cup = new THREE.Group(); R.cup.position.set(-1.92, 0.9, 0.05); g.add(R.cup);
    add(new THREE.CylinderGeometry(0.032, 0.028, 0.09, 16), P.paint({ a: '#a9d1c7', b: '#94c2b6', size: 0.04 }), [0, 0.045, 0], { parent: R.cup });
    const brush = add(new THREE.CylinderGeometry(0.005, 0.005, 0.17, 6), P.paint({ a: '#e86f5a', size: 0.03 }), [0.006, 0.13, 0], { parent: R.cup, rot: [0, 0, -0.12] });
    add(box(0.012, 0.028, 0.012, 0.003), whiteM, [0.016, 0.215, 0], { parent: R.cup, rot: [0, 0, -0.12] });
    // 냉장고(작은 것)
    add(box(0.55, 1.15, 0.55, 0.03), P.paint({ a: '#e6eaec', b: '#d6dbdf', size: 0.2 }), [-1.95, 0.575, -1.68]);
    // ---- 현관(왼쪽 앞): 한 단 낮은 타일 바닥 + 신발 한 켤레 + 문
    add(new THREE.BoxGeometry(0.95, 0.1, 1.0), P.paint({ a: '#8d8a84', b: '#7c7a75', size: 0.15 }), [-1.72, -0.07, 1.5]);
    add(box(0.2, 0.86, 1.0, 0.01), P.paint({ a: '#6d4b31', b: '#5e3f28', size: 0.2 }), [-2.12, 1.0, 1.5]);   // 문
    add(new THREE.SphereGeometry(0.025, 10, 8), P.paint({ a: '#c9a25a', size: 0.03, metalness: 0.7, roughness: 0.3 }), [-2.0, 1.0, 1.15]);
    R.shoes = new THREE.Group(); R.shoes.position.set(-1.62, -0.02, 1.55); g.add(R.shoes);
    const shoeM = P.paint({ a: '#f0ece4', b: '#d9d3c8', c: '#4f6fa8', size: 0.05 });
    for (const x of [-0.07, 0.07]) { add(box(0.09, 0.07, 0.25, 0.03), shoeM, [x, 0.035, 0], { parent: R.shoes, rot: [0, x * 1.2, 0] }); add(box(0.095, 0.02, 0.26, 0.01), P.paint({ a: '#c9c2b6', size: 0.05 }), [x, 0.008, 0], { parent: R.shoes, rot: [0, x * 1.2, 0] }); }
    // 택배 상자(현관 안쪽, 시간에 따라 쌓였다 치워진다)
    const boxM = P.paint({ a: '#c99a62', b: '#b6874f', c: '#ddb27c', size: 0.12 });
    R.parcels = [[0.42, 0.3, 0.34], [0.34, 0.24, 0.3], [0.5, 0.2, 0.38]].map(([w, h, d], i) => {
      const m = add(box(w, h, d, 0.01), boxM, [-1.45 + i * 0.05, h / 2 + i * 0.0, 0.85 + i * 0.32]); m.userData.h = h;
      add(new THREE.BoxGeometry(w * 1.002, 0.004, 0.05), basic2(P, '#d8c9a8'), [0, h / 2 + 0.002, 0], { parent: m, cast: false });
      return m;
    });
    // ---- 화분(창 아래 바닥) — 자란다
    R.plant = new THREE.Group(); R.plant.position.set(1.0, 0, -1.72); g.add(R.plant);
    add(new THREE.CylinderGeometry(0.11, 0.085, 0.2, 18), P.paint({ a: '#b4623c', b: '#a35532', size: 0.06 }), [0, 0.1, 0], { parent: R.plant });
    R.leaves = []; const leafM = P.paint({ a: '#5f8f4e', b: '#4c7a3d', c: '#79a964', size: 0.05 });
    for (let i = 0; i < 9; i++) { const l = add(new THREE.SphereGeometry(0.06, 10, 8), leafM, [0, 0, 0], { parent: R.plant, scale: [1, 0.35, 0.6] }); R.leaves.push(l); }
    // ---- 벽: 달력(뒤 벽 왼쪽) · 벽시계 · 작은 선반
    R.calTex = K.canvasTex(400, 520, null);
    R.calendar = add(new THREE.PlaneGeometry(0.4, 0.52), new THREE.MeshStandardMaterial({ map: R.calTex, roughness: 0.95 }), [-1.25, 1.45, -1.995], { cast: false });
    R.clock = new THREE.Group(); R.clock.position.set(-0.95, 2.05, -1.99); g.add(R.clock);
    add(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 32), whiteM, [0, 0, 0.015], { parent: R.clock, rot: [Math.PI / 2, 0, 0] });
    add(new THREE.TorusGeometry(0.17, 0.012, 8, 40), woodM, [0, 0, 0.03], { parent: R.clock });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(new THREE.BoxGeometry(0.008, 0.024, 0.004), P.basic('#30302e'), [Math.sin(a) * 0.145, Math.cos(a) * 0.145, 0.032], { parent: R.clock, rot: [0, 0, -a], cast: false }); }
    const hand = (len, wd) => { const p = new THREE.Group(); p.position.z = 0.036; R.clock.add(p); const m = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.004), P.basic('#24231f')); m.position.y = len / 2 - 0.01; p.add(m); return p; };
    R.hHour = hand(0.09, 0.012); R.hMin = hand(0.13, 0.008);
    // 천장 등 + 스탠드
    R.ceil = add(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 28), new THREE.MeshBasicMaterial({ color: '#fff6e6' }), [0, 2.47, 0], { cast: false });
    R.lamp = new THREE.PointLight('#ffd7a6', 0, 9, 1.6); R.lamp.position.set(0, 2.2, 0); R.lamp.castShadow = true; R.lamp.shadow.mapSize.set(1024, 1024); g.add(R.lamp);
    R.tableLamp = new THREE.PointLight('#ffe2c4', 0, 3, 2); R.tableLamp.position.set(-0.85, 1.25, -0.75); g.add(R.tableLamp);
    // 창으로 들어오는 빛(해) — update 에서 세기·색을 바꾼다
    R.sunL = new THREE.DirectionalLight('#ffe2b8', 2.2); R.sunL.position.set(1.5, 4, -7); R.sunL.target.position.set(-0.3, 0, 0.3); R.sunL.castShadow = true;
    R.sunL.shadow.mapSize.set(2048, 2048); Object.assign(R.sunL.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 }); R.sunL.shadow.bias = -0.0008; g.add(R.sunL); g.add(R.sunL.target);
    R.hemi = new THREE.HemisphereLight('#dfe6ff', '#8a6a52', 0.6); g.add(R.hemi);
    R.bounce = new THREE.PointLight('#fff1dc', 0, 10, 1.2); R.bounce.position.set(0.3, 1.6, -0.8); g.add(R.bounce);
    // ---- 소품: 커튼 · 둥근 러그 · 책장 · 빨래 건조대 · 침대 위 액자와 전구 줄 · 코트 걸이 · 슬리퍼 · 휴지통
    const cur = P.paint({ a: '#a9cfc7', b: '#97c0b7', c: '#c3e0da', size: 0.18 });
    for (const x of [-0.42, 1.42]) { const c = add(box(0.36, 1.5, 0.06, 0.02), cur, [x, 1.45, -1.9]); for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 10), cur, [x - 0.12 + i * 0.12, 1.45, -1.86]); }
    add(new THREE.CylinderGeometry(0.012, 0.012, 2.1, 8), woodM, [0.5, 2.22, -1.88], { rot: [0, 0, Math.PI / 2] });
    add(new THREE.CylinderGeometry(0.75, 0.75, 0.012, 48), P.paint({ a: '#e7b7a7', b: '#dca896', c: '#f2d0c3', size: 0.12 }), [-0.55, 0.006, -0.45]);
    const shelf = new THREE.Group(); shelf.position.set(2.05, 0, 1.2); g.add(shelf);
    add(box(0.32, 1.2, 0.8, 0.01), woodM, [0, 0.6, 0], { parent: shelf });
    const bookCols = ['#c4553e', '#4f7fb3', '#e3b04b', '#6d9b6a', '#8a6fb0', '#d98a6a', '#3f5f7a', '#e8d9b5'];
    for (let r = 0; r < 3; r++) { add(box(0.3, 0.02, 0.78, 0.005), whiteM, [-0.01, 0.25 + r * 0.36, 0], { parent: shelf }); let z = -0.34; for (let i = 0; z < 0.32; i++) { const h = 0.2 + 0.08 * K.hash(r, i), w = 0.035 + 0.025 * K.hash(i, r); add(box(0.2, h, w, 0.004), P.paint({ a: bookCols[(r * 3 + i) % 8], size: 0.05 }), [-0.04, 0.26 + r * 0.36 + h / 2, z + w / 2], { parent: shelf, rot: [K.hash(i, r, 3) > 0.85 ? 0.25 : 0, 0, 0] }); z += w + 0.004; } }
    const rack = new THREE.Group(); rack.position.set(0.55, 0, 0.95); rack.rotation.y = 0.3; g.add(rack);
    const steelM = P.paint({ a: '#d6d9dc', size: 0.05, metalness: 0.5, roughness: 0.4 });
    for (const x of [-0.45, 0.45]) { add(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6), steelM, [x, 0.5, -0.15], { parent: rack, rot: [0.3, 0, 0] }); add(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6), steelM, [x, 0.5, 0.15], { parent: rack, rot: [-0.3, 0, 0] }); }
    for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), steelM, [0, 0.95, -0.12 + i * 0.08], { parent: rack, rot: [0, 0, Math.PI / 2] });
    add(box(0.32, 0.4, 0.012, 0.004), P.paint({ a: '#f3d36a', b: '#e9c65a', size: 0.06 }), [-0.2, 0.75, -0.04], { parent: rack });
    add(box(0.22, 0.3, 0.012, 0.004), P.paint({ a: '#ffffff', b: '#e8eef5', size: 0.06 }), [0.18, 0.8, 0.04], { parent: rack });
    add(box(0.6, 0.44, 0.03, 0.01), P.paint({ a: '#5a4030', size: 0.1 }), [1.68, 1.55, -1.99]);
    add(new THREE.PlaneGeometry(0.52, 0.36), P.paint({ a: '#8fb5cf', b: '#f3e2bd', c: '#e8a07c', size: 0.07 }), [1.68, 1.55, -1.972], { cast: false });
    R.fairy = []; for (let i = 0; i < 14; i++) { const u = i / 13, x = 1.25 + u * 0.9, y = 1.95 - 0.12 * Math.sin(Math.PI * u); const m = add(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd48a' }), [x, y, -1.95], { cast: false }); R.fairy.push(m); }
    const coat = add(box(0.38, 0.85, 0.12, 0.05), P.paint({ a: '#7a8a6c', b: '#6b7b5e', size: 0.1 }), [-2.13, 1.35, 0.7], { rot: [0, Math.PI / 2, 0] });
    add(new THREE.SphereGeometry(0.03, 8, 6), woodM, [-2.18, 1.8, 0.7]);
    for (const x of [-0.06, 0.06]) add(box(0.09, 0.03, 0.22, 0.02), P.paint({ a: '#f2b8c6', b: '#e8a7b8', size: 0.05 }), [1.0 + x, 0.015, 0.25], { rot: [0, 0.4, 0] });
    add(new THREE.CylinderGeometry(0.12, 0.1, 0.3, 16), P.paint({ a: '#8fa0b3', size: 0.08 }), [-1.5, 0.15, -1.75]);

    // 하루의 상태를 적용: day = 0(한밤)~1(한낮), lamp = 방 불, season = 0 봄 1 여름비 2 가을 3 겨울, t = 알갱이 시간
    R.setDay = ({ day = 1, lamp = 0, season = -1, t = 0, warm = 0 }) => {
      const sky = new THREE.Color('#1a2440').lerp(new THREE.Color(season === 1 ? '#8e9bab' : '#b7cde3'), day).lerp(new THREE.Color('#f0a86a'), warm * 0.6);
      R.outM.color.copy(new THREE.Color('#2a3350').lerp(new THREE.Color('#ffffff'), day)).lerp(new THREE.Color('#ffc69a'), warm * 0.4);
      R.nightWin.forEach((m, i) => (m.material.opacity = K.clamp((1 - day * 1.6)) * (K.hash(i, 9) > 0.35 ? 1 : 0.25)));
      R.sunL.intensity = 3.0 * day; R.sunL.color.set('#fff1d8').lerp(new THREE.Color('#ff9a52'), warm);
      R.hemi.intensity = 0.35 + 1.3 * day; R.bounce.intensity = 4.5 * day;
      R.lamp.intensity = lamp * 4.0; R.tableLamp.intensity = lamp * 1.2;
      R.fairy.forEach((m, i) => m.material.color.set('#ffd48a').multiplyScalar(0.6 + 2.6 * lamp * (0.7 + 0.3 * Math.sin(t * 3 + i))));
      R.ceil.material.color.set(lamp > 0.05 ? '#fff6e6' : '#77746c').multiplyScalar(lamp > 0.05 ? 1 + lamp * 1.8 : 1);
      // 계절 알갱이
      const col = ['#ffc9d6', '#c9d6e6', '#d9873a', '#ffffff'][Math.max(0, season)] || '#fff', fall = season === 1 ? 3.2 : season === 3 ? 0.35 : 0.55;
      R.flakes.material.color.set(col); R.flakes.material.opacity = season < 0 ? 0 : 0.95;
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pp = new THREE.Vector3(), eu = new THREE.Euler();
      R.flakeSeed.forEach(([a, b, c, d], i) => {
        const y = 2.4 - ((t * fall * (0.7 + 0.6 * c) + d * 3) % 3.0);
        pp.set(-0.8 + a * 2.8 + 0.12 * Math.sin(t * 1.5 + i), y, -2.3 - b * 0.7);
        eu.set(t * 2 + i, t * 1.3 + i * 2, 0); q.setFromEuler(eu);
        if (season === 1) sc.set(0.15, 2.6, 1); else sc.set(1, 1, 1);
        if (season < 0) sc.set(0, 0, 0);
        M.compose(pp, season === 1 ? new THREE.Quaternion() : q, sc); R.flakes.setMatrixAt(i, M);
      });
      R.flakes.instanceMatrix.needsUpdate = true;
    };
    R.setClock = (hours) => { R.hHour.rotation.z = -(hours % 12) / 12 * Math.PI * 2; R.hMin.rotation.z = -(hours % 1) * Math.PI * 2; };
    R.setPlant = (k) => R.leaves.forEach((l, i) => { const a = i * 2.4, h = 0.18 + i * 0.05 * k + 0.02; const s = K.clamp(k * 1.4 - i * 0.08, 0.15, 1); l.position.set(Math.cos(a) * 0.07 * (0.5 + k), h * (0.6 + 0.8 * k), Math.sin(a) * 0.06 * (0.5 + k)); l.scale.set(s * (1 + k), s * 0.35, s * 0.6 * (1 + k)); l.rotation.set(0, a, 0.5); });
    R.setParcels = (n) => R.parcels.forEach((p, i) => { const v = K.clamp(n - i); p.visible = v > 0.01; p.position.y = p.userData.h / 2 + (1 - K.ease.outBounce(v)) * 0.6; });
    R.setSteam = (on, t) => R.steam.forEach((m, i) => { const u = ((t * 0.55 + i / R.steam.length) % 1); m.position.set(0.02 * Math.sin(i + t * 2), 0.26 + u * 0.55, 0.06 * Math.cos(i * 1.7)); m.scale.setScalar(0.6 + u * 2.4); m.material.opacity = on * 0.32 * Math.sin(Math.PI * u); });
    R.setKettle = (on) => { R.kettleLed.material.color.set(on ? '#ff5a3a' : '#3a2a28').multiplyScalar(on ? 2.4 : 1); };
    // 달력: 월 칸(연도 없음). page = 0.. 넘어가는 진행(정수 = 그 달)
    R.drawCal = (month) => R.calTex.redraw((ctx, w, h) => {
      ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c4553e'; ctx.fillRect(0, 0, w, 120); ctx.fillStyle = '#fff'; ctx.font = `900 84px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(month) + '월', w / 2, 64);
      ctx.fillStyle = '#5a554c'; ctx.font = `600 28px ${FONT}`;
      for (let i = 0; i < 35; i++) { const x = 40 + (i % 7) * 53, y = 170 + Math.floor(i / 7) * 70; ctx.fillStyle = i % 7 === 0 ? '#c4553e' : '#5a554c'; ctx.fillText(String(((i + month * 3) % 31) + 1), x + 12, y); }
    });
    R.drawCal(o.month || 3);
    R.group = g;
    return R;
  };
  function basic2(P, c) { return new P.THREE.MeshBasicMaterial({ color: c }); }

  // ---------------------------------------------------------------- 언니 집 거실(다른 집). 따뜻한 색, 소파, 낮은 탁자 위 폰, 벽시계, 스탠드, 창
  PAINT.sisterRoom = (P, o = {}) => {
    const { THREE } = P, g = new THREE.Group(), R = {};
    const add = (geo, mat, pos, op = {}) => P.add(geo, mat, pos, Object.assign({ parent: g }, op));
    const wallM = P.paint({ a: '#e9d9c7', b: '#dcc7b0', c: '#f1e4d4', size: 0.6 });
    add(new THREE.BoxGeometry(5, 0.1, 4.4), P.paint({ a: '#8f6a4a', b: '#7e5c3f', size: 0.35 }), [0, -0.05, 0]);
    add(new THREE.BoxGeometry(3.2, 0.02, 2.2), P.paint({ a: '#c98d6a', b: '#b77c5a', c: '#e0b08a', size: 0.25 }), [0, 0.01, 0.2]);   // 러그
    const BW = (x0, x1, y0, y1) => add(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.12), wallM, [(x0 + x1) / 2, (y0 + y1) / 2, -2.26]);
    BW(-2.5, -0.9, 0, 2.6); BW(0.9, 2.5, 0, 2.6); BW(-0.9, 0.9, 0, 0.7); BW(-0.9, 0.9, 2.2, 2.6);   // 창(가운데) 구멍
    add(new THREE.BoxGeometry(0.12, 2.6, 4.4), wallM, [-2.56, 1.3, 0]); add(new THREE.BoxGeometry(0.12, 2.6, 4.4), wallM, [2.56, 1.3, 0]);
    add(new THREE.BoxGeometry(5, 0.08, 4.4), wallM, [0, 2.64, 0]);
    // 창밖 = 밤의 아파트 단지(불 켜진 창들)
    const outTex = K.canvasTex(1024, 640, (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16203f'); gr.addColorStop(1, '#3a3462'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      const r = K.rng(4); for (let i = 0; i < 6; i++) { const x = i * 180 - 30, top = 120 + r() * 140; ctx.fillStyle = '#232a4a'; ctx.fillRect(x, top, 150, h); for (let yy = top + 20; yy < h; yy += 44) for (let xx = x + 14; xx < x + 140; xx += 34) { ctx.fillStyle = r() < 0.45 ? '#ffcf86' : '#2e3658'; ctx.fillRect(xx, yy, 20, 26); } }
    });
    R.outM = new THREE.MeshBasicMaterial({ map: outTex, color: new THREE.Color(1.15, 1.15, 1.15) }); add(new THREE.PlaneGeometry(4, 2.6), R.outM, [0, 1.4, -3.2], { cast: false });
    for (const [x, y, w, h] of [[0, 0.7, 1.86, 0.06], [0, 2.2, 1.86, 0.06], [-0.9, 1.45, 0.06, 1.56], [0.9, 1.45, 0.06, 1.56], [0, 1.45, 0.04, 1.5]]) add(new THREE.BoxGeometry(w, h, 0.1), P.paint({ a: '#f4efe6', size: 0.2 }), [x, y, -2.22]);
    // 커튼
    for (const x of [-1.1, 1.1]) add(box3(0.4, 2.0, 0.08), P.paint({ a: '#d9a483', b: '#c99373', c: '#e8bc9c', size: 0.2 }), [x, 1.5, -2.08]);
    // 소파(뒤쪽 벽 앞이 아니라 왼쪽에 비스듬히) + 쿠션 + 담요
    const sofa = new THREE.Group(); sofa.position.set(-0.9, 0, 0.2); sofa.rotation.y = 0.35; g.add(sofa);
    const sofaM = P.paint({ a: '#6d8a7c', b: '#5f7c6e', c: '#86a395', size: 0.3 });
    add(box3(1.9, 0.42, 0.85), sofaM, [0, 0.31, 0], { parent: sofa }); add(box3(1.9, 0.55, 0.2), sofaM, [0, 0.72, -0.34], { parent: sofa });
    for (const x of [-0.95, 0.95]) add(box3(0.18, 0.62, 0.85), sofaM, [x, 0.4, 0], { parent: sofa });
    add(box3(0.42, 0.36, 0.14), P.paint({ a: '#e8c56a', b: '#d9b35a', size: 0.1 }), [-0.55, 0.72, -0.18], { parent: sofa, rot: [0.2, 0, 0.15] });
    add(box3(0.7, 0.05, 0.6), P.paint({ a: '#c9b8e0', b: '#b8a6d2', size: 0.15 }), [0.45, 0.55, 0.05], { parent: sofa, rot: [0, 0.3, 0.05] });
    // 낮은 탁자 + 폰 자리 + 머그 + 책
    const T = R.table = new THREE.Group(); T.position.set(0.35, 0, 0.75); g.add(T);
    const woodM = P.paint({ a: '#dcc4a4', b: '#d0b694', c: '#e8d6bc', size: 0.09 });
    add(box3(1.1, 0.05, 0.6), woodM, [0, 0.42, 0], { parent: T });
    for (const [x, z] of [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]]) add(new THREE.CylinderGeometry(0.022, 0.018, 0.42, 8), woodM, [x, 0.21, z], { parent: T });
    add(new THREE.CylinderGeometry(0.042, 0.038, 0.1, 18), P.paint({ a: '#3f6aa8', b: '#355c94', size: 0.05 }), [0.33, 0.495, -0.1], { parent: T });
    add(box3(0.26, 0.04, 0.19), P.paint({ a: '#c4553e', b: '#b04a35', size: 0.08 }), [-0.32, 0.465, -0.06], { parent: T, rot: [0, 0.3, 0] });
    R.phoneSpot = [0.02, 0.45, 0.06];
    // 벽시계(오른쪽 벽 쪽 뒤 벽)
    R.clock = new THREE.Group(); R.clock.position.set(1.6, 1.95, -2.19); g.add(R.clock);
    add(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32), P.paint({ a: '#fbf6ea', size: 0.1 }), [0, 0, 0.015], { parent: R.clock, rot: [Math.PI / 2, 0, 0] });
    add(new THREE.TorusGeometry(0.2, 0.016, 8, 40), P.paint({ a: '#3b3b3b', size: 0.05 }), [0, 0, 0.03], { parent: R.clock });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(new THREE.BoxGeometry(0.01, i % 3 ? 0.022 : 0.04, 0.004), P.basic('#30302e'), [Math.sin(a) * 0.17, Math.cos(a) * 0.17, 0.032], { parent: R.clock, rot: [0, 0, -a], cast: false }); }
    const hand = (len, wd) => { const p = new THREE.Group(); p.position.z = 0.036; R.clock.add(p); const m = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.004), P.basic('#24231f')); m.position.y = len / 2 - 0.012; p.add(m); return p; };
    R.hHour = hand(0.11, 0.014); R.hMin = hand(0.155, 0.009);
    R.setClock = (hours) => { R.hHour.rotation.z = -(hours % 12) / 12 * Math.PI * 2; R.hMin.rotation.z = -(hours % 1) * Math.PI * 2; };
    // 액자 두 개(가족 사진 대신 풍경 그림) · 화분 · 스탠드
    for (const [x, y, w, h, c] of [[-1.7, 1.7, 0.5, 0.38, '#7fa0b8'], [-1.15, 1.85, 0.3, 0.4, '#d9b07a']]) { add(box3(w, h, 0.03), P.paint({ a: '#5a4030', size: 0.1 }), [x, y, -2.19]); add(new THREE.PlaneGeometry(w * 0.84, h * 0.84), P.paint({ a: c, b: '#efe6d4', size: 0.08 }), [x, y, -2.172], { cast: false }); }
    add(new THREE.CylinderGeometry(0.16, 0.12, 0.34, 18), P.paint({ a: '#e4ddd0', size: 0.08 }), [2.0, 0.17, -1.6]);
    for (let i = 0; i < 7; i++) add(new THREE.SphereGeometry(0.16, 10, 8), P.paint({ a: '#4f7d44', b: '#5f9150', c: '#79ad66', size: 0.06 }), [2.0 + Math.cos(i * 2.3) * 0.14, 0.5 + i * 0.11, -1.6 + Math.sin(i * 2.3) * 0.12], { scale: [1, 0.6, 0.8] });
    const lampP = add(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 8), P.paint({ a: '#2f2f2f', size: 0.05 }), [1.65, 0.725, 0.4]);
    R.shade = add(new THREE.CylinderGeometry(0.14, 0.22, 0.26, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#f4dfbf', emissive: new THREE.Color('#ffb36b'), emissiveIntensity: 1.6, side: THREE.DoubleSide }), [1.65, 1.5, 0.4], { cast: false });
    R.lamp = new THREE.PointLight('#ffd9b0', 3.2, 7, 1.6); R.lamp.position.set(1.65, 1.42, 0.4); R.lamp.castShadow = true; R.lamp.shadow.mapSize.set(1024, 1024); g.add(R.lamp);
    R.fill = new THREE.PointLight('#ffd7a8', 1.0, 6, 1.8); R.fill.position.set(-0.4, 2.3, 0.6); g.add(R.fill);
    R.hemi = new THREE.HemisphereLight('#7f8fcf', '#5a3c2c', 0.35); g.add(R.hemi);
    R.group = g;
    return R;
  };
  function box3(w, h, d) { return K.roundedBox(w, h, d, Math.min(w, h, d) * 0.25, 3); }

  // ---------------------------------------------------------------- 동네·도시(밤): 다세대 건물 줄 + 골목 + 강 + 다리 + 아파트 단지
  // 원룸 건물 = 원점 근처(정면이 z+). 원룸 창 = (ox, oy, oz)
  PAINT.town = (P, o = {}) => {
    const { THREE } = P, g = new THREE.Group(), R = {};
    const add = (geo, mat, pos, op = {}) => P.add(geo, mat, pos, Object.assign({ parent: g }, op));
    const r = K.rng(o.seed || 12);
    const winTex = (seed, cols, rows, lit, warm = '#ffcf86') => K.canvasTex(256, 512, (ctx, w, h) => {
      const rr = K.rng(seed); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const on = rr() < lit; ctx.fillStyle = on ? warm : '#0a0d16'; ctx.fillRect(x * w / cols + 8, y * h / rows + 10, w / cols - 16, h / rows - 22); }
    });
    const bld = (x, z, w, h, d, col, seed, lit = 0.35, opt = {}) => {
      const tex = winTex(seed, Math.max(2, Math.round(w / 1.6)), Math.max(2, Math.round(h / 2.8)), lit);
      const m = add(box3(w, h, d), P.paint({ a: col, b: opt.b || col, size: 0.8, emissiveMap: tex, emissive: new THREE.Color(1.6, 1.4, 1.1) }), [x, h / 2, z]);
      return m;
    };
    // 골목 바닥(젖은 아스팔트는 mirrorFloor 로 장면에서) + 맞은편 줄
    R.bld = bld; R.add = add; R.group = g;
    return R;
  };
})();
