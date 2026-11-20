// e1 — 책장이 넘어가면 그 뒤에서 안부 알림이 나무 블록(toy-blocks)으로 하나씩 떨어져 쌓인다.
// 햇살 드는 놀이방 바닥. 마지막 긴급 블록을 누르면 '위치 보기' 블록이 내려오고, 그것을 누르면 하얗게 날아가 e2 로.
// 시작 화면 = 팝업북 마지막 프레임(segs/e1/page.png)을 한 장의 책장으로 그려, 왼쪽 가장자리를 축으로 넘긴다(2D 위층).
// 이 파일은 직접 고치지 말고 _main.js 를 고친 뒤 `python3 _build.py` (블록 만드는 코드는 _toybox.js — toy-blocks 부품에서 가져옴).
{
  const DUR = 13.2;
  const PX = 300, EDGE = 0.07;
  const MAPLE = { base: '#e6cc9f', line: '150,100,52', light: '255,244,214' };
  const OAK = { base: '#a87c50', line: '70,42,20', light: '255,226,180' };
  const INK = '#2a2420', CREAM = '#f2e9d6';
  const BW = 3.6, BD = 1.3;
  const GRAV = 52, DROP_FROM = 17.5, BOUNCE = 0.12;
  const MSG = [
    { t: 1.75, title: '✅ 오늘 안부 확인 완료', body: '엄마 · 오늘 3,214보를 걸으셨습니다.', paint: '#86ad7c', tc: '#2c8048' },
    { t: 3.15, title: '✅ 수동 안부 확인', body: '아빠 · 보호 대상자가 직접 안부 확인을 보냈습니다.', paint: '#7fa3c4', tc: '#2c8048' },
    { t: 5.75, title: '⚠ 주의', body: '민수 · 오늘 예정된 안부 확인이 아직 없습니다. 직접 확인해 주세요.', paint: '#e0b440', tc: '#a46a00' },
    { t: 8.0, title: '🚨 긴급 도움 요청', body: '지수 · 보호 대상자가 직접 도움을 요청했습니다. 즉시 확인해 주세요.', paint: '#d95a4e', tc: '#c2362c', heavy: true },
  ];
  const BTN = { t: 10.65, size: [2.6, 0.8, 1.15], paint: '#5468d6' };
  const T_TOUCH1 = 10.25, T_TOUCH2 = 12.0, T_FLASH = 12.4;
  const F_TITLE = 74, F_BODY = 61, LH_BODY = 74, PADX = 52, ICON = 78;

  /*TOYBOX*/

  // ---- 블록 높이: 글자 줄 수로 정한다
  // 낱말 단위로 줄을 바꾼다(한국어도 띄어쓰기 단위 — 낱말 중간에서 끊지 않는다)
  function wrap(m, s, maxW) { const out = []; let cur = ''; for (const w of s.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (m.measureText(nx).width > maxW && cur) { out.push(cur); cur = w; } else cur = nx; } if (cur) out.push(cur); return out; }
  function layoutMsgs() {
    const m = document.createElement('canvas').getContext('2d');
    const inner = BW * PX - PADX * 2;
    return MSG.map((g) => {
      m.font = `700 ${F_BODY}px "Noto Sans KR"`; const lines = wrap(m, g.body, inner);
      m.font = `900 ${F_TITLE}px "Noto Sans KR"`; const tf = Math.min(F_TITLE, Math.floor(F_TITLE * (inner - ICON - 22) / m.measureText(g.title).width));
      const hTex = 44 + 88 + 10 + lines.length * LH_BODY + 36;
      return { ...g, lines, tf, h: hTex / PX };
    });
  }
  const msgArt = (g, icon) => (c, W, H) => {
    c.rotate(0.004 * (g.t % 2 ? 1 : -1));
    const x0 = -W / 2 + PADX, y0 = -H / 2 + 42;
    c.save(); c.beginPath(); c.roundRect(x0, y0 + 3, ICON, ICON, ICON * 0.23); c.clip(); c.drawImage(icon, x0, y0 + 3, ICON, ICON); c.restore();
    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `900 ${g.tf}px "Noto Sans KR"`; c.fillStyle = g.tc; c.fillText(g.title, x0 + ICON + 22, y0 + 46);
    c.font = `700 ${F_BODY}px "Noto Sans KR"`; c.fillStyle = INK;
    g.lines.forEach((ln, i) => c.fillText(ln, x0, y0 + 88 + 10 + LH_BODY * (i + 0.5)));
  };
  const btnArt = (c, W, H) => {
    c.textBaseline = 'middle'; c.textAlign = 'center'; c.font = '900 92px "Noto Sans KR"'; c.fillStyle = '#fbf6ea';
    c.fillText('🗺️ 위치 보기', 0, 4);
  };

  // ---- 떨어짐(toy-blocks 부품과 같은 닫힌 식)
  const fallTime = (d) => Math.sqrt(2 * (DROP_FROM - d.y) / GRAV);
  const bounceTime = (d) => 2 * BOUNCE * fallTime(d);
  const rockPhase = (d, tau) => 2 * Math.PI * d.hz * tau * (1 + 0.9 * tau);
  function dropPose(K, d, t) {
    const tau = t - d.tc, T = fallTime(d), tb = bounceTime(d), h = d.size[1] / 2;
    const lift = tau < 0 ? (DROP_FROM - d.y) - 0.5 * GRAV * Math.pow(Math.max(0, T + tau), 2) : tau < tb ? 0.5 * GRAV * tau * (tb - tau) : 0;
    const env = tau < 0 ? 1 - 1.5 * tau : Math.exp(-d.damp * tau) * (1 - K.smooth(0.5, 0.95, tau));
    const rz = d.tilt * env * (tau < 0 ? 1 : Math.cos(rockPhase(d, tau)));
    const rx = d.tiltX * env * (tau < 0 ? 1 : Math.cos(rockPhase(d, tau) * 1.31));
    const ry = d.yaw + d.spin * tau * (tau < 0 ? 1 : Math.exp(-14 * tau));
    return {
      x: d.x - Math.sign(rz) * d.pivot[0] * (1 - Math.cos(rz)) - h * Math.sin(rz),
      y: d.y + lift + d.pivot[0] * Math.abs(Math.sin(rz)) + d.pivot[1] * Math.abs(Math.sin(rx)) - h * (1 - Math.cos(rz) * Math.cos(rx)),
      z: d.z + Math.sign(rx) * d.pivot[1] * (1 - Math.cos(rx)) + h * Math.sin(rx),
      rx, ry, rz,
    };
  }
  function plan(K, L) {
    const r = K.rng(41), drops = []; let y0 = 0;
    L.forEach((g, i) => {
      const lean = r.sign(), hv = g.heavy ? 1.6 : 1;
      drops.push({ g, level: i, size: [BW, g.h, BD], tc: g.t, x: r.range(-0.05, 0.05), z: r.range(-0.03, 0.03), y: y0 + g.h / 2,
        yaw: r.range(-0.025, 0.025), spin: r.range(0.3, 0.7) * r.sign(), tilt: lean * r.range(0.05, 0.07) * hv, tiltX: r.range(-0.04, 0.04), hz: r.range(2.5, 3.2), damp: g.heavy ? 3.6 : 5.0,
        pivot: [BW / 2 * 0.98, BD / 2], sway: lean * (g.heavy ? 0.022 : 0.0035 * Math.pow(i + 1, 0.8)), swayHz: 1.7 / Math.sqrt(i + 1.4), swayDamp: g.heavy ? 1.9 : 3.0, swayFor: g.heavy ? 1.9 : 0.8 });
      y0 += g.h;
    });
    const b = BTN.size;
    drops.push({ btn: true, level: L.length, size: b, tc: BTN.t, x: 0.04, z: 0.02, y: y0 + b[1] / 2, yaw: -0.02, spin: 0.5, tilt: 0.06, tiltX: 0.03, hz: 3.3, damp: 4.6,
      pivot: [b[0] / 2, b[2] / 2], sway: 0.006, swayHz: 1.2, swayDamp: 2.2, swayFor: 1.2 });
    return { drops, top: y0 };
  }
  function towerSway(K, P, t) {
    let s = 0;
    for (const d of P.drops) { const tau = t - d.tc; if (tau > 0 && tau < d.swayFor) s += d.sway * Math.exp(-d.swayDamp * tau) * Math.sin(2 * Math.PI * d.swayHz * tau) * (1 - K.smooth(d.swayFor * 0.55, d.swayFor, tau)); }
    return s;
  }

  registerStyle({
    id: 'e1', duration: DUR,
    fonts: ['900 100px "Noto Sans KR"', '700 100px "Noto Sans KR"'],
    koText: MSG.map((g) => g.title + g.body).join('') + '위치 보기✅⚠🚨🗺️안부는 하루 한 번, 자동으로미리 연결한 가족에게 전해집니다.소식이 없으면,그것도 알려 줍니다.',
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.15, bloom: 0.12, bloomThreshold: 1.1, vignette: 0.28, grain: 0.02, fov: 22, background: '#3a2c20', contrast: 1.05, saturation: 1.02 },

    async build(S) {
      const { THREE, K, scene, camera } = S;
      const iconImg = await ANBU.loadIconImage();
      const pageImg = await new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = 'segs/e1/page.png'; });
      const L = layoutMsgs(), P = plan(K, L), toy = makeToyBox(S);
      const put = (m) => { m.rotation.order = 'ZXY'; scene.add(m); return m; };

      // ---------------- 햇빛: 왼쪽 낮은 오후 해가 창틀을 지나 바닥에 줄무늬 그림자를 그린다
      const sd = new THREE.Vector3(12, -7, -9).normalize(), TGT = new THREE.Vector3(0, 1.6, 0);
      const sunPos = TGT.clone().addScaledVector(sd, -34);
      K.sun(S, { pos: sunPos.toArray(), target: TGT.toArray(), color: '#ffd09a', power: 4.4, size: 13, soft: 0.9, mapSize: 4096, far: 70 });
      K.skyLight(S, { color: '#9fb6da', power: 0.75, size: 11, center: [0, 1.5, 0], mapSize: 1024 });
      K.env(S, { top: '#8a9bb8', horizon: '#c9b394', bottom: '#5a4430', intensity: 0.42, panels: [{ pos: sunPos.clone().multiplyScalar(0.5).toArray(), size: [10, 8], color: '#ffe0b0', power: 2.2 }, { pos: [14, 8, 16], size: [8, 8], color: '#a9bde0', power: 0.7 }] });
      // 창이 난 벽(화면 밖): 해 쪽에 서서 빛을 창 모양으로 잘라 낸다. 창살은 탑을 비켜 바닥에 떨어지게 둔다
      const win = new THREE.Group(); win.position.copy(TGT).addScaledVector(sd, -11); win.lookAt(TGT); scene.add(win);
      const occ = new THREE.MeshBasicMaterial({ color: '#000', colorWrite: false, depthWrite: false }), bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), occ); m.position.set(x, y, 0); m.castShadow = true; win.add(m); };
      const HW = 4.4, HH = 3.9;
      bar(30, 15, 0, HH + 7.5); bar(30, 15, 0, -HH - 7.5); bar(15, 2 * HH, -HW - 7.5, 0); bar(15, 2 * HH, HW + 7.5, 0);
      bar(0.22, 2 * HH, -3.0, 0); bar(0.22, 2 * HH, 3.05, 0); bar(2 * HW, 0.2, 0, -HH + 1.0);
      // 먼 벽의 창빛 한 조각
      K.spot(S, { pos: [-7, 9, 6], target: [-3.6, 4.2, -7], color: '#ffcf96', power: 1.1 * 220, angle: 0.13, penumbra: 0.6, shadow: false });

      // ---------------- 바닥(참나무 널)과 먼 벽
      const fData = K.canvasTex(2048, 2048, null, { data: true, repeat: [3, 3] });
      const fMap = K.canvasTex(2048, 2048, (c, W, H) => {
        const d = fData.ctx, r = K.rng(9), bh = H / 8;
        for (let i = 0; i < 8; i++) {
          for (const x of [c, d]) { x.save(); x.beginPath(); x.rect(0, i * bh, W, bh); x.clip(); x.translate(0, i * bh); }
          toy.wood(c, d, W, bh, 60 + i, 'h', OAK, 132, 0.7);
          c.fillStyle = `rgba(${r() < 0.5 ? '40,20,6' : '255,224,170'},${r.range(0.03, 0.1)})`; c.fillRect(0, 0, W, bh);
          for (const x of [c, d]) x.restore();
        }
        for (let i = 0; i <= 8; i++) for (const [x, col] of [[c, 'rgba(40,22,8,0.85)'], [d, 'rgb(30,200,0)']]) { x.fillStyle = col; x.fillRect(0, i * bh - 2, W, 4); }
        for (let i = 0; i < 8; i++) { const sx = r.range(0, W); for (const [x, col] of [[c, 'rgba(40,22,8,0.8)'], [d, 'rgb(30,200,0)']]) { x.fillStyle = col; x.fillRect(sx, i * bh, 4, bh); } }
      }, { repeat: [3, 3] });
      const floor = K.mirrorFloor(S, { y: 0, size: 1, roughness: 0.3, strength: 0.22, fresnel: true, resolution: 0.5, material: { color: '#ffffff', map: fMap, bumpMap: fData, bumpScale: 2.0, roughnessMap: fData, roughness: 0.6 } });
      floor.scale.set(36, 36, 1); floor.position.set(0, 0, -4);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: '#cbbca3', roughness: 0.95 }));
      wall.position.set(0, 15, -9); wall.receiveShadow = true; scene.add(wall);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(60, 0.5, 0.12), new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 0.7 }));
      skirt.position.set(0, 0.25, -8.94); skirt.castShadow = skirt.receiveShadow = true; scene.add(skirt);

      // ---------------- 블록
      const bodies = P.drops.map((d, i) => {
        if (d.btn) {
          const f = { paint: BTN.paint, art2: btnArt }, s = { paint: BTN.paint };
          return put(toy.block({ size: d.size, seed: 90, faces: { front: f, back: s, top: s, bottom: s, left: s, right: s } }));
        }
        const g = d.g, front = { paint: CREAM, art2: msgArt(g, iconImg), wear: 0.7 };
        const side = g.heavy ? { paint: g.paint, glow: '#ff3b2f', glowK: 0.0 } : { paint: g.paint };
        return put(toy.block({ size: d.size, seed: 20 + i * 3, faces: { front, back: side, top: side, bottom: side, left: side, right: side } }));
      });
      const redI = MSG.findIndex((g) => g.heavy), redMats = bodies[redI].material.filter((m) => m.emissive && m.emissive.r > 0.5);
      const redLight = new THREE.PointLight('#ff4434', 0, 7, 2); scene.add(redLight);

      // ---------------- 카메라: 아이 눈높이의 긴 렌즈. 탑이 자라는 만큼 천천히 올라가며 한 번 돈다
      const aimAt = K.path([[0, [0, 2.3, 0.65]], [6.0, [0, 2.55, 0.65]], [9.3, [0, 2.78, 0.65]], [11.2, [0, 3.05, 0.65]], [DUR, [0, 3.15, 0.65]]]);
      const posAt = K.path([[0, [-1.5, 3.4, 22.0]], [6.0, [-0.7, 3.75, 22.6]], [9.3, [0.2, 4.0, 22.8]], [11.2, [0.7, 4.3, 22.2]], [DUR, [0.9, 4.4, 21.6]]]);
      const v = new THREE.Vector3(), touch1 = { x: 540, y: 900 }, touch2 = { x: 540, y: 700 };
      const proj = (p, out) => { v.set(p[0], p[1], p[2]).project(camera); out.x = (v.x + 1) / 2 * 1080; out.y = (1 - v.y) / 2 * 1920; };
      const redD = P.drops[redI], btnD = P.drops[P.drops.length - 1];

      const self = {
        update(t) {
          const sway = towerSway(K, P, t);
          P.drops.forEach((d, i) => {
            const p = dropPose(K, d, t), m = bodies[i], tau = t - d.tc;
            const ang = sway * K.seg(tau, -0.05, 0.02), dx = p.x, dy = p.y, hw = BW / 2;
            let jz = 0, jy = 0;
            for (const e of P.drops) { const te = t - e.tc; if (e.level > d.level && te > 0 && te < 0.5) { const k = Math.exp(-11 * te) / (e.level - d.level) * (e.g && e.g.heavy ? 2 : 1); jz += 0.006 * k * Math.sin(52 * te + i); jy += 0.008 * k * Math.sin(38 * te + i * 2.1); } }
            m.position.set(dx * Math.cos(ang) - dy * Math.sin(ang) - Math.sign(ang) * hw * (1 - Math.cos(ang)), hw * Math.abs(Math.sin(ang)) + dx * Math.sin(ang) + dy * Math.cos(ang), p.z);
            m.rotation.set(p.rx, p.ry + jy, p.rz + ang + jz);
            m.visible = tau > -fallTime(d);
          });
          // 긴급 블록: 떨어진 뒤 붉게 숨 쉰다, 누른 순간 한 번 번쩍
          const pulse = 0.5 + 0.5 * Math.sin((t - redD.tc) * 5.2), on = K.seg(t, redD.tc + 0.3, redD.tc + 1.0);
          const tap = Math.exp(-Math.pow((t - T_TOUCH1 - 0.08) * 6, 2));
          const glow = on * (0.18 + 0.32 * pulse) + 0.45 * tap;
          redMats.forEach((m) => { m.emissiveIntensity = glow; });
          const rm = bodies[redI].position;
          redLight.position.set(rm.x, rm.y - 0.2, rm.z + 2.8); redLight.intensity = on * (1.4 + 2.2 * pulse) + 3 * tap;
          // 카메라: 끝에서 '위치 보기' 블록으로 밀고 들어간다
          const push = K.seg(t, 11.85, T_FLASH + 0.7, K.ease.in);
          const pp = posAt(t), aa = aimAt(t), bm = bodies[bodies.length - 1].position;
          const pos = [K.lerp(pp[0], bm.x, push * 0.6), K.lerp(pp[1], bm.y + 0.4, push * 0.6), pp[2] - 9 * push];
          K.look(camera, pos, [K.lerp(aa[0], bm.x, push), K.lerp(aa[1], bm.y, push), aa[2]]);
          K.focus(camera, [rm.x, K.lerp(2.4, rm.y, K.seg(t, 7.5, 9.5)), BD / 2], 0.05);
          camera.updateMatrixWorld();
          proj([rm.x, rm.y, BD / 2 + 0.02], touch1); proj([bm.x, bm.y, BTN.size[2] / 2 + 0.02], touch2);
        },
        overlay(ctx, t, W, H) {
          drawPage(ctx, t, W, H);
          CAP.draw(ctx, t, W, H, [
            { a: 0.9, b: 5.45, lines: ['안부는 하루 한 번, 자동으로', '*미리 연결한 가족에게* 전해집니다.'] },
            { a: 5.85, b: 9.5, lines: ['소식이 없으면,', '그것도 알려 줍니다.'] },
          ]);
          ring(ctx, t, touch1, T_TOUCH1); ring(ctx, t, touch2, T_TOUCH2);
          const fl = K.seg(t, T_FLASH, T_FLASH + 0.6, K.ease.in);
          if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
        },
      };

      // ---- 책장 넘기기: 화면 전체가 한 장의 책장. 왼쪽 가장자리를 축으로 오른쪽 끝이 들려 왼쪽으로 넘어간다
      function drawPage(ctx, t, W, H) {
        // 책장이 화면 안쪽(뒤)으로 넘어간다: 오른쪽 끝이 먼저 멀어지며 왼쪽 가장자리 쪽으로 접히고, 그 뒤 장면이 드러난다
        const u = K.seg(t, 0.1, 1.35, K.ease.inOut);
        if (u >= 1) return;
        if (u <= 0) { ctx.drawImage(pageImg, 0, 0, W, H); return; }
        const N = 160, du = W / N, f = 2400, cy = H / 2, th0 = u * (Math.PI / 2 + 0.12), curl = 0.55 * Math.sin(u * Math.PI);
        const pts = [{ X: 0, Z: 0, th: th0 }]; let X = 0, Z = 0;
        for (let i = 0; i < N; i++) { const th = Math.min(Math.PI * 0.98, th0 + curl * Math.pow((i + 0.5) / N, 2)); X += du * Math.cos(th); Z -= du * Math.sin(th); pts.push({ X, Z, th }); }
        // 넘어가는 책장이 장면에 드리우는 그림자(책장 오른쪽 끝 바로 옆)
        let ex = 0; for (const q of pts) ex = Math.max(ex, q.X * f / (f - q.Z));
        const sw = 220 + 260 * Math.sin(th0), sa = 0.55 * (1 - u);
        const sh = ctx.createLinearGradient(ex, 0, ex + sw, 0); sh.addColorStop(0, `rgba(10,6,2,${sa})`); sh.addColorStop(1, 'rgba(10,6,2,0)');
        ctx.fillStyle = sh; ctx.fillRect(ex, 0, sw, H);
        const sx = pageImg.width / W;
        for (let i = N - 1; i >= 0; i--) {                        // 먼 쪽(오른쪽 끝)부터 그린다
          const a = pts[i], b = pts[i + 1];
          const sa2 = f / (f - a.Z), sb = f / (f - b.Z), xa = a.X * sa2, xb = b.X * sb, s = (sa2 + sb) / 2;
          const x0 = Math.min(xa, xb), w = Math.abs(xb - xa) + 1.2, top = cy - cy * s, hh = H * s;
          if (x0 > W + 10 || x0 + w < -10) continue;
          if (xb >= xa) {
            ctx.drawImage(pageImg, i * du * sx, 0, du * sx + 0.5, pageImg.height, x0, top, w, hh);
            const dark = 0.6 * (1 - Math.cos(b.th));
            if (dark > 0.005) { ctx.fillStyle = `rgba(18,10,4,${Math.min(0.75, dark)})`; ctx.fillRect(x0, top, w, hh); }
          } else {
            const k = 0.5 + 0.3 * Math.abs(Math.cos(b.th));
            ctx.fillStyle = `rgb(${Math.round(236 * k)},${Math.round(224 * k)},${Math.round(200 * k)})`; ctx.fillRect(x0, top, w, hh);
          }
        }
        // 책장 두께: 오른쪽 끝의 얇은 밝은 단면
        const e = pts[N], se = f / (f - e.Z);
        ctx.fillStyle = `rgba(250,240,220,${0.8 * Math.sin(th0)})`; ctx.fillRect(e.X * se - 2, cy - cy * se, 3, H * se);
      }
      function ring(ctx, t, p, a) {
        const b = a + 0.75, u = (t - a) / (b - a); if (u < 0 || u > 1) return;
        const e = 1 - Math.pow(1 - u, 3), fade = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
        ctx.save(); ctx.globalAlpha = Math.max(0, fade) * 0.95;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 46 + 120 * e); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.5, 'rgba(255,240,215,0.3)'); g.addColorStop(1, 'rgba(255,240,215,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 46 + 120 * e, 0, 7); ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(p.x, p.y, 20 + 100 * e, 0, 7); ctx.stroke();
        const dotA = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.3; if (dotA > 0) { ctx.globalAlpha = dotA; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, 26 * (1 - 0.25 * Math.sin(Math.min(1, u * 4) * 3.14)), 0, 7); ctx.fill(); }
        ctx.restore();
      }

      // 위치 점검(렌더 로그에 화면 픽셀)
      const pr = (p) => { const q = new THREE.Vector3(...p).project(camera); return `${Math.round((q.x + 1) / 2 * 1080)},${Math.round((1 - q.y) / 2 * 1920)}`; };
      for (const t of [2.5, 9.4, 12.0]) { self.update(t); console.warn(`[e1 t=${t}] floorL ${pr([-BW / 2, 0, BD / 2])} floorR ${pr([BW / 2, 0, BD / 2])} towerTop ${pr([0, P.top, BD / 2])} btnTop ${pr([0, P.top + BTN.size[1], BD / 2])}`); }
      console.warn('[e1 heights] ' + L.map((g) => g.h.toFixed(2) + '/' + g.lines.length).join(' '));
      return self;
    },

    sound(k) {
      const K = globalThis.K, r = K.rng(5);
      const knock = (t, g, f, pan) => {
        k.tone(t, { f: [[0, f * 1.3], [0.035, f]], dur: 0.1, gain: 0.5 * g, pan, verb: 0.16 });
        k.tone(t, { f: [[0, f * 0.62], [0.08, f * 0.5]], dur: 0.13, gain: 0.34 * g, pan });
        k.tone(t, { f: f * 2.76, dur: 0.04, gain: 0.14 * g, pan });
        k.noise(t, { dur: 0.024, filter: 'bandpass', f: f * 3.4, q: 1.1, gain: 0.55 * g, pan });
        k.noise(t, { dur: 0.08, color: 'brown', filter: 'lowpass', f: 320, gain: 0.6 * g, pan });
      };
      k.play('paper', 0.2, { gain: 0.6, dur: 0.9 }); k.play('swish', 0.55, { gain: 0.35, dur: 0.7 });
      MSG.forEach((g, i) => {
        const f = (g.heavy ? 330 : 440 + r.range(-30, 40)) * (1 - 0.03 * i);
        k.play('whoosh', g.t - 0.22, { gain: g.heavy ? 0.4 : 0.22, dur: 0.25, top: 1600 });
        knock(g.t, g.heavy ? 1.2 : 0.9, f, -0.1); knock(g.t + 0.07, 0.35, f * 1.12, -0.1);
        if (g.heavy) { k.play('thud', g.t + 0.01, { gain: 0.5, f: 70 }); k.play('impact', g.t, { gain: 0.3 }); k.play('ding', g.t + 0.18, { gain: 0.3, f: 'B5' }); k.play('ding', g.t + 0.34, { gain: 0.26, f: 'B5' }); }
        else k.play('ding', g.t + 0.14, { gain: 0.11 + 0.02 * i, f: ['E6', 'G6', 'D6'][i] });
      });
      k.play('tick', T_TOUCH1, { gain: 0.6, f: 2800 }); k.play('tock', T_TOUCH1 + 0.01, { gain: 0.3, f: 520 });
      k.play('whoosh', BTN.t - 0.2, { gain: 0.25, dur: 0.25, top: 1800 }); knock(BTN.t, 0.85, 560, 0.1); knock(BTN.t + 0.07, 0.3, 620, 0.1);
      k.play('tick', T_TOUCH2, { gain: 0.6, f: 3000 }); k.play('tock', T_TOUCH2 + 0.01, { gain: 0.3, f: 620 });
      k.play('riser', T_FLASH - 0.15, { gain: 0.5, dur: 0.8 }); k.play('whoosh', T_FLASH, { gain: 0.5, dur: 0.7, top: 3200 }); k.play('sparkle', T_FLASH + 0.3, { gain: 0.3, n: 4 });
    },
  });
}
