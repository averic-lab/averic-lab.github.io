// price — 장면 11(4마디). 크림색 스튜디오. 두꺼운 압인 카드 두 장이 차례로 미끄러져 들어와 비스듬히 겹친다
// (청록: 보내는 분 / 무료, 인디고: 지켜보는 분 / 3개월 무료 체험 — 원판 카드 문구 그대로). 그 아래로 김이 오르는 점심 한 그릇이 놓인다.
// 자막: p_l5 이후 연 $9.99 / p_l6 점심 한 끼 정도예요 (원판 문구 그대로, 새 숫자 없음).
(function () {
  const B = ANBU.B, D = 3 * ANBU.BAR, C1 = 0, C2 = 2 * B, L5 = 4 * B, L6 = 6 * B, BOWL = 5.4 * B;
  registerStyle({
    id: 'price', name: 'Free, trial, a lunch', duration: D,
    koText: '보내는 분 무료 지켜보는 분 3개월 무료 체험 이후 연 $9.99 점심 한 끼 정도예요',
    render: { samples: 32, shutter: 0.55, tone: 'filmic', exposure: 1.0, bloom: 0.2, bloomThreshold: 1.3, vignette: 0.28, grain: 0.01, fov: 30, near: 0.05, far: 200, background: '#f3e2c2' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const cap = KINE.cap;
      const env = K.env(S, { top: '#fff4e0', horizon: '#f3dcb4', bottom: '#c9a978', intensity: 0.6, blur: 0.06, panels: [{ pos: [-10, 12, 10], size: [8, 8], color: '#ffffff', power: 4 }, { pos: [10, 4, 8], size: [3, 10], color: '#ffe6c8', power: 3 }] });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#efd9b4', roughness: 0.85 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshStandardMaterial({ color: '#f6e6c8', roughness: 0.95 })); wall.position.set(0, 50, -30); scene.add(wall);
      // 압인 카드: 두꺼운 면 종이 + 눌린 글자(위 밝은 선·아래 그림자로 판 느낌)
      const card = (top, big, color, small) => {
        const tex = K.canvasTex(1040, 600, (c, w, h) => {
          c.fillStyle = color; c.fillRect(0, 0, w, h); const r = K.rng(top.length); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.05})`; c.fillRect(r() * w, r() * h, 2, 2); }
          c.textAlign = 'center'; c.textBaseline = 'middle';
          const press = (txt, y, f) => { let fs = f; c.font = `900 ${fs}px "Noto Sans KR"`; while (c.measureText(txt).width > w - 110 && fs > 30) { fs -= 4; c.font = `900 ${fs}px "Noto Sans KR"`; }
            c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillText(txt, w / 2, y + 4); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillText(txt, w / 2, y - 3); c.fillStyle = '#fff8f0'; c.fillText(txt, w / 2, y); };
          press(top, 150, 100); press(big, 380, small ? 112 : 210);
        });
        const side = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const m = new THREE.Mesh(K.roundedBox(5.2, 3.0, 0.16, 0.08, 3), [side, side, side, side, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), side]);
        m.castShadow = m.receiveShadow = true; scene.add(m); return m;
      };
      const c1 = card(cap('p_l1'), cap('p_l2'), '#14b8a6', false), c2 = card(cap('p_l3'), cap('p_l4'), '#5b6cff', true);
      // 점심 한 그릇: 유약 바른 사발 + 국물 + 면 + 반숙 달걀 + 파 + 젓가락, 역광 김
      const bowl = new THREE.Group(); scene.add(bowl);
      const prof = []; for (let i = 0; i <= 24; i++) { const a = i / 24; prof.push(new THREE.Vector2(0.9 + 1.55 * Math.sin(a * Math.PI / 2), -0.95 + 1.35 * (1 - Math.cos(a * Math.PI / 2)))); }
      const inner = prof.slice().reverse().map((v) => new THREE.Vector2(v.x - 0.09, v.y + 0.06));
      const bowlM = new THREE.MeshPhysicalMaterial({ color: '#f4efe6', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, envMap: env, side: THREE.DoubleSide });
      const shell = new THREE.Mesh(new THREE.LatheGeometry(prof.concat(inner), 96), bowlM); shell.castShadow = shell.receiveShadow = true; bowl.add(shell);
      const band = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.04, 8, 96), new THREE.MeshStandardMaterial({ color: '#2f5f9a', roughness: 0.4 })); band.rotation.x = Math.PI / 2; band.position.y = 0.1; band.scale.set(1.02, 1.02, 1); bowl.add(band);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.25, 64), bowlM); foot.position.y = -1.05; bowl.add(foot);
      const soup = new THREE.Mesh(new THREE.CircleGeometry(2.25, 64), new THREE.MeshPhysicalMaterial({ color: '#c9864a', roughness: 0.08, clearcoat: 1, transmission: 0.1 })); soup.rotation.x = -Math.PI / 2; soup.position.y = 0.22; bowl.add(soup);
      const noodleM = new THREE.MeshStandardMaterial({ color: '#f2dca0', roughness: 0.5 }), R = K.rng(6);
      for (let i = 0; i < 26; i++) { const pts = []; const a0 = R() * 6.28, r0 = 0.3 + R() * 1.4; for (let k = 0; k < 8; k++) { const a = a0 + k * 0.32, r = r0 + Math.sin(k * 1.3 + i) * 0.25; pts.push([Math.cos(a) * r, 0.26 + Math.sin(k * 2 + i) * 0.05, Math.sin(a) * r]); } const n = new THREE.Mesh(K.tube(pts, 0.045, { radial: 6 }), noodleM); n.castShadow = true; bowl.add(n); }
      const egg = new THREE.Group(); egg.position.set(0.7, 0.32, 0.4); egg.rotation.set(-1.2, 0, 0.3); bowl.add(egg);
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#fbf8f0', roughness: 0.3, clearcoat: 0.5 })); white.scale.set(1, 1.3, 1); egg.add(white);
      const yolk = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshPhysicalMaterial({ color: '#f0a030', roughness: 0.15, clearcoat: 1 })); yolk.rotation.x = -Math.PI / 2; yolk.position.y = 0.005; egg.add(yolk);
      const onionM = new THREE.MeshStandardMaterial({ color: '#5aa04a', roughness: 0.5 });
      for (let i = 0; i < 24; i++) { const o = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12), onionM); o.position.set((R() - 0.5) * 2.4, 0.3, (R() - 0.5) * 2.4); o.rotation.set(Math.PI / 2 + (R() - 0.5) * 0.6, 0, 0); if (o.position.length() < 2) bowl.add(o); }
      const chopM = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.45 });
      for (const dz of [-0.12, 0.12]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 5.2, 12), chopM); ch.rotation.set(0, 0, Math.PI / 2 - 0.12); ch.position.set(0.4, 0.62, 1.2 + dz); ch.castShadow = true; bowl.add(ch); }
      // 김: 역광에 빛나는 반투명 띠(시간에 따라 흔들림)
      const steamT = K.canvasTex(128, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.35, h / 2, 0, 0, 7); c.fill(); });
      const steams = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2, 1, 16), new THREE.MeshBasicMaterial({ map: steamT, transparent: true, depthWrite: false, opacity: 0.5 })); m.userData.base = m.geometry.attributes.position.array.slice(); bowl.add(m); return m; });
      bowl.scale.setScalar(0.95);
      K.sun(S, { pos: [-8, 14, 10], target: [0, 2, 0], color: '#fff2dc', power: 1.5, size: 12, soft: 0.9 });
      K.skyLight(S, { color: '#ffe8c8', power: 0.45, size: 12, center: [0, 2, 0] });
      K.spot(S, { pos: [4, 8, -10], target: [0, 2, 3], color: '#ffd8a0', power: 900, angle: 0.5, penumbra: 1, shadow: false });   // 김 역광
      const items = [
        { k: 'p_l5', at: L5, y: 300, size: 92, kind: 'slam', color: '#10163f', strokeColor: 'rgba(255,248,230,0.8)', shadow: 'rgba(120,70,0,0.3)' },
        { k: 'p_l6', at: L6, y: 440, size: 100, kind: 'slam', color: '#d7263d', strokeColor: 'rgba(255,248,230,0.85)', shadow: 'rgba(120,70,0,0.3)' },
      ];
      const BZ = 3.2, sn = 0.3;
      const cam = ANBU.path([[0, [-7.5, 6.2, 13]], [C2 - 0.02, [-4, 5.8, 12]], [C2 + sn, [4.6, 3.6, 14.5], 'snap'], [L5 - 0.02, [4.0, 3.5, 15]], [L5 + sn, [0.4, 6.4, 28], 'snap'],
        [L6 - 0.02, [0.3, 6.2, 26]], [L6 + sn, [1.8, 9.0, BZ + 11], 'snap'], [D, [-2.8, 9.4, BZ + 11]]]);
      const aim = ANBU.path([[0, [-1.6, 5.1, -1.6]], [C2 - 0.02, [-0.9, 5.1, -1.6]], [C2 + sn, [1.0, 3.0, -0.6], 'snap'], [L5 - 0.02, [1.0, 3.0, -0.6]], [L5 + sn, [0, 3.4, 0], 'snap'],
        [L6 - 0.02, [0, 3.3, 0]], [L6 + sn, [0, 2.6, BZ - 0.6], 'snap'], [D, [0, 2.5, BZ - 0.6]]]);
      const fov = ANBU.path([[0, 32], [C2 + sn, 30, 'snap'], [L6 + sn, 30, 'snap'], [D, 30]]);
      return {
        update(t) {
          const a = K.spring(t - C1, 1.6, 0.6), b = K.spring(t - C2, 1.6, 0.6);
          c1.visible = t >= C1; c2.visible = t >= C2;
          const ex = K.ease.in(K.seg(t, L6 - 0.1, L6 + 0.45)); c1.position.set(-0.9 - 14 * (1 - a) - 6 * ex, 5.1 + 14 * ex, -1.6); c1.rotation.set(-0.12, 0.18, 0.07 - 0.4 * (1 - a));
          c2.position.set(1.0 + 14 * (1 - b) + 6 * ex, 2.7 + 14 * ex, -0.6); c2.rotation.set(-0.12, -0.16, -0.05 + 0.4 * (1 - b));
          const bw = K.spring(t - BOWL, 1.8, 0.55); bowl.visible = t > BOWL; bowl.position.set(0, 1.05 + 3 * (1 - bw), BZ);
          steams.forEach((m, i) => { const p = m.geometry.attributes.position, s0 = m.userData.base; for (let k = 0; k < p.count; k++) { const y = s0[k * 3 + 1]; p.setX(k, s0[k * 3] + 0.25 * Math.sin(y * 1.8 + t * 2.2 + i * 1.7)); } p.needsUpdate = true; m.position.set((i - 1.5) * 0.45, 2.2 + 0.2 * Math.sin(t + i), 0); m.quaternion.copy(camera.quaternion); m.material.opacity = 0.42 * K.seg(t, BOWL + 0.4, BOWL + 1.2); });
          // 카메라: 들어오는 첫 카드를 옆에서 따라감 → 둘째 카드(박 2)에 스냅 → 박 4 에 물러나 두 장 + 요금 → 박 6 '점심 한 끼'에 김 나는 그릇으로 크래시 푸시 → 그릇을 천천히 돎
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, [C2, L5, L6], 0.06, 8)); K.focus(camera, aim(t), 0.07);
        },
        overlay: KINE.overlay(items),
      };
    },
    sound(k) {
      k.play('slap', C1 + 0.15, { gain: 0.8 }); k.play('slap', C2 + 0.15, { gain: 0.8 });
      k.play('stamp', L5, { gain: 0.5 }); k.play('tock', BOWL + 0.1, { f: 300, gain: 0.8 }); k.play('success', L6, { f: 'C6', gain: 0.45 });
    },
  });
})();
