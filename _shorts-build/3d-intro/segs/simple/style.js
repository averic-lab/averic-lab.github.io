// simple — 장면 6b(3.5마디). floating-screens: 청록 공간에 떠 있는 화면 카드 세 장 — 설치(내려받기) → 코드 입력(열쇠) → 끝(체크).
// 카드가 박마다 하나씩 깊은 곳에서 앞으로 나와 한 줄로 서고, 카드 사이를 빛 줄이 잇는다. '끝' 카드가 서면 작은 색종이가 터진다.
// 자막: p_g1 초등학생도 / p_g2 금방 쓸 수 있게 (위) · p_g3 최대한 단순하게 (카드 아래). 카드 글자: p_s1·p_s2·p_s3.
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR, CARD = [4, 6, 8].map((n) => n * B), G3 = 10 * B;
  const ICON = {
    down: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    key: 'M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  };
  registerStyle({
    id: 'simple', name: 'Install, code, done', duration: D,
    koText: '초등학생도 금방 쓸 수 있게 최대한 단순하게 설치 코드 입력 끝',
    render: { samples: 32, shutter: 0.55, tone: 'filmic', exposure: 1.0, bloom: 0.35, bloomThreshold: 1.1, vignette: 0.32, grain: 0.01, fov: 28, near: 0.05, far: 200, background: '#0f8f82' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const env = K.env(S, { top: '#7fe6da', horizon: '#18b3a3', bottom: '#06473f', intensity: 0.9, blur: 0.05, panels: [{ pos: [-10, 12, 12], size: [10, 6], color: '#ffffff', power: 5 }, { pos: [12, 2, 8], size: [2, 14], color: '#c8fff6', power: 4 }] });
      const bgT = K.canvasTex(512, 1024, (c, w, h) => { const g = c.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.55, h * 0.7); g.addColorStop(0, '#17a493'); g.addColorStop(0.6, '#0a6a5f'); g.addColorStop(1, '#03302b'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(90, 160), new THREE.MeshBasicMaterial({ map: bgT })); bg.position.set(0, 0, -40); scene.add(bg);
      const cap = KINE.cap, labs = ['p_s1', 'p_s2', 'p_s3'].map(cap), ics = ['down', 'key', 'check'];
      const CW = 3.0, CH = 3.6, GAP = 0.55, X = [-(CW + GAP), 0, CW + GAP];
      const cards = labs.map((lab, i) => {
        const last = i === 2;
        const face = K.canvasTex(600, 720, (c, w, h) => {
          c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h);
          c.fillStyle = last ? '#0f9e8c' : '#10163f'; c.beginPath(); c.arc(w / 2, 280, 170, 0, 7); c.fill();
          c.save(); c.translate(w / 2 - 120, 160); c.scale(10, 10); c.fillStyle = '#ffffff'; c.fill(new Path2D(ICON[ics[i]])); c.restore();
          c.fillStyle = '#10163f'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 96; c.font = `900 ${fs}px "Noto Sans KR"`;
          while (c.measureText(lab).width > w - 60 && fs > 30) { fs -= 4; c.font = `900 ${fs}px "Noto Sans KR"`; }
          c.fillText(lab, w / 2, 590);
          c.fillStyle = 'rgba(16,22,63,0.25)'; c.beginPath(); c.arc(60, 60, 14, 0, 7); c.fill();
          c.fillStyle = 'rgba(16,22,63,0.35)'; c.font = `800 44px "Oswald", "Noto Sans KR"`; c.fillText(String(i + 1), w - 60, 64);
        });
        const g = new THREE.Group(); scene.add(g);
        const slab = new THREE.Mesh(HERO.slab(THREE, CW, CH, 0.32, 0.18, 0.05), new THREE.MeshPhysicalMaterial({ color: '#dff7f2', roughness: 0.2, transmission: 0.3, thickness: 0.3, clearcoat: 1, envMap: env })); slab.castShadow = true; g.add(slab);
        const f = new THREE.Mesh(K.roundedRect(CW - 0.2, CH - 0.2, 0.24, 12), new THREE.MeshStandardMaterial({ map: face, roughness: 0.4, emissive: '#ffffff', emissiveMap: face, emissiveIntensity: 0.02 })); f.position.z = 0.095; g.add(f);
        return { g, last };
      });
      // 카드 사이 빛 줄(화살표 대신 흐르는 빛)
      const links = [0, 1].map((i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(GAP + 0.1, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6c8').multiplyScalar(3) })); m.position.set((X[i] + X[i + 1]) / 2, 0, 0); scene.add(m); return m; });
      // 색종이(끝 카드가 서는 순간)
      const NC = 70, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.5 }), NC);
      const R = K.rng(9), cv = []; const pal = ['#ffd166', '#ff5f7a', '#ffffff', '#5b6cff', '#10163f'];
      for (let i = 0; i < NC; i++) { cv.push([(R() - 0.5) * 2, R() * 1.2 + 0.4, (R() - 0.3) * 1.2, R() * 6, R() * 6]); conf.setColorAt(i, new THREE.Color(pal[i % pal.length])); }
      scene.add(conf);
      K.spot(S, { pos: [-14, 22, 34], target: [0, 0, 0], color: '#ffffff', power: 2600, angle: 0.3, penumbra: 0.9, soft: 0.8 });
      K.spot(S, { pos: [8, -4, 6], target: [0, 0, 0], color: '#7af0d2', power: 400, angle: 0.6, penumbra: 1, shadow: false });
      const s = 0.3, Cx = (i) => X[i];
      const cam = ANBU.path([[0, [-8, 3, 30]], [CARD[0] - 0.05, [-6, 1.6, 22]], [CARD[0] + s, [Cx(0) + 0.5, 0.4, 15], 'snap'], [CARD[1] - 0.05, [Cx(0) + 0.9, 0.4, 15]], [CARD[1] + s, [Cx(1) + 0.5, 0.3, 15], 'snap'],
        [CARD[2] - 0.05, [Cx(1) + 0.9, 0.3, 15]], [CARD[2] + s, [Cx(2) + 0.5, 0.3, 15], 'snap'], [G3 - 0.05, [Cx(2) + 0.8, 0.5, 15.6]], [G3 + s, [1.5, 3.5, 41], 'snap'], [D, [-1.6, 1.2, 38]]]);
      const aim = ANBU.path([[0, [-2, 1.5, -6]], [CARD[0] - 0.05, [-3.4, 1.3, -4]], [CARD[0] + s, [Cx(0), 0.45, 0], 'snap'], [CARD[1] - 0.05, [Cx(0) + 0.3, 0.45, 0]], [CARD[1] + s, [Cx(1), 0.45, 0], 'snap'],
        [CARD[2] - 0.05, [Cx(1) + 0.3, 0.45, 0]], [CARD[2] + s, [Cx(2), 0.45, 0], 'snap'], [G3 - 0.05, [Cx(2), 0.45, 0]], [G3 + s, [0, 1.6, 0], 'snap'], [D, [0, 1.8, 0]]]);
      const fov = ANBU.path([[0, 30], [CARD[0] + s, 28, 'snap'], [G3 + s, 28, 'snap'], [D, 28]]);
      const items = [
        { k: 'p_g1', at: 0.05, y: 300, size: 112, kind: 'slam', color: '#fff8f0' },
        { k: 'p_g2', at: 2 * B, y: 440, size: 88, kind: 'slam', color: '#fff8f0' },
        { k: 'p_g3', at: G3, y: 1390, size: 96, kind: 'slam', color: '#ffd166', strokeColor: 'rgba(16,22,63,0.7)' },
      ];
      return {
        update(t) {
          cards.forEach((c, i) => {
            const p = t - CARD[i], e = K.spring(p, 1.8, 0.55);
            c.g.visible = true;
            c.g.position.set(X[i] * (p < 0 ? 0.6 : 1), 0.12 * Math.sin(t * 1.6 + i) + (p < 0 ? 1.5 + i * 0.8 : 0), p < 0 ? -14 + 4 * p : -14 * (1 - e) + (c.last ? 0.4 * K.spring(t - G3, 2.2, 0.4) : 0));
            c.g.rotation.set(0.12 * Math.sin(t * 1.1 + i * 2), (p < 0 ? -0.5 + 0.3 * Math.sin(t + i) : -0.5 * (1 - e)) + 0.06 * Math.sin(t * 0.9 + i), 0);
            if (c.last && t > G3) c.g.scale.setScalar(1 + 0.06 * K.spring(t - G3, 3, 0.3));
          });
          links.forEach((m, i) => { const k = K.seg(t, CARD[i + 1] + 0.1, CARD[i + 1] + 0.35); m.scale.set(Math.max(0.001, k), 1, 1); m.material.color.setScalar(2 + 1.5 * Math.sin(t * 8 - i)); });
          const cp = t - CARD[2] - 0.15;
          conf.visible = cp > 0;
          for (let i = 0; i < NC; i++) { const v = cv[i], tt = Math.max(0, cp); K.place(conf, i, [X[2] + v[0] * 2.2 * tt * 1.5, 1.0 + v[1] * 4 * tt - 4.9 * tt * tt * 0.6, 0.6 + v[2] * 2 * tt], [v[3] + tt * 6, v[4] + tt * 4, 0], tt > 1.8 ? 0.001 : 1); }
          conf.instanceMatrix.needsUpdate = true;
          // 카메라: 빈 공간 깊은 곳을 보다가 → 카드가 설 때마다 그 카드 앞으로 스냅(왼→오 한 장씩) → '최대한 단순하게'(박 10)에 확 물러나 세 장을 한눈에
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, CARD.concat([G3]), 0.06, 8)); K.focus(camera, aim(t), t < G3 ? 0.05 : 0.08);
        },
        overlay: KINE.overlay(items, { pulse: 0.025 }),
      };
    },
    sound(k) {
      CARD.forEach((a, i) => { k.play('whoosh', a - 0.12, { dur: 0.3, top: 2600, gain: 0.6 }); k.play('pop', a + 0.12, { f: [520, 660, 880][i], gain: 0.9 }); });
      k.play('success', CARD[2] + 0.15, { f: 'C6', gain: 0.6 });
      k.play('stamp', G3, { gain: 0.45 });
    },
  });
})();
