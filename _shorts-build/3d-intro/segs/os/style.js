// os — 장면 7(2.5마디). studio-product: 남색 스튜디오의 회전 받침 위에 일반형 폰 두 대가 서로를 향해 비스듬히 선다
// (특정 제조사 외형은 흉내 내지 않는다 — 색과 뒷면 재질만 다르게). 왼쪽 폰이 먼저 미끄러져 들어오며 안부 알림을 받고,
// 오른쪽 폰이 들어와 같은 알림을 받는다. 그 사이에 날개 아이콘이 떠서 두 폰을 잇는다.
// 자막: p_h1 안드로이드도 / p_h2 아이폰도 + 폰 아래 이름표 p_and · p_ios.
(function () {
  const B = ANBU.B, D = 3 * ANBU.BAR, IN1 = 0, IN2 = 4 * B, P1 = 2 * B, P2 = 6 * B, WING = 8 * B;
  registerStyle({
    id: 'os', name: 'Both phones', duration: D,
    koText: '안드로이드도 아이폰도 안드로이드 아이폰 ✅ 오늘 안부 확인 완료 엄마 · 오늘 6,120보를 걸으셨습니다. 지금',
    render: { samples: 32, shutter: 0.55, tone: 'filmic', exposure: 1.0, bloom: 0.4, bloomThreshold: 1.1, vignette: 0.36, grain: 0.012, fov: 30, near: 0.05, far: 200, background: '#0b0f36' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const L = ANBU.S(), icon = await ANBU.loadIconImage();
      const env = HERO.studio(S, { glow: '#2a3488', warm: '#dfe4ff', cool: '#8fa0ff', rimL: '#a8b4ff', rimR: '#ffc8a0' });
      const draw = (P) => (ctx, t, W, H) => { HERO.ui.lock(ctx, W, H, { time: '18:00', date: '', top: '#26306e', bot: '#5b6cff' }); HERO.ui.push(ctx, W, { icon, y: 640, title: L.pushTitle, body: L.pushBody, k: K.seg(t, P, P + 0.5), app: L.app, now: L.now }); };
      const A = HERO.phone(S, { env, metal: '#3c4048', back: '#1d4a3a', draw: draw(P1) });
      const Bp = HERO.phone(S, { env, metal: '#d8d2c8', back: '#e9e3da', draw: draw(P2) });
      const turn = new THREE.Group(); scene.add(turn);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.7, 0.5, 96), new THREE.MeshStandardMaterial({ color: '#15183a', roughness: 0.3, metalness: 0.7, envMap: env })); disc.position.y = 0.25; disc.receiveShadow = true; turn.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.06, 10, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color('#8fa0ff').multiplyScalar(2) })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.5; turn.add(rim);
      const PY = 4.6;
      A.group.position.set(-2.8, PY, 0); A.group.rotation.y = 0.32; Bp.group.position.set(2.8, PY, 0); Bp.group.rotation.y = -0.32;
      turn.add(A.group, Bp.group);
      const W = HERO.wingedIcon(S, icon, { size: 1.15, glow: 0.05 }); scene.add(W.group);
      K.spot(S, { pos: [-8, 16, 14], target: [0, PY, 0], color: '#ffffff', power: 1500, angle: 0.4, penumbra: 0.85, soft: 1.0 });
      K.spot(S, { pos: [10, 7, -9], target: [0, PY, 0], color: '#ffb68a', power: 700, angle: 0.5, penumbra: 1, shadow: false });
      K.spot(S, { pos: [-10, 7, -9], target: [0, PY, 0], color: '#8fa0ff', power: 700, angle: 0.5, penumbra: 1, shadow: false });
      const sn = 0.3, CY = PY + 1.2;
      const cam = ANBU.path([[0, [-7, PY + 1.6, 13]], [P1 - 0.02, [-4.2, PY + 1.6, 12]], [P1 + sn, [-2.2, PY + 1.6, 13.5], 'snap'], [IN2 - 0.3, [-1.8, PY + 1.6, 14]], [IN2 + sn, [3.4, PY + 1.6, 14.5], 'in'],
        [P2 - 0.02, [3.5, PY + 1.6, 14.5]], [P2 + sn, [3.2, PY + 1.6, 13.5], 'snap'], [WING - 0.02, [3.0, PY + 1.6, 14]], [WING + 0.4, [2, PY + 3.4, 31], 'snap'], [D, [-4.5, PY + 3.8, 30]]]);
      const aim = ANBU.path([[0, [-3.4, CY, 0]], [P1 + sn, [-2.8, CY, 0], 'snap'], [IN2 - 0.3, [-2.6, CY, 0]], [IN2 + 0.15, [2.8, CY, 0], 'in'], [P2 + sn, [2.8, CY, 0], 'snap'], [WING - 0.02, [2.6, CY, 0]],
        [WING + 0.4, [0, PY + 1.7, 0], 'snap'], [D, [0, PY + 1.5, 0]]]);
      const fov = ANBU.path([[0, 32], [P1 + sn, 30, 'snap'], [WING + 0.4, 30, 'snap'], [D, 30]]);
      const items = [
        { k: 'p_h1', at: 0.05, y: 300, size: 104, kind: 'sl', color: '#fff8f0' },
        { k: 'p_h2', at: IN2, y: 440, size: 104, kind: 'sr', color: '#ffd166' },
        { k: 'p_and', at: WING + 0.3, x: 335, y: 1505, size: 50, kind: 'fade', color: '#dfe4ff', maxW: 380, weight: 700 },
        { k: 'p_ios', at: WING + 0.45, x: 745, y: 1505, size: 50, kind: 'fade', color: '#dfe4ff', maxW: 380, weight: 700 },
      ];
      return {
        update(t) {
          const a = K.spring(t - IN1, 1.6, 0.6), b = K.spring(t - IN2, 1.6, 0.6);
          A.group.position.x = -2.8 - 14 * (1 - a); A.group.visible = t >= IN1;
          Bp.group.position.x = 2.8 + 14 * (1 - b); Bp.group.visible = t >= IN2;
          turn.rotation.y = 0.12 * Math.sin(t * 0.7);
          A.redraw(t); Bp.redraw(t);
          // 날개 아이콘: 두 폰 사이 위쪽에 떠서 날갯짓, 박마다 살짝 튐
          const w = K.spring(t - WING, 2, 0.5); W.group.visible = t > WING;
          W.group.position.set(0, PY + 2.0 + 0.15 * Math.sin(t * 3), 1.2); W.group.scale.setScalar(Math.max(0.001, w) * (1 + 0.08 * Math.exp(-((t / B) % 1) * 6)));
          W.pose(1, t * 12, 0.5); W.group.rotation.y = 0.2 * Math.sin(t * 1.3);
          // 카메라: 왼쪽 폰이 들어오는 걸 따라붙고 → 알림(박 2)에 크래시 → 오른쪽으로 휘팬 → 오른쪽 폰 알림(박 6)에 크래시 → 날개(박 8)에 확 물러나 두 대를 돌며 보여 줌
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, [P1, P2, WING], 0.07, 8)); K.focus(camera, aim(t), 0.06);
        },
        overlay: KINE.overlay(items),
      };
    },
    sound(k) {
      k.play('whoosh', IN1, { dur: 0.4, top: 2400, gain: 0.8 }); k.play('whoosh', IN2 - 0.05, { dur: 0.4, top: 2400, gain: 0.8 });
      k.play('ding', P1, { f: 'E6', gain: 0.4 }); k.play('ding', P2, { f: 'A6', gain: 0.4 });
      k.play('sparkle', WING, { n: 5, gain: 0.7 });
    },
  });
})();
