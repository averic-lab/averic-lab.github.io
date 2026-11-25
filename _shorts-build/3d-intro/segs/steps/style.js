// steps — 장면 8(3마디). data-skyline: 7일 걸음수가 빌딩 7동으로 솟는다(원판 값 그대로 5,800 / 6,420 / 5,100 / 7,260 / 6,840 / 5,530 / 8,420).
// 마지막(오늘) 동만 주황색 유리 + 불 켜진 창. 박 반 개마다 한 동씩 솟고, 오늘 동이 다 서면 숫자가 8,420까지 세어진다.
// 카메라는 거리 높이에서 출발해 크레인으로 올라가며 스카이라인을 내려다본다.
// 자막: p_i1 걸음 수로 보는 / p_i2 오늘 하루 + 숫자(2D) + 아래 '걸음수'(앱 문구).
(function () {
  const B = ANBU.B, D = 3 * ANBU.BAR, WEEK = [5800, 6420, 5100, 7260, 6840, 5530, 8420], GROW = 0.6, NUM = 4 * B;
  registerStyle({
    id: 'steps', name: 'Seven-day skyline', duration: D,
    koText: '걸음 수로 보는 오늘 하루 걸음수 0123456789,',
    render: { samples: 32, shutter: 0.55, tone: 'filmic', exposure: 1.0, bloom: 0.5, bloomThreshold: 1.0, vignette: 0.36, grain: 0.012, fov: 30, near: 0.05, far: 300, background: '#0f1537' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const env = K.env(S, { top: '#141c4a', horizon: '#3a3f7a', bottom: '#080a18', intensity: 0.9, blur: 0.04, panels: [{ pos: [-20, 14, 10], size: [12, 4], color: '#ffd2a8', power: 4 }, { pos: [18, 10, -10], size: [3, 12], color: '#7f9cff', power: 4 }] });
      // 하늘(저녁 노을 끝 + 별)
      const sky = K.canvasTex(512, 1024, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1030'); g.addColorStop(0.6, '#262c66'); g.addColorStop(0.85, '#7a4a6e'); g.addColorStop(1, '#e08a6a'); c.fillStyle = g; c.fillRect(0, 0, w, h); const r = K.rng(2); for (let i = 0; i < 200; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.7})`; c.fillRect(r() * w, r() * h * 0.5, 1.5, 1.5); } });
      const skyM = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ map: sky, depthWrite: false })); skyM.position.set(0, 30, -80); scene.add(skyM);
      // 바닥: 도로와 블록(어두운 아스팔트, 노란 차선)
      const groundT = K.canvasTex(1024, 1024, (c, w, h) => { c.fillStyle = '#15171f'; c.fillRect(0, 0, w, h); c.fillStyle = '#23262f'; c.fillRect(w * 0.08, h * 0.25, w * 0.84, h * 0.5); c.fillStyle = '#d9c27a'; for (let x = 0; x < w; x += 70) c.fillRect(x, h * 0.86, 36, 6); c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 30; i++) c.fillRect(w * 0.08 + i * 28, h * 0.22, 14, h * 0.02); });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: groundT, roughness: 0.6, metalness: 0.1, envMap: env, envMapIntensity: 0.4 }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      // 빌딩 7동 — 높이는 걸음수에 비례(8,420 → 14)
      const winT = (lit) => K.canvasTex(256, 1024, (c, w, h) => {
        c.fillStyle = lit ? '#3a2410' : '#0e1830'; c.fillRect(0, 0, w, h); const r = K.rng(lit ? 5 : 3);
        for (let y = 14; y < h; y += 34) for (let x = 14; x < w; x += 40) { const on = lit ? r() < 0.75 : r() < 0.25; c.fillStyle = on ? (lit ? '#ffd08a' : '#9fb8ff') : (lit ? '#5a3a1a' : '#16223f'); c.globalAlpha = on ? 0.95 : 1; c.fillRect(x, y, 24, 20); }
        c.globalAlpha = 1; c.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < w; x += 40) c.fillRect(x, 0, 4, h);
      });
      const tDark = winT(false), tLit = winT(true);
      const TW = 1.9, GAPX = 0.42, HMAX = 14, towers = WEEK.map((v, i) => {
        const last = i === 6, h = v / 8420 * HMAX;
        const tex = (last ? tLit : tDark).clone(); tex.needsUpdate = true; tex.repeat.set(1, h / 10); tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshPhysicalMaterial({ color: last ? '#ff9a4a' : '#5f7bd8', map: tex, emissive: last ? '#ffffff' : '#ffffff', emissiveMap: tex, emissiveIntensity: last ? 1.3 : 0.55, roughness: 0.15, metalness: 0.3, clearcoat: 1, envMap: env });
        const g = new THREE.Group(); g.position.set((i - 3) * (TW + GAPX), 0, (i % 2) * -0.6); scene.add(g);
        const m = new THREE.Mesh(K.roundedBox(TW, 1, TW, 0.08, 3), mat); m.castShadow = m.receiveShadow = true; g.add(m);
        const cap = new THREE.Mesh(K.roundedBox(TW + 0.1, 0.18, TW + 0.1, 0.05, 2), new THREE.MeshStandardMaterial({ color: last ? '#ffd166' : '#c9d2ff', roughness: 0.3, metalness: 0.8, emissive: last ? '#ff8a3d' : '#000000', emissiveIntensity: last ? 1 : 0 })); g.add(cap);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(last ? '#ffb040' : '#ff4a5a').multiplyScalar(4) })); g.add(beacon);
        return { g, m, cap, beacon, h, last, t0: i * 0.5 * B };
      });
      const glow = new THREE.PointLight('#ff9a4a', 0, 14, 1.6); scene.add(glow);
      K.sun(S, { pos: [-14, 12, 16], target: [0, 4, 0], color: '#ffd2a8', power: 1.6, size: 16, soft: 1.0 });
      K.skyLight(S, { color: '#5e6bb8', power: 0.6, size: 16, center: [0, 4, 0] });
      K.spot(S, { pos: [14, 10, -12], target: [0, 6, 0], color: '#8fa0ff', power: 900, angle: 0.5, penumbra: 1, shadow: false });
      const TX = (6 - 3) * (TW + GAPX), sn = 0.35;
      const cam = ANBU.path([[0, [-11, 0.8, 15]], [NUM - 0.05, [0.5, 1.0, 14]], [NUM + sn, [TX + 4.6, 17.2, 11.5], 'snap'], [8 * B - 0.05, [TX - 4.2, 17.8, 11.5]], [8 * B + sn, [9, 12.5, 62], 'snap'], [D, [2.5, 13, 56]]]);
      const aim = ANBU.path([[0, [-5, 5.5, 0]], [NUM - 0.05, [3, 8.5, 0]], [NUM + sn, [TX, 14.6, 0], 'snap'], [8 * B - 0.05, [TX, 14.4, 0]], [8 * B + sn, [1.3, 10.2, 0], 'snap'], [D, [1.3, 9.8, 0]]]);
      const fov = ANBU.path([[0, 38], [NUM - 0.05, 40], [NUM + sn, 32, 'snap'], [8 * B + sn, 30, 'snap'], [D, 30]]);
      let numTxt = '';
      const items = [
        { k: 'p_i1', at: 0.05, y: 290, size: 92, kind: 'slam', color: '#fff8f0' },
        { k: 'p_i2', at: 1 * B, y: 420, size: 116, kind: 'slam', color: '#ffd166' },
        { text: ANBU.S().stepsLabel, at: 0.5 * B, y: 1500, size: 46, kind: 'fade', color: '#aab4e6', weight: 700, stroke: false },
      ];
      return {
        update(t) {
          for (const tw of towers) {
            const e = K.ease.outBack(K.seg(t, tw.t0, tw.t0 + GROW)), h = Math.max(0.02, tw.h * e);
            tw.m.scale.y = h; tw.m.position.y = h / 2; tw.cap.position.y = h + 0.09; tw.beacon.position.y = h + 0.3;
            tw.g.visible = t >= tw.t0;
            tw.beacon.material.color.setScalar(((t * 2 + tw.t0) % 1) < 0.5 ? (tw.last ? 4 : 2.5) : 0.4);
          }
          const last = towers[6]; glow.position.set(last.g.position.x, last.h * 0.6, 3); glow.intensity = 40 * K.seg(t, last.t0, last.t0 + GROW);
          numTxt = ANBU.num(Math.round(8420 * K.ease.out(K.seg(t, NUM, NUM + 1.4 * B))));
          // 카메라: 거리 높이에서 솟는 빌딩들 사이를 올려다보며 옆으로 달림 → 숫자(박 4)에 오늘 동 꼭대기로 크레인 업 → 꼭대기를 돌다가 → 박 8 에 확 물러나 스카이라인 전체
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, [NUM, 8 * B], 0.07, 8)); K.focus(camera, aim(t), t < 8 * B ? 0.05 : 0.12);
        },
        overlay: KINE.overlay(items, { extra(ctx, t) {
          // 숫자: 오늘 동이 다 선 뒤 세어진다(오늘 동 색)
          if (t < NUM) return;
          KINE.item(ctx, t, { text: numTxt, at: NUM, y: 665, size: 104, kind: 'pop', color: '#ffb25a', glow: 'rgba(255,150,60,0.55)' });
        } }),
      };
    },
    sound(k) {
      for (let i = 0; i < 7; i++) k.play('pop', i * 0.5 * B, { f: 420 + i * 60, gain: 0.7 });
      for (let i = 0; i < 14; i++) k.play('count', 4 * B + i * 0.05, { gain: 0.5 });
      k.play('ding', 4 * B + 1.4 * B, { f: 'G6', gain: 0.4 });
    },
  });
})();
