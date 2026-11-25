// sos — 장면 10(3.5마디). 앞: 어두운 받침 위의 큰 입체 버튼 '도움이 필요해요'(앱 문구) — 박 4 에 눌려 들어가며 붉은 고리가 퍼진다.
// 뒤: 카메라가 크레인으로 올라가면 받침 뒤에 깔린 동네 지도 미니어처 위로 핀 하나가 툭 떨어지고 고리가 한 번 퍼진다.
// ⚠ 위치는 그 순간 1회만 — 핀이 따라다니거나 구조대가 오는 장면은 없다(응급 구조 앱이 아니다).
// 자막: p_k1 도움이 필요할 때 / p_k2 버튼 한 번, / p_k3 그 순간의 위치만.
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR, PRESS = 4 * B, PIN = 8 * B;
  registerStyle({
    id: 'sos', name: 'One press, one pin', duration: D,
    koText: '도움이 필요할 때 버튼 한 번, 그 순간의 위치만 도움이 필요해요',
    render: { samples: 32, shutter: 0.55, tone: 'filmic', exposure: 1.0, bloom: 0.5, bloomThreshold: 1.0, vignette: 0.4, grain: 0.012, fov: 30, near: 0.05, far: 300, background: '#1a0508' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const L = ANBU.S();
      const env = HERO.studio(S, { glow: '#4a0f16', warm: '#ffd8cc', rimL: '#ff6a7a', rimR: '#ff9aa0', floor: false });
      // ---------- 지도 미니어처(받침 뒤, 바닥에 깔림)
      const MX = 0, MZ = -16, MS = 26;
      const mapT = K.canvasTex(2048, 2048, (c, w, h) => {
        c.fillStyle = '#2b303c'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#2f4a38'; c.fillRect(w * 0.08, h * 0.1, w * 0.26, h * 0.22); c.fillRect(w * 0.62, h * 0.62, w * 0.3, h * 0.2);   // 공원
        c.strokeStyle = '#2c4f74'; c.lineWidth = 90; c.beginPath(); c.moveTo(-50, h * 0.55); c.bezierCurveTo(w * 0.3, h * 0.45, w * 0.55, h * 0.75, w + 50, h * 0.62); c.stroke();   // 강
        c.strokeStyle = '#555c6c'; c.lineWidth = 46; for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(i * w / 8, 0); c.lineTo(i * w / 8 + 60, h); c.stroke(); c.beginPath(); c.moveTo(0, i * h / 8); c.lineTo(w, i * h / 8 - 40); c.stroke(); }
        c.strokeStyle = '#a88a52'; c.lineWidth = 70; c.beginPath(); c.moveTo(0, h * 0.38); c.lineTo(w, h * 0.3); c.stroke();
      });
      const map = new THREE.Mesh(new THREE.PlaneGeometry(MS, MS), new THREE.MeshStandardMaterial({ map: mapT, roughness: 0.85 }));
      map.rotation.x = -Math.PI / 2; map.position.set(MX, 0, MZ); map.receiveShadow = true; scene.add(map);
      const R = K.rng(41), NB = 150, bI = new THREE.InstancedMesh(K.roundedBox(1, 1, 1, 0.08, 2), new THREE.MeshStandardMaterial({ color: '#8d8a86', roughness: 0.8 }), NB);
      for (let i = 0; i < NB; i++) { const gx = Math.floor(R() * 8), gz = Math.floor(R() * 8), x = MX - MS / 2 + (gx + 0.5) * MS / 8 + (R() - 0.5) * 1.2, z = MZ - MS / 2 + (gz + 0.5) * MS / 8 + (R() - 0.5) * 1.2, h = 0.4 + R() * 1.6; if ((gx < 3 && gz < 3) || Math.abs(z - MZ - 1.2) < 1.5) continue; K.place(bI, i, [x, h / 2, z], [0, R() * 0.2, 0], [1.1 + R(), h, 1.1 + R()]); }
      bI.castShadow = bI.receiveShadow = true; bI.instanceMatrix.needsUpdate = true; scene.add(bI);
      // 핀(물방울 모양 + 흰 원) + 바닥 고리
      const pin = new THREE.Group(); scene.add(pin);
      const pinM = new THREE.MeshPhysicalMaterial({ color: '#e5303f', roughness: 0.25, clearcoat: 1, envMap: env });
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 32), pinM); head.position.y = 2.4; head.castShadow = true; pin.add(head);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.9, 48), pinM); tip.rotation.x = Math.PI; tip.position.y = 1.15; tip.castShadow = true; pin.add(tip);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 16), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })); dot.position.set(0, 2.45, 0.72); dot.scale.z = 0.5; pin.add(dot);
      const PP = new THREE.Vector3(MX + 2.2, 0, MZ + 1.0);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff4a5a').multiplyScalar(2.5), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(PP).setY(0.05); scene.add(ring);
      // ---------- 버튼(받침 위)
      const plinth = new THREE.Mesh(K.roundedBox(6.6, 2.2, 4.2, 0.25, 4), new THREE.MeshStandardMaterial({ color: '#1b1214', roughness: 0.4, metalness: 0.6, envMap: env })); plinth.position.set(0, 1.1, 0); plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);
      const bezel = new THREE.Mesh(K.roundedBox(5.8, 0.5, 3.2, 0.25, 4), new THREE.MeshStandardMaterial({ color: '#c9c3bc', roughness: 0.25, metalness: 1, envMap: env })); bezel.position.set(0, 2.35, 0); scene.add(bezel);
      const capT = K.canvasTex(1040, 520, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e0303f'); g.addColorStop(1, '#a8121f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 210; c.font = `900 ${fs}px "Noto Sans KR"`;
        while (c.measureText(L.emBtn).width > w - 110 && fs > 60) { fs -= 6; c.font = `900 ${fs}px "Noto Sans KR"`; } c.lineWidth = fs * 0.1; c.strokeStyle = 'rgba(80,0,10,0.6)'; c.strokeText(L.emBtn, w / 2, h / 2 + 10); c.fillText(L.emBtn, w / 2, h / 2 + 10);
      });
      const capMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: capT, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35, emissive: '#ff2a3a', emissiveIntensity: 0.05, envMap: env });
      const btnSide = new THREE.MeshPhysicalMaterial({ color: '#c81e30', roughness: 0.5, clearcoat: 0.5, envMap: env });
      const btn = new THREE.Mesh(K.roundedBox(5.2, 1.0, 2.6, 0.45, 6), [btnSide, btnSide, capMat, btnSide, btnSide, btnSide]); btn.castShadow = true; scene.add(btn);
      const glow = new THREE.PointLight('#ff3040', 0, 10, 1.6); glow.position.set(0, 4, 2); scene.add(glow);
      const wave = new THREE.Mesh(new THREE.RingGeometry(2.9, 3.02, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6070').multiplyScalar(2.5), transparent: true, side: THREE.DoubleSide, depthWrite: false })); wave.rotation.x = -Math.PI / 2; wave.position.y = 2.62; wave.scale.set(1, 0.42, 1); scene.add(wave);
      K.spot(S, { pos: [-8, 16, 12], target: [0, 1, -4], color: '#fff0ea', power: 2400, angle: 0.65, penumbra: 0.85, soft: 1.1 });
      K.spot(S, { pos: [10, 6, -6], target: [0, 2, 0], color: '#ff5a6a', power: 700, angle: 0.6, penumbra: 1, shadow: false });
      K.skyLight(S, { color: '#ffd8cc', power: 0.5, size: 18, center: [0, 0, -8] });
      // 카메라: 버튼 글자를 낮게 옆으로 훑으며 → 누르는 순간(박 4) 크래시 줌 + 흔들림 → 위로 확 솟구쳐 동네를 내려다봄
      // → 핀이 꽂히는 순간(박 8) 핀으로 스냅 → 천천히 물러나 동네 속 핀 하나
      const sn = 0.3;
      const cam = ANBU.path([[0, [-8, 6.6, 14]], [PRESS - 0.02, [4.6, 8.2, 15.5]], [PRESS + sn, [0.5, 9.6, 12], 'snap'], [PIN - 0.9, [0.3, 10, 13]], [PIN - 0.08, [PP.x + 1, 27, PP.z + 19], 'in'],
        [PIN + sn, [PP.x + 1.0, 8.5, PP.z + 10.5], 'snap'], [D, [PP.x + 2.4, 19, PP.z + 17]]]);
      const aim = ANBU.path([[0, [0, 3.3, 0]], [PRESS - 0.02, [0, 3.4, 0]], [PRESS + sn, [0, 3.6, 0.2], 'snap'], [PIN - 0.9, [0, 3.6, 0]], [PIN - 0.08, [PP.x, 0, PP.z - 3], 'in'],
        [PIN + sn, [PP.x, 2.6, PP.z - 0.5], 'snap'], [D, [PP.x, 0, PP.z - 3.5]]]);
      const fov = ANBU.path([[0, 32], [PRESS + sn, 30, 'snap'], [PIN - 0.08, 32], [PIN + sn, 30, 'snap'], [D, 30]]);
      const items = [
        { k: 'p_k1', at: 0.05, y: 300, size: 96, kind: 'slam', color: '#fff8f0' },
        { k: 'p_k2', at: PRESS, y: 430, size: 104, kind: 'slam', color: '#ff9aa4' },
        { k: 'p_k3', at: PIN, y: 560, size: 92, kind: 'slam', color: '#ffd166' },
      ];
      return {
        update(t) {
          const pd = t - PRESS, press = pd > 0 ? (pd < 0.08 ? pd / 0.08 : Math.max(0, 1 - (pd - 0.18) / 0.25)) : 0;
          btn.position.set(0, 3.05 - 0.38 * press, 0);
          capMat.emissiveIntensity = 0.05 + (pd > 0 ? 0.8 * Math.exp(-pd * 2.2) : 0); glow.intensity = pd > 0 ? 40 * Math.exp(-pd * 2.2) : 0;
          const w = K.seg(t, PRESS, PRESS + 0.8); wave.scale.set(1 + w * 0.8, 0.42 + w * 0.5, 1 + w * 0.8); wave.material.opacity = pd > 0 ? 1 - w : 0;
          // 핀: 위에서 떨어져 꽂히고 살짝 튐 → 고리 한 번
          const pp = t - PIN, fall = K.seg(t, PIN - 0.35, PIN, K.ease.in), bob = pp > 0 ? 0.6 * Math.exp(-pp * 6) * Math.abs(Math.sin(pp * 14)) : 0;
          pin.position.set(PP.x, (1 - fall) * 14 + bob, PP.z); pin.visible = t > PIN - 0.35; pin.rotation.y = 0.4;
          const r = K.seg(t, PIN, PIN + 1.0); ring.scale.setScalar(1 + r * 4); ring.material.opacity = pp > 0 ? 1 - r : 0;
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, [PRESS, PIN], 0.14, 7)); K.focus(camera, t < PIN - 0.5 ? [0, 3.4, 0] : [PP.x, 1.5, PP.z], 0.08);
        },
        overlay: KINE.overlay(items),
      };
    },
    sound(k) {
      k.play('click', PRESS, { f: 1200, gain: 1.2 }); k.play('thud', PRESS + 0.02, { gain: 0.7 }); k.play('riser', PRESS + 0.1, { dur: 0.6, gain: 0.4 });
      k.play('whoosh', PIN - 0.4, { dur: 0.4, top: 2200, gain: 0.7 }); k.play('impact', PIN, { gain: 0.6 }); k.play('ding', PIN + 0.05, { f: 'C6', gain: 0.35 });
    },
  });
})();
