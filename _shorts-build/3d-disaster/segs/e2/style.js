{
  // e2 위치 — painted(동화책 그림) 줌인 + 앱 「긴급 위치」 화면(9초).
  // 어두운 우주의 지구 → 동아시아 → 한반도 → 구름을 뚫고 도시 → 아파트 동네 → 붉은 위치 표시의 맥박(약 6초),
  // 그 그림 지도가 휴대폰 화면 속 앱 「긴급 위치」 페이지의 지도로 바뀐다(마지막 약 3초).
  // 지구 = 실제 3D 구(그림 텍스처) + 점점 촘촘한 그림 지도 층(구면 조각 2장 → 평면 2장)을 고도에 따라 겹쳐 바꾼다.
  // 육지 윤곽: Natural Earth(world-atlas 50m/10m)를 경위도 링으로 바꾼 segs/e2/land.json. 지명·글자는 그리지 않는다.
  const DURATION = 9;
  const LON0 = 127.02, LAT0 = 37.535;          // 위치 표시가 있는 곳(특정 주소가 아닌 한반도 중서부 큰 도시의 아파트 동네)
  const R_EARTH = 6371000;
  // 고도(지구 반지름 단위) 시간표 — 로그로 보간해 줌 속도가 일정하게 느껴진다
  const ZK = [[0, 6.6], [1.2, 2.5], [2.45, 0.42], [3.3, 0.075], [3.95, 0.0135], [4.75, 0.0026], [5.45, 0.00058], [6.05, 0.00034], [9, 0.0003]];
  const APP = 6.0;                              // 앱 화면으로 바뀌기 시작
  const PULSE0 = 4.35, PULSE = 0.85;            // 위치 표시 맥박
  const CLOUD_T = 3.72;                         // 구름을 뚫는 순간(소리)
  // 한 줄기 큰 강(경위도) — 한반도 지도와 도시 지도가 같은 강을 그려 층이 바뀌어도 이어진다
  const RIVER = [[126.5, 37.66], [126.68, 37.6], [126.82, 37.566], [126.92, 37.536], [127.0, 37.516], [127.08, 37.521], [127.16, 37.544], [127.26, 37.558], [127.4, 37.548], [127.7, 37.5]];
  // 앱 화면(오버레이) 배치 — 휴대폰과 그 안의 「긴급 위치」 페이지
  const PH = { x: 160, y: 250, w: 760, h: 1430, r: 88, bez: 18 };
  const MAPWIN = { y0: 418, y1: 1210 };         // 지도 창(투명 — 아래 그림 지도가 보인다)

  // ---------------------------------------------------------------- 붓 필터(원본 painted 그대로)
  const BRUSH = `
    uniform float radius;
    vec3 px(vec2 o){ return texture2D(tex, vUv + o / res).rgb; }
    void main(){
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
        vec2 q = 0.70710678 * vec2(v.x - v.y, v.x + v.y); vxx = zeta - eta * q.x * q.x; vyy = zeta - eta * q.y * q.y;
        z = max(0.0, q.y + vxx); w[1] = z * z; z = max(0.0, -q.x + vyy); w[3] = z * z; z = max(0.0, -q.y + vxx); w[5] = z * z; z = max(0.0, q.x + vyy); w[7] = z * z;
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
      gl_FragColor = vec4(acc.rgb / acc.w, 0.5 + clamp(detail, -0.16, 0.16) * 2.5);
    }`;
  // 물감 두께 + 캔버스 결 + 칠하지 않은 가장자리(원본에서 자막 모서리만 뺐다 — 자막은 CAP.draw)
  const SURFACE = `
    float lum(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    float weave(vec2 p){
      vec2 q = p / 4.0, id = floor(q), f = fract(q) - 0.5; float over = mod(id.x + id.y, 2.0);
      float warp = cos(f.x * 3.14159) * (0.55 + 0.45 * cos(f.y * 6.28318)), weft = cos(f.y * 3.14159) * (0.55 + 0.45 * cos(f.x * 6.28318));
      return mix(warp, weft, over) * (0.8 + 0.4 * h21(id * (over > 0.5 ? vec2(0.0, 1.0) : vec2(1.0, 0.0))));
    }
    float thickness(vec2 o){ vec4 s = texture2D(tex, vUv + o / res); return 0.25 * lum(s.rgb) + 0.8 * (s.a - 0.5); }
    void main(){
      vec2 p = vUv * res; vec3 c = texture2D(tex, vUv).rgb;
      float edge = min(min(p.x, res.x - p.x), min(p.y, res.y - p.y));
      float painted = smoothstep(0.0, 3.0, edge - 13.0 - 17.0 * vnoise(p * vec2(0.012, 0.11)) - 7.0 * vnoise(p * 0.07));
      float body = painted * smoothstep(0.04, 0.8, lum(c));
      vec2 g = vec2(thickness(vec2(1.5, 0.0)) - thickness(vec2(-1.5, 0.0)), thickness(vec2(0.0, 1.5)) - thickness(vec2(0.0, -1.5))) * painted;
      vec2 gw = vec2(weave(p + vec2(0.8, 0.0)) - weave(p - vec2(0.8, 0.0)), weave(p + vec2(0.0, 0.8)) - weave(p - vec2(0.0, 0.8)));
      vec3 n = normalize(vec3(-(g * 1.6 + gw * mix(0.3, 0.07, body)), 1.0));
      vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
      float diff = dot(n, L) / L.z, spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 48.0);
      c = mix(vec3(0.90, 0.86, 0.77) * (0.97 + 0.05 * vnoise(p * 0.02)), c, painted);
      c = c * mix(1.0, diff, 0.5) + spec * 0.12 * body;
      c *= 1.0 - 0.07 * (1.0 - body) * (1.0 - weave(p));
      gl_FragColor = vec4(c, 1.0);
    }`;

  registerStyle({
    id: 'e2', name: 'Painted zoom to location', family: 'Filters over 3D',
    duration: DURATION,
    koText: '도움이 필요할 땐 위치와 함께 바로 알릴 수 있습니다. 긴급 위치 대상자 아빠 수집 시각 오후 9:42 정확도 약 20m 외부 지도 앱으로 열기',
    render: { samples: 24, shutter: 0.35, tone: 'neutral', exposure: 1.0, bloom: 0.5, bloomThreshold: 1.0, vignette: 0, grain: 0, saturation: 1.1, contrast: 1.04, fov: 34, near: 0.01, far: 200, background: '#05060f' },

    async build(S) {
      const { THREE, K, scene, camera } = S;
      const V = (x, y, z) => new THREE.Vector3(x, y, z), lin = (hex) => new THREE.Color(hex);
      const glow = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
      S.addFilter(BRUSH, { radius: { value: 8 } });
      S.addFilter(SURFACE, {});
      // ---- 붓 자국 결: 수천 개의 짧은 붓질을 한 장의 반복 무늬에 찍는다(원본 painted 의 dabField)
      function dabField(seed, flow) {
        const N = 1024, r = K.rng(seed), data = new Uint8Array(N * N * 4).fill(128), LEN = 84, WID = 22;
        for (let n = Math.round(N * N / (LEN * WID) * 3.4); n > 0; n--) {
          const cx = Math.floor(r() * N), cy = Math.floor(r() * N), len = LEN * r.range(0.55, 1.35), wid = WID * r.range(0.6, 1.25);
          const a = flow(cx / N, cy / N) + r.gauss() * 0.16, ca = Math.cos(a), sa = Math.sin(a), bend = r.range(-0.35, 0.35) / len;
          const tx = r() * 255, ty = r() * 255, tone = r() * 255, hairs = Math.max(3, Math.round(wid / 3.2)), ext = Math.ceil(len / 2 + wid);
          const from = [], to = [], ridge = [];
          for (let h = 0; h < hairs; h++) { from.push(-len / 2 + r() * len * 0.14); to.push(len / 2 - r() * len * 0.32); ridge.push(r.range(-0.3, 0.3)); }
          for (let dy = -ext; dy <= ext; dy++) for (let dx = -ext; dx <= ext; dx++) {
            const u = dx * ca + dy * sa, across = (-dx * sa + dy * ca - bend * u * u) / wid + 0.5;
            if (across < 0 || across >= 1) continue;
            const h = Math.floor(across * hairs);
            if (u < from[h] || u > to[h]) continue;
            const i = ((((cy + dy) % N) + N) % N * N + (((cx + dx) % N) + N) % N) * 4;
            data[i] = tx; data[i + 1] = ty; data[i + 2] = tone;
            data[i + 3] = 255 * K.clamp(0.5 + ridge[h] + 0.25 * Math.pow(Math.abs(across - 0.5) * 2, 3) - 0.15 * (u / len + 0.5));
          }
        }
        const tex = new THREE.DataTexture(data, N, N);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
        return tex;
      }
      const DABS = dabField(7, (u, v) => 0.4 * Math.sin(6.283 * (u + 2 * v)));
      // 물감 재질: 보통의 빛 받는 재질 + 물체에 붙은 붓 자국(삼면 투영). a, b = 붓 자국 색 사이, c = 몇 자국의 강조색
      const paint = (o = {}) => {
        const { a = '#ffffff', b = a, c = b, size = 1, tilt = 0.45, ...std } = o;
        const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, std));
        const u = { uDabs: { value: DABS }, uA: { value: lin(a) }, uB: { value: lin(b) }, uC: { value: lin(c) }, uTilt: { value: tilt }, uS: { value: 1 / size } };
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uDabs; uniform vec3 uA, uB, uC; uniform float uTilt, uS; varying vec3 vOP; varying vec3 vON; vec4 dab;')
            .replace('#include <color_fragment>', `#include <color_fragment>
              { vec3 w = pow(abs(normalize(vON)), vec3(4.0)); w /= (w.x + w.y + w.z);
                dab = texture2D(uDabs, vOP.yz * uS) * w.x + texture2D(uDabs, vOP.zx * uS + 0.37) * w.y + texture2D(uDabs, vOP.xy * uS + 0.71) * w.z;
                vec3 col = mix(uA, uB, smoothstep(0.15, 0.85, dab.b)); col = mix(col, uC, smoothstep(0.86, 0.96, dab.b));
                diffuseColor.rgb *= col * (0.88 + 0.24 * dab.a); }`)
            .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + uTilt * vec3(dab.r - 0.5, dab.g - 0.5, 0.0));');
        };
        return m;
      };
      const LAND = await (await fetch('segs/e2/land.json')).json();
      const D2R = Math.PI / 180;

      // ---- 구면 좌표: 경위도 → 단위 방향. 동·북 방향(접평면)
      const dirOf = (lon, lat) => { const a = lon * D2R, b = lat * D2R; return V(Math.cos(b) * Math.cos(a), Math.sin(b), -Math.cos(b) * Math.sin(a)); };
      const eastOf = (lon) => { const a = lon * D2R; return V(-Math.sin(a), 0, -Math.cos(a)); };
      const northOf = (lon, lat) => { const a = lon * D2R, b = lat * D2R; return V(-Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)); };
      const P0 = dirOf(LON0, LAT0), E0 = eastOf(LON0), N0 = northOf(LON0, LAT0);
      const SUN = P0.clone().multiplyScalar(0.78).addScaledVector(E0, -0.42).addScaledVector(N0, 0.46).normalize();   // 왼쪽 위에서 오는 늦은 오후 해
      const toM = (lon, lat) => [(lon - LON0) * 111320 * Math.cos(LAT0 * D2R), (lat - LAT0) * 110950];               // 경위도 → 위치 표시 기준 미터

      // ---- 지면 층 재질: 그림 지도 + 해의 기울기 + 가장자리 흐림(다음 층과 이어지게). 깊이는 쓰지 않고 그리는 순서로 쌓는다
      const surf = (map, feather, order) => {
        const m = new THREE.ShaderMaterial({
          uniforms: { map: { value: map }, uOp: { value: 1 }, uSun: { value: SUN }, uF: { value: feather } },
          vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform sampler2D map; uniform float uOp, uF; uniform vec3 uSun; varying vec2 vUv; varying vec3 vN;
            void main(){ vec4 c = texture2D(map, vUv); float d = dot(normalize(vN), uSun);
              vec3 lit = c.rgb * (0.42 + 0.72 * max(d, 0.0)), night = c.rgb * vec3(0.16, 0.2, 0.36);
              vec3 col = mix(night, lit, smoothstep(-0.12, 0.22, d));
              float f = uF > 0.0 ? smoothstep(0.0, uF, vUv.x) * smoothstep(0.0, uF, 1.0 - vUv.x) * smoothstep(0.0, uF, vUv.y) * smoothstep(0.0, uF, 1.0 - vUv.y) : 1.0;
              gl_FragColor = vec4(col, c.a * uOp * f); }`,
          transparent: true, depthTest: false, depthWrite: false,
        });
        return m;
      };
      // 경위도 격자 조각(구면)
      const patchGeo = (lo0, lo1, la0, la1, nx, ny, r) => {
        const pos = [], nrm = [], uv = [], idx = [];
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
          const lon = K.lerp(lo0, lo1, i / nx), lat = K.lerp(la0, la1, j / ny), d = dirOf(lon, lat);
          pos.push(d.x * r, d.y * r, d.z * r); nrm.push(d.x, d.y, d.z); uv.push(i / nx, j / ny);
        }
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        return g;
      };

      // ---- 붓 그림 지도 그리기 도구
      const ringsPath = (ctx, rings, X, Y) => { ctx.beginPath(); for (const r of rings) { ctx.moveTo(X(r[0]), Y(r[1])); for (let i = 2; i < r.length; i += 2) ctx.lineTo(X(r[i]), Y(r[i + 1])); ctx.closePath(); } };
      const mix3 = (a, b, k) => { const A = lin(a), B = lin(b); A.lerp(B, k); return '#' + A.convertLinearToSRGB().getHexString(); };
      const dabs = (ctx, n, rr, w, h, size, colorAt, angAt) => {      // 짧고 굵은 붓질을 흩뿌린다(색은 자리마다)
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const x = rr() * w, y = rr() * h, L = size * rr.range(0.8, 2.0), a = (angAt ? angAt(x, y) : 0.2) + rr.gauss() * 0.3;
          ctx.strokeStyle = colorAt(x, y, rr); ctx.globalAlpha = rr.range(0.35, 0.8); ctx.lineWidth = size * rr.range(0.35, 0.6);
          ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); ctx.lineTo(x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      const nz = K.noise(4);
      const oceanCol = (x, y, rr) => rr.pick(['#1d4a86', '#245a9a', '#2a68aa', '#1a3f78', '#3478b4']);
      const landCol = (lon, lat, rr) => {
        const al = Math.abs(lat), n = nz.n2(lon * 0.08, lat * 0.08);
        if (al > 64 + 4 * n) return rr.pick(['#eef0f4', '#dfe6ee', '#ffffff']);
        const desert = (lon > 40 && lon < 118 && lat > 34 && lat < 49) || (lon > -15 && lon < 35 && lat > 14 && lat < 31) || (lon > 35 && lon < 60 && lat > 14 && lat < 31) || (lon > 118 && lon < 145 && lat > -31 && lat < -19);
        const high = lon > 76 && lon < 102 && lat > 27 && lat < 37;
        if (high) return rr.pick(['#9a8466', '#b8a588', '#e6e2da']);
        if (desert && n > -0.25) return rr.pick(['#c9a35e', '#d6b46e', '#b98f4e']);
        if (al < 16) return rr.pick(['#3f7a3a', '#4d8a40', '#356a33']);
        return rr.pick(['#6d9a4a', '#82a656', '#5a8a42', '#97a85c', '#4f7a3e']);
      };
      const urbanR = (x, y) => { const a = Math.atan2(y, x); return 15000 * (1 + 0.28 * nz.n2(Math.cos(a) * 1.3 + 5, Math.sin(a) * 1.3 + 5) + 0.12 * Math.sin(a * 3 + 1)); };   // 도시 덩어리 반경(미터)

      // ================================================================ 지구 + 동아시아 + 한반도(구면 층)
      const equiCanvas = (W, H, lo0, lo1, la0, la1, rings, size, nDab, extra) => K.canvasTex(W, H, (ctx) => {
        const X = (lon) => (lon - lo0) / (lo1 - lo0) * W, Y = (lat) => (la1 - lat) / (la1 - la0) * H, rr = K.rng(W + H);
        const lonOf = (x) => lo0 + x / W * (lo1 - lo0), latOf = (y) => la1 - y / H * (la1 - la0);
        ctx.fillStyle = '#21528e'; ctx.fillRect(0, 0, W, H);
        dabs(ctx, nDab, rr, W, H, size, oceanCol, () => 0.15);
        ringsPath(ctx, rings, X, Y);                                  // 얕은 바다(해안 둘레의 밝은 청록)
        ctx.strokeStyle = '#4aa6be'; ctx.globalAlpha = 0.55; ctx.lineWidth = size * 1.6; ctx.lineJoin = 'round'; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#6a9448'; ctx.fill();
        ctx.save(); ringsPath(ctx, rings, X, Y); ctx.clip();
        dabs(ctx, nDab * 1.3, rr, W, H, size, (x, y, r2) => landCol(lonOf(x), latOf(y), r2), (x, y) => 1.2 + nz.n2(x * 0.004, y * 0.004) * 2);
        if (extra) extra(ctx, X, Y, rr);
        ctx.restore();
        ctx.strokeStyle = 'rgba(40,60,40,0.35)'; ctx.lineWidth = Math.max(1, size * 0.18); ringsPath(ctx, rings, X, Y); ctx.stroke();
      });
      const GLOBE_T = equiCanvas(4096, 2048, -180, 180, -90, 90, LAND.globe, 12, 26000);
      const A1 = [95, 160, 5, 60], A2 = [121, 134.5, 31, 44];
      const koreaExtra = (ctx, X, Y, rr) => {
        // 동쪽 산줄기(진한 초록), 도시 덩어리(베이지 회색), 큰 강 — 도시 지도와 같은 자리
        for (let i = 0; i < 260; i++) { const lat = rr.range(35.2, 39.5), lon = 128.2 + (39.5 - lat) * 0.32 + rr.gauss() * 0.35; ctx.fillStyle = rr.pick(['#3f6a36', '#4a7a3c', '#365e30']); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(X(lon), Y(lat), rr.range(8, 20), rr.range(14, 30), 1.1, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        const pxPerM = (X(LON0 + 1) - X(LON0)) / (111320 * Math.cos(LAT0 * D2R));
        ctx.beginPath(); for (let k = 0; k <= 72; k++) { const a = k / 72 * Math.PI * 2, rM = urbanR(Math.cos(a), Math.sin(a)); ctx.lineTo(X(LON0) + Math.cos(a) * rM * pxPerM, Y(LAT0) - Math.sin(a) * rM * pxPerM); }
        ctx.fillStyle = '#b9ae9c'; ctx.fill();
        ctx.strokeStyle = '#5e9ac0'; ctx.lineWidth = Math.max(3, 900 * pxPerM); ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); RIVER.forEach(([lo, la], i) => (i ? ctx.lineTo(X(lo), Y(la)) : ctx.moveTo(X(lo), Y(la)))); ctx.stroke();
      };
      const L1_T = equiCanvas(4096, Math.round(4096 * (A1[3] - A1[2]) / (A1[1] - A1[0])), ...A1, LAND.asia, 10, 30000);
      const L2_T = equiCanvas(4096, Math.round(4096 * (A2[3] - A2[2]) / (A2[1] - A2[0])), ...A2, LAND.korea, 9, 34000, koreaExtra);
      const globe = new THREE.Mesh(patchGeo(-180, 180, -90, 90, 256, 128, 1), surf(GLOBE_T, 0, 0)); globe.renderOrder = 0; scene.add(globe);
      const L1 = new THREE.Mesh(patchGeo(...A1, 96, 96, 1), surf(L1_T, 0.06, 1)); L1.renderOrder = 1; scene.add(L1);
      const L2 = new THREE.Mesh(patchGeo(...A2, 64, 64, 1), surf(L2_T, 0.08, 2)); L2.renderOrder = 2; scene.add(L2);
      // 구름 껍질(지구 전체) + 대기 테두리 빛
      const cloudT = K.canvasTex(2048, 1024, (ctx, w, h) => {
        const rr = K.rng(8); ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round';
        for (let i = 0; i < 2600; i++) {
          const x = rr() * w, y = rr() * h, lat = 90 - y / h * 180, band = Math.exp(-Math.pow((Math.abs(lat) - 50) / 14, 2)) * 0.8 + Math.exp(-Math.pow(lat / 8, 2)) * 0.6 + 0.15;
          if (rr() > band || nz.n2(x * 0.006, y * 0.012) < -0.05) continue;
          const rad = rr.range(10, 34), g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rad * 2.2, rad, 0.15 * Math.sin(y * 0.02), 0, 7); ctx.fill();
        }
      });
      const clouds = new THREE.Mesh(patchGeo(-180, 180, -90, 90, 192, 96, 1.008), surf(cloudT, 0, 5)); clouds.renderOrder = 5; scene.add(clouds);
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 48), new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SUN }, uOp: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
        vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform vec3 uSun; uniform float uOp; varying vec3 vN; varying vec3 vW;
          void main(){ vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0 - abs(dot(-vN, v)), 1.6);
            float lit = 0.35 + 0.65 * smoothstep(-0.3, 0.5, dot(-vN, uSun));
            gl_FragColor = vec4(vec3(0.35, 0.62, 1.0) * 1.6 * rim * lit * uOp, 1.0); }`,
      }));
      atmo.renderOrder = 6; scene.add(atmo);
      // 별(카메라를 따라다닌다)
      const stars = (() => {
        const r = K.rng(5), N = 380, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) { const v = V(r.gauss(), r.gauss(), r.gauss()).normalize().multiplyScalar(100); pos.set([v.x, v.y, v.z], i * 3); const k = r.range(0.7, 2.2); col.set([k * 0.9, k * 0.95, k], i * 3); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 13, sizeAttenuation: false, vertexColors: true, depthWrite: false, depthTest: false, transparent: true }));
        p.renderOrder = -5; p.frustumCulled = false; scene.add(p); return p;
      })();

      // ================================================================ 위치 표시 기준 접평면(미터 단위 — 아주 가까이서도 정밀하다)
      const frame = new THREE.Group(); frame.position.copy(P0); frame.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(E0, N0, P0)); frame.scale.setScalar(1 / R_EARTH); scene.add(frame);
      // 큰 길 격자(미터): 도시 지도와 동네 지도가 같은 격자를 쓴다
      const GR = { th: 0.18, step: 900, off: 450 };
      const g2l = (u, v) => [u * Math.cos(GR.th) - v * Math.sin(GR.th), u * Math.sin(GR.th) + v * Math.cos(GR.th)];
      const l2g = (x, y) => [x * Math.cos(GR.th) + y * Math.sin(GR.th), -x * Math.sin(GR.th) + y * Math.cos(GR.th)];
      const riverM = RIVER.map(([lo, la]) => toM(lo, la));
      const distRiver = (x, y) => { let d = 1e9; for (let i = 1; i < riverM.length; i++) { const [ax, ay] = riverM[i - 1], [bx, by] = riverM[i], dx = bx - ax, dy = by - ay, k = K.clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)); d = Math.min(d, Math.hypot(x - ax - k * dx, y - ay - k * dy)); } return d; };
      const hillAt = (x, y) => nz.fbm(x / 6000 + 11, y / 6000 + 3, 0, 3);   // 도시 안의 푸른 산
      // 아파트 동: 큰 길 사이 블록 안에 줄지어 선다(위치 표시 바로 옆 마당은 비워 둔다)
      const blds = [];
      { const rr = K.rng(31);
        for (let bu = -3; bu <= 2; bu++) for (let bv = -3; bv <= 2; bv++) {
          const u0 = bu * GR.step + GR.off - GR.step / 2 + 45, v0 = bv * GR.step + GR.off - GR.step / 2 + 45, size = GR.step - 90;
          const park = rr() < 0.12 && !(bu === 0 && bv === 0);
          if (park) continue;
          for (let v = v0 + 50; v < v0 + size - 40; v += 62) for (let u = u0 + 40; u < u0 + size - 70; u += 92) {
            if (rr() < 0.12) continue;
            const cu = u + 35, cv = v + 8, [x, y] = g2l(cu - GR.off, cv - GR.off);
            if (Math.hypot(x, y) < 60) continue;
            blds.push({ x, y, l: 72, w: 17, h: rr.range(38, 75) });
          }
        } }
      const sunL = [SUN.dot(E0), SUN.dot(N0), SUN.dot(P0)];                     // 접평면에서 본 해의 방향 → 그림자 방향
      const shadowOff = (h) => [-sunL[0] / sunL[2] * h, -sunL[1] / sunL[2] * h];
      const planeCanvas = (W, size, draw) => K.canvasTex(W, W, (ctx) => { const s = W / size, X = (x) => (x + size / 2) * s, Y = (y) => (size / 2 - y) * s; draw(ctx, X, Y, s); });
      const roadLines = (ctx, X, Y, half, width, color, every = 1) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'butt';
        const n = Math.ceil(half * 1.5 / GR.step);
        for (let k = -n; k <= n; k++) { if (k % every) continue; const c = k * GR.step + GR.step / 2; for (const vert of [0, 1]) { ctx.beginPath(); const p0 = vert ? g2l(c, -half * 1.5) : g2l(-half * 1.5, c), p1 = vert ? g2l(c, half * 1.5) : g2l(half * 1.5, c); ctx.moveTo(X(p0[0]), Y(p0[1])); ctx.lineTo(X(p1[0]), Y(p1[1])); ctx.stroke(); } }
      };
      const riverStroke = (ctx, X, Y, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); riverM.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke(); };
      // ---- 도시 지도(62km)
      const S3 = 62000;
      const L3_T = planeCanvas(4096, S3, (ctx, X, Y, s) => {
        const rr = K.rng(61), W = 4096;
        ctx.fillStyle = '#7f9a52'; ctx.fillRect(0, 0, W, W);
        dabs(ctx, 26000, rr, W, W, 12, (x, y, r2) => r2.pick(['#7f9a52', '#93a85c', '#6d8a46', '#a9a865', '#5f7e40']), () => 0.4);   // 바깥 들판
        ctx.save(); ctx.beginPath(); for (let k = 0; k <= 96; k++) { const a = k / 96 * Math.PI * 2, rM = urbanR(Math.cos(a), Math.sin(a)); ctx.lineTo(X(Math.cos(a) * rM), Y(Math.sin(a) * rM)); } ctx.closePath(); ctx.clip();
        ctx.fillStyle = '#b9ae9c'; ctx.fillRect(0, 0, W, W);
        for (let bu = -25; bu <= 25; bu++) for (let bv = -25; bv <= 25; bv++) {        // 블록마다 조금씩 다른 색 + 잔 무늬
          const o2 = GR.step / 2, c = [g2l(bu * GR.step + o2, bv * GR.step + o2), g2l((bu + 1) * GR.step + o2, bv * GR.step + o2), g2l((bu + 1) * GR.step + o2, (bv + 1) * GR.step + o2), g2l(bu * GR.step + o2, (bv + 1) * GR.step + o2)];
          ctx.fillStyle = rr() < 0.1 ? rr.pick(['#7f9a52', '#6d8a46']) : rr.pick(['#b9ae9c', '#c7bba6', '#a8a39a', '#bdb3a2', '#d2c6b0', '#9fa09c', '#c9b49a']); ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.fill();
        }
        dabs(ctx, 30000, rr, W, W, 11, (x, y, r2) => r2.pick(['#e8dfcf', '#8f8a86', '#cfc4b0', '#a7a097', '#b8a48a', '#d9cdb6']), (x, y) => GR.th + (nz.n2(x * 0.01, y * 0.01) > 0 ? Math.PI / 2 : 0));
        roadLines(ctx, X, Y, S3 / 2, 4.5, '#ece6da');
        roadLines(ctx, X, Y, S3 / 2, 9, '#f6f0e4', 4);
        ctx.restore();
        for (let i = 0; i < 1800; i++) { const x = rr.range(-S3 / 2, S3 / 2), y = rr.range(-S3 / 2, S3 / 2); if (hillAt(x, y) < 0.18 || Math.hypot(x, y) < 1800) continue; ctx.fillStyle = rr.pick(['#3f6a36', '#4f7a3c', '#5e8a44', '#355e30']); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(X(x), Y(y), rr.range(10, 26), rr.range(8, 20), rr() * 3, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        riverStroke(ctx, X, Y, 1100 * s, '#cdbf9e'); riverStroke(ctx, X, Y, 900 * s, '#4f8fbf');
        ctx.strokeStyle = 'rgba(225,218,205,0.7)'; ctx.lineWidth = 3;                              // 다리
        for (let i = -12; i <= 12; i++) { const [x0, y0] = g2l(i * GR.step * 2, 0); for (let k = 1; k < riverM.length; k++) { const [ax, ay] = riverM[k - 1], [bx, by] = riverM[k]; if ((ax - x0) * (bx - x0) <= 0 && ax !== bx) { const yy = ay + (by - ay) * (x0 - ax) / (bx - ax); ctx.beginPath(); ctx.moveTo(X(x0), Y(yy - 700)); ctx.lineTo(X(x0), Y(yy + 700)); ctx.stroke(); } } }
      });
      const L3 = new THREE.Mesh(new THREE.PlaneGeometry(S3, S3), surf(L3_T, 0.1, 3)); L3.renderOrder = 3; frame.add(L3);
      // ---- 동네 지도(3km): 아스팔트 큰 길, 단지 안 작은 길, 잔디와 나무, 아파트 동과 그림자
      const S4 = 3000;
      const L4_T = planeCanvas(4096, S4, (ctx, X, Y, s) => {
        const rr = K.rng(71), W = 4096;
        ctx.fillStyle = '#c4b9a4'; ctx.fillRect(0, 0, W, W);
        dabs(ctx, 9000, rr, W, W, 30, (x, y, r2) => r2.pick(['#c4b9a4', '#d1c6b0', '#b7ad9a', '#cbbfa8']), () => GR.th);
        for (let bu = -3; bu <= 2; bu++) for (let bv = -3; bv <= 2; bv++) {          // 단지마다 잔디 마당
          const u0 = bu * GR.step + GR.off - GR.step / 2 + 45, v0 = bv * GR.step + GR.off - GR.step / 2 + 45, sz = GR.step - 90;
          const q = [[u0, v0], [u0 + sz, v0], [u0 + sz, v0 + sz], [u0, v0 + sz]].map(([u, v]) => g2l(u - GR.off, v - GR.off));
          ctx.fillStyle = '#8fa565'; ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.fill();
          ctx.strokeStyle = '#b4ab9c'; ctx.lineWidth = 10 * s; ctx.stroke();
        }
        dabs(ctx, 12000, rr, W, W, 26, (x, y, r2) => r2.pick(['#8fa565', '#9fb070', '#7f9858', '#a8b47a']), () => 1.0);
        ctx.save(); ctx.translate(0, 0);                                              // 단지 안 작은 길(가로)
        for (let bu = -3; bu <= 2; bu++) for (let bv = -3; bv <= 2; bv++) for (let k = 0; k < 2; k++) {
          const v = bv * GR.step + GR.off - GR.step / 2 + 45 + 300 * (k + 1), u0 = bu * GR.step + GR.off - GR.step / 2 + 45, p0 = g2l(u0 - GR.off, v - GR.off), p1 = g2l(u0 + GR.step - 90 - GR.off, v - GR.off);
          ctx.strokeStyle = '#a49c90'; ctx.lineWidth = 11 * s; ctx.beginPath(); ctx.moveTo(X(p0[0]), Y(p0[1])); ctx.lineTo(X(p1[0]), Y(p1[1])); ctx.stroke();
        }
        ctx.restore();
        for (let i = 0; i < 5200; i++) {                                              // 나무
          const x = rr.range(-S4 / 2, S4 / 2), y = rr.range(-S4 / 2, S4 / 2), [u, v] = l2g(x, y), mu = ((u + GR.off) % GR.step + GR.step) % GR.step, mv = ((v + GR.off) % GR.step + GR.step) % GR.step;
          if (mu < 50 || mv < 50 || mu > GR.step - 50 || mv > GR.step - 50) continue;
          const rad = rr.range(4, 8) * s; ctx.fillStyle = 'rgba(40,40,70,0.35)'; ctx.beginPath(); ctx.arc(X(x) + 4 * s, Y(y) + 3 * s, rad, 0, 7); ctx.fill();
          ctx.fillStyle = rr.pick(['#4f7a3c', '#5e8a44', '#3f6a36', '#6d9a4a']); ctx.beginPath(); ctx.arc(X(x), Y(y), rad, 0, 7); ctx.fill();
        }
        roadLines(ctx, X, Y, S4 / 2, 34 * s, '#6c6b78');                               // 큰 길
        roadLines(ctx, X, Y, S4 / 2, 3 * s, '#e8d9a8');
        const quad = (b, grow, col) => { const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, d]) => { const [u, v] = [a * (b.l / 2 + grow), d * (b.w / 2 + grow)]; return [b.x + u * Math.cos(GR.th) - v * Math.sin(GR.th), b.y + u * Math.sin(GR.th) + v * Math.cos(GR.th)]; }); ctx.fillStyle = col; ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.fill(); return c; };
        for (const b of blds) { const [ox, oy] = shadowOff(b.h); ctx.globalAlpha = 0.45; quad({ ...b, x: b.x + ox, y: b.y + oy }, 0, '#3a3560'); ctx.globalAlpha = 1; }
        for (const b of blds) { quad(b, 0, '#efe6d6'); quad(b, -5, '#d9cfbf'); }
      });
      const L4 = new THREE.Mesh(new THREE.PlaneGeometry(S4, S4), surf(L4_T, 0.12, 4)); L4.position.z = 0.5; L4.renderOrder = 4; frame.add(L4);
      // ---- 3D 아파트 동(동네 층과 함께 땅에서 솟는다)
      const near = blds.filter((b) => Math.hypot(b.x, b.y) < 820);
      const winT = K.canvasTex(256, 512, (ctx, w, h) => { ctx.fillStyle = '#f2e9d8'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#8a8fa8'; for (let y = 0; y < 16; y++) for (let x = 0; x < 6; x++) ctx.fillRect(10 + x * 41, 10 + y * 31, 26, 16); }, { repeat: [1, 1] });
      const bldM = paint({ a: '#f2eadc', b: '#ffffff', c: '#e2d6c4', size: 0.6, map: winT, roughness: 0.9 });
      const bldG = new THREE.BoxGeometry(1, 1, 1); bldG.translate(0, 0, 0.5);
      { const uv = bldG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i)); }
      const bldMesh = new THREE.InstancedMesh(bldG, bldM, near.length); bldMesh.renderOrder = 9; bldMesh.frustumCulled = false; frame.add(bldMesh);
      const placeBld = (k) => { const o = new THREE.Object3D(); near.forEach((b, i) => { o.position.set(b.x, b.y, 0.5); o.rotation.set(0, 0, GR.th); o.scale.set(b.l, b.w, Math.max(0.01, b.h * k)); o.updateMatrix(); bldMesh.setMatrixAt(i, o.matrix); }); bldMesh.instanceMatrix.needsUpdate = true; };
      const sunLight = new THREE.DirectionalLight('#ffe2b8', 3.2); scene.add(sunLight, sunLight.target);
      sunLight.target.position.copy(P0); sunLight.position.copy(P0).add(SUN);
      scene.add(new THREE.HemisphereLight('#9fb4ff', '#6a5a4a', 1.0));
      // ---- 내려가며 뚫는 구름(접평면 위, 미터)
      const puffT = K.canvasTex(512, 512, (ctx, w, h) => {
        const rr = K.rng(17); ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < 90; i++) { const a = rr() * Math.PI * 2, d = Math.pow(rr(), 0.7) * 170, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d * 0.85, r = rr.range(40, 95) * (1 - d / 260);
          const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(236,236,250,0.75)'); g.addColorStop(1, 'rgba(190,190,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      });
      const puffs = [];
      { const rr = K.rng(23);
        for (let i = 0; i < 13; i++) {
          const alt = Math.exp(K.lerp(Math.log(70000), Math.log(200000), rr())), sz = alt * rr.range(0.35, 0.62);
          const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ map: puffT, transparent: true, depthTest: false, depthWrite: false, color: glow('#ffffff', 1.05) }));
          m.position.set(rr.range(-0.5, 0.5) * alt, rr.range(-0.5, 0.5) * alt, alt); m.rotation.z = rr() * 6; frame.add(m); puffs.push({ m, alt });
        }
        puffs.sort((a, b) => a.alt - b.alt).forEach((p, i) => (p.m.renderOrder = 10 + i)); }
      // ---- 붉은 위치 표시(화면에서 늘 같은 크기) + 맥박 고리
      const marker = new THREE.Group(); marker.position.z = 1; frame.add(marker);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: glow('#ff3b3b', 3.2), transparent: true, depthTest: false, depthWrite: false })); dot.renderOrder = 40; marker.add(dot);
      const dotRim = new THREE.Mesh(new THREE.RingGeometry(1, 1.35, 40), new THREE.MeshBasicMaterial({ color: glow('#ffffff', 2.2), transparent: true, depthTest: false, depthWrite: false })); dotRim.renderOrder = 41; marker.add(dotRim);
      const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), new THREE.MeshBasicMaterial({ color: glow('#ff4a4a', 2.6), transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = 39; marker.add(m); return m; });

      // ---- 카메라: 고도 h(로그 보간, 단조) · 바라보는 땅의 경위도 · 마지막에 남쪽에서 비스듬히
      const lnZ = (() => {                       // 단조 3차 보간(Fritsch–Carlson): 넘치지 않는다
        const xs = ZK.map((k) => k[0]), ys = ZK.map((k) => Math.log(k[1])), n = xs.length, d = [], m = [];
        for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
        m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
        for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const tt = 3 / Math.sqrt(s); m[i] = tt * a * d[i]; m[i + 1] = tt * b * d[i]; } }
        return (t) => { if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1]; let i = 0; while (t > xs[i + 1]) i++; const hh = xs[i + 1] - xs[i], u = (t - xs[i]) / hh, u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * hh * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * hh * m[i + 1]; };
      })();
      const hAt = (t) => Math.exp(lnZ(t));
      const opIn = (h, a, b) => K.smooth(a, b, h);           // a(높음)→b(낮음)으로 내려가며 0→1
      const proj = new THREE.Vector3();
      let lastMarkerScreen = [540, 960], globeScr = [540, 960, 0, 0];
      // 별: 작은 점은 붓 필터가 지워 버리므로 필터 뒤(오버레이)에 물감 점처럼 찍는다. 지구 원판 안에는 찍지 않는다
      const STARS = (() => { const r = K.rng(55); return Array.from({ length: 260 }, () => ({ x: r() * 1080, y: r() * 1920, s: r.range(1.2, 3.4), a: r.range(0.35, 1), c: r.pick(['#ffffff', '#fff1d6', '#d6e4ff']) })); })();

      return {
        update(t) {
          const h = hAt(t), k = K.ease.inOut(K.seg(t, 0, 2.3));
          const lon = K.lerp(104, LON0, k), lat = K.lerp(16, LAT0, k);
          const G = dirOf(lon, lat), N = northOf(lon, lat), U = G;
          const tilt = 0.46 * K.smooth(4.9, 6.15, t), look = -0.045 * K.smooth(APP, APP + 0.75, t) * h;
          const pos = G.clone().addScaledVector(U, h * Math.cos(tilt)).addScaledVector(N, -h * Math.sin(tilt));
          const tgt = G.clone().addScaledVector(N, look);
          camera.position.copy(pos); camera.up.copy(N); camera.lookAt(tgt);
          camera.near = Math.max(1e-7, h * 0.04); camera.far = h > 0.05 ? h + 3 : h * 14;
          stars.visible = false;
          proj.set(0, 0, 0).project(camera); const dist = camera.position.length();
          globeScr = [(proj.x * 0.5 + 0.5) * 1080, (0.5 - proj.y * 0.5) * 1920, dist > 1.0001 ? Math.tan(Math.asin(1 / dist)) / Math.tan(17 * D2R) * 960 * 1.07 : 1e5, K.smooth(0.35, 1.2, h)];
          // 층 바꾸기(고도에 따라)
          L1.material.uniforms.uOp.value = opIn(h, 1.7, 1.0);
          L2.material.uniforms.uOp.value = opIn(h, 0.5, 0.3);
          clouds.material.uniforms.uOp.value = 0.75 * K.smooth(0.25, 0.9, h);
          clouds.rotation.y = 0.02 * t;
          atmo.material.uniforms.uOp.value = K.smooth(0.3, 1.2, h);
          L3.material.uniforms.uOp.value = opIn(h, 0.034, 0.018);
          L4.material.uniforms.uOp.value = opIn(h, 0.0017, 0.001);
          const deep = h < 0.01; globe.visible = L1.visible = L2.visible = !deep; clouds.visible = atmo.visible = h > 0.2;
          L3.visible = h < 0.04; L4.visible = h < 0.0019;
          const rise = K.ease.out(K.seg(t, 5.05, 5.75)); bldMesh.visible = rise > 0.001; if (bldMesh.visible) placeBld(rise);
          for (const p of puffs) { const hm = h * R_EARTH; p.m.visible = hm > p.alt * 1.02 && hm < p.alt * 9; p.m.material.opacity = K.smooth(p.alt * 9, p.alt * 3, hm) * K.smooth(p.alt * 1.02, p.alt * 1.25, hm); }
          // 위치 표시: 구름을 뚫은 뒤 나타나 맥박친다. 크기는 화면 기준으로 일정
          const mk = K.smooth(4.05, 4.4, t) * (1 - K.smooth(APP + 0.35, APP + 0.7, t)), sc = h * R_EARTH * 0.022;
          marker.visible = mk > 0.001; marker.scale.setScalar(sc * (0.6 + 0.4 * K.ease.outBack(K.seg(t, 4.05, 4.45))));
          dot.material.opacity = dotRim.material.opacity = mk;
          rings.forEach((r, i) => { const ph = ((t - PULSE0) / PULSE - i / 3) % 1, on = t > PULSE0 + i * PULSE / 3; const p = ph < 0 ? ph + 1 : ph; r.scale.setScalar(1 + 3.2 * p); r.material.opacity = on ? mk * (1 - p) * 0.9 : 0; });
          dot.scale.setScalar(1 + 0.12 * Math.max(0, Math.sin(((t - PULSE0) / PULSE) * Math.PI * 2)));
          frame.updateMatrixWorld(true); proj.set(0, 0, 1).applyMatrix4(frame.matrixWorld).project(camera);
          lastMarkerScreen = [(proj.x * 0.5 + 0.5) * 1080, (0.5 - proj.y * 0.5) * 1920];
        },
        overlay(ctx, t, W, H) {
          if (globeScr[3] > 0) {
            ctx.save(); ctx.globalAlpha = 1; const tw = (i) => 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
            STARS.forEach((st, i) => { if (Math.hypot(st.x - globeScr[0], st.y - globeScr[1]) < globeScr[2] + 6) return; ctx.globalAlpha = st.a * globeScr[3] * tw(i); ctx.fillStyle = st.c; ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, 7); ctx.fill(); });
            ctx.restore();
          }
          // 3차 피드백: 설명 자막 삭제
          const a = K.seg(t, APP, APP + 0.7);
          if (a <= 0) return;
          const e = K.ease.outQuint(a), sc = 1 + 1.15 * (1 - e), cx = PH.x + PH.w / 2, cy = PH.y + PH.h / 2;
          const T = (x, y) => [cx + (x - cx) * sc, cy + (y - cy) * sc];
          ctx.save();
          // 휴대폰 바깥: 어두운 밤빛(지도는 휴대폰 화면 안에만 남는다)
          const [ox, oy] = T(PH.x, PH.y), ow = PH.w * sc, oh = PH.h * sc, or = PH.r * sc, bz = PH.bez * sc;
          const bg = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.5, H * 0.75); bg.addColorStop(0, '#1b2350'); bg.addColorStop(1, '#070915');
          ctx.globalAlpha = K.smooth(0, 0.6, a); ctx.fillStyle = bg; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.roundRect(ox, oy, ow, oh, or); ctx.fill('evenodd');
          ctx.globalAlpha = 1;
          // 휴대폰 테두리
          ctx.fillStyle = '#0d0f16'; ctx.beginPath(); ctx.roundRect(ox, oy, ow, oh, or); ctx.roundRect(ox + bz, oy + bz, ow - 2 * bz, oh - 2 * bz, or - bz); ctx.fill('evenodd');
          ctx.strokeStyle = 'rgba(160,175,220,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(ox + 1.5, oy + 1.5, ow - 3, oh - 3, or); ctx.stroke();
          // 화면 안: 위쪽 상태 줄 + 앱 제목 줄, 아래 정보 카드(지도 창은 비워 둔다)
          ctx.save(); ctx.beginPath(); ctx.roundRect(ox + bz, oy + bz, ow - 2 * bz, oh - 2 * bz, or - bz); ctx.clip();
          ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
          const ui = K.smooth(0.25, 0.85, a), x0 = PH.x + PH.bez, x1 = PH.x + PH.w - PH.bez;
          ctx.globalAlpha = ui;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, PH.y, x1 - x0, MAPWIN.y0 - PH.y);
          ctx.fillStyle = '#1a1c1c'; ctx.font = '700 30px "Noto Sans KR"'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText('9:42', x0 + 52, PH.y + 52);
          ctx.fillStyle = '#1a1c1c'; for (let i = 0; i < 4; i++) ctx.fillRect(x1 - 150 + i * 12, PH.y + 62 - 8 - i * 5, 8, 8 + i * 5);
          ctx.strokeStyle = '#1a1c1c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x1 - 92, PH.y + 42, 44, 22, 6); ctx.stroke(); ctx.fillRect(x1 - 88, PH.y + 46, 30, 14); ctx.fillRect(x1 - 46, PH.y + 48, 4, 10);
          ctx.strokeStyle = '#1a1c1c'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x0 + 66, MAPWIN.y0 - 66); ctx.lineTo(x0 + 48, MAPWIN.y0 - 48); ctx.lineTo(x0 + 66, MAPWIN.y0 - 30); ctx.stroke();
          ctx.font = '700 40px "Noto Sans KR"'; ctx.textAlign = 'center'; ctx.fillText('긴급 위치', (x0 + x1) / 2, MAPWIN.y0 - 48);
          const sh = ctx.createLinearGradient(0, MAPWIN.y0, 0, MAPWIN.y0 + 26); sh.addColorStop(0, 'rgba(10,12,30,0.28)'); sh.addColorStop(1, 'rgba(10,12,30,0)'); ctx.fillStyle = sh; ctx.fillRect(x0, MAPWIN.y0, x1 - x0, 26);
          // 정보 카드(아래에서 올라온다)
          const up = (1 - K.ease.out(K.seg(t, APP + 0.25, APP + 0.85))) * 300;
          ctx.translate(0, up);
          ctx.fillStyle = '#f7f8fc'; ctx.fillRect(x0, MAPWIN.y1, x1 - x0, PH.y + PH.h - MAPWIN.y1);
          const rows = [['대상자', '아빠'], ['수집 시각', '오후 9:42'], ['정확도', '약 20m']];
          rows.forEach(([lb, val], i) => {
            const ra = K.ease.out(K.seg(t, APP + 0.6 + i * 0.14, APP + 0.95 + i * 0.14)); ctx.globalAlpha = ui * ra;
            const y = MAPWIN.y1 + 78 + i * 70;
            ctx.textAlign = 'left'; ctx.font = '400 34px "Noto Sans KR"'; ctx.fillStyle = '#6b7080'; ctx.fillText(lb, x0 + 52, y);
            ctx.font = '700 36px "Noto Sans KR"'; ctx.fillStyle = '#1a1c1c'; ctx.fillText(val, x0 + 252, y);
          });
          const ba = K.ease.outBack(K.seg(t, APP + 1.05, APP + 1.45)); ctx.globalAlpha = ui * K.clamp(ba);
          const bx = x0 + 44, bw = x1 - x0 - 88, byy = MAPWIN.y1 + 300, bh = 104;
          ctx.save(); ctx.translate(bx + bw / 2, byy + bh / 2); ctx.scale(0.9 + 0.1 * ba, 0.9 + 0.1 * ba);
          ctx.fillStyle = '#4355B9'; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
          ctx.font = '700 36px "Noto Sans KR"'; const lw = ctx.measureText('외부 지도 앱으로 열기').width, gx = -(lw + 58) / 2;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(gx, -14); ctx.lineTo(gx + 13, -19); ctx.lineTo(gx + 26, -14); ctx.lineTo(gx + 39, -19); ctx.lineTo(gx + 39, 17); ctx.lineTo(gx + 26, 22); ctx.lineTo(gx + 13, 17); ctx.lineTo(gx, 22); ctx.closePath(); ctx.moveTo(gx + 13, -19); ctx.lineTo(gx + 13, 17); ctx.moveTo(gx + 26, -14); ctx.lineTo(gx + 26, 22); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.fillText('외부 지도 앱으로 열기', gx + 58, 2);
          ctx.restore();
          ctx.restore();
          // 지도 위 붉은 핀(선명하게) + 맥박
          const pa = K.ease.outBack(K.seg(t, APP + 0.35, APP + 0.75));
          if (pa > 0) {
            const [mx, my] = lastMarkerScreen, s2 = sc;
            const ph = (((t - PULSE0) / PULSE) % 1 + 1) % 1;
            ctx.save(); ctx.beginPath(); ctx.rect(ox + bz, MAPWIN.y0 * 1, ow, (MAPWIN.y1 - MAPWIN.y0)); ctx.clip();
            for (let i = 0; i < 2; i++) { const p = (ph + i * 0.5) % 1; ctx.globalAlpha = (1 - p) * 0.55 * K.clamp(pa); ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.ellipse(mx, my, 24 + 90 * p, (24 + 90 * p) * 0.55, 0, 0, 7); ctx.fill(); }
            ctx.globalAlpha = 1; ctx.translate(mx, my); ctx.scale(pa * s2, pa * s2);
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 18, 7, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-12, -22, -34, -40, -34, -66); ctx.arc(0, -66, 34, Math.PI, 0); ctx.bezierCurveTo(34, -40, 12, -22, 0, 0); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -66, 13, 0, 7); ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        },
      };
    },

    sound(k) {
      // 우주의 낮은 울림 → 내려갈수록 커지는 바람(구름을 뚫는 순간 최고) → 위치 표시 맥박 → 앱 화면
      k.tone(0, { f: 55, dur: 3.6, gain: 0.07, a: 0.8, hold: 2.2, verb: 0.5 });
      k.tone(0, { f: 82.4, dur: 3.2, gain: 0.04, a: 1.0, hold: 1.6, verb: 0.5 });
      k.noise(0, { dur: 3.0, color: 'brown', filter: 'lowpass', f: [[0, 90], [3, 220]], gain: 0.16, a: 1.2, hold: 1.2 });
      k.play('sparkle', 0.15, { n: 5, gain: 0.5 });
      k.play('riser', 1.8, { dur: 1.9, gain: 0.7 });
      k.noise(2.6, { dur: 2.2, color: 'pink', filter: 'bandpass', f: [[0, 400], [CLOUD_T - 2.6, 1600], [2.2, 500]], q: 0.7, gain: 0.32, a: CLOUD_T - 2.7, verb: 0.2 });
      k.noise(CLOUD_T - 0.4, { dur: 1.0, color: 'white', filter: 'highpass', f: [[0, 2600], [0.5, 4800], [1.0, 2200]], gain: 0.08, a: 0.35 });
      k.play('whoosh', CLOUD_T - 0.25, { dur: 0.7, top: 2400, gain: 0.9 });
      k.noise(4.2, { dur: 1.8, color: 'pink', filter: 'bandpass', f: 700, q: 0.5, gain: 0.03, a: 0.5 });   // 멀리 도시의 공기
      for (let t = PULSE0; t < DURATION - 0.2; t += PULSE) {                // 맥박: 낮고 둥근 두 번 뛰는 소리
        const g = t < APP ? 1 : 0.6;
        k.tone(t, { f: [[0, 520], [0.12, 420]], dur: 0.18, gain: 0.05 * g, a: 0.005, verb: 0.3 });
        k.tone(t + 0.17, { f: [[0, 440], [0.12, 360]], dur: 0.16, gain: 0.035 * g, a: 0.005, verb: 0.3 });
      }
      k.play('swish', APP, { dur: 0.35, gain: 0.8 });
      k.play('pop', APP + 0.4, { f: 700, gain: 0.7 });
      k.play('tick', APP + 0.65, { f: 4200, gain: 0.4 }); k.play('tick', APP + 0.79, { f: 4200, gain: 0.35 }); k.play('tick', APP + 0.93, { f: 4200, gain: 0.3 });
      k.play('pop', APP + 1.1, { f: 520, gain: 0.6 });
    },
  });
}
