// complex — 장면 6a(2.5마디). toy-blocks: 노란 스튜디오 위 나무 블록 탑. 블록마다 원판의 메뉴 이름
// (p_m1 고급 설정 · p_m2 알림 세부 · p_m3 연동 · p_m4 권한 · p_m5 옵션 · p_m6 테마)이 찍혀 있다.
// 박마다 블록이 하나씩 옆으로 쏙 빠져 떨어지고(젠가), 마지막에 남은 탑이 통째로 무너진다.
// 자막: p_f1 복잡한 설정 ✕ / p_f2 불필요한 기능 ✕ (✕ 는 원판처럼 빨간색).
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR;
  const PULL = [4, 6, 8, 10].map((n) => n * B), TOPPLE = 12 * B;
  registerStyle({
    id: 'complex', name: 'Menu tower collapses', duration: D,
    koText: '복잡한 설정 불필요한 기능 ✕ 고급 설정 알림 세부 연동 권한 옵션 테마',
    render: { samples: 32, shutter: 0.6, tone: 'filmic', exposure: 1.0, bloom: 0.2, bloomThreshold: 1.3, vignette: 0.3, grain: 0.01, fov: 28, near: 0.05, far: 200, background: '#f2b93c', saturation: 1.05 },
    async build(S) {
      const { THREE, camera, scene } = S;
      const env = K.env(S, { top: '#ffe2a0', horizon: '#ffd166', bottom: '#d8a23a', intensity: 0.8, blur: 0.08, panels: [{ pos: [-10, 12, 10], size: [8, 8], color: '#fff6e0', power: 4 }, { pos: [12, 6, 4], size: [4, 10], color: '#ffe0b0', power: 3 }] });
      // 노란 무한 배경(바닥과 벽이 곡면으로 이어짐)
      const cyc = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.MeshStandardMaterial({ color: '#f5bd45', roughness: 0.9 }));
      cyc.rotation.x = -Math.PI / 2; cyc.receiveShadow = true; scene.add(cyc);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshStandardMaterial({ color: '#f7c656', roughness: 0.95 })); back.position.set(0, 30, -20); scene.add(back);
      const cap = KINE.cap;
      const labels = ['p_m1', 'p_m2', 'p_m3', 'p_m4', 'p_m5', 'p_m6'].map(cap);
      const colors = ['#10163f', '#ff5f7a', '#5b6cff', '#14b8a6', '#ff8a3d', '#d7263d'];
      const BW = 4.2, BH = 1.05, BD = 1.9;
      const woodT = K.canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#d8b07a'; c.fillRect(0, 0, w, h); const n = K.noise(3); for (let y = 0; y < h; y++) { const v = n.n2(y * 0.05, 0.3) * 0.5 + 0.5; c.fillStyle = `rgba(120,80,40,${0.1 + v * 0.18})`; c.fillRect(0, y, w, 1); } });
      const blocks = labels.map((lab, i) => {
        const face = K.canvasTex(840, 210, (c, w, h) => {
          c.fillStyle = colors[i]; c.fillRect(0, 0, w, h);
          c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, 0, w, 14);
          c.fillStyle = '#fff8f0'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 112; c.font = `900 ${fs}px "Noto Sans KR"`;
          while (c.measureText(lab).width > w - 90 && fs > 30) { fs -= 4; c.font = `900 ${fs}px "Noto Sans KR"`; }
          c.fillText(lab, w / 2, h / 2 + 6);
          // 오른쪽 끝 토글 스위치 모양(설정 메뉴임을 알 수 있게)
        });
        const side = new THREE.MeshStandardMaterial({ map: woodT, roughness: 0.75 });
        const front = new THREE.MeshStandardMaterial({ map: face, roughness: 0.55 });
        const m = new THREE.Mesh(K.roundedBox(BW, BH, BD, 0.1, 4), [side, side, side, side, front, side]);
        m.castShadow = m.receiveShadow = true; scene.add(m);
        return { m, i, y0: BH / 2 + i * (BH + 0.02) };
      });
      // 빼낼 순서와 방향: 박 3·4·5·6 에 2·4·1·3 번째 블록
      const order = [{ i: 1, dir: -1 }, { i: 3, dir: 1 }, { i: 0, dir: 1 }, { i: 4, dir: -1 }];
      K.sun(S, { pos: [-10, 18, 12], target: [0, 3, 0], color: '#fff3dc', power: 3.0, size: 12, soft: 0.8, mapSize: 2048 });
      K.skyLight(S, { color: '#ffd98a', power: 0.9, size: 12, center: [0, 3, 0] });
      K.spot(S, { pos: [9, 6, -8], target: [0, 3, 0], color: '#ffffff', power: 500, angle: 0.6, penumbra: 1, shadow: false });
      const P = PULL, s = 0.25;
      const cam = ANBU.path([[0, [-12, 6.6, 23]], [P[0] - 0.05, [-7, 6, 25]], [P[0] + s, [-10, 2.6, 13.5], 'snap'], [P[1] - 0.05, [-9, 3, 14.5]], [P[1] + s, [10, 4.4, 13], 'snap'], [P[2] - 0.05, [9.5, 4, 14]],
        [P[2] + s, [8.5, 1.5, 12.5], 'snap'], [P[3] - 0.05, [7.5, 2, 14]], [P[3] + s, [-9.5, 4.8, 12.5], 'snap'], [TOPPLE - 0.05, [-8.5, 5, 14]], [TOPPLE + 0.5, [4, 19, 17], 'snap'], [D, [2, 23, 7.5]]]);
      const aim = ANBU.path([[0, [0, 4.2, 0]], [P[0] - 0.05, [0, 4, 0]], [P[0] + s, [-2.6, 1.7, 0], 'snap'], [P[1] - 0.05, [-2.4, 2, 0]], [P[1] + s, [2.6, 3.6, 0], 'snap'], [P[2] - 0.05, [2.4, 3, 0]],
        [P[2] + s, [2.8, 0.7, 0], 'snap'], [P[3] - 0.05, [2.4, 1.2, 0]], [P[3] + s, [-2.6, 3.0, 0], 'snap'], [TOPPLE - 0.05, [-1.6, 3, 0]], [TOPPLE + 0.5, [2, 1.2, 1.5], 'snap'], [D, [2.6, 0.4, 2.2]]]);
      const fov = ANBU.path([[0, 28], [P[0] + s, 30, 'snap'], [TOPPLE + 0.5, 34, 'snap'], [D, 34]]);
      const items = [
        { k: 'p_f1', at: 0.05, y: 300, size: 96, kind: 'slam', color: '#10163f', suffix: '✕', strokeColor: 'rgba(255,248,230,0.75)', shadow: 'rgba(120,70,0,0.35)' },
        { k: 'p_f2', at: 2 * B, y: 440, size: 96, kind: 'slam', color: '#10163f', suffix: '✕', strokeColor: 'rgba(255,248,230,0.75)', shadow: 'rgba(120,70,0,0.35)' },
      ];
      return {
        update(t) {
          // 빠진 블록 위의 블록들은 한 칸씩 내려앉는다
          const gone = (i) => { const o = order.find((q) => q.i === i); if (!o) return 0; const k = order.indexOf(o); return K.seg(t, PULL[k] + 0.12, PULL[k] + 0.32, K.ease.in); };
          const top = K.seg(t, TOPPLE, TOPPLE + 0.9);
          for (const b of blocks) {
            const o = order.find((q) => q.i === b.i), k = o ? order.indexOf(o) : -1;
            let drop = 0; for (const q of blocks) if (q.i < b.i) drop += gone(q.i) * (BH + 0.02);
            let x = 0, y = b.y0 - drop, z = 0, rx = 0, rz = 0;
            if (o && t > PULL[k]) {
              const p = t - PULL[k], slide = K.ease.out(K.seg(p, 0, 0.18));
              x = o.dir * (slide * 3.6 + Math.min(0.5, Math.max(0, p - 0.18)) * 1.6);
              const fall = Math.max(0, p - 0.18); y = b.y0 - 9.8 * fall * fall * 0.9; rz = -o.dir * 2.2 * fall; z = 0.6 * fall;
              if (y < BH / 2) { y = BH / 2 + Math.max(0, 0.4 * Math.sin((p - 0.5) * 9) * Math.exp(-(p - 0.5) * 4)); }
            } else if (top > 0) {
              // 남은 탑이 앞쪽 오른쪽으로 무너짐 — 높은 블록일수록 멀리
              const h = b.i, fall = top * top;
              rz = -1.3 * fall * (0.6 + h * 0.12); x = fall * (0.6 + h * 0.55); y = Math.max(BH / 2, y - fall * h * 0.95); z = fall * (h * 0.9); rx = 0.4 * fall;
            }
            b.m.position.set(x, y, z); b.m.rotation.set(rx, 0.18 * Math.sin(b.i * 1.7), rz);
          }
          // 카메라: 탑을 돌며 보다가 블록이 빠질 때마다 그 블록 쪽으로 스냅(좌우 번갈아) → 무너지는 순간 위로 확 솟아 내려다봄
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, PULL.concat([TOPPLE + 0.55]), 0.08, 8)); K.focus(camera, aim(t), 0.07);
        },
        overlay: KINE.overlay(items, { pulse: 0.025 }),
      };
    },
    sound(k) {
      k.play('stamp', 0.05, { gain: 0.5 }); k.play('stamp', 2 * B, { gain: 0.5 });
      PULL.forEach((a) => { k.play('swish', a, { dur: 0.15, gain: 0.9 }); k.play('tock', a + 0.55, { f: 520, gain: 0.8 }); });
      for (let i = 0; i < 6; i++) k.play('tock', TOPPLE + 0.5 + i * 0.09, { f: 400 + i * 40, gain: 0.7 });
      k.play('thud', TOPPLE + 0.6, { gain: 0.6 });
    },
  });
})();
