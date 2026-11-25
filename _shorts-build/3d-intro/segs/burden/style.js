// burden — 장면 2(2.5마디). 앞 절반: 나무 책상 위 폰(device-hero)에 '엄마' 발신 화면이 울리다 끊긴다(전화는 부담스럽고).
// 박 4 에서 휘팬 → 뒤 절반: tiny-diorama 풍경 — 굽이진 긴 길 끝, 언덕 위 작은 집 한 채에만 불(장면 1 의 그 창).
// 작은 차 한 대가 길 초입에서 느릿느릿(찾아가긴 어렵고). 두 세트는 같은 장면 안 서로 다른 자리에 있고 카메라가 건너뛴다.
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR, WHIP = 8 * B;
  registerStyle({
    id: 'burden', name: 'Unanswered call, far road', duration: D,
    koText: '잘 지내는지… 전화는 매번 부담스럽고 찾아가긴 정말 쉽지 않고 엄마',
    render: { samples: 32, shutter: 0.7, tone: 'filmic', exposure: 1.0, bloom: 0.45, bloomThreshold: 1.0, vignette: 0.4, grain: 0.014, fov: 30, near: 0.05, far: 400, background: '#15122e' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const mom = ANBU.S().alias[0];
      // ================= A: 책상 위 폰 (원점 근처)
      const env = HERO.studio(S, { floor: false, wall: false, warm: '#c9d6f0', cool: '#8fa9d6', rimL: '#9fb6e0' });
      const wood = K.canvasTex(2048, 2048, (c, w, h) => {
        c.fillStyle = '#4a3326'; c.fillRect(0, 0, w, h); const r = K.rng(9), n = K.noise(4);
        for (let y = 0; y < h; y += 2) { const v = n.fbm(0.002 * 0, y * 0.006, 0) * 0.5 + n.n2(y * 0.03, 1) * 0.5; c.fillStyle = `rgba(${90 + v * 40},${62 + v * 28},${44 + v * 20},0.55)`; c.fillRect(0, y, w, 2); }
        for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(40,25,16,${0.15 + r() * 0.2})`; c.lineWidth = 1 + r() * 2; c.beginPath(); const y0 = r() * h; c.moveTo(0, y0); for (let x = 0; x < w; x += 40) c.lineTo(x, y0 + Math.sin(x * 0.004 + i) * 30 + n.n2(x * 0.004, i) * 40); c.stroke(); }
        for (let x = 0; x < w; x += 512) { c.fillStyle = 'rgba(20,12,8,0.6)'; c.fillRect(x, 0, 3, h); }
      }, { repeat: [1, 1] });
      const desk = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, envMap: env, envMapIntensity: 0.35 }));
      desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);
      const icon = await ANBU.loadIconImage(); void icon;
      const phone = HERO.phone(S, { env, draw(ctx, t, W, H) {
        const end = K.smooth(6.1 * B, 6.6 * B, t);
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2c3552'); g.addColorStop(1, '#14182a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        // 아바타 원 + 이름(이름은 앱 문구 '엄마')
        const ring = 1 + 0.12 * Math.max(0, Math.sin(t * 9)) * (1 - end);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(W / 2, 560, 170 * ring, 0, 7); ctx.fill();
        ctx.fillStyle = '#5b6b9a'; ctx.beginPath(); ctx.arc(W / 2, 560, 130, 0, 7); ctx.fill();
        ctx.fillStyle = '#e8ecf8'; ctx.beginPath(); ctx.arc(W / 2, 520, 46, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(W / 2, 640, 80, 52, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = `700 96px "Noto Sans KR"`; ctx.fillText(mom, W / 2, 820);
        // 아래 버튼: 수화기 모양(빨강 = 끊기)
        const bx = W / 2, by = 1420;
        ctx.fillStyle = end > 0.5 ? '#6a2a2e' : '#e5484d'; ctx.beginPath(); ctx.arc(bx, by, 96, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(bx, by); ctx.rotate(2.36); ctx.scale(4.2, 4.2); ctx.translate(-12, -12); ctx.fillStyle = '#fff';
        ctx.fill(new Path2D('M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z')); ctx.restore();
        // 연결 점 세 개(울리는 동안 차례로 밝아짐)
        for (let i = 0; i < 3; i++) { const a = 0.25 + 0.75 * (Math.floor(t * 4) % 3 === i ? 1 : 0); ctx.fillStyle = `rgba(255,255,255,${a * (1 - end)})`; ctx.beginPath(); ctx.arc(W / 2 - 50 + i * 50, 930, 12, 0, 7); ctx.fill(); }
        if (end > 0) { ctx.fillStyle = `rgba(0,0,0,${0.75 * end})`; ctx.fillRect(0, 0, W, H); }
      } });
      phone.group.rotation.x = -Math.PI / 2; phone.group.position.set(0, phone.PD / 2 + 0.01, 0); scene.add(phone.group);
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.8, 2.0, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#e9e4da', roughness: 0.35, side: THREE.DoubleSide, envMap: env }));
      mug.position.set(4.6, 1.0, -3.4); mug.castShadow = true; scene.add(mug);
      const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.82, 32), new THREE.MeshStandardMaterial({ color: '#2a170d', roughness: 0.15 })); coffee.rotation.x = -Math.PI / 2; coffee.position.set(4.6, 1.75, -3.4); scene.add(coffee);
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.2, 12), new THREE.MeshStandardMaterial({ color: '#1d2433', roughness: 0.3, metalness: 0.4 })); pen.rotation.set(0, 0.5, Math.PI / 2); pen.position.set(-3.6, 0.1, 2.6); pen.castShadow = true; scene.add(pen);
      K.spot(S, { pos: [-7, 14, 6], target: [0, 0, 0], color: '#cfdcff', power: 900, angle: 0.45, penumbra: 0.9, soft: 0.8 });
      K.spot(S, { pos: [8, 5, -9], target: [0, 0.5, 0], color: '#6f86c8', power: 260, angle: 0.6, penumbra: 1, shadow: false });

      // ================= B: 먼 길 끝의 집 (x=200 쪽에 따로 둔 미니어처)
      const O = new THREE.Vector3(200, 0, 0);
      const g = new THREE.Group(); g.position.copy(O); scene.add(g);
      const n = K.noise(21);
      const terr = new THREE.PlaneGeometry(40, 60, 120, 180); terr.rotateX(-Math.PI / 2);
      const road = new THREE.CatmullRomCurve3([[-2, 0, 22], [3, 0, 14], [-4, 0, 6], [2, 0, -2], [-3, 0, -10], [1.5, 0, -18], [0, 0, -24]].map((p) => new THREE.Vector3(...p)));
      const rp = road.getSpacedPoints(300);
      const hAt = (x, z) => { const hill = Math.max(0, -z - 14) * 0.18; return n.fbm(x * 0.06, z * 0.06) * 1.6 + hill * 1.4 + Math.max(0, Math.abs(x) - 9) * 0.25; };
      const dRoad = (x, z) => { let m = 1e9; for (let i = 0; i < rp.length; i += 3) { const dx = rp[i].x - x, dz = rp[i].z - z; m = Math.min(m, dx * dx + dz * dz); } return Math.sqrt(m); };
      const pos = terr.attributes.position, col = [];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i), dr = dRoad(x, z), roadK = K.smooth(1.2, 0.5, dr);
        const y = hAt(x, z) * (1 - roadK * 0.7) - roadK * 0.05; pos.setY(i, y);
        const c = new THREE.Color().setHSL(0.27 + n.n2(x * 0.2, z * 0.2) * 0.04, 0.35, 0.22 + n.n2(x * 0.5, z * 0.5) * 0.04);
        if (roadK > 0.5) c.set('#3a3a40'); else if (dr < 1.6) c.lerp(new THREE.Color('#8a7a5a'), 0.6);
        col.push(c.r, c.g, c.b);
      }
      terr.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); terr.computeVertexNormals();
      const land = new THREE.Mesh(terr, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); land.receiveShadow = true; g.add(land);
      // 길의 노란 점선
      const dashI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.02, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8d48a').multiplyScalar(1.4) }), 80);
      for (let i = 0; i < 80; i++) { const u = i / 80, p = road.getPointAt(u), tg = road.getTangentAt(u); K.place(dashI, i, [p.x, hAt(p.x, p.z) * 0.3 - 0.03 + 0.05, p.z], [0, Math.atan2(tg.x, tg.z), 0]); }
      dashI.instanceMatrix.needsUpdate = true; g.add(dashI);
      // 나무(막대 사탕 나무) 여러 그루
      const NT = 160, trI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshStandardMaterial({ color: '#2b4f30', roughness: 0.9 }), NT);
      const tkI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), new THREE.MeshStandardMaterial({ color: '#5a3f2a' }), NT);
      { const r = K.rng(31); let k = 0; while (k < NT) { const x = (r() - 0.5) * 36, z = 26 - r() * 52; if (dRoad(x, z) < 1.8) continue; const y = hAt(x, z), s = 0.6 + r() * 0.8; K.place(trI, k, [x, y + 0.75 * s, z], null, [s, s * 1.25, s]); K.place(tkI, k, [x, y + 0.3 * s, z], null, s); k++; } }
      trI.castShadow = tkI.castShadow = true; trI.instanceMatrix.needsUpdate = tkI.instanceMatrix.needsUpdate = true; g.add(trI, tkI);
      // 언덕 위 집(끝): 벽·지붕·창 하나만 불
      const endP = road.getPointAt(1), hy = hAt(endP.x, endP.z) - 0.1;
      const house = new THREE.Group(); house.position.set(endP.x + 1.4, hy, endP.z - 1.2); g.add(house);
      const hw = new THREE.Mesh(K.roundedBox(2.2, 1.5, 1.8, 0.06, 2), new THREE.MeshStandardMaterial({ color: '#e2d8c6', roughness: 0.85 })); hw.position.y = 0.75; hw.castShadow = true; house.add(hw);
      const rg = new THREE.CylinderGeometry(0.01, 1.5, 1.0, 4, 1); rg.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#8a3b2e', roughness: 0.7 })); roof.scale.set(1.15, 1, 0.95); roof.position.y = 2.0; roof.castShadow = true; house.add(roof);
      const hwin = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc274').multiplyScalar(3.2) })); hwin.position.set(0.4, 0.85, 0.91); house.add(hwin);
      const hl = new THREE.PointLight('#ffb766', 3, 3, 2); hl.position.set(0.4, 0.9, 1.4); house.add(hl);
      // 길 초입의 작은 차
      const car = new THREE.Group(); g.add(car);
      const cb = new THREE.Mesh(K.roundedBox(0.7, 0.32, 1.3, 0.12, 3), new THREE.MeshStandardMaterial({ color: '#c94a3f', roughness: 0.4, metalness: 0.3 })); cb.position.y = 0.32; cb.castShadow = true; car.add(cb);
      const cab = new THREE.Mesh(K.roundedBox(0.6, 0.26, 0.7, 0.1, 3), new THREE.MeshPhysicalMaterial({ color: '#1a2233', roughness: 0.1, clearcoat: 1 })); cab.position.set(0, 0.58, -0.05); car.add(cab);
      for (const x of [-0.3, 0.3]) { const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff3cf').multiplyScalar(5) })); hl2.position.set(x * 0.7, 0.34, -0.66); car.add(hl2); }
      // 노을 끝 하늘(멀리)
      const sky = K.canvasTex(1024, 1024, (c, w, h) => { const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#1a1d48'); gg.addColorStop(0.55, '#5a3f78'); gg.addColorStop(0.8, '#e08a6a'); gg.addColorStop(1, '#f2b27a'); c.fillStyle = gg; c.fillRect(0, 0, w, h); });
      const skyM = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), new THREE.MeshBasicMaterial({ map: sky, depthWrite: false })); skyM.position.set(200, 18, -70); scene.add(skyM);
      K.sun(S, { pos: [O.x - 10, 9, -40], target: [O.x, 0, 0], color: '#ffb48a', power: 2.2, size: 30, soft: 1.2, mapSize: 2048 });
      K.skyLight(S, { color: '#6a73b8', power: 0.7, size: 30, center: [O.x, 0, 0] });

      // 카메라 동선(박 = 0.5초): A 0–4초 / B 4–8초
      const camA = ANBU.path([[0, [0.15, 3.4, 1.6]], [2.9, [1.2, 15, 8.4]], [3.25, [0.7, 10.5, 6.0], 'snap'], [WHIP, [0.6, 10.8, 6.2]]]);
      const aimA = ANBU.path([[0, [0, 0, -0.45]], [2.9, [0, 0, -2.3]], [3.25, [0, 0, -1.4], 'snap'], [WHIP, [0, 0, -1.4]]]);
      const fovA = ANBU.path([[0, 30], [2.9, 34], [3.25, 28, 'snap'], [WHIP, 28]]);
      const rollA = ANBU.path([[0, 0.7], [2.9, 0.04], [WHIP, 0]]);
      const HX = O.x + endP.x + 1.4, HZ = endP.z - 1.2;
      const camB = ANBU.path([[WHIP, [O.x + 1.2, 1.3, 27.6]], [5.6, [O.x + 3.8, 5.2, 14]], [D, [HX + 1.8, hy + 4.6, HZ + 13]]]);
      const aimB = ANBU.path([[WHIP, [O.x - 1.0, 0.6, 17]], [5.6, [O.x - 1.5, 1.4, 0]], [D, [HX, hy + 1.6, HZ]]]);
      const fovB = ANBU.path([[WHIP, 38], [5.6, 32], [D, 28]]);
      // 자막(3D 판 전용, 2026-11-26 사용자 확정): 잘 지내는지… / 전화는 매번 부담스럽고 / 찾아가긴 정말 쉽지 않고 — 박 0·2·8(휘팬)
      const items = [
        { k: 'p_b0_3d', at: 0.06, y: 300, size: 88, kind: 'fade', color: '#fff8f0' },
        { k: 'p_b1_3d', at: 2 * B, y: 420, size: 92, kind: 'sl', color: '#fff8f0', nowrap: true },
        { k: 'p_b2_3d', at: WHIP, y: 540, size: 92, kind: 'sr', color: '#ff9aa8', nowrap: true },
      ];
      return {
        update(t) {
          phone.redraw(t);
          if (t < WHIP) {
            // 부감으로 폰을 내려다보며 천천히 밀려 들어감. 울리는 동안 진동
            const ring = t < 6.1 * B ? 1 : 0, sh = ring * 0.05 * Math.sin(t * 95) * (Math.sin(t * 9) > 0 ? 1 : 0.2);
            phone.group.position.x = sh; phone.group.rotation.z = sh * 0.4;
            // '엄마' 이름 위 매크로에서 시작 → 돌며 끌어올려 책상 전체(스핀 아웃) → 끊기는 순간(박 6) 스냅 펀치 → 가속하며 오른쪽 휘팬
            const p = camA(t), a = aimA(t), whip = K.seg(t, WHIP - 0.35, WHIP, K.ease.in);
            K.look(camera, p, [a[0] + 14 * whip, a[1], a[2]], fovA(t), rollA(t));
            K.focus(camera, [0, 0, -0.2], t < 1 ? 0.02 : 0.08);
          } else {
            // 휘팬 도착: 길 초입, 차 뒤 낮은 자리 → 길을 따라 날아올라 언덕 위 집으로(크레인 업 + 돌리 인)
            const p = camB(t), a = aimB(t), arrive = 1 - K.ease.out(K.seg(t, WHIP, WHIP + 0.25));
            K.look(camera, [p[0] - 7 * arrive, p[1], p[2]], a, fovB(t), 0.12 * arrive);
            K.focus(camera, a, 0.18);
          }
          // 차는 아주 느리게(멀다)
          const cu = 0.06 + 0.06 * K.seg(t, WHIP, D), cp2 = road.getPointAt(cu), tg = road.getTangentAt(cu);
          car.position.set(cp2.x, hAt(cp2.x, cp2.z) * 0.3, cp2.z); car.rotation.y = Math.atan2(tg.x, tg.z) + Math.PI;
        },
        overlay: KINE.overlay(items, { pulse: 0.03 }),
      };
    },
    sound(k) {
      for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) k.tone(0.1 + i * 0.6 + j * 0.035, { f: 180, type: 'square', dur: 0.03, gain: 0.03, filter: 'lowpass', f2: 600 });   // 진동
      k.play('blip', 6.2 * B, { f: 'A4', dur: 0.12, gain: 0.6 });
      k.play('whoosh', WHIP - 0.18, { dur: 0.5, top: 3200, gain: 0.9 });
      k.bed('room', WHIP, D, { gain: 0.3 });
    },
  });
})();
