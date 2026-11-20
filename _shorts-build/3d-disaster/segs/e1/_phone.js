// e1 — 책장이 넘어가면 그 뒤 어두운 스튜디오에 보호자의 휴대폰이 서 있다(device-hero).
// 화면은 실제 앱 「Anbu Guardian」 대시보드. 그 앱에서 알림·걸음수·주의·안전 코드 카드가 한 장씩 떠올라
// 화면 밖으로 튀어나와 층층이 자리 잡는다(layer-stack: 위로 떠올라 지나쳤다가 내려앉고, 높이만큼 그림자가 진다).
// 그다음 🚨 긴급 도움 요청 알림이 위에서 떨어지고, 누르면 '🗺️ 위치 보기' 단추가 솟고, 그것을 누르면 하얗게 → e2.
// 3차 피드백(2026-11-20): 자막 없이 장면만으로 이해되게 — 이 장면이 영상의 핵심.
// 4차(2026-11-20): painted 화풍. 책장 넘김은 뺐다 — 팝업북이 책을 덮고 뒤표지의 앱 아이콘이 튀어 올라 사라진 뒤 교차 전환으로 이어진다.
// 이 파일이 원본이다. `python3 _build.py` 가 style.js 로 복사한다(옛 장난감 블록판은 out/e1_v2_toyblocks_*.bak).
{
  const DUR = 12.8;
  const S72 = ANBU.S(), AP = S72.app, RTL = ANBU.RTL(), RX = (x) => (RTL ? -x : x);   // 언어별 화면 문구(앱·서버 번역) / 아랍어는 좌우 반전
  const DEBUG = false;
  const PAL = ANBU.PAL;
  // 폰(세계 단위 1 = 약 2cm). 특정 회사 제품처럼 보이지 않게: 균일한 얇은 베젤, 가운데 작은 펀치홀, 오른쪽 버튼 두 개
  const PW = 4.1, PH = 8.2, PD = 0.42, PR = 0.58;
  const SW = PW - 0.26, SH = PH - 0.26, SR = PR - 0.13;
  const PT = SW / 390, HPT = SH / PT;                        // 화면은 390pt 폭으로 그린다
  const PLH = 1.15, PLW = 6.2, PLD = 3.0;
  const PHY = PLH + PH / 2;
  const FRONT = PD / 2;
  const sx = (pt) => (pt - 195) * PT, sy = (pt) => (HPT / 2 - pt) * PT;   // 화면 pt → 화면 좌표(중심 0)
  const TS = 240;                                            // 카드 글자 그림: 1 세계단위 = 240px

  // ---- 카드 시간표·자리. o = 앱 안의 출발 자리(화면 좌표), f = 떠오른 자리 [x, y, z], s0 = 출발 크기
  const T = { turn: [0, 2.9], sweep: 1.5, push: 2.75, steps: 3.85, caution: 4.95, code: 6.05, sos: 8.0, tap1: 9.75, btn: 10.05, tap2: 11.3, flash: 11.75 };
  const CARDS = {
    push:    { t: T.push,    w: 4.7, h: 1.36, o: [0, sy(-60)],          f: [-0.38, 2.95, 1.35], s0: 0.92, rot: 0.025,  tilt: 0.6 },
    steps:   { t: T.steps,   w: 3.2, h: 2.3,  o: [sx(181), sy(393)],     f: [-1.3, 0.62, 1.0],  s0: 0.86, rot: -0.03, tilt: 0.45 },
    caution: { t: T.caution, w: 3.35, h: 2.62, o: [sx(395), sy(388)],    f: [1.22, -0.74, 1.3], s0: 0.72, rot: 0.03,  tilt: 0.45 },
    code:    { t: T.code,    w: 4.0, h: 1.78, o: [sx(195), sy(628)],     f: [0.78, -2.95, 1.6], s0: 0.7,  rot: -0.02, tilt: 0.5 },
    sos:     { t: T.sos,     w: 4.8, h: 2.4,  o: [0, sy(-80)],           f: [0, 1.15, 2.35],    s0: 0.94, rot: 0,     tilt: 0.7, freq: 1.15 },
    btn:     { t: T.btn,     w: 2.75, h: 0.8, o: [0, 1.15, 2.1],         f: [0, -0.72, 2.5],    s0: 0.6,  rot: 0,     tilt: 0.3 },
  };
  const ORDER = ['push', 'steps', 'caution', 'code', 'sos', 'btn'];
  // painted(4차 피드백, 2026-11-20): 인트로·지도 장면과 같은 물감 필터 두 장(붓질 + 캔버스 결·칠하지 않은 가장자리). 원본 s0/style.js 에서 그대로 복사.
  // 붓 반경은 알림 글자가 읽히도록 s0(8)보다 작게 — BRUSH_R
  const BRUSH_R = 5;
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

  const PUSH_BODY = S72.alias[0] + ' · ' + S72.app.stepsBody;   // 홈페이지 목업과 같은 모양: 별칭 · 걸음수 문장(앱 noti_steps_body)
  const SOS_BODY = S72.alias[1] + ' · ' + S72.srv.emBody;       // 별칭 · 서버 push_emergency_body
  const STEPS7 = [0.44, 0.67, 0.52, 0.8, 0.61, 0.73, 0.96];

  // 카드 하나의 자세(화면 좌표). 위로 떠올라 지나쳤다가 내려앉는다(스프링), 착지 뒤엔 아주 느리게 숨 쉰다
  function pose(name, t) {
    const c = CARDS[name], u = t - c.t;
    if (u < 0) return null;
    const p = K.spring(u, c.freq || 1.35, 0.5);                   // 자리로 가는 움직임(지나쳤다 돌아옴)
    const zl = K.spring(u, 1.05, 0.62);                            // 들림
    const o = c.o, oz = o[2] == null ? 0.012 : o[2];
    const hump = 0.42 * Math.sin(Math.PI * K.clamp(u / 0.75));     // 제자리보다 조금 더 높이 떴다가 내려앉는다
    const bob = K.smooth(0.9, 1.8, u);
    return {
      x: K.lerp(o[0], c.f[0], p) + 0.03 * bob * Math.sin(0.9 * t + c.t),
      y: K.lerp(o[1], c.f[1], p) + 0.04 * bob * Math.sin(0.7 * t + 2 * c.t),
      z: K.lerp(oz, c.f[2], zl) + hump + 0.06 * bob * Math.sin(0.55 * t + c.t * 3),
      rx: c.tilt * (1 - K.ease.out(K.clamp(u / 0.65))) + 0.03 * bob * Math.sin(0.6 * t + c.t),
      ry: 0.035 * bob * Math.sin(0.45 * t + c.t * 1.7),
      rz: c.rot * K.clamp(p) + 0.012 * bob * Math.sin(0.5 * t + c.t),
      s: K.lerp(c.s0, 1, K.clamp(p * 1.15)), u, p,
    };
  }

  registerStyle({
    id: 'e1', duration: DUR,
    fonts: ['900 100px "Noto Sans KR"', '800 100px "Noto Sans KR"', '700 100px "Noto Sans KR"', '600 100px "Noto Sans KR"', '500 100px "Noto Sans KR"'],
    koText: '즉시확인해주세요Anbu Guardian9:41현재2명의안부를확인중입니다.오늘의안부요약안전:1주의:1보호대상자리스트엄마85%✅안전활동량:활동적걸음수6,240지난7일마지막확인:2시간전아빠주의새로운보호대상자추가홈연결알림설정안부지금오늘안부확인완료엄마·오늘6,240보를걸으셨습니다.⚠안전확인이필요합니다지금바로전화안전확인완료SAFETYSHARECODEK7M-4PXR🚨긴급도움요청아빠·보호대상자가직접도움을요청했습니다.🗺️위치보기0123456789',
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.05, bloom: 0.3, bloomThreshold: 1.3, vignette: 0, grain: 0, saturation: 1.12, contrast: 1.05, fov: 20, near: 0.5, far: 180, background: '#10132a' },

    async build(S) {
      const { THREE, scene, camera } = S;
      const iconImg = await ANBU.loadIconImage();
      S.addFilter(BRUSH, { radius: { value: BRUSH_R } });
      S.addFilter(SURFACE, {});

      const rr = (w, h, r) => {
        const s = new THREE.Shape(), x = w / 2, y = h / 2;
        s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
        s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
        return s;
      };
      const slab = (w, h, r, depth, bevel, curve = 20) => {
        const g = new THREE.ExtrudeGeometry(rr(w - 2 * bevel, h - 2 * bevel, Math.max(0.001, r - bevel)), { depth: depth - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: curve });
        g.translate(0, 0, bevel);
        const p = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
        return g;
      };
      const puck = (r, h, b, seg = 48) => new THREE.LatheGeometry([[0, 0], [r, 0], [r, h - b], [r - b, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)), seg).rotateX(Math.PI / 2);
      const mesh = (geo, mat, parent, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m; };

      // ================= 스튜디오: 어두운 방, 금속·유리는 비친 것으로만 모양이 난다
      const studio = K.env(S, { top: '#1a1d40', horizon: '#4a3050', bottom: '#20141c', intensity: 1, blur: 0.004, panels: [
        { pos: [-18.3, 2, 8.1], size: [0.6, 26], color: '#ffd6a0', power: 13 },
        { pos: [-11.8, 2, 16.2], size: [0.25, 26], color: '#ffe4c4', power: 12 },
        { pos: [-20, 2, -1], size: [2, 26], color: '#ffd6a0', power: 7 },
        { pos: [19.5, 2, -3], size: [2.6, 26], color: '#8c8fd6', power: 7 },
        { pos: [-11, 5, -16], size: [2.5, 20], color: '#f1dcc0', power: 5 },
        { pos: [2, 20, 3], size: [18, 7], color: '#ffd6a0', power: 3.5 },
        { pos: [-4.6, 7, -13], size: [0.7, 15], color: '#ffd6a0', power: 16 },
        { pos: [5.0, 7, -13], size: [0.7, 15], color: '#a7a3f0', power: 12 },
        { pos: [0, 13, -11], size: [7, 0.5], color: '#ffe4c4', power: 9 },
      ] });
      // 먼 벽: 가운데에 깊은 남보라 빛이 고인다(앱 보호자 색 인디고의 기운) + 점점이 먼 빛
      // painted: 그림책의 새벽 하늘 — 위는 깊은 남색, 폰 뒤로 보랏빛과 호박색 빛이 번진다 + 붓으로 찍은 별
      const wall = K.canvasTex(1024, 512, (ctx, w, h) => {
        const v = ctx.createLinearGradient(0, 0, 0, h); v.addColorStop(0, '#141a3e'); v.addColorStop(0.45, '#2a2558'); v.addColorStop(0.75, '#4a2f5e'); v.addColorStop(1, '#6a3d4e');
        ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
        const g = ctx.createRadialGradient(w * 0.5, h * 0.66, 0, w * 0.5, h * 0.66, w * 0.3);
        g.addColorStop(0, 'rgba(255,176,92,0.75)'); g.addColorStop(0.35, 'rgba(214,112,96,0.4)'); g.addColorStop(1, 'rgba(120,70,120,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const r = K.rng(31);
        for (let i = 0; i < 160; i++) { const x = r.range(0, w), y = r.range(0, h * 0.6), a = r.range(0.25, 0.8); ctx.fillStyle = `rgba(255,240,210,${a})`; ctx.beginPath(); ctx.arc(x, y, r.range(0.6, 1.8), 0, 7); ctx.fill(); }
      });
      mesh(new THREE.PlaneGeometry(190, 95), new THREE.MeshBasicMaterial({ map: wall }), scene, 0, 24, -46, false);
      K.mirrorFloor(S, { y: 0, color: '#3a2433', roughness: 0.35, surfaceRoughness: 0.5, strength: 0.3, fresnel: true, resolution: 0.5, material: { envMap: studio, envMapIntensity: 0.1 } });
      // 따뜻한 주광 하나(위·앞·왼쪽) — 떠오른 카드의 그림자를 아래오른쪽으로 떨군다 / 옆에서 옅은 남보라 보조광
      const key = K.spot(S, { pos: [-9, PHY + 16, 22], target: [0, PHY, 0], color: PAL.lamp, power: 1500, angle: 0.3, penumbra: 0.85, soft: 1.3, mapSize: 2048, near: 5, far: 70 });
      K.spot(S, { pos: [16, PHY + 2, 6], target: [0, PHY, 0], color: '#9a9ce8', power: 90, angle: 0.5, penumbra: 1, shadow: false });
      const stone = new THREE.MeshStandardMaterial({ color: '#4a2e3a', roughness: 0.55, metalness: 0.1, envMap: studio, envMapIntensity: 0.5 });
      mesh(K.roundedBox(PLW, PLH, PLD, 0.06, 4), stone, scene, 0, PLH / 2, 0);

      // ================= 폰
      const phone = new THREE.Group(); phone.position.set(0, PHY, 0); scene.add(phone);
      const metal = new THREE.MeshStandardMaterial({ color: '#a8a39b', roughness: 0.24, metalness: 1 });
      const blackGlass = new THREE.MeshPhysicalMaterial({ color: '#020203', roughness: 0.05, metalness: 0, ior: 1.6 });
      const backGlass = new THREE.MeshPhysicalMaterial({ color: '#2b2d31', roughness: 0.38, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.25 });
      mesh(slab(PW, PH, PR, PD, 0.08, 40), metal, phone, 0, 0, -PD / 2);
      mesh(K.roundedRect(PW - 0.12, PH - 0.12, PR - 0.06, 16), blackGlass, phone, 0, 0, PD / 2 + 0.0008);
      const back = mesh(K.roundedRect(PW - 0.12, PH - 0.12, PR - 0.06, 16), backGlass, phone, 0, 0, -PD / 2 - 0.0008); back.rotation.y = Math.PI;
      mesh(K.roundedBox(0.07, 1.25, 0.14, 0.03, 3), metal, phone, PW / 2 + 0.012, 1.55, 0);
      mesh(K.roundedBox(0.07, 0.62, 0.14, 0.03, 3), metal, phone, PW / 2 + 0.012, 0.35, 0);
      const pcam = new THREE.Group(); pcam.position.set(-1.25, PH / 2 - 1.0, -PD / 2); pcam.rotation.y = Math.PI; phone.add(pcam);
      mesh(slab(0.62, 1.45, 0.3, 0.06, 0.02), backGlass, pcam);
      [0.33, -0.33].forEach((y) => mesh(puck(0.22, 0.08, 0.02), metal, pcam, 0, y, 0.06));

      // ---- 화면: 실제 앱 보호자 대시보드(홈페이지 목업과 같은 값)
      const dashTex = K.canvasTex(Math.round(390 * 3.2), Math.round(HPT * 3.2), (c) => { c.scale(3.2, 3.2); paintDash(c); });
      const gui = new THREE.Group(); gui.position.z = FRONT + 0.0016; phone.add(gui);
      const screenMat = new THREE.MeshStandardMaterial({ map: dashTex, emissiveMap: dashTex, emissive: '#ffffff', color: '#ffffff', roughness: 0.85, envMap: studio, envMapIntensity: 0.25 });
      const screen = mesh(K.roundedRect(SW, SH, SR, 16), screenMat, gui); screen.castShadow = false;
      const GLASS_Z = 0.014;
      const glass = mesh(K.roundedRect(SW, SH, SR, 16), new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.045, ior: 1.6, envMap: studio, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), gui, 0, 0, GLASS_Z, false);
      glass.renderOrder = 10;
      // 띠 조명이 유리를 스쳐 지나가는 빛(폰이 돌아설 때 한 번)
      const sweepTex = K.canvasTex(512, 8, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0.42, 'rgba(255,224,190,0)'); g.addColorStop(0.5, 'rgba(255,240,220,1)'); g.addColorStop(0.58, 'rgba(255,224,190,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
      sweepTex.wrapS = THREE.ClampToEdgeWrapping;
      const sweepMat = new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
      const sweep = mesh(K.roundedRect(SW, SH, SR, 16), sweepMat, gui, 0, 0, GLASS_Z + 0.002, false); sweep.renderOrder = 11; sweep.rotation.z = -0.5;
      const setScreen = (b) => { screenMat.emissive.setScalar(0.66 * b); screenMat.color.setScalar(0.4); };

      // ================= 카드: 두께 있는 흰 카드 스톡. 글자는 캔버스, 단추·아이콘·막대는 진짜로 솟은 조각
      const cardMat = (tex, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.6, color: '#c8c8c8', roughness: 0.7, envMap: studio, envMapIntensity: 0.25 }, o));
      // 캔버스는 세계단위로 그리되(c.scale(TS)) 글자만은 실제 px 크기로 찍는다 — 0.3px 같은 작은 글꼴은 이모지 폭이 틀어져 뒤 글자와 겹친다
      const worldText = (c) => {
        const proto = CanvasRenderingContext2D.prototype, fd = Object.getOwnPropertyDescriptor(proto, 'font'), ld = Object.getOwnPropertyDescriptor(proto, 'letterSpacing');
        let cur = '10px sans-serif', ls = '0px';
        Object.defineProperty(c, 'font', { configurable: true, get: () => cur, set: (v) => { cur = v; fd.set.call(c, v.replace(/([\d.]+)px/, (m, n) => (n * TS) + 'px')); } });
        Object.defineProperty(c, 'letterSpacing', { configurable: true, get: () => ls, set: (v) => { ls = v; ld.set.call(c, (parseFloat(v) * TS) + 'px'); } });
        c.fillText = (str, x, y) => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); let X = x * TS; if (RTL) { X = c.canvas.width - X; const al = c.textAlign; c.textAlign = al === 'left' ? 'right' : al === 'right' ? 'left' : al; } proto.fillText.call(c, str, X, y * TS); c.restore(); };
        c.measureText = (str) => ({ width: proto.measureText.call(c, str).width / TS });
        return c;
      };
      const tex = (w, h, draw) => K.canvasTex(Math.round(w * TS), Math.round(h * TS), (c) => { if (RTL) { c.translate(Math.round(w * TS), 0); c.scale(-1, 1); } c.scale(TS, TS); draw(worldText(c)); });
      const fitFont = (c, s, wt, size, maxW) => { c.font = `${wt} ${size}px "Noto Sans KR"`; const m = c.measureText(s).width; if (m > maxW) c.font = `${wt} ${size * maxW / m}px "Noto Sans KR"`; };
      // 캔버스는 세계단위로 그린다(c.scale(TS)) — 글꼴 크기도 세계단위
      const head = (c, w, timeTxt = '지금') => {
        c.drawImage(iconImg, 0.26, 0.16, 0.32, 0.32);
        c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = '600 0.2px "Noto Sans KR"'; c.fillStyle = '#757575'; c.fillText('안부', 0.68, 0.33);
        c.textAlign = 'right'; c.fillStyle = '#9AA0AE'; c.fillText(timeTxt, w - 0.28, 0.33);
      };
      const cards = {};
      const group = (name, depth, r, faceTex, opts) => {
        const c = CARDS[name], g = new THREE.Group(); g.rotation.order = 'ZXY'; gui.add(g);
        const m = mesh(slab(c.w, c.h, r, depth, Math.min(0.018, depth / 3)), cardMat(faceTex, opts), g);
        g.visible = false; cards[name] = { g, m, depth, mats: [m.material], base: [m.material.emissiveIntensity] };
        return cards[name];
      };
      const addPart = (card, geo, mat, x, y, z) => { const p = mesh(geo, mat, card.g, x, y, card.depth + z); card.mats.push(mat); card.base.push(mat.emissiveIntensity || 0); return p; };
      const iconTex = K.canvasTex(256, 256, (c) => c.drawImage(iconImg, 0, 0, 256, 256));
      const iconMat = () => new THREE.MeshStandardMaterial({ map: iconTex, emissiveMap: iconTex, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.45, envMap: studio, envMapIntensity: 0.3 });

      // 1) 안부 알림
      {
        const c = CARDS.push;
        const t1 = tex(c.w, c.h, (x) => {
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.w, c.h);
          x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = '600 0.2px "Noto Sans KR"'; x.fillStyle = '#757575'; x.fillText(S72.brand, 0.68, 0.33);
          x.textAlign = 'right'; x.fillStyle = '#9AA0AE'; x.fillText(S72.now, c.w - 0.28, 0.33);
          x.textAlign = 'left'; fitFont(x, S72.srv.autoTitle, 800, 0.37, c.w - 0.5); x.fillStyle = '#1A1C1C'; x.fillText(S72.srv.autoTitle, 0.26, 0.73);
          fitFont(x, PUSH_BODY, 500, 0.28, c.w - 0.5); x.fillStyle = '#3F4948'; x.fillText(PUSH_BODY, 0.26, 1.1);
        });
        const k = group('push', 0.06, 0.22, t1);
        addPart(k, slab(0.32, 0.32, 0.075, 0.04, 0.01), iconMat(), RX(-c.w / 2 + 0.42), c.h / 2 - 0.33, 0);
      }
      // 2) 걸음수 카드 — 숫자가 굴러 올라가고 막대가 솟는다
      const stepsTex = (() => {
        const c = CARDS.steps, t = K.canvasTex(Math.round(c.w * TS), Math.round(c.h * TS), null);
        const x = worldText(t.ctx);
        t.paint = (n) => {
          if (RTL) x.setTransform(-TS, 0, 0, TS, Math.round(c.w * TS), 0); else x.setTransform(TS, 0, 0, TS, 0, 0);
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.w, c.h);
          x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.font = '700 0.25px "Noto Sans KR"'; x.fillStyle = '#757575'; x.fillText(AP.steps, 0.26, 0.5);
          x.textAlign = 'right'; x.font = '800 0.52px "Noto Sans KR"'; x.fillStyle = '#1A237E'; x.fillText(ANBU.num(n), c.w - 0.24, 0.56);
          x.fillStyle = '#EEF0F6'; x.fillRect(0.26, 1.98, c.w - 0.52, 0.012);   // 바닥선
          x.textAlign = 'right'; x.font = '500 0.2px "Noto Sans KR"'; x.fillStyle = '#757575'; x.fillText(AP.last7, c.w - 0.24, 2.18);
          t.needsUpdate = true;
        };
        t.paint(0); t.key = 0; return t;
      })();
      const bars = [];
      {
        const c = CARDS.steps, k = group('steps', 0.06, 0.2, stepsTex);
        const x0 = -c.w / 2 + 0.3, x1 = c.w / 2 - 0.3, n = 7, gap = 0.11, bw = (x1 - x0 - gap * (n - 1)) / n, base = c.h / 2 - 1.98, top = 1.12;
        STEPS7.forEach((v, i) => {
          const mat = new THREE.MeshStandardMaterial({ color: i === 6 ? '#FB8C00' : '#3b4296', emissive: i === 6 ? '#FB8C00' : '#2a3190', emissiveIntensity: i === 6 ? 0.55 : 0.35, roughness: 0.5, envMap: studio, envMapIntensity: 0.3 });
          const geo = new THREE.BoxGeometry(bw, 1, 0.07); geo.translate(0, 0.5, 0.035);
          const b = addPart(k, geo, mat, x0 + bw / 2 + i * (bw + gap), base, 0); b.userData.h = v * top; b.scale.y = 0.001; bars.push(b);
        });
      }
      // 3) 주의 카드 — 아빠, 안전 확인이 필요합니다 / 솟은 단추 둘
      {
        const c = CARDS.caution;
        const t3 = tex(c.w, c.h, (x) => {
          x.fillStyle = '#FFF8DA'; x.fillRect(0, 0, c.w, c.h);
          x.fillStyle = '#F59E0B'; x.fillRect(0, 0, 0.09, c.h);
          x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = '800 0.31px "Noto Sans KR"'; x.fillStyle = '#1A1C1C'; x.fillText(S72.alias[1], 0.3, 0.38);
          x.font = '700 0.21px "Noto Sans KR"'; const pw = x.measureText(AP.pillCaution).width + 0.3;
          x.fillStyle = 'rgba(245,158,11,0.18)'; x.beginPath(); x.roundRect(c.w - 0.26 - pw, 0.22, pw, 0.34, 0.17); x.fill();
          x.fillStyle = '#C77700'; x.textAlign = 'center'; x.fillText(AP.pillCaution, c.w - 0.26 - pw / 2, 0.395);
          x.textAlign = 'left'; fitFont(x, '⚠ ' + AP.safetyNeeded, 800, 0.29, c.w - 0.55); x.fillStyle = '#C77700'; x.fillText('⚠ ' + AP.safetyNeeded, 0.3, 0.9);
        });
        const k = group('caution', 0.06, 0.2, t3);
        const bw = c.w - 0.6;
        const b1 = tex(bw, 0.56, (x) => { x.fillStyle = '#F59E0B'; x.fillRect(0, 0, bw, 0.56); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 0.26px "Noto Sans KR"'; x.fillStyle = '#ffffff'; fitFont(x, AP.callNow, 700, 0.26, bw - 0.25); x.fillText(AP.callNow, bw / 2, 0.29); });
        const b2 = tex(bw, 0.52, (x) => { x.fillStyle = '#FFF8DA'; x.fillRect(0, 0, bw, 0.52); x.strokeStyle = 'rgba(245,158,11,0.55)'; x.lineWidth = 0.025; x.beginPath(); x.roundRect(0.02, 0.02, bw - 0.04, 0.48, 0.13); x.stroke(); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 0.25px "Noto Sans KR"'; x.fillStyle = '#D98400'; fitFont(x, AP.confirmSafety, 700, 0.25, bw - 0.25); x.fillText(AP.confirmSafety, bw / 2, 0.27); });
        addPart(k, slab(bw, 0.56, 0.13, 0.05, 0.012), cardMat(b1, { emissiveIntensity: 0.62 }), 0.03, c.h / 2 - 1.5, 0);
        addPart(k, slab(bw, 0.52, 0.13, 0.03, 0.01), cardMat(b2, { emissiveIntensity: 0.58 }), 0.03, c.h / 2 - 2.12, 0);
      }
      // 4) 안전 코드 카드 — 진한 파랑 그라데이션, 큰 코드, 솟은 동그란 단추 둘
      {
        const c = CARDS.code;
        const t4 = tex(c.w, c.h, (x) => {
          const g = x.createLinearGradient(0, 0, c.w, c.h); g.addColorStop(0, '#123C63'); g.addColorStop(1, '#1D6FA5'); x.fillStyle = g; x.fillRect(0, 0, c.w, c.h);
          x.fillStyle = 'rgba(255,255,255,0.07)'; x.beginPath(); x.arc(c.w - 0.25, 0.05, 0.75, 0, 7); x.fill();
          x.fillStyle = 'rgba(255,255,255,0.05)'; x.beginPath(); x.arc(c.w - 1.3, c.h + 0.15, 0.68, 0, 7); x.fill();
          x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = '700 0.17px "Noto Sans KR"'; x.letterSpacing = '0.025px'; x.fillStyle = 'rgba(255,255,255,0.78)'; x.fillText('SAFETY SHARE CODE', 0.3, 0.42); x.letterSpacing = '0px';
          x.letterSpacing = '0.03px'; fitFont(x, 'K7M-4PXR', 800, 0.74, c.w - 0.6); x.fillStyle = '#ffffff'; x.fillText('K7M-4PXR', 0.28, 1.2); x.letterSpacing = '0px';
        });
        const k = group('code', 0.07, 0.2, t4, { emissiveIntensity: 0.7, color: '#d0d0d0' });
        const btnTex = (copy) => K.canvasTex(256, 256, (x) => {
          x.fillStyle = '#3a6f9c'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#ffffff'; x.translate(128, 128); x.scale(4.2, 4.2); x.translate(-12, -12);
          x.fill(new Path2D(copy ? 'M9 3h9a2 2 0 0 1 2 2v9h-2V5H9zM5 7h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z' : 'M17 7a2.6 2.6 0 1 0-2.5-3.2L9.3 6.6a2.6 2.6 0 1 0 0 4.3l5.2 2.6a2.6 2.6 0 1 0 .8-1.6L10.1 9.3a2.6 2.6 0 0 0 0-1.1l5.2-2.6c.45.27.98.42 1.7.4z'));
        });
        [[true, RX(c.w / 2 - 1.05)], [false, RX(c.w / 2 - 0.5)]].forEach(([cp, x]) => {
          const m = addPart(k, new THREE.CylinderGeometry(0.2, 0.2, 0.05, 40).rotateX(Math.PI / 2).translate(0, 0, 0.025), new THREE.MeshStandardMaterial({ map: btnTex(cp), emissiveMap: btnTex(cp), emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.5, envMap: studio, envMapIntensity: 0.3 }), x, c.h / 2 - 0.42, 0);
          m.geometry.attributes.uv && fixDiscUV(m.geometry);
        });
      }
      // 5) 긴급 도움 요청 — 붉은 테두리가 숨 쉰다
      {
        const c = CARDS.sos;
        const t5 = tex(c.w, c.h, (x) => {
          x.fillStyle = '#FFF4F3'; x.fillRect(0, 0, c.w, c.h);
          x.strokeStyle = '#E5484D'; x.lineWidth = 0.07; x.beginPath(); x.roundRect(0.035, 0.035, c.w - 0.07, c.h - 0.07, 0.2); x.stroke();
          x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = '600 0.2px "Noto Sans KR"'; x.fillStyle = '#757575'; x.fillText(S72.brand, 0.68, 0.36);
          x.textAlign = 'right'; x.fillStyle = '#9AA0AE'; x.fillText(S72.now, c.w - 0.3, 0.36);
          x.textAlign = 'left'; fitFont(x, S72.srv.emTitle, 900, 0.42, c.w - 0.55); x.fillStyle = '#C62828'; x.fillText(S72.srv.emTitle, 0.28, 0.83);
          // 본문 = 별칭 · 서버 push_emergency_body 그대로. 세 줄 안에 들어가게 낱말 단위로 나누고, 안 들어가면 글자를 줄인다
          x.fillStyle = '#3F4948'; let fs = 0.29, rows;
          for (;;) { x.font = `600 ${fs}px "Noto Sans KR"`; rows = ANBU.wrap(x, SOS_BODY, c.w - 0.55); if (rows.length <= 3 || fs <= 0.21) break; fs -= 0.01; }
          rows.slice(0, 3).forEach((r, i) => x.fillText(r, 0.28, 1.28 + 0.36 * i * (fs / 0.29)));
        });
        const k = group('sos', 0.07, 0.22, t5, { emissiveIntensity: 0.62 });
        addPart(k, slab(0.32, 0.32, 0.075, 0.04, 0.01), iconMat(), RX(-c.w / 2 + 0.44), c.h / 2 - 0.36, 0);
      }
      // 6) 위치 보기 단추
      {
        const c = CARDS.btn;
        const t6 = tex(c.w, c.h, (x) => { x.fillStyle = '#4355B9'; x.fillRect(0, 0, c.w, c.h); x.textAlign = 'center'; x.textBaseline = 'middle'; fitFont(x, AP.viewLoc, 800, 0.36, c.w - 0.4); x.fillStyle = '#ffffff'; x.fillText(AP.viewLoc, c.w / 2, c.h / 2 + 0.02); });
        group('btn', 0.14, 0.24, t6, { emissiveIntensity: 0.72, color: '#cccccc' });
      }
      function fixDiscUV(g) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.4 + 0.5, p.getY(i) / 0.4 + 0.5); uv.needsUpdate = true; }

      // 긴급 카드 뒤 붉은 번짐 + 붉은 빛(주변 카드와 화면을 물들인다)
      const haloTex = K.canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
      const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, color: new THREE.Color('#ff3b30'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
      const halo = mesh(new THREE.PlaneGeometry(1, 1), haloMat, gui, 0, 0, 0, false); halo.renderOrder = 4;
      const redLight = new THREE.PointLight('#ff3b30', 0, 0, 2); redLight.castShadow = false; gui.add(redLight);
      // 카드가 떠오를 때마다 번지는 작은 빛(그 자리에서 앱이 내뱉는 느낌)
      const pops = ORDER.map(() => { const m = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: haloTex, color: new THREE.Color('#ffe0b8'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), gui, 0, 0, 0.03, false); m.renderOrder = 12; return m; });

      // ================= 분위기: 위에서 비스듬히 내려오는 빛줄기, 그 안과 화면 앞에서만 빛나는 먼지, 화면 불빛, 먼 빛망울
      const BO = new THREE.Vector3(-5.5, PHY + 17, -4.5), BT = new THREE.Vector3(0.6, PHY - 1.5, 0.6);
      K.spot(S, { pos: BO.toArray(), target: [0, PHY + 1.5, 0], color: PAL.lamp, power: 220, angle: 0.2, penumbra: 1, shadow: false });
      const bAx = BT.clone().sub(BO), bLen = bAx.length(); bAx.normalize();
      const R0 = 0.35, R1 = 4.0;
      const beamGeo = new THREE.CylinderGeometry(R0, R1, bLen, 48, 1, true); beamGeo.translate(0, -bLen / 2, 0);
      const beamMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { col: { value: new THREE.Color(PAL.lamp) }, k: { value: 0.05 } },
        vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vS; void main(){ vS = 1.0 - uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 col; uniform float k; varying vec3 vN; varying vec3 vV; varying float vS; void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float a = pow(f, 2.2) * smoothstep(0.0, 0.2, vS) * (1.0 - smoothstep(0.4, 1.0, vS)); gl_FragColor = vec4(col * a * k, 1.0); }',
      });
      const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.copy(BO); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bAx); beam.renderOrder = 5; scene.add(beam);
      const glow = new THREE.PointLight('#e8e6ff', 0, 0, 2); glow.position.set(0, 0.5, FRONT + 1.7); glow.castShadow = false; phone.add(glow);
      const ND = 260, DB = { x: [-6.5, 6.5], y: [PLH + 0.3, PHY + 9.5], z: [-3.5, 6.5] };
      const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), ND);
      dust.instanceMatrix.setUsage(THREE.DynamicDrawUsage); dust.frustumCulled = false; dust.renderOrder = 6; scene.add(dust);
      const dd = Array.from({ length: ND }, (_, i) => ({ x: K.hash(i, 1.1), y: K.hash(i, 2.3), z: K.hash(i, 3.7), s: 0.018 + 0.03 * K.hash(i, 4.1) ** 2, ph: 6.283 * K.hash(i, 5.9), sp: 0.03 + 0.07 * K.hash(i, 6.2) }));
      const _c = new THREE.Color(), _p = new THREE.Vector3(), lampC = new THREE.Color('#ffcf94'), scrC = new THREE.Color('#e4e6ff'), redC = new THREE.Color('#ff5a4e');
      for (let i = 0; i < ND; i++) dust.setColorAt(i, _c.setRGB(0, 0, 0));
      const atmos = (t, sb, red, rotY) => {
        beamMat.uniforms.k.value = 0.05 * (1 - 0.4 * red);
        glow.intensity = 1.6 * sb;
        const H = DB.y[1] - DB.y[0], cr = Math.cos(rotY), sr = Math.sin(rotY);
        for (let i = 0; i < ND; i++) {
          const d = dd[i];
          const x = K.lerp(DB.x[0], DB.x[1], d.x) + 0.35 * Math.sin(0.21 * t + d.ph);
          const yy = (((d.y - d.sp * t / H * 3) % 1) + 1) % 1;
          const y = DB.y[0] + H * yy + 0.12 * Math.sin(0.37 * t + 2 * d.ph);
          const z = K.lerp(DB.z[0], DB.z[1], d.z) + 0.3 * Math.sin(0.17 * t + 3 * d.ph);
          _p.set(x, y, z).sub(BO);
          const s = _p.dot(bAx), r = Math.sqrt(Math.max(0, _p.lengthSq() - s * s)), u = s / bLen, R = R0 + (R1 - R0) * u;
          const inBeam = (1 - K.smooth(0.45 * R, R, r)) * K.smooth(0.08, 0.25, u) * (1 - K.smooth(0.55, 1.05, u));
          const lx = x * cr - z * sr, lz = x * sr + z * cr, ly = y - PHY;
          const scr = lz > FRONT ? K.smooth(0.6, 1.6, lz - FRONT) * Math.exp(-(lz - FRONT) / 2.4) * (1 - K.smooth(SW / 2, SW / 2 + 1.8, Math.abs(lx))) * (1 - K.smooth(SH / 2, SH / 2 + 1.8, Math.abs(ly))) : 0;
          const tw = 0.75 + 0.25 * Math.sin(1.3 * t + 5 * d.ph);
          const kb = 1.25 * inBeam * tw, ks = 2.0 * scr * sb * tw * (1 - red), kr = 2.6 * scr * red * tw;
          _c.setRGB(lampC.r * kb + scrC.r * ks + redC.r * kr, lampC.g * kb + scrC.g * ks + redC.g * kr, lampC.b * kb + scrC.b * ks + redC.b * kr);
          dust.setColorAt(i, _c);
          K.place(dust, i, [x, y, z], null, d.s);
        }
        dust.instanceMatrix.needsUpdate = true; dust.instanceColor.needsUpdate = true;
      };
      const orbTex = K.canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
      [[-8, 15, '#ffb86a', 3.2, 0.2], [7.5, 19, '#a9a6ff', 2.6, 0.18], [-4.5, 23, '#9db6de', 2.2, 0.12], [9, 8.5, '#ffb02e', 3.6, 0.12], [-9.5, 5, '#8e8af0', 2.4, 0.12], [3.5, 26, '#ffcf94', 2.8, 0.12]].forEach(([x, y, col, sz, k]) => {
        const m = mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ map: orbTex, color: new THREE.Color(col).multiplyScalar(k * 2.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), scene, x, y, -36, false);
        m.renderOrder = 1;
      });

      // ================= 움직임
      const turn = K.track([[0, -0.78], [T.turn[1], -0.16, 'inOut'], [T.sos, -0.2], [DUR, -0.06, 'inOut']]);
      const _v = new THREE.Vector3();
      const world = (name) => cards[name].g.getWorldPosition(_v).clone();
      const touch1 = { x: 0, y: 0 }, touch2 = { x: 0, y: 0 };
      const proj = (p, out) => { const v = p.clone().project(camera); out.x = (v.x + 1) / 2 * 1080; out.y = (1 - v.y) / 2 * 1920; return out; };
      // 카메라: 낮게 비스듬히 시작 → 폰이 돌아서는 동안 정면으로 다가간다 → 카드가 떠오르는 동안 아주 천천히 호를 그린다
      //         → 긴급 알림에 다가가고, 끝에 '위치 보기'로 밀고 들어간다
      const camBase = (t) => {
        const a = K.ease.inOut(K.seg(t, 0, 3.2));
        const az = K.lerp(0.42, 0.1, a) - 0.034 * K.seg(t, 3.2, 8.0) * 6;   // 0.10 → -0.10
        const el = K.lerp(-0.07, 0.02, a);
        const d = K.lerp(50, 40.5, a) - 1.0 * K.seg(t, 3.2, 8.0, K.ease.inOut);
        return { az, el, d, aim: [-0.25, PHY + 0.05, 0.9] };
      };
      const self = {
        update(t) {
          phone.rotation.y = turn(t);
          const red = K.seg(t, T.sos + 0.2, T.sos + 0.9) * (1 - K.seg(t, T.flash - 0.2, T.flash + 0.3));
          setScreen(1.05 - 0.4 * red);
          atmos(t, 1.05 - 0.4 * red, red, phone.rotation.y);
          // 띠 조명이 유리를 스친다
          const sw = K.seg(t, T.sweep, T.sweep + 1.1, K.ease.inOut);
          sweepTex.offset.x = K.lerp(0.6, -0.6, sw); sweepMat.opacity = sw > 0 && sw < 1 ? 0.32 : 0;
          // 카드
          ORDER.forEach((name, i) => {
            const k = cards[name], st = pose(name, t);
            k.g.visible = !!st;
            const pp = pops[i];
            if (!st) { pp.material.opacity = 0; return; }
            let dz = 0, dimK = 0;
            // 긴급 알림이 오면 나머지 카드는 뒤로 물러나 어두워진다
            if (name !== 'sos' && name !== 'btn') { const back = K.seg(t, T.sos, T.sos + 0.8, K.ease.inOut); dz = -0.45 * back * (st.z / 1.6); dimK = 0.45 * back; }
            if (name === 'sos') { const tap = Math.exp(-Math.pow((t - T.tap1 - 0.06) * 7, 2)); dz = -0.28 * tap; }
            if (name === 'btn') { const tap = Math.exp(-Math.pow((t - T.tap2 - 0.06) * 7, 2)); dz = -0.1 * tap; }
            k.g.position.set(st.x, st.y, st.z + dz);
            k.g.rotation.set(st.rx, st.ry, st.rz);
            k.g.scale.set(st.s, st.s, st.s * K.clamp(st.u / 0.25, 0.05, 1));
            k.mats.forEach((m, j) => { if (m.emissiveIntensity != null) m.emissiveIntensity = k.base[j] * (1 - dimK); if (m.color && j === 0) m.color.setScalar((name === 'code' ? 0.82 : 0.78) * (1 - 0.5 * dimK)); });
            // 떠오르는 순간 앱 화면 그 자리에서 빛이 한 번 번진다
            const pk = Math.exp(-st.u * 5) * K.clamp(st.u / 0.05);
            pp.position.set(CARDS[name].o[0], CARDS[name].o[1], 0.03); pp.scale.setScalar(2.5 + 3 * st.u); pp.material.opacity = 0.55 * pk;
          });
          // 걸음수: 숫자가 굴러 올라가고 막대가 차례로 솟는다
          {
            const st = pose('steps', t), u = st ? st.u : 0;
            const n = Math.round(6240 * K.ease.out(K.seg(u, 0.25, 1.2)) / 10) * 10;
            if (stepsTex.key !== n) { stepsTex.key = n; stepsTex.paint(n); }
            bars.forEach((b, i) => { const g = K.spring(u - 0.25 - 0.07 * i, 1.7, 0.55); b.scale.y = Math.max(0.001, b.userData.h * g); });
          }
          // 긴급: 붉은 숨
          const sosSt = pose('sos', t);
          if (sosSt) {
            const pulse = 0.5 + 0.5 * Math.sin((t - T.sos) * 5.6), on = K.seg(t, T.sos + 0.2, T.sos + 0.8);
            const tap = Math.exp(-Math.pow((t - T.tap1 - 0.08) * 6, 2));
            const sm = cards.sos.mats[0]; sm.emissiveIntensity = (0.62 + 0.25 * on * pulse + 0.4 * tap) * (1 - 0.3 * K.seg(t, T.btn, T.btn + 0.6));
            halo.position.set(sosSt.x, sosSt.y, Math.max(0.04, sosSt.z - 0.1)); halo.scale.set(7.2 + 0.8 * pulse, 4.8 + 0.5 * pulse, 1);
            haloMat.opacity = on * (0.22 + 0.2 * pulse) + 0.3 * tap;
            redLight.position.set(sosSt.x, sosSt.y - 0.4, sosSt.z + 2.4); redLight.intensity = on * (2 + 3 * pulse) + 5 * tap;
          } else { haloMat.opacity = 0; redLight.intensity = 0; }
          // 카메라
          const cb = camBase(t);
          let aim = cb.aim.slice(), d = cb.d;
          const toSos = K.seg(t, T.sos + 0.1, T.sos + 1.7, K.ease.inOut);
          phone.updateMatrixWorld(true);
          const sosW = new THREE.Vector3(CARDS.sos.f[0], CARDS.sos.f[1], CARDS.sos.f[2]).applyMatrix4(gui.matrixWorld);
          const btnW = new THREE.Vector3(CARDS.btn.f[0], CARDS.btn.f[1], CARDS.btn.f[2]).applyMatrix4(gui.matrixWorld);
          const mid = sosW.clone().lerp(btnW, 0.45);
          aim = [K.lerp(aim[0], mid.x - 0.1, 0.6 * toSos), K.lerp(aim[1], mid.y, 0.8 * toSos), K.lerp(aim[2], mid.z, 0.5 * toSos)];
          d -= 5.0 * toSos;
          const push = K.seg(t, T.tap2 - 0.35, T.flash + 0.9, K.ease.in);
          aim = [K.lerp(aim[0], btnW.x, push), K.lerp(aim[1], btnW.y, push), K.lerp(aim[2], btnW.z, push)];
          d -= 20 * push;
          const pos = [aim[0] + d * Math.sin(cb.az) * Math.cos(cb.el), aim[1] + d * Math.sin(cb.el), aim[2] + d * Math.cos(cb.az) * Math.cos(cb.el)];
          K.look(camera, pos, aim);
          K.focus(camera, [0, PHY + 0.3, FRONT + K.lerp(1.0, 2.3, toSos)], 0.12);
          camera.updateMatrixWorld();
          if (sosSt) proj(world('sos'), touch1);
          if (pose('btn', t)) proj(world('btn'), touch2);
        },
        overlay(ctx, t, W, H) {
          ring(ctx, t, touch1, T.tap1); ring(ctx, t, touch2, T.tap2);
          const fl = K.seg(t, T.flash, T.flash + 0.6, K.ease.in);
          if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
          if (DEBUG) { ctx.save(); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(130, 154, 820, 1382); ctx.restore(); }
        },
      };

      // ---- 화면 UI(보호자 대시보드). 390pt 폭. 값은 홈페이지 목업(style.css)과 앱 위젯을 따른다
      function paintDash(c) {
        c.fillStyle = '#F7F9F8'; c.fillRect(0, 0, 390, HPT);
        if (RTL) { c.translate(390, 0); c.scale(-1, 1); }   // 아랍어: 화면 전체를 좌우 반전(글자는 T_ 가 바로 세워 찍는다)
        // 글자: maxW(pt)를 넘으면 글꼴을 줄인다
        const T_ = (s, x, y, f, col, al = 'left', maxW = 0) => {
          c.font = f; c.fillStyle = col;
          if (maxW) { const w = c.measureText(s).width; if (w > maxW) c.font = f.replace(/([\d.]+)px/, (m, n) => (n * maxW / w) + 'px'); }
          if (RTL) { c.save(); c.translate(x, y); c.scale(-1, 1); c.textAlign = al === 'left' ? 'right' : al === 'right' ? 'left' : al; c.fillText(s, 0, 0); c.restore(); }
          else { c.textAlign = al; c.fillText(s, x, y); }
        };
        c.textBaseline = 'middle';
        T_('9:41', 34, 25, '600 15px "Noto Sans KR"', '#1A1C1C');
        c.beginPath(); c.arc(195, 24, 7.5, 0, 7); c.fillStyle = '#050608'; c.fill();
        c.fillStyle = '#1A1C1C'; [0, 1, 2, 3].forEach((i) => { c.beginPath(); c.roundRect(300 + i * 6, 30 - i * 3, 4, 5 + i * 3, 1); c.fill(); });
        c.beginPath(); c.roundRect(330, 19, 26, 12, 3.5); c.lineWidth = 1.4; c.strokeStyle = '#1A1C1C'; c.stroke(); c.beginPath(); c.roundRect(332.5, 21.5, 17, 7, 2); c.fill();
        T_(AP.title, 195, 64, '700 19px "Noto Sans KR"', '#1A1C1C', 'center', 300);
        { const [h1, h2 = ''] = AP.checking.split('\n'); T_(h1, 22, 110, '700 25.5px "Noto Sans KR"', '#1A1C1C', 'left', 346); T_(h2, 22, 144, '700 25.5px "Noto Sans KR"', '#1A1C1C', 'left', 346); }
        T_(AP.summary, 22, 180, '500 13.5px "Noto Sans KR"', '#757575');
        c.fillStyle = '#00685E'; c.beginPath(); c.arc(27, 204, 4.6, 0, 7); c.fill(); T_(AP.legendSafe, 36, 204, '600 13.5px "Noto Sans KR"', '#3F4948', 'left', 52);
        c.fillStyle = '#F59E0B'; c.beginPath(); c.arc(97, 204, 4.6, 0, 7); c.fill(); T_(AP.legendCaution, 106, 204, '600 13.5px "Noto Sans KR"', '#3F4948', 'left', 80);
        T_(AP.list, 22, 238, '700 16.5px "Noto Sans KR"', '#1A1C1C', 'left', 346);
        // 대상자 카드 1(엄마, 안전)
        const card = (x, w, bg, bd) => { c.save(); c.beginPath(); c.roundRect(x, 256, w, 276, 18); c.clip(); c.fillStyle = bg; c.fillRect(x, 256, w, 276); c.fillStyle = bd; c.fillRect(x, 256, 4.5, 276); c.restore(); };
        card(20, 322, '#EEF6EF', '#00685E');
        c.font = '700 18px "Noto Sans KR"'; const mw = Math.min(150, c.measureText(S72.alias[0]).width); T_(S72.alias[0], 40, 284, '700 18px "Noto Sans KR"', '#1A1C1C', 'left', 150); T_(S72.battery, 40 + mw + 8, 285, '600 12px "Noto Sans KR"', '#2E7D32');
        c.font = '600 12px "Noto Sans KR"'; const pw = Math.min(110, c.measureText(AP.pillSafe).width) + 18;
        c.fillStyle = 'rgba(0,104,94,0.12)'; c.beginPath(); c.roundRect(326 - pw, 273, pw, 22, 11); c.fill(); T_(AP.pillSafe, 326 - pw / 2, 284.5, '600 12px "Noto Sans KR"', '#00685E', 'center', 110);
        T_(AP.activity, 40, 309, '400 13.5px "Noto Sans KR"', '#3F4948');
        // 걸음수 그래프(흐린 유리 아래) — 떠오른 카드의 원래 자리
        c.save(); c.beginPath(); c.roundRect(36, 324, 290, 150, 14); c.clip(); c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillRect(36, 324, 290, 150);
        c.filter = 'blur(7px)';
        T_(AP.steps, 50, 346, '700 12px "Noto Sans KR"', '#757575', 'left', 150); T_(S72.steps, 312, 346, '800 20px "Noto Sans KR"', '#1A237E', 'right');
        STEPS7.forEach((v, i) => { c.fillStyle = i === 6 ? '#FB8C00' : 'rgba(26,35,126,0.7)'; const h = 72 * v; c.fillRect(54 + i * 37.5, 440 - h, 26, h); });
        c.filter = 'none'; c.fillStyle = 'rgba(247,249,248,0.35)'; c.fillRect(36, 324, 290, 150); c.restore();
        T_(AP.last7, 312, 460, '400 11px "Noto Sans KR"', '#9e9e9e', 'right');
        T_(AP.lastCheck, 40, 506, '400 13px "Noto Sans KR"', '#757575', 'left', 290);
        // 대상자 카드 2(아빠, 주의) — 오른쪽에 살짝 보인다
        card(351, 322, '#FFF7D6', '#F59E0B');
        T_(S72.alias[1], 371, 284, '700 18px "Noto Sans KR"', '#1A1C1C');
        c.save(); c.beginPath(); c.roundRect(366, 324, 290, 150, 14); c.clip(); c.filter = 'blur(6px)'; c.fillStyle = '#F59E0B'; c.fillRect(366, 380, 290, 30); c.fillStyle = 'rgba(245,158,11,0.35)'; c.fillRect(366, 420, 290, 28); c.restore();
        // 쪽 표시
        c.fillStyle = '#4355B9'; c.beginPath(); c.roundRect(181, 549, 20, 6, 3); c.fill(); c.fillStyle = 'rgba(67,85,185,0.2)'; c.beginPath(); c.arc(209, 552, 3, 0, 7); c.fill();
        // 새 대상자 추가
        c.save(); c.setLineDash([6, 5]); c.strokeStyle = 'rgba(117,117,117,0.55)'; c.lineWidth = 1.6; c.beginPath(); c.roundRect(20, 572, 350, 126, 16); c.stroke(); c.restore();
        c.fillStyle = '#EFF1F0'; c.beginPath(); c.arc(195, 616, 21, 0, 7); c.fill(); T_('+', 195, 615, '400 24px "Noto Sans KR"', '#3F4948', 'center');
        T_(AP.add, 195, 664, '500 14.5px "Noto Sans KR"', '#3F4948', 'center', 320);
        // 아래 탭
        c.fillStyle = '#ffffff'; c.fillRect(0, HPT - 78, 390, 78); c.fillStyle = '#E8EAF0'; c.fillRect(0, HPT - 78, 390, 1.2);
        const icons = ['M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z', 'M9.5 14.5 14.5 9.5M11 7 13 5a4 4 0 0 1 6 6l-2 2M13 17l-2 2a4 4 0 0 1-6-6l2-2', 'M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.5 20a2 2 0 0 0 3 0', null];
        AP.nav.forEach((s, i) => {
          const cx = 48.75 + 97.5 * i, col = i === 0 ? '#4355B9' : '#9AA0AE';
          c.save(); c.translate(cx - 10, HPT - 64); c.scale(20 / 24, 20 / 24); c.strokeStyle = c.fillStyle = col; c.lineWidth = 2.2; c.lineCap = c.lineJoin = 'round';
          if (i === 0) c.fill(new Path2D(icons[0])); else if (icons[i]) c.stroke(new Path2D(icons[i])); else { c.beginPath(); c.arc(12, 12, 3.4, 0, 7); c.stroke(); for (let a = 0; a < 8; a++) { const q = a * Math.PI / 4; c.beginPath(); c.moveTo(12 + 6.5 * Math.cos(q), 12 + 6.5 * Math.sin(q)); c.lineTo(12 + 9 * Math.cos(q), 12 + 9 * Math.sin(q)); c.stroke(); } }
          c.restore();
          T_(s, cx, HPT - 30, '600 12px "Noto Sans KR"', col, 'center', 90);
        });
      }

      function ring(ctx, t, p, a) {
        const b = a + 0.75, u = (t - a) / (b - a); if (u < 0 || u > 1) return;
        const e = 1 - Math.pow(1 - u, 3), fade = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
        ctx.save(); ctx.globalAlpha = Math.max(0, fade) * 0.95;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 46 + 120 * e); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.5, 'rgba(255,240,215,0.3)'); g.addColorStop(1, 'rgba(255,240,215,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 46 + 120 * e, 0, 7); ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(p.x, p.y, 20 + 100 * e, 0, 7); ctx.stroke();
        const dotA = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.3; if (dotA > 0) { ctx.globalAlpha = dotA; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, 26 * (1 - 0.25 * Math.sin(Math.min(1, u * 4) * 3.14)), 0, 7); ctx.fill(); }
        ctx.restore();
      }

      // 위치 점검(렌더 로그): 카드 네 모서리의 화면 픽셀 → 안전 영역(x 130–950, y 154–1536) 안인지
      const corners = (name) => {
        const c = CARDS[name], g = cards[name].g; g.updateMatrixWorld(true);
        const ps = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj(new THREE.Vector3(a * c.w / 2, b * c.h / 2, cards[name].depth).applyMatrix4(g.matrixWorld), {}));
        return `${name} x ${Math.round(Math.min(...ps.map((p) => p.x)))}..${Math.round(Math.max(...ps.map((p) => p.x)))} y ${Math.round(Math.min(...ps.map((p) => p.y)))}..${Math.round(Math.max(...ps.map((p) => p.y)))} px/u ${Math.round((Math.max(...ps.map((p) => p.x)) - Math.min(...ps.map((p) => p.x))) / c.w)}`;
      };
      for (const t of [7.6, 9.6, 10.9]) { self.update(t); console.warn(`[e1 t=${t}] ` + ORDER.filter((n) => pose(n, t)).map(corners).join(' | ')); }
      return self;
    },

    sound(k) {
      // 폰이 돌아서며 유리를 스치는 빛 → 카드마다 '톡' 떠오름 + 맑은 음(올라가는 화음) → 긴급: 낮은 쿵 + 경보음 두 번
      k.play('paper', 0.2, { gain: 0.6, dur: 0.9 }); k.play('swish', 0.55, { gain: 0.3, dur: 0.7 });
      k.play('swish', T.sweep, { gain: 0.22, dur: 0.9, pan: -0.2 }); k.play('whoosh', 0.9, { gain: 0.2, dur: 1.8, top: 1200 });
      const notes = { push: 'E6', steps: 'G5', caution: 'C6', code: 'E6' };
      ['push', 'steps', 'caution', 'code'].forEach((n, i) => {
        const t0 = CARDS[n].t, pan = CARDS[n].f[0] > 0.3 ? 0.25 : CARDS[n].f[0] < -0.3 ? -0.25 : 0;
        k.play('whoosh', t0 - 0.05, { gain: 0.16, dur: 0.3, top: 2400, pan });
        k.play('pop', t0 + 0.02, { gain: 0.5, f: 700 + 60 * i, pan });
        k.play('blip', t0 + 0.04, { gain: 0.3, f: ['C6', 'E5', 'A5', 'G5'][i], type: 'sine', dur: 0.12, pan });
        k.play('tock', t0 + 0.55, { gain: 0.22, f: 480 + 40 * i, pan });
        if (n === 'push') k.play('ding', t0 + 0.05, { gain: 0.6, f: notes.push });
        if (n === 'caution') k.play('ding', t0 + 0.05, { gain: 0.35, f: 'A5' });
      });
      // 걸음수 숫자 굴러가는 소리(작은 틱)
      for (let i = 0; i < 9; i++) k.play('tick', CARDS.steps.t + 0.3 + i * 0.09, { gain: 0.12, f: 2600 + 90 * i, pan: -0.25 });
      const s = T.sos;
      k.play('whoosh', s - 0.15, { gain: 0.4, dur: 0.45, top: 1800 });
      k.play('thud', s + 0.25, { gain: 0.5, f: 70 }); k.play('impact', s + 0.22, { gain: 0.28 });
      k.play('ding', s + 0.3, { gain: 0.42, f: 'B5' }); k.play('ding', s + 0.52, { gain: 0.38, f: 'B5' }); k.play('ding', s + 1.15, { gain: 0.26, f: 'B5' });
      k.play('tick', T.tap1, { gain: 0.6, f: 2800 }); k.play('tock', T.tap1 + 0.01, { gain: 0.3, f: 520 });
      k.play('whoosh', T.btn - 0.05, { gain: 0.22, dur: 0.3, top: 2200 }); k.play('pop', T.btn + 0.05, { gain: 0.5, f: 820 });
      k.play('tick', T.tap2, { gain: 0.6, f: 3000 }); k.play('tock', T.tap2 + 0.01, { gain: 0.3, f: 620 });
      k.play('riser', T.flash - 0.3, { gain: 0.5, dur: 0.9 }); k.play('whoosh', T.flash, { gain: 0.5, dur: 0.7, top: 3200 }); k.play('sparkle', T.flash + 0.3, { gain: 0.3, n: 4 });
    },
  });
}
