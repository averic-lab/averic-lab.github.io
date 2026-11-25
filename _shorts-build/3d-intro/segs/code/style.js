// code — 장면 5(3마디). 앞: 클립보드의 빈 가입 서류(칸만 있고 글자 없음)에 붉은 ✕ 도장이 쾅 → 서류가 뒤로 넘어가 떨어진다(회원가입 없음).
// 뒤: split-flap-board — 아래에서 올려다보는 각도의 청록 안내판에서 8칸이 촤르륵 넘어가 'K7M-4PXR'(원판과 같은 예시 코드)에서 멈춘다(코드 하나면 연결).
// 안내판은 이 장면만을 위한 간단한 판(칸마다 위·아래 반쪽 + 넘어가는 날개 한 장).
(function () {
  const B = ANBU.B, D = 4 * ANBU.BAR, STAMP = 2 * B, FALL = 5 * B, F0 = 6 * B;
  const CODE = 'K7M-4PXR', DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
  registerStyle({
    id: 'code', name: 'No sign-up, one code', duration: D,
    koText: '회원가입 없음 코드 하나면 연결 K7M-4PXR',
    render: { samples: 32, shutter: 0.5, tone: 'filmic', exposure: 1.0, bloom: 0.45, bloomThreshold: 1.0, vignette: 0.4, grain: 0.014, fov: 30, near: 0.05, far: 200, background: '#04100f' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const env = K.env(S, { top: '#05110f', horizon: '#0b2422', bottom: '#020605', intensity: 0.9, blur: 0.02, panels: [
        { pos: [-12, 10, 12], size: [10, 6], color: '#e8fff8', power: 5 }, { pos: [14, 4, 6], size: [1.2, 14], color: '#5eead4', power: 8 }, { pos: [0, 16, -6], size: [16, 2], color: '#ffffff', power: 3 }] });
      // 벽(살짝 거친 회벽, 청록)
      const wallT = K.canvasTex(1024, 1024, (c, w, h) => { c.fillStyle = '#0e2a27'; c.fillRect(0, 0, w, h); const r = K.rng(4); for (let i = 0; i < 6000; i++) { c.fillStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},0.035)`; c.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [3, 3] });
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.92 })); wall.position.set(0, 8, -1.2); wall.receiveShadow = true; scene.add(wall);

      // ---------- 안내판: 8칸
      const CW = 1.05, CH = 1.5, GAP = 0.12, N = CODE.length, BY = 3.0;
      const housing = new THREE.Mesh(K.roundedBox(N * (CW + GAP) + 0.6, CH + 0.7, 0.9, 0.12, 4), new THREE.MeshStandardMaterial({ color: '#1c2b29', roughness: 0.4, metalness: 0.6, envMap: env }));
      housing.position.set(0, BY, -0.6); housing.castShadow = housing.receiveShadow = true; scene.add(housing);
      const bezel = new THREE.Mesh(K.roundedBox(N * (CW + GAP) + 0.75, CH + 0.85, 0.7, 0.16, 4), new THREE.MeshStandardMaterial({ color: '#b8c7c2', roughness: 0.3, metalness: 1, envMap: env }));
      bezel.position.set(0, BY, -0.75); scene.add(bezel);
      // 글자 반쪽 재질(글자마다 위·아래)
      const glyph = (ch, accent) => K.canvasTex(256, 360, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a2624'); g.addColorStop(0.5, '#121c1b'); g.addColorStop(0.5, '#0d1514'); g.addColorStop(1, '#16211f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = accent ? '#7af0d2' : '#f1efe6'; c.font = `700 290px "Oswald", "Noto Sans KR"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, w / 2, h / 2 + 8);
        c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillRect(0, h / 2 - 3, w, 6);
      });
      const mats = {};
      const matFor = (ch, half, accent) => {
        const key = ch + half + (accent ? 'a' : '');
        if (!mats[key]) {
          const tx = glyph(ch, accent); tx.repeat.set(1, 0.5); tx.offset.set(0, half === 'top' ? 0.5 : 0);
          mats[key] = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.55, metalness: 0.05, envMap: env, envMapIntensity: 0.4, side: THREE.DoubleSide, emissive: accent ? '#3fd0b0' : '#000000', emissiveMap: accent ? tx : null, emissiveIntensity: accent ? 0.9 : 0 });
        }
        return mats[key];
      };
      const halfG = (top) => { const g = new THREE.PlaneGeometry(CW, CH / 2); g.translate(0, top ? CH / 4 : -CH / 4, 0); return g; };
      // 칸마다 넘김 순서: 무작위 글자 몇 장을 거쳐 목표 글자에서 멈춘다(왼쪽부터 차례로 멈춤)
      const R = K.rng(17), cells = [];
      for (let i = 0; i < N; i++) {
        const x = (i - (N - 1) / 2) * (CW + GAP);
        const top = new THREE.Mesh(halfG(true), matFor(' ', 'top')), bot = new THREE.Mesh(halfG(false), matFor(' ', 'bot'));
        top.position.set(x, BY, 0.01); bot.position.set(x, BY, 0.01); scene.add(top, bot);
        const flap = new THREE.Group(); flap.position.set(x, BY, 0.03); scene.add(flap);
        const ff = new THREE.Mesh(halfG(true), matFor(' ', 'top')), fb = new THREE.Mesh(halfG(true), matFor(' ', 'bot'));
        fb.rotation.x = Math.PI; fb.position.z = -0.002; flap.add(ff, fb); ff.castShadow = true;
        const seq = [' '], n = 5 + i * 2;
        for (let k = 0; k < n; k++) seq.push(DRUM[1 + Math.floor(R() * (DRUM.length - 1))]);
        seq.push(CODE[i]);
        const land = F0 + 0.55 + i * 0.13, step = (land - F0) / (seq.length - 1);
        cells.push({ top, bot, flap, ff, fb, seq, t0: F0, step, land });
      }
      const accentOn = F0 + 0.55 + N * 0.13 + 0.1;

      // ---------- 클립보드 + 빈 가입 서류
      const form = new THREE.Group(); scene.add(form);
      const board = new THREE.Mesh(K.roundedBox(3.4, 4.6, 0.12, 0.12, 3), new THREE.MeshStandardMaterial({ color: '#6b4a32', roughness: 0.7 })); board.castShadow = true; form.add(board);
      const paperT = K.canvasTex(800, 1060, (c, w, h) => {
        c.fillStyle = '#f6f3ec'; c.fillRect(0, 0, w, h); const r = K.rng(2); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(120,110,90,${r() * 0.05})`; c.fillRect(r() * w, r() * h, 2, 2); }
        c.fillStyle = '#c9c4b8'; c.fillRect(70, 90, 420, 34);                                  // 제목 자리
        for (let i = 0; i < 5; i++) { c.fillStyle = '#d8d3c7'; c.fillRect(70, 200 + i * 140, 200, 22); c.strokeStyle = '#b9b3a6'; c.lineWidth = 4; c.strokeRect(70, 236 + i * 140, 660, 62); }
        c.fillStyle = '#9aa2b4'; c.beginPath(); c.roundRect(70, 930, 660, 80, 16); c.fill();   // 버튼 자리
      });
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.98), new THREE.MeshStandardMaterial({ map: paperT, roughness: 0.9 })); paper.position.set(0, -0.2, 0.07); paper.castShadow = true; form.add(paper);
      const clip = new THREE.Mesh(K.roundedBox(1.4, 0.45, 0.25, 0.08, 3), new THREE.MeshStandardMaterial({ color: '#c9ccd2', roughness: 0.25, metalness: 1, envMap: env })); clip.position.set(0, 2.15, 0.12); form.add(clip);
      const stampT = K.canvasTex(512, 512, (c, w, h) => { c.strokeStyle = 'rgba(215,38,61,0.92)'; c.lineWidth = 62; c.lineCap = 'round'; c.beginPath(); c.moveTo(90, 90); c.lineTo(w - 90, h - 90); c.moveTo(w - 90, 90); c.lineTo(90, h - 90); c.stroke(); const r = K.rng(8); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 400; i++) { c.beginPath(); c.arc(r() * w, r() * h, r() * 5, 0, 7); c.fill(); } });
      const stamp = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshStandardMaterial({ map: stampT, transparent: true, roughness: 0.6, depthWrite: false })); stamp.position.set(0, -0.1, 0.09); form.add(stamp);
      const FY = 6.6; form.position.set(0, FY, 1.6);

      K.spot(S, { pos: [-6, 12, 12], target: [0, 4, 0], color: '#f2fffb', power: 650, angle: 0.5, penumbra: 0.85, soft: 0.9 });
      K.spot(S, { pos: [8, 1, 6], target: [0, 4, 0], color: '#5eead4', power: 500, angle: 0.6, penumbra: 1, shadow: false });
      K.spot(S, { pos: [0, 12, -4], target: [0, BY, 0], color: '#bff8ec', power: 300, angle: 0.5, penumbra: 1, shadow: false });

      // 카메라: 서류 정면 → 서류가 넘어가면 아래로 크레인하며 안내판을 아래에서 올려다봄
      // 카메라: 서류를 아래에서 올려다보며 다가감 → 도장(박 2)에 크래시 줌 + 흔들림 → 서류가 넘어가면 따라 내려가
      // 안내판 바로 앞 매크로로 칸을 왼쪽→오른쪽 따라가며(넘어가는 플랩) → 코드가 다 서면 확 물러나 전체를 보여 줌
      const LAND = F0 + 0.55 + N * 0.13;
      const cam = ANBU.path([[0, [1.6, FY - 2.6, 15]], [STAMP - 0.02, [1.0, FY - 1.8, 12.5]], [STAMP + 0.28, [0.4, FY - 0.9, 9.8], 'snap'], [FALL, [-0.6, FY - 0.4, 8.4]],
        [F0 - 0.05, [-4.8, BY - 0.2, 8.2], 'in'], [LAND - 0.15, [3.4, BY - 0.6, 6.6], 'lin'], [LAND + 0.45, [-4.6, BY - 5.4, 44], 'snap'], [D, [-3.8, BY - 4.6, 37]]]);
      const aim = ANBU.path([[0, [0, FY + 0.6, 1.6]], [STAMP - 0.02, [0, FY + 0.4, 1.6]], [STAMP + 0.28, [0, FY - 0.1, 1.6], 'snap'], [FALL, [0, FY - 0.2, 1.6]],
        [F0 - 0.05, [-2.9, BY + 0.5, 0], 'in'], [LAND - 0.15, [3.9, BY + 0.5, 0], 'lin'], [LAND + 0.45, [-0.1, BY + 2.6, 0], 'snap'], [D, [-0.1, BY + 2.3, 0]]]);
      const fov = ANBU.path([[0, 32], [STAMP + 0.28, 30, 'snap'], [F0 - 0.05, 34], [LAND - 0.15, 34], [LAND + 0.45, 30, 'snap'], [D, 30]]);
      const items = [
        { k: 'p_e1', at: 0.05, y: 330, size: 116, kind: 'slam', color: '#fff8f0' },
        { k: 'p_e2', at: 8 * B, y: 500, size: 92, kind: 'sl', color: '#7af0d2' },
      ];
      return {
        update(t) {
          // 도장: 위에서 크게 → 쾅
          const sp = K.seg(t, STAMP - 0.12, STAMP); stamp.visible = t > STAMP - 0.12; stamp.scale.setScalar(1 + 1.4 * (1 - sp)); stamp.material.opacity = sp;
          const shake = t > STAMP ? 0.08 * Math.exp(-(t - STAMP) * 10) * Math.sin(t * 90) : 0;
          // 서류가 아래 모서리를 축으로 뒤로 넘어가며 떨어짐
          const f = K.seg(t, FALL, FALL + 0.7, K.ease.in);
          form.rotation.x = -1.4 * f; form.position.set(shake, FY - 6 * f * f, 1.6 - 2 * f); form.visible = f < 0.99;
          // 안내판 넘김
          for (const c of cells) {
            const u = (t - c.t0) / c.step, i = Math.max(0, Math.min(c.seq.length - 1, Math.floor(u))), fr = t >= c.land ? 1 : u < 0 ? 0 : u - Math.floor(u);
            const cur = c.seq[i], nxt = c.seq[Math.min(c.seq.length - 1, i + 1)], acc = t > accentOn && t >= c.land;
            const done = t >= c.land;
            c.top.material = matFor(done || u < 0 ? cur : nxt, 'top', acc); c.bot.material = matFor(cur, 'bot', acc);
            c.ff.material = matFor(cur, 'top', acc); c.fb.material = matFor(nxt, 'bot', acc);
            c.flap.rotation.x = done ? 0 : -Math.PI * K.ease.in(fr); c.flap.visible = !done && u >= 0;
          }
          ANBU.shoot(camera, cam(t), aim(t), fov(t), ANBU.shake(t, [STAMP, accentOn], 0.12, 7));
          K.focus(camera, t < FALL ? [0, FY, 1.6] : t < LAND ? aim(t) : [0, BY, 0], t < LAND && t > F0 ? 0.04 : 0.1);
        },
        overlay: KINE.overlay(items),
      };
    },
    sound(k) {
      k.play('stamp', STAMP, { gain: 1.0 });
      k.play('paper', FALL, { dur: 0.5, gain: 0.8 });
      // 플랩 소리: 칸마다 넘어갈 때(따각)
      const R = K.rng(17); void R;
      for (let i = 0; i < 8; i++) { const land = F0 + 0.55 + i * 0.13, n = 6 + i * 2, step = (land - F0) / n; for (let j = 0; j < n; j++) k.play('tick', F0 + j * step + i * 0.003, { f: 3400 + i * 120, gain: 0.35 }); k.play('tock', land, { f: 900, gain: 0.4 }); }
      k.play('success', F0 + 0.55 + 8 * 0.13 + 0.1, { f: 'G5', gain: 0.4 });
    },
  });
})();
