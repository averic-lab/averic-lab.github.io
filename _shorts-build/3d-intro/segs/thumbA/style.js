// thumbA — 썸네일 시안 A「안부가 날아온다」(정지 1장). drop 장면의 요소를 더 크게·더 극적으로:
// 빛줄기가 쏟아지는 진홍 스튜디오, 날개를 활짝 편 실제 앱 아이콘이 화면 앞으로 날아오고, 뒤에 비스듬한 폰에 안부 알림.
// 글자는 영상 자막 그대로(앱을 열지 않아도, / 매일 자동으로) — 썸네일용으로 크게·두껍게.
(function () {
  registerStyle({
    id: 'thumbA', name: 'Thumbnail A', duration: 1,
    koText: '앱을 열지 않아도, 매일 자동으로 ✅ 오늘 안부 확인 완료 엄마 · 오늘 6,120보를 걸으셨습니다. 지금 18:00 안부',
    render: { samples: 64, shutter: 0, tone: 'filmic', exposure: 1.05, bloom: 0.55, bloomThreshold: 1.1, vignette: 0.45, grain: 0.01, fov: 34, near: 0.05, far: 200, background: '#14040a', saturation: 1.12 },
    async build(S) {
      const { THREE, camera, scene } = S;
      const L = ANBU.S(), icon = await ANBU.loadIconImage();
      const env = HERO.studio(S, { glow: '#7a1430', warm: '#ffd2b8', rimL: '#ff6a8a', rimR: '#ffb08a' });
      // 뒤의 폰: 비스듬히 기울어 알림이 보인다
      const phone = HERO.phone(S, { env, draw(ctx, t, W, H) {
        HERO.ui.lock(ctx, W, H, { time: '18:00', date: '', top: '#2b2a4a', bot: '#8a3c56' });
        HERO.ui.push(ctx, W, { icon, y: 700, title: L.pushTitle, body: L.pushBody, k: 1, app: L.app, now: L.now, scale: 1.05 });
      } });
      phone.group.position.set(1.6, 2.4, -2.2); phone.group.rotation.set(-0.08, -0.38, -0.12); scene.add(phone.group); phone.redraw(0.5);
      // 앞으로 날아오는 날개 아이콘
      const Wg = HERO.wingedIcon(S, icon, { size: 1.75, glow: 0.02, wingGlow: 0.05 }); scene.add(Wg.group);
      Wg.group.position.set(-1.25, 4.9, 1.8); Wg.group.rotation.set(0.12, 0.18, 0.14); Wg.pose(1, 1.4, 0.75);
      // 빛줄기(위에서 비스듬히 쏟아지는 광선) + 먼지
      const rayT = K.canvasTex(256, 1024, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,220,200,0)'); g.addColorStop(0.5, 'rgba(255,220,200,0.55)'); g.addColorStop(1, 'rgba(255,220,200,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.3, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); c.globalCompositeOperation = 'destination-in'; c.fillStyle = v; c.fillRect(0, 0, w, h); });
      [[-3, 0.35, 2.2], [-0.5, 0.28, 3.0], [2.4, 0.42, 1.6], [4.6, 0.3, 2.4]].forEach(([x, rz, w]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 26), new THREE.MeshBasicMaterial({ map: rayT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })); m.position.set(x, 9, -4); m.rotation.z = rz; scene.add(m); });
      const ND = 260, R = K.rng(4), dust = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2d0').multiplyScalar(3) }), ND);
      for (let i = 0; i < ND; i++) K.place(dust, i, [(R() - 0.5) * 14, R() * 14, (R() - 0.5) * 8], null, 0.5 + R() * 1.2); dust.instanceMatrix.needsUpdate = true; scene.add(dust);
      const glow = new THREE.PointLight('#ffd0b0', 6, 6, 2); glow.position.set(-1.3, 5.5, 4.6); scene.add(glow);
      K.spot(S, { pos: [-8, 16, 14], target: [0, 5, 0], color: '#ffe8d8', power: 1700, angle: 0.45, penumbra: 0.85, soft: 1.0 });
      K.spot(S, { pos: [10, 6, -10], target: [0, 5, 0], color: '#ff4a6a', power: 1100, angle: 0.6, penumbra: 1, shadow: false });
      const items = [
        { k: 'p_c1', at: -1, y: 236, size: 100, kind: 'fade', color: '#fff8f0', strokeColor: 'rgba(40,0,10,0.85)', fixed: true },
        { text: KINE.cap('p_c2') + ' ' + KINE.cap('p_c3'), at: -1, y: 455, size: 168, kind: 'fade', color: '#ffd166', strokeColor: 'rgba(60,10,0,0.9)', glow: 'rgba(255,150,60,0.75)', fixed: true },
      ];
      return {
        update() { K.look(camera, [0.2, 4.6, 21], [0.3, 4.2, 0], 34, -0.04); K.focus(camera, [-1.25, 4.9, 1.8], 0.04); },
        overlay: (ctx, t, W, H) => { KINE.draw(ctx, t, W, H, items); KINE.guides(ctx, W, H); },
      };
    },
  });
})();
