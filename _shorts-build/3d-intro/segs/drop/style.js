// drop — 장면 3(4마디, 곡의 드롭). device-hero: 실제 앱 아이콘 타일이 유리 받침 위로 쾅 내려앉고(충격파),
// 깃털 날개가 돋아 날아간다 → 카메라가 따라 내려가면 받침 옆에 선 보호자의 폰에 안부 알림이 도착한다.
// 자막: 받침 아래 '안부'(앱 이름) + 위 p_c1 앱을 열지 않아도, / p_c2 매일 / p_c3 자동으로. 알림 문구는 서버 원문(push_title + 엄마 · 오늘 N보).
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR, LAND = 0, OPEN = [6 * B, 6.8 * B], FLY = 7.3 * B, PUSH = 9 * B;
  registerStyle({
    id: 'drop', name: 'Icon lands, grows wings, push arrives', duration: D,
    koText: '안부 앱을 열지 않아도, 매일 자동으로 ✅ 오늘 안부 확인 완료 엄마 · 오늘 6,120보를 걸으셨습니다. 지금 18:00 11월 19일 목요일',
    render: { samples: 32, shutter: 0.6, tone: 'filmic', exposure: 1.0, bloom: 0.5, bloomThreshold: 1.15, vignette: 0.35, grain: 0.012, fov: 32, near: 0.05, far: 200, background: '#0b0608' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const L = ANBU.S(), icon = await ANBU.loadIconImage();
      const env = HERO.studio(S, { glow: '#5a1f2c', warm: '#ffd2b8', rimL: '#ff8aa0', rimR: '#ffc0a8' });
      // 유리 받침(두꺼운 원반 + 아래 금속 링)
      const glassM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.04, transmission: 0.92, thickness: 0.8, ior: 1.5, clearcoat: 1, envMap: env, envMapIntensity: 1.2 });
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.55, 96), glassM); ped.position.set(0, 2.2, 0); ped.castShadow = true; scene.add(ped);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 1.95, 64), new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.35, metalness: 0.8, envMap: env })); col.position.y = 0.97; col.castShadow = true; scene.add(col);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.48, 0.05, 12, 96), new THREE.MeshStandardMaterial({ color: '#c9a27a', roughness: 0.25, metalness: 1, envMap: env })); ring.rotation.x = Math.PI / 2; ring.position.y = 1.93; scene.add(ring);
      // 충격파 고리(내려앉는 순간 퍼진다)
      const wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb0a0').multiplyScalar(3), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      wave.rotation.x = -Math.PI / 2; wave.position.y = 2.49; scene.add(wave);
      const W = HERO.wingedIcon(S, icon, { size: 1.9, glow: 0.05, wingGlow: 0.06 }); scene.add(W.group);
      const topY = 2.48 + 0.95 + 0.05;
      const fly = new THREE.CatmullRomCurve3([[0, topY + 0.4, 0.3], [-0.6, topY + 2.5, 1.2], [-3.5, topY + 7, 1.5], [-9, topY + 15, -2]].map((p) => new THREE.Vector3(...p)));
      const iLight = new THREE.PointLight('#ffd0b0', 0, 8, 2); scene.add(iLight);
      // 보호자의 폰(받침 오른쪽, 작은 받침대에 세움)
      const phone = HERO.phone(S, { env, draw(ctx, t, Wd, H) {
        HERO.ui.lock(ctx, Wd, H, { time: '18:00', date: '', top: '#2b2a4a', bot: '#7a4656' });
        HERO.ui.push(ctx, Wd, { icon, y: 640, title: L.pushTitle, body: L.pushBody, k: K.seg(t, PUSH, PUSH + 0.5), app: L.app, now: L.now });
      } });
      const PX = 8.5, PY = 4.6;
      phone.group.position.set(PX, PY, 1.2); phone.group.rotation.y = -0.25; scene.add(phone.group);
      const stand = new THREE.Mesh(K.roundedBox(3.6, 0.5, 2.2, 0.1, 3), new THREE.MeshStandardMaterial({ color: '#16161a', roughness: 0.4, metalness: 0.6, envMap: env })); stand.position.set(PX, 0.25, 1.0); stand.castShadow = true; scene.add(stand);
      K.spot(S, { pos: [-8, 16, 14], target: [2, 2.5, 0], color: '#ffe0c8', power: 1700, angle: 0.42, penumbra: 0.85, soft: 1.1 });
      K.spot(S, { pos: [10, 6, -10], target: [0, 3, 0], color: '#ff8fa6', power: 700, angle: 0.6, penumbra: 1, shadow: false });
      K.spot(S, { pos: [PX + 6, 9, 10], target: [PX, PY, 1], color: '#c8d6ff', power: 420, angle: 0.4, penumbra: 1, shadow: false });

      // 카메라(박 = 0.5초): 아래에서 올려다보는 착지(흔들림) → 아이콘 주위를 돌며 올라감 → '자동으로'(박 5) 크래시 푸시
      // → 날개가 펴지면 물러남 → 날아오르는 아이콘을 따라 틸트 업 → 오른쪽 폰으로 급강하 → 알림(박 9)에 크래시 줌
      const orb = (a, r, h) => [r * Math.sin(a), h, r * Math.cos(a)];
      const CY = PY + 0.35;                                   // 알림 카드 중심 높이(화면 위쪽 1/3)
      const camA = ANBU.path([[0, orb(0.45, 11, 2.0)], [1.55, orb(-0.45, 10.5, 2.8)], [2.5, orb(-0.9, 7.4, 3.3), 'snap'], [3.0, orb(-1.1, 7.8, 3.5)], [3.6, orb(-1.25, 10.5, 4.0)],
        [FLY + 0.5, [-3.0, topY + 3.4, 11]], [PUSH - 0.1, [PX - 2.6, CY + 3.0, 19]], [PUSH + 0.35, [PX + 0.2, CY + 1.5, 14.6], 'snap'], [D, [PX + 0.5, CY + 1.3, 13.2]]]);
      const aimA = ANBU.path([[0, [0, topY + 1.3, 0]], [2.5, [0, topY + 0.9, 0], 'snap'], [3.6, [0, topY + 1.2, 0]], [FLY + 0.5, [-1.4, topY + 4.0, 1.2]],
        [PUSH - 0.1, [PX, CY + 1.4, 1.2]], [PUSH + 0.35, [PX, CY + 1.15, 1.3], 'snap'], [D, [PX, CY + 1.05, 1.3]]]);
      const fovA = ANBU.path([[0, 34], [2.5, 28, 'snap'], [3.6, 32], [PUSH - 0.1, 34], [PUSH + 0.35, 30, 'snap'], [D, 28]]);
      const items = [
        { text: L.app, at: LAND, y: 1455, size: 140, kind: 'stamp', color: '#fff8f0', out: FLY + 0.2 },
        { k: 'p_c1', at: 2 * B, y: 300, size: 76, kind: 'sl', color: '#fff8f0' },
        { k: 'p_c2', at: 4 * B, y: 420, size: 92, kind: 'slam', color: '#fff8f0' },
        { k: 'p_c3', at: 5 * B, y: 548, size: 132, kind: 'slam', color: '#ffd166', glow: 'rgba(255,170,90,0.6)' },
      ];
      return {
        update(t) {
          // 착지: 위에서 떨어져 받침에 쾅 → 살짝 튐
          const fall = 1, bounce = Math.max(0, Math.sin(K.seg(t, LAND, LAND + 0.35) * Math.PI)) * 0.25 * (1 - K.seg(t, LAND, LAND + 0.35));
          const open = K.ease.out(K.seg(t, OPEN[0], OPEN[1])), u = K.seg(t, FLY, FLY + 1.4, K.ease.in);
          const base = new THREE.Vector3(0, topY + (1 - fall) * 9 + bounce + 0.12 * Math.sin(t * 3) * open, 0.3);
          W.group.position.copy(u > 0 ? fly.getPoint(u) : base);
          const sq = Math.exp(-t * 9) * Math.cos(t * 30); W.group.scale.set(1 + 0.25 * sq, 1 - 0.25 * sq, 1);
          W.group.rotation.set(-0.1 * open - 0.35 * u, 0.3 * Math.sin(t * 1.4) * open * (1 - u) + 0.6 * u, 0.15 * u);
          W.pose(open, t * (u > 0 ? 22 : 12), 0.5 + 0.3 * u);
          W.group.visible = u < 0.98;
          iLight.position.copy(W.group.position).add(new THREE.Vector3(0, 0, 1.5)); iLight.intensity = 6 * open * (1 - u);
          const w = K.seg(t, LAND, LAND + 0.7); wave.scale.setScalar(1 + w * 3.2); wave.material.opacity = (1 - w) * (t > LAND ? 1 : 0);
          // 카메라 + 착지·알림 순간 흔들림
          let am = aimA(t);
          // 날아오르는 동안은 아이콘을 직접 따라 본다
          const fk = K.smooth(FLY - 0.1, FLY + 0.15, t) * (1 - K.smooth(FLY + 0.55, PUSH - 0.2, t));
          if (fk > 0) { const ip = W.group.position; am = am.map((v, i) => v + (ip.getComponent(i) - v) * fk); }
          ANBU.shoot(camera, camA(t), am, fovA(t), ANBU.shake(t, [LAND, 2.5, PUSH], 0.12, 6));
          K.focus(camera, t < FLY + 0.3 ? W.group.position.toArray() : [PX, CY, 1.3], 0.06);
          phone.redraw(t);
        },
        overlay: KINE.overlay(items, { big: true }),
      };
    },
    sound(k) {
      
      k.play('impact', LAND, { gain: 1.0 });
      k.play('sparkle', OPEN[0], { n: 6, gain: 0.8 });
      for (let i = 0; i < 6; i++) k.noise(OPEN[0] + 0.3 + i * 0.22, { dur: 0.15, color: 'pink', filter: 'bandpass', f: [[0, 600], [0.15, 1500]], q: 0.8, gain: 0.12, a: 0.04 });
      k.play('whoosh', FLY, { dur: 0.9, top: 3000, gain: 1.0 });
      k.play('success', PUSH, { f: 'E6', gain: 0.55 });
    },
  });
})();
