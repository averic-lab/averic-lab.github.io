{
  // s0 인트로 — painted(동화책 그림). 첨단 기술이 영화처럼 빠르게 지나가는 몽타주(7.5초).
  // AI 칩과 빛나는 말풍선 → 걸어 나오는 로봇 → 돌아가는 DNA → 솟는 로켓 → 미래 도시의 밤(마지막 약 1초 거의 정지).
  // 카메라는 한 번도 끊기지 않고 앞으로 흐르며, 각 물체 위를 날아 지나가면 다음 물체가 튀어나온다.
  // 마지막 프레임은 다음 장면(팝업북) 왼쪽 면 삽화로 쓴다 → 도시가 화면 가운데를 넓게, 자막 아래(y 560~)까지 채운다.
  const DURATION = 9.0;
  // 정거장: z = 물체 위치, d = 카메라 거리, cy/ay = 카메라 높이·바라보는 높이, cut = 다음 정거장으로 넘어가는 시각
  const ST = [
    // m = 그 정거장의 가운데 시각, v = 머무는 동안 천천히 밀려 들어가는 속도
    { z: 0, d: 8.0, cy: 0.9, ay: 0.55, cut: 1.25, m: 0.6, v: 1.9 },                     // AI 칩
    { z: -28, d: 3.6, cy: 1.35, ay: 1.45, cut: 2.6, m: 1.95, v: 0.7 },                   // 로봇
    { z: -56, d: 7.4, cy: 1.2, ay: 0.85, cut: 3.85, m: 3.25, v: 1.2 },                   // DNA
    { z: -110, d: 38, cy: 3.2, ay: 9.6, cx: -10, ax: 1.6, cut: 5.45, m: 4.65, v: 1.1 }, // ★ 로켓이 내려와 집게 팔에 붙잡힘
    { z: -150, d: 17, cy: 2.4, ay: 1.0, cx: 1.2, ax: 0.0, cut: 7.0, m: 6.25, v: 0.6 },// ★ 날아다니는 스포츠카가 사뿐히 착지
    { z: -200, d: 30.0, cy: 3.6, ay: 7.6, cut: 99, m: 8.5, v: 0.3 },                     // 미래 도시(끝까지)
  ];
  const WHOOSH = 0.36;            // 정거장 사이를 날아가는 시간
  const CITY_IN = 0.9;            // 도시로 들어가는 마지막 이동은 길고 부드럽게 멈춘다
  const HOLD = 7.95;              // 이 뒤로는 거의 정지
  const BUBBLES = [0.04, 0.28, 0.52];
  const STEPS = [];               // 로봇 발걸음(소리와 같이 씀)
  const CATCH0 = 3.85, LAND0 = 5.45;   // 두 ★ 장면의 시작 시각(앞 정거장의 cut)

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
    id: 's0', name: 'Painted montage', family: 'Filters over 3D',
    duration: DURATION,
    koText: '인류 역사상 오늘날처럼 세상이 급격하게 변한 적이 있었을까요? AI',
    render: { samples: 24, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.55, bloomThreshold: 1.0, vignette: 0, grain: 0, saturation: 1.12, contrast: 1.05, fov: 34, near: 0.1, far: 900, background: '#10132a' },

    build(S) {
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
      const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));
      const add = (geo, mat, pos, o = {}) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (o.rot) m.rotation.set(...o.rot); if (o.scale) m.scale.setScalar(o.scale); m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || scene).add(m); return m; };

      // ---- 하늘: 카메라를 따라다니는 큰 구. 정거장마다 색이 바뀐다(위·지평선·아래·빛 무리)
      const SKY = [
        { top: '#0a0f2e', hor: '#123f5c', bot: '#071226', glow: '#2fd3e0', g: 0.55 },   // 칩: 깊은 남색 + 청록 빛
        { top: '#1b1028', hor: '#5a2e3a', bot: '#120b16', glow: '#ffb35c', g: 0.5 },    // 로봇: 따뜻한 어둠 + 호박색 문
        { top: '#1c0b38', hor: '#5b1d6e', bot: '#120626', glow: '#ff5fa8', g: 0.5 },    // DNA: 보라 + 자홍
        { top: '#23306e', hor: '#f08a4b', bot: '#3a2a4a', glow: '#ffcf7a', g: 0.8 },    // 로켓 붙잡기: 해 질 녘
        { top: '#0e1a46', hor: '#2b6688', bot: '#0c1328', glow: '#5fd6ff', g: 0.55 },   // 스포츠카 착지: 푸른 저녁
        { top: '#070b22', hor: '#2e2a66', bot: '#0b0f24', glow: '#ff9a5c', g: 0.35 },   // 도시의 밤
      ];
      const skyU = { uTop: { value: lin(SKY[0].top) }, uHor: { value: lin(SKY[0].hor) }, uBot: { value: lin(SKY[0].bot) }, uGlow: { value: lin(SKY[0].glow) }, uG: { value: 0.5 } };
      const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, uniforms: skyU,
        vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uTop, uHor, uBot, uGlow; uniform float uG; varying vec3 vD;
          float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
          float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y), mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
          void main(){ vec3 d = normalize(vD); float y = d.y + 0.04 * (n3(d * vec3(3.0, 14.0, 3.0)) - 0.5);
            vec3 c = y > 0.0 ? mix(uHor, uTop, pow(clamp(y, 0.0, 1.0), 0.55)) : mix(uHor, uBot, pow(clamp(-y, 0.0, 1.0), 0.5));
            c += uGlow * uG * exp(-pow(length(d.xz * vec2(1.0, 1.0) - vec2(0.0, -1.0)) * 1.6, 2.0) - abs(y) * 3.0);
            c *= 0.9 + 0.2 * n3(d * vec3(9.0, 30.0, 9.0));
            gl_FragColor = vec4(c, 1.0); }`,
      }));
      sky.renderOrder = -10; scene.add(sky);
      // 별(밝아서 붓이 지우지 못하게 꽃 번짐을 먹인다)
      const stars = (() => {
        const r = K.rng(5), N = 520, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) { const th = r() * Math.PI * 2, ph = r.range(0.05, 1.2); pos.set([Math.cos(th) * Math.cos(ph) * 500, Math.sin(ph) * 500, Math.sin(th) * Math.cos(ph) * 500], i * 3); const k = r.range(0.8, 2.2); col.set([k, k * 0.95, k * 0.85], i * 3); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 11, sizeAttenuation: false, vertexColors: true, depthWrite: false, transparent: true }));
        p.renderOrder = -9; scene.add(p); return p;
      })();

      // ---- 빛: 왼쪽 위의 따뜻한 주광 + 차가운 하늘빛
      const hemi = new THREE.HemisphereLight('#8aa6ff', '#2a1d3a', 0.9); scene.add(hemi);
      const key = K.sun(S, { pos: [-6, 9, 6], target: [0, 0, 0], color: '#ffe1b8', power: 3.2, size: 14, soft: 0.6, mapSize: 2048 });

      // ---- 속도감: 길을 따라 흩어진 빛 알갱이(이동할 때 잔상으로 길게 끌린다)
      const motes = (() => {
        const r = K.rng(11), N = 240, m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), basic('#ffffff'), N);
        const cols = ['#9ff4ff', '#ffd27a', '#ff8fd1', '#ffffff'];
        for (let i = 0; i < N; i++) {
          const a = r() * Math.PI * 2, rad = r.range(3.2, 9), z = r.range(-240, 12);
          K.place(m, i, [Math.cos(a) * rad, 1.4 + Math.sin(a) * rad * 0.7, z], null, r.range(0.04, 0.09));
          m.setColorAt(i, glow(r.pick(cols), r.range(1.5, 3.5)));
        }
        m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.castShadow = false; scene.add(m); return m;
      })();

      // ================================================================ 1. AI 칩 + 빛나는 말풍선
      const chip = new THREE.Group(); chip.position.set(0, 0, ST[0].z); scene.add(chip);
      const chipBody = new THREE.Group(); chipBody.rotation.set(0.95, -0.42, 0.06); chipBody.position.set(0.35, -0.55, 0); chip.add(chipBody);
      add(K.roundedBox(2.5, 0.28, 2.5, 0.08), paint({ a: '#1c2340', b: '#2a3560', c: '#3b4f8a', size: 1.2 }), [0, 0, 0], { parent: chipBody });
      const pinM = paint({ a: '#d9a441', b: '#f2cf72', c: '#fff0b0', roughness: 0.4, metalness: 0.6 });
      for (let s = 0; s < 4; s++) for (let i = 0; i < 7; i++) {
        const u = -0.96 + i * 0.32, pin = add(K.roundedBox(0.16, 0.08, 0.34, 0.03), pinM, [0, -0.02, 0], { parent: chipBody });
        const ang = s * Math.PI / 2; pin.position.set(Math.cos(ang) * 1.38 - Math.sin(ang) * u, -0.04, Math.sin(ang) * 1.38 + Math.cos(ang) * u); pin.rotation.y = -ang;
      }
      const dieTex = K.canvasTex(1024, 1024, (ctx, w, h) => {
        ctx.fillStyle = '#06222e'; ctx.fillRect(0, 0, w, h);
        const r = K.rng(3); ctx.lineCap = 'round';
        for (let i = 0; i < 46; i++) {                    // 회로선: 가장자리에서 가운데로 꺾이며 들어온다
          let x = r() < 0.5 ? (r() < 0.5 ? 0 : w) : r() * w, y = x === 0 || x === w ? r() * h : (r() < 0.5 ? 0 : h);
          ctx.strokeStyle = r() < 0.7 ? '#36e4ff' : '#9cf6ff'; ctx.lineWidth = r.range(10, 18); ctx.beginPath(); ctx.moveTo(x, y);
          for (let k = 0; k < 3; k++) { if (k % 2) x += (w / 2 - x) * r.range(0.3, 0.7); else y += (h / 2 - y) * r.range(0.3, 0.7); ctx.lineTo(x, y); }
          ctx.stroke(); ctx.fillStyle = '#e4fdff'; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#0a3140'; ctx.beginPath(); ctx.roundRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56, 60); ctx.fill();
        ctx.strokeStyle = '#7ff3ff'; ctx.lineWidth = 16; ctx.stroke();
        ctx.fillStyle = '#eaffff'; ctx.font = '900 330px "Noto Sans KR"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AI', w / 2, h / 2 + 18);
      });
      const dieMat = basic(glow('#ffffff', 1.6), { map: dieTex });
      const die = add(new THREE.PlaneGeometry(1.75, 1.75), dieMat, [0, 0.145, 0], { parent: chipBody, rot: [-Math.PI / 2, 0, 0], cast: false });
      const chipLight = new THREE.PointLight('#38e6ff', 30, 12, 2); chipLight.position.set(0, 1.6, 0.8); chip.add(chipLight);
      // 터지는 빛 고리(첫 프레임에 눈길)
      const ring = add(new THREE.TorusGeometry(1, 0.06, 8, 64), basic(glow('#7ff3ff', 4), { transparent: true }), [0, 0.2, 0], { parent: chipBody, rot: [Math.PI / 2, 0, 0], cast: false });
      // 말풍선 3개: 칩에서 솟아 떠오른다(모서리 둥근 판 + 꼬리, 안에 대화 줄)
      const bubbleTex = (lines, tint) => K.canvasTex(768, 520, (ctx, w, h) => {
        ctx.fillStyle = tint; ctx.beginPath(); ctx.roundRect(20, 20, w - 40, h - 130, 90); ctx.fill();
        ctx.beginPath(); ctx.moveTo(150, h - 120); ctx.lineTo(120, h - 18); ctx.lineTo(270, h - 115); ctx.fill();
        ctx.fillStyle = 'rgba(8,40,60,0.85)'; ctx.lineCap = 'round';
        lines.forEach((l, i) => { ctx.fillRect(110, 100 + i * 92, l * (w - 220), 44); });
      });
      const bubbles = [
        { tex: bubbleTex([0.9, 0.62], '#d9fbff'), pos: V(-1.05, 1.0, 0.6), s: 1.1 },
        { tex: bubbleTex([0.72, 0.95, 0.4], '#ffffff'), pos: V(0.8, 1.6, 0.2), s: 1.0 },
        { tex: bubbleTex([0.5], '#b8f0ff'), pos: V(-0.35, 2.25, -0.4), s: 0.85 },
      ].map((b, i) => {
        const m = add(new THREE.PlaneGeometry(1.48, 1.0), basic(glow('#ffffff', 1.5), { map: b.tex, transparent: true, depthWrite: false }), null, { parent: chip, cast: false });
        if (i === 1) m.scale.x = -1;
        return Object.assign(b, { m });
      });

      // ================================================================ 2. 걸어 나오는 휴머노이드 로봇
      const robotSt = new THREE.Group(); robotSt.position.set(0, 0, ST[1].z); scene.add(robotSt);
      add(new THREE.PlaneGeometry(40, 40), paint({ a: '#2a2230', b: '#3b2c38', c: '#5a4048', size: 3 }), [0, 0, 0], { parent: robotSt, rot: [-Math.PI / 2, 0, 0], cast: false });
      // 빛이 새어 나오는 문(로봇이 그 안에서 걸어 나온다)
      add(new THREE.PlaneGeometry(2.6, 4.2), basic(glow('#ffd9a0', 3.2)), [0, 2.1, -4.2], { parent: robotSt, cast: false });
      const frameM = paint({ a: '#3a2a3a', b: '#4e3a46', size: 1 });
      for (const x of [-1.5, 1.5]) add(K.roundedBox(0.4, 4.6, 0.6, 0.05), frameM, [x, 2.3, -4.1], { parent: robotSt });
      add(K.roundedBox(3.4, 0.4, 0.6, 0.05), frameM, [0, 4.5, -4.1], { parent: robotSt });
      add(new THREE.PlaneGeometry(2.6, 6), basic(glow('#ffbf73', 0.55), { transparent: true, opacity: 0.6, depthWrite: false }), [0, 0.02, -1.2], { parent: robotSt, rot: [-Math.PI / 2, 0, 0], cast: false });   // 바닥에 번진 문빛
      const doorLight = new THREE.SpotLight('#ffcf8f', 120, 20, 0.7, 0.8, 2); doorLight.position.set(0, 3.2, -3.9); doorLight.target.position.set(0, 0.5, 0); robotSt.add(doorLight, doorLight.target);
      const white = paint({ a: '#e9e6f2', b: '#ffffff', c: '#c9d6ff', size: 0.7, roughness: 0.5 }), joint = paint({ a: '#4a4e66', b: '#62677f', size: 0.5 });
      const robot = new THREE.Group(); robot.scale.setScalar(1.08); robotSt.add(robot);
      const torso = add(K.roundedBox(0.82, 0.92, 0.48, 0.16), white, [0, 1.48, 0], { parent: robot });
      add(new THREE.CircleGeometry(0.13, 24), basic(glow('#5ff0ff', 3.5)), [0, 1.6, 0.245], { parent: robot, cast: false });
      add(K.roundedBox(0.56, 0.26, 0.38, 0.1), joint, [0, 0.98, 0], { parent: robot });
      add(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12), joint, [0, 2.02, 0], { parent: robot });
      const head = new THREE.Group(); head.position.set(0, 2.32, 0); robot.add(head);
      add(K.roundedBox(0.54, 0.5, 0.5, 0.18), white, [0, 0, 0], { parent: head });
      add(K.roundedBox(0.44, 0.2, 0.06, 0.06), paint({ a: '#0e1424', b: '#1a2238', roughness: 0.25 }), [0, 0.02, 0.24], { parent: head });
      add(new THREE.PlaneGeometry(0.32, 0.055), basic(glow('#6ff6ff', 4)), [0, 0.03, 0.275], { parent: head, cast: false });
      const limb = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
      const legs = [-1, 1].map((sx) => {
        const hip = new THREE.Group(); hip.position.set(sx * 0.2, 0.95, 0); robot.add(hip);
        const th = limb(0.13, 0.36, white); th.position.y = -0.24; th.castShadow = true; hip.add(th);
        const knee = new THREE.Group(); knee.position.y = -0.48; hip.add(knee);
        const sh = limb(0.12, 0.34, white); sh.position.y = -0.22; sh.castShadow = true; knee.add(sh);
        const foot = new THREE.Mesh(K.roundedBox(0.24, 0.12, 0.38, 0.05), joint); foot.position.set(0, -0.44, 0.06); foot.castShadow = true; knee.add(foot);
        return { hip, knee };
      });
      const arms = [-1, 1].map((sx) => {
        const sh = new THREE.Group(); sh.position.set(sx * 0.52, 1.82, 0); robot.add(sh);
        const up = limb(0.11, 0.3, white); up.position.y = -0.21; up.castShadow = true; sh.add(up);
        const el = new THREE.Group(); el.position.y = -0.44; sh.add(el);
        const fo = limb(0.1, 0.28, white); fo.position.y = -0.19; fo.castShadow = true; el.add(fo);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), joint); hand.position.y = -0.42; hand.castShadow = true; el.add(hand);
        return { sh, el };
      });
      const WALK = { t0: 1.02, speed: 0.95, hz: 1.7, z0: -3.6 };
      for (let k = 0; ; k++) { const t = WALK.t0 + (k + 0.5) / (2 * WALK.hz); if (t > ST[1].cut + 0.1) break; STEPS.push(t); }

      // ================================================================ 3. 돌아가는 DNA 나선
      const dnaSt = new THREE.Group(); dnaSt.position.set(0, 0, ST[2].z); scene.add(dnaSt);
      const dna = new THREE.Group(); dna.position.set(0, 0.9, 0); dna.rotation.z = 0.42; dnaSt.add(dna);
      const NB = 26, HSTEP = 0.3, RAD = 1.0, TWIST = 0.52;
      const strand = (ph) => Array.from({ length: NB }, (_, k) => [Math.cos(k * TWIST + ph) * RAD, -NB * HSTEP / 2 + k * HSTEP, Math.sin(k * TWIST + ph) * RAD]);
      const A = strand(0), Bp = strand(Math.PI);
      add(K.tube(A, 0.11, { segments: 220 }), paint({ a: '#ffb547', b: '#ffd27a', c: '#fff1c4', emissive: '#ff8a1a', emissiveIntensity: 0.35, size: 0.6, roughness: 0.4 }), null, { parent: dna });
      add(K.tube(Bp, 0.11, { segments: 220 }), paint({ a: '#2fd6c8', b: '#6ff0e0', c: '#d6fff8', emissive: '#14b8b0', emissiveIntensity: 0.35, size: 0.6, roughness: 0.4 }), null, { parent: dna });
      const rungCols = ['#ff5fa8', '#7c8cff', '#ffe066', '#5ff0a0'];
      const rungMats = rungCols.map((c) => paint({ a: c, b: c, emissive: c, emissiveIntensity: 0.3, size: 0.5 }));
      for (let k = 0; k < NB; k++) {
        const a = V(...A[k]), b = V(...Bp[k]), mid = a.clone().add(b).multiplyScalar(0.5);
        [[a, mid, k % 4], [mid, b, (k + 2) % 4]].forEach(([p, q, ci]) => {
          const len = p.distanceTo(q), m = add(new THREE.CylinderGeometry(0.075, 0.075, len, 10), rungMats[ci], null, { parent: dna });
          m.position.copy(p.clone().add(q).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), q.clone().sub(p).normalize());
        });
        for (const p of [a, b]) add(new THREE.SphereGeometry(0.17, 16, 12), basic(glow(k % 2 ? '#fff4d0' : '#d8fffa', 1.6)), [p.x, p.y, p.z], { parent: dna, cast: false });
      }
      const dnaLight = new THREE.PointLight('#ff7ad0', 40, 14, 2); dnaLight.position.set(1.5, 1.5, 2.5); dnaSt.add(dnaLight);

      // ================================================================ 4. ★ 거대한 재사용 로켓이 불꽃을 뿜으며 내려와 발사탑의 집게 팔에 붙잡힌다
      // (특정 회사·로고·글자 없음 — 동화책의 '로켓'과 '격자 철골 탑')
      const catchSt = new THREE.Group(); catchSt.position.set(0, 0, ST[3].z); scene.add(catchSt);
      add(new THREE.PlaneGeometry(160, 120), paint({ a: '#4a3a52', b: '#6b4a52', c: '#c27a5a', size: 4 }), [0, 0, -20], { parent: catchSt, rot: [-Math.PI / 2, 0, 0], cast: false });
      for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(1, 24, 12), paint({ a: '#3e2f4e', b: '#56405e', size: 4 }), [-60 + i * 17, -3, -70 - (i % 3) * 10], { parent: catchSt, scale: 12 + (i % 3) * 4, cast: false });
      const steel = paint({ a: '#3b4258', b: '#566078', c: '#8a94b0', size: 1.2, roughness: 0.6, metalness: 0.2 });
      add(K.roundedBox(6, 2.4, 6, 0.15), paint({ a: '#4a4f62', b: '#646b80', size: 1.5 }), [0, 1.2, 0], { parent: catchSt });          // 발사대
      add(new THREE.TorusGeometry(1.5, 0.3, 10, 40), steel, [0, 2.5, 0], { parent: catchSt, rot: [Math.PI / 2, 0, 0] });
      // 격자 철골 탑: 기둥 넷 + 층마다 가로보와 X자 버팀대(인스턴스 한 번에)
      const TW = { x: 4.8, half: 1.3, h: 21, step: 2.1 };
      const beams = [];
      const corner = (cx, cz) => [TW.x + cx * TW.half, cz * TW.half];
      const C4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [cx, cz] of C4) { const [x, z] = corner(cx, cz); beams.push([[x, 0, z], [x, TW.h, z], 0.34]); }
      for (let y = 0; y < TW.h - 0.1; y += TW.step) for (let k = 0; k < 4; k++) {
        const [x0, z0] = corner(...C4[k]), [x1, z1] = corner(...C4[(k + 1) % 4]);
        beams.push([[x0, y + TW.step, z0], [x1, y + TW.step, z1], 0.2]);
        beams.push([[x0, y, z0], [x1, y + TW.step, z1], 0.13]); beams.push([[x1, y, z1], [x0, y + TW.step, z0], 0.13]);
      }
      const beamMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steel, beams.length);
      { const o = new THREE.Object3D(); beams.forEach(([p, q, th], i) => { const P = V(...p), Q = V(...q), L = P.distanceTo(Q); o.position.copy(P).add(Q).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), Q.clone().sub(P).normalize()); o.scale.set(th, L, th); o.updateMatrix(); beamMesh.setMatrixAt(i, o.matrix); }); }
      beamMesh.castShadow = beamMesh.receiveShadow = true; catchSt.add(beamMesh);
      add(new THREE.SphereGeometry(0.3, 10, 8), basic(glow('#ff5a5a', 4)), [TW.x, TW.h + 0.4, 0], { parent: catchSt, cast: false });
      // 젓가락처럼 생긴 집게 팔 두 개: 탑 옆면에서 로켓 쪽으로 뻗어 있다가 닫힌다
      const ARM_Y = 10.8, armM = paint({ a: '#4a5168', b: '#646e8a', c: '#9aa4c0', size: 1, roughness: 0.55, metalness: 0.25 });
      const arms2 = [1, -1].map((sz) => {
        const piv = new THREE.Group(); piv.position.set(TW.x - TW.half, ARM_Y, sz * 1.25); catchSt.add(piv);
        add(K.roundedBox(1.0, 1.4, 1.0, 0.1), steel, [0.2, 0, 0], { parent: piv });
        add(K.roundedBox(5.4, 0.75, 0.42, 0.12), armM, [-2.7, 0, 0], { parent: piv });
        for (let i = 0; i < 4; i++) add(K.roundedBox(0.16, 0.55, 0.46, 0.04), steel, [-0.8 - i * 1.1, 0, 0], { parent: piv });   // 팔의 마디
        add(K.roundedBox(0.9, 0.95, 0.3, 0.1), paint({ a: '#d9d2c4', b: '#f2ece0', size: 0.5 }), [-3.5, 0, -sz * 0.3], { parent: piv }); // 받침 패드
        return { piv, sz };
      });
      // 로켓 몸체: 은빛 원통 + 아래쪽과 한쪽 면이 그을린 검은 열차폐
      const sootTex = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#c9ced8'); g.addColorStop(0.5, '#eef1f6'); g.addColorStop(1, '#c4c9d4'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const rr = K.rng(13);
        for (let i = 0; i < 260; i++) {                       // 아래에서 위로 그을린 줄기, 한쪽(가운데)이 진하다
          const u = rr(), side = Math.exp(-Math.pow((u - 0.55) / 0.22, 2)), len = h * rr.range(0.08, 0.35 + 0.5 * side);
          ctx.globalAlpha = rr.range(0.25, 0.75) * (0.35 + 0.65 * side); ctx.fillStyle = rr() < 0.8 ? '#16161c' : '#3a2e2a';
          ctx.beginPath(); ctx.ellipse(u * w, h, rr.range(6, 26), len, 0, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1; const gb = ctx.createLinearGradient(0, h, 0, h * 0.72); gb.addColorStop(0, 'rgba(14,14,18,0.95)'); gb.addColorStop(1, 'rgba(14,14,18,0)'); ctx.fillStyle = gb; ctx.fillRect(0, h * 0.72, w, h * 0.28);
        ctx.fillStyle = '#20222a'; ctx.fillRect(0, h * 0.06, w, h * 0.035);      // 위쪽 이음 띠
      });
      const hullM = paint({ a: '#e6e9ef', b: '#ffffff', c: '#c8d0e0', size: 1.2, map: sootTex, roughness: 0.35, metalness: 0.25 });
      const bigRocket = new THREE.Group(); catchSt.add(bigRocket);
      const RH = 13, RR = 0.95;
      add(new THREE.CylinderGeometry(RR, RR, RH, 40), hullM, [0, RH / 2, 0], { parent: bigRocket });
      add(new THREE.CylinderGeometry(RR * 0.98, RR, 0.5, 40), paint({ a: '#1d1e24', b: '#2c2d36', size: 0.6 }), [0, RH + 0.25, 0], { parent: bigRocket });
      const gridTex = K.canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#2b2e38'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#000'; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) ctx.fillRect(14 + x * 47, 14 + y * 47, 34, 34); });
      for (let i = 0; i < 4; i++) {                           // 격자 날개 넷
        const a = i * Math.PI / 2 + 0.4, f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshStandardMaterial({ map: gridTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }));
        gridTex.colorSpace = THREE.SRGBColorSpace;
        f.position.set(Math.cos(a) * (RR + 0.55), RH - 1.1, Math.sin(a) * (RR + 0.55)); f.rotation.set(0, -a, 0); f.castShadow = true; bigRocket.add(f);
      }
      for (let i = 0; i < 3; i++) { const a = i * 2.09; add(new THREE.CylinderGeometry(0.22, 0.38, 0.6, 16, 1, true), paint({ a: '#2a2a30', b: '#44444e', size: 0.4, side: THREE.DoubleSide }), [Math.cos(a) * 0.42, -0.25, Math.sin(a) * 0.42], { parent: bigRocket }); }
      const plumeO = add(new THREE.ConeGeometry(1.0, 6.5, 32, 1, true), basic(glow('#ff8a2a', 3.2), { transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), [0, -3.6, 0], { parent: bigRocket, rot: [Math.PI, 0, 0], cast: false });
      const plumeI = add(new THREE.ConeGeometry(0.55, 3.6, 24, 1, true), basic(glow('#fff2c0', 7), { transparent: true, depthWrite: false, side: THREE.DoubleSide }), [0, -2.1, 0], { parent: bigRocket, rot: [Math.PI, 0, 0], cast: false });
      const plumeLight = new THREE.PointLight('#ff9a4a', 0, 30, 1.6); plumeLight.position.set(0, -1.5, 1.5); bigRocket.add(plumeLight);
      // 시간표: 내려오기 → 팔이 닫힘 → 살짝 내려앉음 → 불꽃 꺼짐
      const CT = { fall: [-0.2, 1.0], close: [0.82, 1.12], settle: 1.1, off: [1.08, 1.35] };
      const rocketBottom = (u) => { const q = K.seg(u, CT.fall[0], CT.fall[1]), k = 1 - (1 - q) * (1 - q); let y = K.lerp(24, 3.55, k); if (u > CT.settle) y -= 0.18 * (1 - Math.exp(-(u - CT.settle) * 9) * Math.cos((u - CT.settle) * 26)); return y; };
      const armOpen = (u) => 1 - K.ease.inOut(K.seg(u, CT.close[0], CT.close[1]));
      // 연기: 불꽃이 발사대에 닿아 옆으로 퍼진다
      const smokeM = paint({ a: '#e8e2e8', b: '#ffffff', c: '#f6c39a', size: 0.9, emissive: '#ff7a30', emissiveIntensity: 0 });
      const puffs = Array.from({ length: 90 }, (_, i) => {
        const r = K.rng(100 + i), born = CATCH0 + 0.15 + i * 0.012, ang = r() * Math.PI * 2;
        const m = add(new THREE.IcosahedronGeometry(1, 2), smokeM, null, { parent: catchSt, cast: false });
        return { m, born, dir: V(Math.cos(ang), 0, Math.sin(ang)), sp: r.range(3.5, 9), rise: r.range(0.2, 1.0), size: r.range(0.35, 0.75) };
      });
      const fill = new THREE.DirectionalLight('#ffb58a', 0); fill.position.set(-20, 8, 10); catchSt.add(fill, fill.target);   // 해 질 녘 하늘빛(로켓 은빛이 살게)

      // ================================================================ 5. ★ 매끈한 2인승 스포츠카가 푸른 불꽃을 뿜으며 사뿐히 착지(연기가 퍼짐)
      const carSt = new THREE.Group(); carSt.position.set(0, 0.03, ST[4].z); scene.add(carSt);   // 도시의 물 거울(y=0)과 겹치지 않게 살짝 올린다
      const padTex = K.canvasTex(1024, 1024, (ctx, w, h) => {
        ctx.fillStyle = '#1e2a40'; ctx.fillRect(0, 0, w, h);
        const rr = K.rng(21); for (let i = 0; i < 900; i++) { ctx.globalAlpha = 0.25; ctx.fillStyle = rr() < 0.5 ? '#2a3a56' : '#162034'; ctx.fillRect(rr() * w, rr() * h, rr.range(20, 80), rr.range(4, 12)); }
        ctx.globalAlpha = 1; ctx.strokeStyle = '#3a4c6e'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(w / 2, h / 2, 300, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#2f3f5e'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(w / 2, h / 2, 400, 0, 7); ctx.stroke();
      });
      add(new THREE.PlaneGeometry(26, 26), paint({ a: '#ffffff', b: '#dfe6f2', size: 3, map: padTex, roughness: 0.4 }), [0, 0, 0], { parent: carSt, rot: [-Math.PI / 2, 0, 0], cast: false });
      add(new THREE.PlaneGeometry(200, 140), paint({ a: '#141c30', b: '#1e2a42', size: 4 }), [0, -0.02, -30], { parent: carSt, rot: [-Math.PI / 2, 0, 0], cast: false });
      const padLights = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return add(new THREE.SphereGeometry(0.11, 10, 8), basic(glow('#6ff0ff', 3)), [Math.cos(a) * 3.9, 0.06, Math.sin(a) * 3.9], { parent: carSt, cast: false }); });
      const car = new THREE.Group(); carSt.add(car);
      const carBody = new THREE.Group(); car.add(carBody);
      const prof = new THREE.Shape();                         // 옆모습: 낮은 코, 짧은 지붕, 길게 흐르는 뒤
      prof.moveTo(-2.15, 0.24); prof.lineTo(1.95, 0.2); prof.quadraticCurveTo(2.38, 0.24, 2.22, 0.44); prof.quadraticCurveTo(1.4, 0.6, 0.55, 0.76);
      prof.quadraticCurveTo(-0.15, 1.12, -0.95, 1.0); prof.quadraticCurveTo(-1.7, 0.9, -2.16, 0.78); prof.lineTo(-2.22, 0.42); prof.closePath();
      const bodyG = new THREE.ExtrudeGeometry(prof, { depth: 1.62, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 5, curveSegments: 20 });
      bodyG.translate(0, 0, -0.81);
      const carRed = paint({ a: '#c8282c', b: '#ef4a3e', c: '#ff9a7a', size: 0.7, roughness: 0.28, metalness: 0.15 });
      add(bodyG, carRed, null, { parent: carBody });
      add(new THREE.SphereGeometry(1, 32, 16), paint({ a: '#1a2c55', b: '#3a5a90', c: '#a8c8ff', size: 0.5, roughness: 0.12 }), [-0.25, 0.86, 0], { parent: carBody, rot: [0, 0, 0.12] }).scale.set(1.05, 0.3, 0.72);
      for (const z of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.05, 0.07, 0.42), basic(glow('#eaf6ff', 6)), [2.2, 0.45, z], { parent: carBody, cast: false });
      add(new THREE.BoxGeometry(0.05, 0.08, 1.5), basic(glow('#ff3040', 4)), [-2.3, 0.66, 0], { parent: carBody, cast: false });
      for (const x of [-1.35, 1.35]) for (const z of [-0.88, 0.88]) add(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 24), paint({ a: '#15161c', b: '#2a2c36', size: 0.4 }), [x, 0.34, z], { parent: carBody, rot: [Math.PI / 2, 0, 0] });
      // 차체 아래 분사구 여섯 개 + 푸른 불꽃
      const jets = [];
      for (const x of [-1.45, 0, 1.45]) for (const z of [-0.5, 0.5]) {
        add(new THREE.TorusGeometry(0.17, 0.06, 8, 20), basic(glow('#7fe8ff', 3)), [x, 0.12, z], { parent: car, rot: [Math.PI / 2, 0, 0], cast: false });
        const f1 = add(new THREE.ConeGeometry(0.16, 1.0, 20, 1, true), basic(glow('#55c8ff', 2.6), { transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }), [x, -0.4, z], { parent: car, rot: [Math.PI, 0, 0], cast: false });
        const f2 = add(new THREE.ConeGeometry(0.09, 0.8, 16, 1, true), basic(glow('#e8fbff', 7), { transparent: true, depthWrite: false, side: THREE.DoubleSide }), [x, -0.3, z], { parent: car, rot: [Math.PI, 0, 0], cast: false });
        jets.push([f1, f2]);
      }
      const jetLight = new THREE.PointLight('#5fd0ff', 0, 10, 1.6); jetLight.position.set(0, -0.2, 0.8); car.add(jetLight);
      const carFill = new THREE.PointLight('#ffd2a8', 0, 30, 1.5); carFill.position.set(4, 4, 6); carSt.add(carFill);   // 앞에서 비추는 따뜻한 빛(빨간 차체가 살게)
      const LT = { fall: [-0.2, 1.0], off: [1.02, 1.35] };
      const carY = (u) => { const k = 1 - Math.pow(1 - K.seg(u, LT.fall[0], LT.fall[1]), 3); let y = K.lerp(4.6, 0, k); if (u > LT.fall[1]) y -= 0.05 * Math.exp(-(u - LT.fall[1]) * 7) * Math.sin((u - LT.fall[1]) * 22); return y; };
      const carSmokeM = paint({ a: '#dfe8f2', b: '#ffffff', c: '#bfe6ff', size: 0.8, emissive: '#3ab8ff', emissiveIntensity: 0 });
      const carPuffs = Array.from({ length: 34 }, (_, i) => {
        const r = K.rng(400 + i), born = LAND0 + 0.45 + i * 0.02, ang = r() * Math.PI * 2;
        const m = add(new THREE.IcosahedronGeometry(1, 2), carSmokeM, null, { parent: carSt, cast: false });
        return { m, born, dir: V(Math.cos(ang), 0, Math.sin(ang)), sp: r.range(2.0, 4.2), rise: r.range(0.05, 0.25), size: r.range(0.2, 0.42) };
      });

      // ================================================================ 5. 미래 도시의 밤
      const city = new THREE.Group(); city.position.set(0, 0, ST[5].z); scene.add(city);
      const winTex = (seed, cols, rows, warm) => K.canvasTex(256, 512, (ctx, w, h) => {
        const r = K.rng(seed); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
        const cw = w / cols, rh = h / rows;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          if (r() < 0.38) continue;
          const c = r() < warm ? ['#ffd28a', '#ffb45e', '#fff0c8'][r.int(0, 2)] : ['#8fe6ff', '#c9f4ff', '#ff9ad8'][r.int(0, 2)];
          ctx.globalAlpha = r.range(0.55, 1); ctx.fillStyle = c; ctx.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.2, cw * 0.64, rh * 0.55);
        }
      }, { repeat: [1, 1] });
      const WINS = [0, 1, 2, 3, 4, 5].map((i) => winTex(40 + i, 4, 12, 0.72));
      const towerMats = WINS.map((tx, i) => paint({ a: ['#1d2550', '#2a2a5e', '#23345e'][i % 3], b: ['#2c3870', '#3a3a78', '#30467a'][i % 3], c: '#5260a8', size: 3, emissiveMap: tx, emissive: '#ffffff', emissiveIntensity: 2.2, roughness: 0.6 }));
      const capM = paint({ a: '#3a4a8a', b: '#5866a8', c: '#8fa0e0', size: 2 });
      const tops = [];
      const r = K.rng(77);
      // 탑: 세 줄. 앞줄은 낮고 듬성듬성, 뒷줄로 갈수록 높고 넓게 퍼진다. 가운데 탑이 그림의 중심
      const TOWERS = [{ x: 0.8, z: -36, h: 31, w: 3.6, d: 3.6, round: true, row: 1, hero: true }];
      const ROWS = [{ z: -18, n: 7, gap: 5.4, h0: 5, h1: 11 }, { z: -32, n: 9, gap: 5.6, h0: 10, h1: 20 }, { z: -48, n: 11, gap: 6.2, h0: 14, h1: 27 }];
      ROWS.forEach((R0, row) => { for (let i = 0; i < R0.n; i++) {
        const x = (i - (R0.n - 1) / 2) * R0.gap + r.range(-1.2, 1.2) + (row % 2) * 2.4, z = R0.z + r.range(-3, 3);
        if (Math.abs(x - 0.8) < 3.5 && row >= 1) continue;   // 가운데 탑 자리
        const h = r.range(R0.h0, R0.h1) * (0.75 + 0.35 * Math.exp(-x * x / 160));
        TOWERS.push({ x, z, h, w: r.range(2.2, 3.4), d: r.range(2.2, 3.2), round: r() < 0.3, row });
      } });
      for (const T of TOWERS) {
        const mat = towerMats[Math.floor(r() * towerMats.length)];
        const g = T.round ? new THREE.CylinderGeometry(T.w / 2, T.w / 2 * 1.08, T.h, 32) : K.roundedBox(T.w, T.h, T.d, 0.3);
        const uv = g.attributes.uv, rx = T.round ? Math.max(2, Math.round(T.w * 3.14 / 3.2)) : Math.max(1, Math.round(T.w / 2.6)), ry = Math.max(1, Math.round(T.h / 9));
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry);
        add(g, mat, [T.x, T.h / 2, T.z], { parent: city });
        add(T.round ? new THREE.CylinderGeometry(T.w / 2 * 0.7, T.w / 2, 0.9, 32) : K.roundedBox(T.w * 0.8, 0.7, T.d * 0.8, 0.2), capM, [T.x, T.h + 0.35, T.z], { parent: city });
        if (T.h > 18) {   // 높은 탑 꼭대기의 첨탑과 깜빡이는 불
          add(new THREE.CylinderGeometry(0.08, 0.16, T.hero ? 6 : 3.4, 8), capM, [T.x, T.h + (T.hero ? 3.6 : 2.3), T.z], { parent: city });
          tops.push(add(new THREE.SphereGeometry(T.hero ? 0.45 : 0.3, 12, 8), basic(glow('#ff5a5a', 4)), [T.x, T.h + (T.hero ? 6.8 : 4.1), T.z], { parent: city, cast: false }));
        }
      }
      // 가운데 탑을 감싼 빛의 고리 두 개(미래 도시의 표지)
      const tallest = TOWERS[0];
      const halos = [0.6, 0.82].map((k, i) => add(new THREE.TorusGeometry(4.0 + i * 1.3, 0.22, 10, 96), basic(glow(i ? '#ff7ad8' : '#6ff0ff', 3.4)), [tallest.x, tallest.h * k, tallest.z], { parent: city, rot: [Math.PI / 2 + 0.2, 0, 0.12 * (i ? -1 : 1)], cast: false }));
      // 물가의 따뜻한 가로등 줄(물에 비친 불빛 줄기가 된다)
      for (let i = 0; i < 26; i++) add(new THREE.SphereGeometry(0.28, 10, 8), basic(glow(i % 3 ? '#ffc070' : '#fff0c0', 3.5)), [-30 + i * 2.4, 0.9, -12.5], { parent: city, cast: false });
      add(K.roundedBox(80, 0.6, 3, 0.1), paint({ a: '#1c2148', b: '#2a2f5e', size: 2 }), [0, 0.3, -13.5], { parent: city });
      // 먼 도시 실루엣 띠(깊이)
      const farTex = K.canvasTex(2048, 512, (ctx, w, h) => {
        const rr = K.rng(9); ctx.clearRect(0, 0, w, h);
        for (let x = 0; x < w;) { const bw = rr.range(30, 90), bh = rr.range(80, 420); ctx.fillStyle = '#2a2f6a'; ctx.fillRect(x, h - bh, bw, bh);
          for (let k = 0; k < bh / 22; k++) if (rr() < 0.4) { ctx.fillStyle = rr() < 0.7 ? '#ffc27a' : '#9fe8ff'; ctx.fillRect(x + rr.range(4, bw - 12), h - bh + k * 22 + 6, 7, 9); }
          x += bw + rr.range(2, 14); }
      });
      add(new THREE.PlaneGeometry(220, 26), basic(glow('#ffffff', 1.0), { map: farTex, transparent: true, depthWrite: false }), [0, 13 - 1, -66], { parent: city, cast: false });
      // 달
      const moon = add(new THREE.CircleGeometry(4.6, 48), basic(glow('#fff1cf', 2.6)), [-11, 31, -150], { parent: city, cast: false });
      // 앞 물: 진짜 거울(불빛이 물에 비친 붓 자국이 된다). 도시 구간에서만 그린다
      const water = K.mirrorFloor(S, { y: 0, size: 260, color: '#0d1638', roughness: 0.18, strength: 0.75, surfaceRoughness: 0.4 });
      water.position.set(0, 0.0, ST[5].z - 20);
      const mirror = S.mirrors[S.mirrors.length - 1];
      // 날아다니는 탈것 불빛
      const cars = Array.from({ length: 9 }, (_, i) => {
        const rr = K.rng(300 + i), m = add(new THREE.CapsuleGeometry(0.22, 0.9, 4, 8), basic(glow(rr() < 0.5 ? '#9ff4ff' : '#ffd27a', 3.2)), null, { parent: city, cast: false });
        m.rotation.z = Math.PI / 2;
        return { m, y: rr.range(7, 22), z: rr.range(-40, -16), x0: rr.range(-30, 30), v: rr.range(3, 6) * (rr() < 0.5 ? -1 : 1) };
      });
      const cityLights = [['#ffb25e', [-8, 6, -10]], ['#6ff0ff', [8, 12, -20]], ['#ff7ad8', [0, 20, -26]]].map(([c, p]) => { const l = new THREE.PointLight(c, 260, 40, 2); l.position.set(...p); city.add(l); return l; });

      const groups = [chip, robotSt, dnaSt, catchSt, carSt, city];

      // ---- 카메라: 정거장 사이를 빠르게 날아간다. 간격 사이에는 아주 천천히 밀려 들어간다
      const E = (t, i) => { const a = ST[i].cut - WHOOSH * 0.45, d = i === ST.length - 2 ? CITY_IN : WHOOSH; return K.seg(t, a, a + d, i === ST.length - 2 ? (u) => 1 - Math.pow(1 - u, 4) : K.ease.inOutQuint); };
      const mixSt = (t, f) => { let v = f(ST[0], 0); for (let i = 0; i < ST.length - 1; i++) v += (f(ST[i + 1], i + 1) - f(ST[i], i)) * E(t, i); return v; };
      const camAt = (t) => {
        const z = mixSt(t, (s) => s.z + s.d - s.v * (t - s.m)) + 2.6 * Math.exp(-t * 3.2);   // 첫 프레임은 칩을 향해 돌진 중
        const y = mixSt(t, (s) => s.cy), x = mixSt(t, (s) => s.cx || 0) + 0.35 * Math.sin(t * 0.9) * (1 - K.smooth(6.8, HOLD, t));
        return [x, y, z];
      };
      const aimAt = (t) => [mixSt(t, (s) => s.ax || 0), mixSt(t, (s) => s.ay), mixSt(t, (s) => s.z) - 1];


      return {
        update(t) {
          const cp = camAt(t), ap = aimAt(t);
          K.look(camera, cp, ap);
          sky.position.copy(camera.position); stars.position.copy(camera.position);
          // 하늘색: 정거장 전환과 같이
          const sk = (k) => { const c = lin(SKY[0][k]); for (let i = 0; i < ST.length - 1; i++) c.lerp(lin(SKY[i + 1][k]), E(t, i)); return c; };
          skyU.uTop.value.copy(sk('top')); skyU.uHor.value.copy(sk('hor')); skyU.uBot.value.copy(sk('bot')); skyU.uGlow.value.copy(sk('glow'));
          skyU.uG.value = mixSt(t, (s, i) => SKY[i].g);
          // 정거장 보이기: 앞 정거장을 날아 지나간 뒤 숨기고, 다음 것은 날아가는 도중에 튀어나온다
          groups.forEach((g, i) => {
            const on = i === 0 ? -1 : ST[i - 1].cut - WHOOSH * 0.6, off = i < ST.length - 1 ? ST[i].cut + 0.32 : 99;
            g.visible = t >= on && t <= off;
            const pop = i === 0 ? K.ease.outBack(K.seg(t, -0.12, 0.3)) : K.ease.outBack(K.seg(t, on, on + 0.42));
            if (i < ST.length - 1) g.scale.setScalar(Math.max(0.001, pop));
          });
          key.target.position.set(0, 0, mixSt(t, (s) => s.z)); key.position.set(-6, 10, key.target.position.z + 7);
          mirror.y = t > ST[4].cut - 0.4 ? 0 : 1e5;   // 도시 구간 밖에서는 거울을 그리지 않는다(렌더 절약)
          water.visible = t > ST[4].cut - 0.4;

          // 1. 칩: 첫 프레임에 빛이 터지고 말풍선이 솟는다
          chipBody.rotation.y = -0.42 + 0.35 * t; chipBody.position.y = -0.55 + 0.06 * Math.sin(t * 3); chipBody.position.x = 0.35;
          const burst = K.seg(t, 0, 0.7, K.ease.out);
          ring.scale.setScalar(1.2 + 3.2 * burst); ring.material.opacity = 1 - burst;
          dieMat.color.copy(glow('#ffffff', 1.5 + 3.5 * Math.exp(-t * 4) + 0.3 * Math.sin(t * 9)));
          chipLight.intensity = 30 + 60 * Math.exp(-t * 3);
          bubbles.forEach((b, i) => {
            const k = K.ease.outBack(K.seg(t, BUBBLES[i], BUBBLES[i] + 0.32)), float = 0.08 * Math.sin(t * 2.6 + i);
            b.m.position.set(b.pos.x * (0.4 + 0.6 * k), -0.3 + (b.pos.y + 0.3) * k + float, b.pos.z);
            b.m.scale.set((i === 1 ? -1 : 1) * b.s * Math.max(0.001, k), b.s * Math.max(0.001, k), 1);
            b.m.lookAt(camera.position);
            if (i === 1) b.m.scale.x = -Math.abs(b.m.scale.x);
          });

          // 2. 로봇: 빛나는 문에서 걸어 나온다
          const wt = Math.max(0, t - WALK.t0), ph = wt * WALK.hz * Math.PI * 2, walking = K.smooth(WALK.t0, WALK.t0 + 0.2, t);
          robot.position.set(0, 0.03 * Math.abs(Math.cos(ph)) * walking, WALK.z0 + WALK.speed * wt);
          legs.forEach((L, i) => { const s = Math.sin(ph + i * Math.PI); L.hip.rotation.x = -0.5 * s * walking; L.knee.rotation.x = 0.75 * Math.max(0, Math.sin(ph + i * Math.PI + 1.2)) * walking; });
          arms.forEach((A2, i) => { const s = Math.sin(ph + i * Math.PI); A2.sh.rotation.x = 0.42 * s * walking; A2.sh.rotation.z = (i ? -1 : 1) * 0.08; A2.el.rotation.x = -0.35 - 0.15 * s; });
          torso.rotation.y = 0.08 * Math.sin(ph); head.rotation.y = 0.15 * Math.sin(t * 1.3) - 0.05;

          // 3. DNA: 빠르게 돈다
          dna.rotation.y = t * 2.1; dna.position.y = 0.9 + 0.1 * Math.sin(t * 2);

          // 4. ★ 로켓 붙잡기
          const u = t - CATCH0, fl = 0.85 + 0.15 * Math.sin(t * 47) * Math.sin(t * 31), burn = 1 - K.smooth(CT.off[0], CT.off[1], u);
          bigRocket.position.y = rocketBottom(u) + 0.35; bigRocket.rotation.z = 0.02 * Math.sin(t * 2.3) * (1 - K.seg(u, 0.8, 1.2));
          const thr = (0.75 + 0.5 * K.smooth(0.3, 0.9, u)) * burn;
          plumeO.scale.set(fl * (0.8 + 0.4 * thr), Math.max(0.01, thr * fl), fl * (0.8 + 0.4 * thr)); plumeI.scale.set(fl, Math.max(0.01, thr * fl), fl);
          plumeO.visible = plumeI.visible = burn > 0.02; plumeLight.intensity = 260 * thr * fl;
          arms2.forEach((A3) => { A3.piv.rotation.y = A3.sz * (-0.075 + 0.62 * armOpen(u)); });
          for (const q of puffs) {
            const age = t - q.born; q.m.visible = age > 0 && catchSt.visible && rocketBottom(q.born - CATCH0) < 12;
            if (!q.m.visible) continue;
            const out = 1 - Math.exp(-1.8 * age);
            q.m.position.set(q.dir.x * q.sp * out, 2.5 + q.rise * age + 0.3 * K.hash(q.born), q.dir.z * q.sp * out * 0.8);
            q.m.scale.setScalar(q.size * (0.3 + 1.5 * Math.pow(Math.min(age, 2), 0.6)));
          }
          smokeM.emissiveIntensity = 0.7 * thr * fl; fill.intensity = catchSt.visible ? 1.6 : 0;

          // 5. ★ 스포츠카 착지
          const v2 = t - LAND0, jet = 1 - K.smooth(LT.off[0], LT.off[1], v2), jf = 0.85 + 0.15 * Math.sin(t * 53) * Math.sin(t * 37);
          car.position.y = carY(v2); car.rotation.y = -1.7 + 0.95 * K.ease.out(K.seg(v2, -0.2, 1.1));
          car.rotation.z = 0.12 * (1 - K.ease.out(K.seg(v2, -0.2, 1.0))); car.rotation.x = 0.04 * Math.sin(t * 5) * jet;
          const near = K.smooth(4.6, 0.3, carY(v2));
          jets.forEach(([f1, f2]) => { const L = Math.max(0.01, jet * jf * (0.7 + 0.5 * near)); f1.scale.set(jf, L, jf); f2.scale.set(jf, L, jf); f1.visible = f2.visible = jet > 0.02; });
          jetLight.intensity = 90 * jet * jf;
          for (const q of carPuffs) {
            const age = t - q.born; q.m.visible = age > 0 && carSt.visible;
            if (!q.m.visible) continue;
            const out = 1 - Math.exp(-2.2 * age);
            q.m.position.set(q.dir.x * q.sp * out, 0.25 + q.rise * age, q.dir.z * q.sp * out);
            { const sc = q.size * (0.4 + 1.4 * Math.pow(Math.min(age, 2), 0.6)); q.m.scale.set(sc, sc * 0.6, sc); }
          }
          carSmokeM.emissiveIntensity = 0.6 * jet; carFill.intensity = carSt.visible ? 70 : 0;
          padLights.forEach((m, i) => m.material.color.copy(glow('#6ff0ff', 1.5 + 2.5 * (0.5 + 0.5 * Math.sin(t * 6 - i * 0.6)))));

          // 5. 도시: 반짝이는 불, 고리, 탈것 — 끝 1초는 거의 멈춘다
          const slow = 1 - 0.85 * K.smooth(HOLD - 0.3, HOLD + 0.4, t), tc = ST[4].cut + (t - ST[4].cut) * slow;
          tops.forEach((m, i) => { m.material.color.copy(glow('#ff5a5a', 1 + 3.5 * (0.5 + 0.5 * Math.sin(t * 3.1 + i * 1.7)))); });
          halos.forEach((h, i) => { h.rotation.z = (i ? -1 : 1) * (0.12 + tc * 0.25); });
          cars.forEach((c) => { const x = ((c.x0 + c.v * tc + 40) % 80 + 80) % 80 - 40; c.m.position.set(x, c.y + 0.4 * Math.sin(tc * 1.3 + c.y), c.z); });
        },
        overlay(ctx, t, W, H) {
          // 3차 피드백: 설명 자막 삭제
        },
      };
    },

    sound(k) {
      // 첫 프레임의 충격 + 칩이 켜지는 반짝임
      k.play('impact', 0.0, { gain: 0.9 });
      k.play('sparkle', 0.02, { n: 8, gain: 1.4 });
      k.tone(0.0, { f: [[0, 220], [0.5, 880]], type: 'triangle', dur: 0.6, gain: 0.06, a: 0.02, verb: 0.4 });
      BUBBLES.forEach((b, i) => k.play('pop', b + 0.06, { f: 900 + i * 220, gain: 0.8, pan: [-0.4, 0.4, 0][i] }));
      // 정거장 사이의 휙
      ST.slice(0, 5).forEach((s, i) => k.play('whoosh', s.cut - WHOOSH * 0.55, { dur: i === 4 ? 0.9 : 0.55, top: 3200, gain: 1.1, pan: [-0.3, 0.3, -0.2, 0.2, 0][i] }));
      // 로봇: 문이 열리는 낮은 울림 + 발소리 + 관절 모터
      k.noise(1.1, { dur: 1.3, color: 'brown', filter: 'lowpass', f: [[0, 120], [0.5, 300], [1.3, 140]], gain: 0.25, a: 0.3 });
      for (const t of STEPS) {
        k.play('thud', t, { f: 150, gain: 0.45 });
        k.tone(t - 0.12, { f: [[0, 340], [0.16, 520]], type: 'sawtooth', dur: 0.18, gain: 0.025, a: 0.03, filter: 'lowpass', f2: 1400 });
      }
      // DNA: 반짝이며 도는 소리
      k.play('sparkle', 2.75, { n: 7, gain: 1.0 });
      k.noise(2.7, { dur: 1.3, color: 'pink', filter: 'bandpass', f: [[0, 800], [0.6, 2400], [1.3, 1200]], q: 3, gain: 0.08, a: 0.4 });
      // ★ 로켓 붙잡기: 내려오는 굉음 → 팔이 닫히며 쇠가 맞물리는 소리 → 불꽃 꺼짐
      k.noise(CATCH0 - 0.25, { dur: 1.6, color: 'brown', filter: 'lowpass', f: [[0, 200], [0.6, 650], [1.6, 260]], gain: 0.6, a: 0.2, hold: 0.9 });
      k.noise(CATCH0 - 0.2, { dur: 1.4, color: 'pink', filter: 'bandpass', f: [[0, 1400], [1.4, 700]], q: 0.6, gain: 0.16, a: 0.3 });
      k.noise(CATCH0 + 0.8, { dur: 0.4, color: 'white', filter: 'highpass', f: [[0, 1800], [0.4, 3800]], gain: 0.06, a: 0.1 });
      k.play('impact', CATCH0 + 1.1, { gain: 0.8 });
      k.play('tock', CATCH0 + 1.1, { f: 340, gain: 0.7 });
      [520, 784, 1170].forEach((f, i) => k.tone(CATCH0 + 1.1, { f, dur: 1.1 - i * 0.2, gain: 0.04, a: 0.003, verb: 0.5 }));
      k.noise(CATCH0 + 1.15, { dur: 0.6, color: 'pink', filter: 'bandpass', f: [[0, 2600], [0.6, 900]], q: 0.8, gain: 0.12, a: 0.02 });
      // ★ 스포츠카 착지: 분사 소리가 내려와 낮아지고, 사뿐한 착지와 연기
      k.tone(LAND0 - 0.2, { f: [[0, 1100], [1.2, 520]], type: 'sawtooth', dur: 1.5, gain: 0.035, a: 0.15, hold: 1.0, filter: 'lowpass', f2: 2400 });
      k.noise(LAND0 - 0.2, { dur: 1.6, color: 'white', filter: 'bandpass', f: [[0, 3000], [1.2, 1600], [1.6, 900]], q: 0.7, gain: 0.12, a: 0.2, hold: 1.0 });
      k.play('thud', LAND0 + 1.0, { f: 110, gain: 0.45 });
      k.noise(LAND0 + 0.9, { dur: 1.0, color: 'pink', filter: 'bandpass', f: [[0, 900], [1.0, 400]], q: 0.6, gain: 0.12, a: 0.05, verb: 0.3 });
      [1.45, 1.62].forEach((d) => k.play('tick', LAND0 + d, { f: 5200, gain: 0.3 }));
      // 도시의 밤: 열리는 듯한 공기 + 반짝임 한 번 + 조용한 바람
      k.noise(6.95, { dur: 2.0, color: 'pink', filter: 'bandpass', f: [[0, 300], [1.0, 900], [2.4, 400]], q: 0.7, gain: 0.07, a: 0.8 });
      k.play('sparkle', 7.4, { n: 6, gain: 0.9 });
      k.tone(7.45, { f: 'E5', dur: 1.5, gain: 0.03, a: 0.05, verb: 0.7 });
    },
  });
}
