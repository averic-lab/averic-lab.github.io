// thumbB — 썸네일 시안 B「한 창의 불빛」(정지 1장). hook 장면을 복사해 카메라를 낮은 올려다보기로 고정하고, 날개 아이콘이 그 창으로 날아가는 순간을 더했다.
// (원래 hook 설명) 장면 1. tiny-diorama: 떠 있는 땅 한 판 위의 밤 아파트 단지 미니어처.
// 수많은 창 가운데 딱 한 창만 따뜻하게 켜져 있다(혼자 지내는 소중한 사람). 카메라는 높은 3/4 시점에서 천천히 내려오며
// 그 창으로 다가간다. 틸트 시프트(얕은 초점)로 미니어처처럼 보인다.
// 자막: p_a1 혼자 지내는 / p_a2 소중한 사람, / p_a3 매일 걱정되시죠? — 박 0·3·6 에 들어와 끝까지 남는다.
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR;
  registerStyle({
    id: 'thumbB', name: 'Thumbnail B', duration: 1,
    koText: '혼자 지내는 소중한 사람, 매일 걱정되시죠?',
    render: { samples: 64, shutter: 0, tone: 'filmic', exposure: 1.05, bloom: 0.55, bloomThreshold: 0.95, vignette: 0.42, grain: 0.012, fov: 26, near: 0.1, far: 300, background: '#0a0e2a', saturation: 1.05 },
    async build(S) {
      const { THREE, camera, scene } = S;
      const R = K.rng(7);
      const env = K.env(S, { top: '#0b1236', horizon: '#26305e', bottom: '#05060c', intensity: 0.7, blur: 0.05, panels: [
        { pos: [-30, 34, 10], size: [5, 5], color: '#dfe8ff', power: 9, round: true },   // 달
        { pos: [30, 8, -20], size: [30, 10], color: '#3a4a8a', power: 1.5 },
      ] });
      // 밤하늘: 별 + 낮게 깔린 도시 빛
      const sky = K.canvasTex(1024, 2048, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#060a22'); g.addColorStop(0.55, '#121a4a'); g.addColorStop(0.8, '#2b2f5e'); g.addColorStop(1, '#3b3460'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        const r = K.rng(3); for (let i = 0; i < 700; i++) { const y = r() * h * 0.7, a = 0.25 + r() * 0.75 * (1 - y / h); c.fillStyle = `rgba(230,235,255,${a})`; const s = r() < 0.04 ? 2.4 : 1.1; c.fillRect(r() * w, y, s, s); }
        const mg = c.createRadialGradient(w * 0.2, h * 0.16, 4, w * 0.2, h * 0.16, 150); mg.addColorStop(0, 'rgba(240,244,255,1)'); mg.addColorStop(0.18, 'rgba(225,232,255,0.95)'); mg.addColorStop(0.2, 'rgba(200,210,255,0.25)'); mg.addColorStop(1, 'rgba(160,170,255,0)');
        c.fillStyle = mg; c.fillRect(0, 0, w, h);
      });
      const skyM = new THREE.Mesh(new THREE.PlaneGeometry(140, 280), new THREE.MeshBasicMaterial({ map: sky, toneMapped: true, depthWrite: false }));
      skyM.position.set(-10, 20, -70); skyM.lookAt(14, 10, 26); scene.add(skyM);

      // ---- 땅 한 판(두꺼운 판, 옆면은 흙·돌 단면)
      const side = K.canvasTex(1024, 256, (c, w, h) => {
        c.fillStyle = '#6b5440'; c.fillRect(0, 0, w, h); c.fillStyle = '#4d3b2c'; c.fillRect(0, h * 0.35, w, h); c.fillStyle = '#3a2d22'; c.fillRect(0, h * 0.75, w, h);
        c.fillStyle = '#3f6b3a'; c.fillRect(0, 0, w, h * 0.08);
        const r = K.rng(11); for (let i = 0; i < 260; i++) { const y = h * (0.15 + r() * 0.8); c.fillStyle = ['#8a7a68', '#5f554b', '#9b8d7a', '#2e241c'][i % 4]; c.beginPath(); c.ellipse(r() * w, y, 3 + r() * 9, 2 + r() * 6, r() * 3, 0, 7); c.fill(); }
      });
      const slab = new THREE.Mesh(K.roundedBox(19, 2.2, 15, 0.35, 5), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshStandardMaterial({ map: i === 2 ? null : side, color: i === 2 ? '#3d6a3c' : '#ffffff', roughness: 0.95 })));
      slab.position.y = -1.1; slab.receiveShadow = slab.castShadow = true; scene.add(slab);
      const top = K.canvasTex(2048, 1600, (c, w, h) => {
        c.fillStyle = '#3b6639'; c.fillRect(0, 0, w, h);
        const r = K.rng(5); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${40 + r() * 40},${80 + r() * 50},${40 + r() * 30},0.5)`; c.fillRect(r() * w, r() * h, 3, 3); }
        c.fillStyle = '#2b2d33'; c.fillRect(0, h * 0.72, w, h * 0.17);                // 길
        c.fillStyle = '#d9cf9a'; for (let x = 20; x < w; x += 150) c.fillRect(x, h * 0.803, 80, 9);
        c.fillStyle = '#8f8a82'; c.fillRect(0, h * 0.66, w, h * 0.06);               // 보도
        c.strokeStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < w; x += 60) { c.beginPath(); c.moveTo(x, h * 0.66); c.lineTo(x, h * 0.72); c.stroke(); }
        c.fillStyle = '#5b5850'; c.fillRect(w * 0.3, h * 0.34, w * 0.4, h * 0.3);   // 단지 마당(포장)
      });
      const topM = new THREE.Mesh(new THREE.PlaneGeometry(18.6, 14.6), new THREE.MeshStandardMaterial({ map: top, roughness: 0.92 }));
      topM.rotation.x = -Math.PI / 2; topM.position.y = 0.002; topM.receiveShadow = true; scene.add(topM);

      // ---- 아파트 동: 둥근 모서리의 모형 건물 + 창(유리·창틀) + 층마다 발코니 난간
      const wallMat = new THREE.MeshStandardMaterial({ color: '#d8d0c4', roughness: 0.85, envMap: env, envMapIntensity: 0.25 });
      const trim = new THREE.MeshStandardMaterial({ color: '#b9b1a5', roughness: 0.8 });
      const glass = new THREE.MeshPhysicalMaterial({ color: '#0a0f22', roughness: 0.06, metalness: 0.1, clearcoat: 1, envMap: env, envMapIntensity: 1.3 });
      const frameM = new THREE.MeshStandardMaterial({ color: '#efe9de', roughness: 0.6 });
      const railM = new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.4, metalness: 0.6 });
      const buildings = [
        { x: 0, z: 0, w: 6.0, h: 9.6, d: 4.0, cols: 4, floors: 8, hero: [2, 2] },
        { x: -6.6, z: -2.6, w: 4.4, h: 7.4, d: 3.8, cols: 3, floors: 6 },
        { x: 6.6, z: -2.2, w: 4.6, h: 11.0, d: 3.8, cols: 3, floors: 9 },
      ];
      let heroWin = null;
      const winGeo = new THREE.PlaneGeometry(0.82, 0.74), frameGeo = K.roundedBox(0.96, 0.9, 0.06, 0.02, 2);
      const nWin = buildings.reduce((s, b) => s + b.cols * b.floors, 0);
      const winI = new THREE.InstancedMesh(winGeo, glass, nWin), frI = new THREE.InstancedMesh(frameGeo, frameM, nWin);
      frI.castShadow = true; let wi = 0;
      const rodGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6); let nRod = 0; const rods = [];
      for (const b of buildings) {
        const body = new THREE.Mesh(K.roundedBox(b.w, b.h, b.d, 0.14, 4), wallMat); body.position.set(b.x, b.h / 2, b.z); body.castShadow = body.receiveShadow = true; scene.add(body);
        const roof = new THREE.Mesh(K.roundedBox(b.w + 0.12, 0.25, b.d + 0.12, 0.06, 2), trim); roof.position.set(b.x, b.h + 0.12, b.z); roof.castShadow = true; scene.add(roof);
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 20), new THREE.MeshStandardMaterial({ color: '#9db0b8', roughness: 0.5, metalness: 0.3 })); tank.position.set(b.x + b.w * 0.25, b.h + 0.6, b.z - 0.4); tank.castShadow = true; scene.add(tank);
        const fz = b.z + b.d / 2, sx = (b.w - 0.9) / (b.cols - 1 || 1);
        for (let f = 0; f < b.floors; f++) {
          const y = 1.05 + f * 1.08;
          if (f > 0) {
            const bal = new THREE.Mesh(K.roundedBox(b.w - 0.2, 0.07, 0.52, 0.02, 2), trim); bal.position.set(b.x, y - 0.56, fz + 0.26); bal.castShadow = bal.receiveShadow = true; scene.add(bal);
            const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, b.w - 0.24, 6), railM); rail.rotation.z = Math.PI / 2; rail.position.set(b.x, y - 0.12, fz + 0.5); scene.add(rail);
            for (let xx = -b.w / 2 + 0.2; xx <= b.w / 2 - 0.2; xx += 0.16) rods.push([b.x + xx, y - 0.33, fz + 0.5]);
          }
          for (let c = 0; c < b.cols; c++) {
            const x = b.x - (b.w - 0.9) / 2 + c * sx;
            const isHero = b.hero && b.hero[0] === c && b.hero[1] === f;
            K.place(frI, wi, [x, y, fz + 0.01]);
            K.place(winI, wi, [x, y, fz + 0.045], null, isHero ? 0.0001 : 1);
            if (isHero) heroWin = new THREE.Vector3(x, y, fz + 0.05);
            wi++;
          }
        }
        // 측면 실외기·배관 디테일
        for (let f = 1; f < b.floors; f += 2) { const ac = new THREE.Mesh(K.roundedBox(0.36, 0.28, 0.24, 0.03, 2), new THREE.MeshStandardMaterial({ color: '#e6e2da', roughness: 0.6 })); ac.position.set(b.x + b.w / 2 + 0.13, 1.0 + f * 1.08, b.z + b.d * 0.2); ac.castShadow = true; scene.add(ac); }
      }
      winI.instanceMatrix.needsUpdate = frI.instanceMatrix.needsUpdate = true; scene.add(winI, frI);
      const rodI = new THREE.InstancedMesh(rodGeo, railM, rods.length); rods.forEach((p, i) => K.place(rodI, i, p)); rodI.instanceMatrix.needsUpdate = true; rodI.castShadow = true; scene.add(rodI); void nRod;

      // ---- 켜진 창 하나: 커튼 너머 따뜻한 방(스탠드 빛, 화분 실루엣)
      const lit = K.canvasTex(256, 232, (c, w, h) => {
        const g = c.createRadialGradient(w * 0.62, h * 0.42, 6, w * 0.6, h * 0.5, w * 0.8); g.addColorStop(0, '#fff0c8'); g.addColorStop(0.35, '#ffc174'); g.addColorStop(1, '#a35a26'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(120,60,24,0.55)'; c.beginPath(); c.moveTo(w * 0.14, h * 0.95); c.lineTo(w * 0.24, h * 0.6); c.lineTo(w * 0.34, h * 0.95); c.fill();   // 스탠드 다리
        c.fillStyle = 'rgba(255,248,225,0.9)'; c.beginPath(); c.moveTo(w * 0.12, h * 0.45); c.lineTo(w * 0.36, h * 0.45); c.lineTo(w * 0.31, h * 0.25); c.lineTo(w * 0.17, h * 0.25); c.fill();   // 스탠드 갓
        for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(255,236,200,${0.12 + (i % 2) * 0.08})`; c.fillRect(i * w / 9, 0, w / 18, h); }   // 커튼 주름
        c.fillStyle = 'rgba(90,50,25,0.6)'; c.fillRect(w * 0.7, h * 0.72, w * 0.16, h * 0.22); c.beginPath(); c.ellipse(w * 0.78, h * 0.62, w * 0.12, h * 0.13, 0, 0, 7); c.fill();   // 화분
      });
      const litM = new THREE.MeshBasicMaterial({ map: lit, toneMapped: true }); litM.color.setScalar(2.2);
      const litMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.74), litM); litMesh.position.copy(heroWin); scene.add(litMesh);
      const winLight = new THREE.PointLight('#ffb766', 2.4, 2.6, 2); winLight.position.copy(heroWin).add(new THREE.Vector3(0, 0.1, 0.55)); scene.add(winLight);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.16, 16), new THREE.MeshStandardMaterial({ color: '#b5653c', roughness: 0.8 })); pot.position.set(heroWin.x + 0.3, heroWin.y - 0.48, heroWin.z + 0.32); pot.castShadow = true; scene.add(pot);
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: '#3f7a3a', roughness: 0.9 })); leaf.scale.set(0.5, 1.6, 1); leaf.position.set(pot.position.x + Math.cos(a) * 0.07, pot.position.y + 0.17 + (i % 2) * 0.05, pot.position.z + Math.sin(a) * 0.07); leaf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); scene.add(leaf); }

      // ---- 나무·가로등·작은 차(모형 소품)
      const trunkM = new THREE.MeshStandardMaterial({ color: '#6a4a33', roughness: 0.9 }), crownM = new THREE.MeshStandardMaterial({ color: '#2f5a33', roughness: 0.85 });
      for (const [x, z, s] of [[-3.5, 3.4, 1], [3.6, 3.6, 0.9], [-8.2, 2.4, 1.1], [8.4, 3.1, 1], [-1.2, 4.0, 0.7], [1.6, -4.5, 1], [-4, -5, 0.9]]) {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.11 * s, 0.9 * s, 8), trunkM); tr.position.set(x, 0.45 * s, z); tr.castShadow = true; scene.add(tr);
        const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * s, 2), crownM); cr.position.set(x, 1.25 * s, z); cr.scale.set(1, 1.15, 1); cr.castShadow = true; scene.add(cr);
      }
      const lampPos = [[-5.5, 4.55], [0.5, 4.55], [6.5, 4.55]];
      for (const [x, z] of lampPos) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.0, 8), railM); pole.position.set(x, 1.0, z); scene.add(pole);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd7a0').multiplyScalar(4) })); bulb.position.set(x, 2.02, z); scene.add(bulb);
        const pl = new THREE.PointLight('#ffcf8f', 2.2, 3.5, 1.8); pl.position.set(x, 1.9, z); scene.add(pl);
      }
      const car = new THREE.Mesh(K.roundedBox(1.2, 0.45, 0.6, 0.15, 3), new THREE.MeshStandardMaterial({ color: '#4a6fa5', roughness: 0.4, metalness: 0.3 })); car.position.set(-2.5, 0.32, 5.8); car.castShadow = true; scene.add(car);

      // ---- 빛: 차가운 달빛(앞 왼쪽 위) + 하늘 그늘 + 뒤 오른쪽 윤곽 빛
      K.sun(S, { pos: [-16, 22, 14], target: [0, 3, 0], color: '#a9bdf0', power: 1.35, size: 14, soft: 0.9, mapSize: 2048 });
      K.skyLight(S, { color: '#3b4c8a', power: 0.55, size: 14, center: [0, 3, 0], spread: 0.8 });
      K.spot(S, { pos: [18, 14, -16], target: [0, 4, 0], color: '#7f8fe0', power: 900, angle: 0.5, penumbra: 1, shadow: false });

      // 카메라: 떠 있는 땅 전체를 높이서 → 나선으로 내려오며 돌다가(0–2초) → '소중한 사람'(박 4)에 창 쪽으로 스냅 푸시
      // → 정면으로 호를 그리며 돌아 들어감 → '매일 걱정되시죠?'(박 8)에 한 번 더 크래시 푸시 → 끝까지 돌리 줌(다가가며 화각을 넓혀 원근이 늘어남)
      const W0 = heroWin, wp = (dx, dy, dz) => [W0.x + dx, W0.y + dy, W0.z + dz];
      const cam = ANBU.path([[0, [-50, 46, 42]], [1.95, [-21, 18, 25]], [2.35, [-6.5, 7.6, 13], 'snap'], [3.9, [2.4, 5.6, 11.5]], [4.3, wp(0.8, 0.7, 5.2), 'snap'], [8, wp(0.3, 0.3, 3.0)]]);
      const aim = ANBU.path([[0, [0, 1.5, 0]], [1.95, [0, 3, 0]], [2.35, wp(0, 0.6, 0), 'snap'], [3.9, wp(0, 0.45, 0)], [4.3, wp(0, 0.2, 0), 'snap'], [8, wp(0, 0.12, 0)]]);
      const fov = ANBU.path([[0, 26], [1.95, 25], [2.35, 22, 'snap'], [3.9, 23], [4.3, 24, 'snap'], [8, 38]]);
      const icon = await ANBU.loadIconImage(), Wg = HERO.wingedIcon(S, icon, { size: 0.6, glow: 0.04, wingGlow: 0.12 }); scene.add(Wg.group);
      const iL = new THREE.PointLight('#ffe0c0', 3, 4, 2); scene.add(iL);
      // 아이콘이 지나온 길에 남은 빛 꼬리
      const trail = new THREE.Mesh(K.tube([[W0.x - 3.6, W0.y - 1.9, W0.z + 5.5], [W0.x - 2.4, W0.y - 0.4, W0.z + 3.6], [W0.x - 0.95, W0.y + 0.45, W0.z + 1.9]], 0.02, { radial: 8 }), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd8a8').multiplyScalar(3), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(trail);
      const items = [
        { k: 'p_a1_3d', at: -1, y: 262, size: 88, kind: 'fade', color: '#fff8f0', strokeColor: 'rgba(5,8,30,0.9)', fixed: true },
        { k: 'p_a2_3d', at: -1, y: 478, size: 168, kind: 'fade', color: '#ffd166', strokeColor: 'rgba(40,20,0,0.9)', glow: 'rgba(255,170,80,0.55)', fixed: true },
      ];
      return {
        update(t) {
          // 낮은 곳에서 그 창을 올려다보는 구도 — 위층들이 원근으로 솟고, 날개 아이콘이 창으로 날아드는 순간
          K.look(camera, [W0.x - 4.2, W0.y - 2.6, W0.z + 9.5], [W0.x + 0.2, W0.y + 0.85, W0.z], 40, 0.06);
          K.focus(camera, W0.toArray(), 0.05);
          if (!this._w) { this._w = true; }
          Wg.group.position.set(W0.x - 0.95, W0.y + 0.45, W0.z + 1.9); Wg.group.rotation.set(0.05, 0.6, 0.2); Wg.pose(1, 1.3, 0.75);
          iL.position.copy(Wg.group.position).add(new THREE.Vector3(0, 0, 0.6));
          // 창 빛이 박마다 숨쉬듯(따뜻한 방) — 셋째 줄에서 한 번 더 환해진다
          const pulse = 1 + 0.08 * Math.sin(t * 2.2) + 0.35 * Math.exp(-Math.max(0, t - 8 * B) * 3) * (t > 8 * B ? 1 : 0);
          litM.color.setScalar((2.2 - 1.0 * K.smooth(4, 8, t)) * pulse); winLight.intensity = 2.4 * pulse;
          car.position.x = -2.5 + 1.2 * t;
        },
        overlay: (ctx, t, W, H) => { KINE.draw(ctx, t, W, H, items); KINE.guides(ctx, W, H); },
      };
    },
    sound(k) {
      k.bed('room', 0, D, { gain: 0.5 });
      k.tone(4 * B, { f: 'E5', dur: 1.2, gain: 0.035, a: 0.02, verb: 0.5 });
      k.play('ding', 8 * B, { f: 'B5', gain: 0.35 });
    },
  });
})();
