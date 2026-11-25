// lang — 장면 9(3마디). low-poly: 천천히 도는 각진 지구본. 박마다 지구 표면에서 인사말 이름표(20개 언어)가 튀어나오고,
// 해가 지구 위를 지나간다. 아래에는 같은 저녁 6시를 나라마다의 표기로 보여 주는 칩 세 개(ko·en·de — 원판과 같은 Intl 표기).
// 자막: p_j1 20개 언어 / p_j2 그 나라 시각 그대로.
(function () {
  const B = ANBU.B, D = 3 * ANBU.BAR, CHIP = 4.5 * B;
  const HI = ['안녕하세요', 'Hello', 'こんにちは', '你好', '哈囉', 'Hallo', 'Bonjour', 'Hola', 'Ciao', 'Hoi', 'Olá', 'Привет', 'مرحبا', 'Merhaba', 'Cześć', 'Xin chào', 'สวัสดี', 'Hej', 'नमस्ते', 'Halo'];
  const FAM = '"Noto Sans", "Noto Sans KR", "Noto Sans JP", "Noto Sans SC", "Noto Sans TC", "Noto Sans Thai", "Noto Sans Devanagari", "Noto Sans Arabic"';
  registerStyle({
    id: 'lang', name: 'Hello in twenty languages', duration: D,
    koText: '20개 언어 그 나라 시각 그대로 오후 6:00',
    render: { samples: 32, shutter: 0.5, tone: 'filmic', exposure: 1.0, bloom: 0.45, bloomThreshold: 1.0, vignette: 0.38, grain: 0.012, fov: 30, near: 0.05, far: 300, background: '#070a1e' },
    async build(S) {
      const { THREE, camera, scene } = S;
      // 다른 문자 글꼴(인사말용) — 쓰는 글자만 미리 불러 둔다
      const fams = ['Noto+Sans', 'Noto+Sans+JP', 'Noto+Sans+SC', 'Noto+Sans+TC', 'Noto+Sans+Thai', 'Noto+Sans+Devanagari', 'Noto+Sans+Arabic'];
      const ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = 'https://fonts.googleapis.com/css2?' + fams.map((f) => `family=${f}:wght@700`).join('&') + '&display=swap';
      document.head.appendChild(ln); await new Promise((ok) => { ln.onload = ok; ln.onerror = ok; });
      await Promise.all(['Noto Sans', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans Thai', 'Noto Sans Devanagari', 'Noto Sans Arabic'].map((f) => document.fonts.load(`700 80px "${f}"`, HI.join(' ')).catch(() => null)));
      K.env(S, { top: '#0a0f2e', horizon: '#1b2560', bottom: '#03040c', intensity: 0.6, blur: 0.05, panels: [{ pos: [-20, 8, 14], size: [8, 8], color: '#fff2d8', power: 6, round: true }] });
      const stars = K.canvasTex(1024, 2048, (c, w, h) => { const g = c.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, h * 0.6); g.addColorStop(0, '#1a2366'); g.addColorStop(1, '#04050f'); c.fillStyle = g; c.fillRect(0, 0, w, h); const r = K.rng(12); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(220,230,255,${0.2 + r() * 0.8})`; const s = r() < 0.05 ? 2.5 : 1.2; c.fillRect(r() * w, r() * h, s, s); } });
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(120, 240), new THREE.MeshBasicMaterial({ map: stars, depthWrite: false })); bg.position.set(0, 0, -60); scene.add(bg);
      // 각진 지구: 이십면체를 쪼개 면마다 바다/땅/눈 색
      const R = 5, geo = new THREE.IcosahedronGeometry(R, 4), n = K.noise(5), pos = geo.attributes.position, col = [];
      for (let i = 0; i < pos.count; i += 3) {
        const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
        const v = n.fbm(cx * 0.35, cy * 0.35, cz * 0.35, 4), lat = Math.abs(cy) / R;
        const c = new THREE.Color(lat > 0.86 ? '#eef3f8' : v > 0.08 ? (v > 0.3 ? '#8a7a4e' : '#4f8a46') : (v > -0.02 ? '#2f7fae' : '#1f5d93'));
        const h = 1;
        for (let k = 0; k < 3; k++) { pos.setXYZ(i + k, pos.getX(i + k) * h, pos.getY(i + k) * h, pos.getZ(i + k) * h); col.push(c.r, c.g, c.b); }
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      const globe = new THREE.Group(); scene.add(globe);
      const earth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75, metalness: 0.0 })); earth.castShadow = earth.receiveShadow = true; globe.add(earth);
      const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(vec3(0.35,0.6,1.4)*f*1.6, f); }' }));
      scene.add(atm);
      // 인사말 이름표: 지구 앞쪽 반구의 정해진 자리에서 튀어나온다
      const RR = K.rng(21), tags = HI.map((w, i) => {
        const tex = K.canvasTex(512, 160, (c, W, H) => { c.fillStyle = 'rgba(255,255,255,0.96)'; c.beginPath(); c.roundRect(6, 6, W - 12, H - 12, 70); c.fill(); c.fillStyle = '#10163f'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 84; c.font = `700 ${fs}px ${FAM}`; while (c.measureText(w).width > W - 70 && fs > 30) { fs -= 4; c.font = `700 ${fs}px ${FAM}`; } c.direction = /[؀-ۿ]/.test(w) ? 'rtl' : 'ltr'; c.fillText(w, W / 2, H / 2 + 4); });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); scene.add(m);
        const th = ((i % 4) - 1.5) * 0.5 - 0.15 + (RR() - 0.5) * 0.12 + (Math.floor(i / 4) % 2) * 0.22, ph = (1.6 - Math.floor(i / 4) * 0.8) * 0.42 + 0.12 + (RR() - 0.5) * 0.08;   // 앞쪽 반구 위 방향
        const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph)).normalize();
        return { m, dir, t0: 0.2 + i * 0.13 };
      });
      const sun = K.sun(S, { pos: [-16, 6, 12], target: [0, 0, 0], color: '#fff0d8', power: 3.2, size: 8, soft: 0.6 });
      K.spot(S, { pos: [14, -2, -10], target: [0, 0, 0], color: '#5b7cff', power: 500, angle: 0.5, penumbra: 1, shadow: false });
      const chips = ['ko-KR', 'en-US', 'de-DE'].map((loc) => new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 1, 18, 0))));
      const items = [
        { k: 'p_j1', at: 0.05, y: 300, size: 124, kind: 'slam', color: '#fff8f0' },
        { k: 'p_j2', at: 2 * B, y: 440, size: 84, kind: 'sl', color: '#7af0d2' },
      ];
      const GY = -0.6, sn = 0.35;
      const cam = ANBU.path([[0, [3.2, 4.4, 15.5]], [2 * B - 0.02, [2.6, 3.8, 17.5]], [2 * B + sn, [3, 2.4, 27], 'snap'], [CHIP - 0.02, [-1.5, 2.0, 42]], [CHIP + sn, [1, 1, 58], 'snap'], [D, [-3, 2, 55]]]);
      const aim = ANBU.path([[0, [0.2, 1.2, 3.2]], [2 * B - 0.02, [0, 1.0, 2.4]], [2 * B + sn, [0, 0.4, 0], 'snap'], [CHIP + sn, [0, 0.2, 0], 'snap'], [D, [0, 0.2, 0]]]);
      const fov = ANBU.path([[0, 40], [2 * B + sn, 32, 'snap'], [CHIP + sn, 30, 'snap'], [D, 30]]);
      return {
        update(t) {
          globe.rotation.set(0.25, 0.1 * t - 0.3, 0); atm.position.set(0, GY, 0); globe.position.set(0, GY, 0);
          // 해가 천천히 돌아간다(빛 방향이 바뀌며 지구 위를 지남)
          const a = -0.9 + 0.5 * K.seg(t, 0, D); sun.position.set(Math.sin(a) * 20, 6, Math.cos(a) * 20);
          for (const tg of tags) {
            const p = t - tg.t0, e = K.spring(p, 2.2, 0.5); tg.m.visible = p > 0;
            const wd = tg.dir.clone().applyEuler(globe.rotation);
            if (wd.z < -0.05) { tg.m.visible = false; continue; }
            tg.m.position.copy(wd.multiplyScalar(R * (1.02 + 0.32 * e))).add(new THREE.Vector3(0, GY, 0));
            tg.m.quaternion.copy(camera.quaternion); tg.m.scale.setScalar(Math.max(0.001, e) * 1.25);
          }
          // 카메라: 지구 표면 바로 위(각진 면과 튀어나오는 이름표 사이)에서 시작 → '그 나라 시각'(박 2)에 크래시 풀아웃 → 칩(박 4.5)에서 한 번 더 물러나 우주에서 본 지구
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, [2 * B, CHIP], 0.06, 8)); K.focus(camera, aim(t), t < 2 * B ? 0.03 : 0.06);
        },
        overlay: KINE.overlay(items, { extra(ctx, t) {
          // 같은 저녁 6시, 나라마다의 표기 — 칩 세 개(남색·코랄·인디고, 원판 색)
          const cols = ['#10163f', '#ff5f7a', '#5b6cff'];
          chips.forEach((s, i) => {
            const p = t - (CHIP + i * 0.4 * B); if (p < 0) return;
            const e = K.spring(p, 2.4, 0.5), x = 540 + (i - 1) * 272, y = 1472 + 60 * (1 - e);
            ctx.save(); ctx.globalAlpha = Math.min(1, p * 6); ctx.translate(x, y); ctx.scale(e, e);
            ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.roundRect(-122, -46, 244, 92, 46); ctx.fill(); ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#fff'; ctx.font = `800 48px "Noto Sans KR"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, 2); ctx.restore();
          });
        } }),
      };
    },
    sound(k) {
      for (let i = 0; i < 20; i++) k.play('pop', 0.2 + i * 0.13, { f: 500 + (i % 5) * 90, gain: 0.45 });
      for (let i = 0; i < 3; i++) k.play('tock', CHIP + i * 0.4 * B, { f: 700 + i * 120, gain: 0.6 });
    },
  });
})();
