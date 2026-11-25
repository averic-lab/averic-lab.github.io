// 「혼자 산 지 3년」 3D 2차 — 공용 도구: device-hero 스튜디오 · 폰 · 날개 달린 안부 아이콘 · 알림 그리기.
// 폰은 붓 필터를 쓰지 않는다(주변과 대비되어 시선을 모은다). 1 단위 = 약 1.8cm(폰 폭 4.1).
(function () {
  const HERO = {}; window.HERO = HERO;
  const FONT = '"Noto Sans KR"';
  HERO.rrShape = (THREE, w, h, r) => { const s = new THREE.Shape(), x = w / 2, y = h / 2; s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2); s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5); return s; };
  HERO.slab = (THREE, w, h, r, depth, bevel, curve = 24) => {
    const g = new THREE.ExtrudeGeometry(HERO.rrShape(THREE, w - 2 * bevel, h - 2 * bevel, Math.max(0.001, r - bevel)), { depth: depth - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: curve });
    g.translate(0, 0, bevel - depth / 2);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return g;
  };
  // 스튜디오: 검은 배경 + 띠 조명(반사로만 모양이 난다) + 따뜻한 주광. o.warm/o.cool 로 색, o.floor 로 반사 바닥
  HERO.studio = (S, o = {}) => {
    const { THREE } = S, warm = o.warm || '#ffd6a0', cool = o.cool || '#8fa9d6', y = o.y || 4;
    const env = K.env(S, { top: '#07080b', horizon: '#0a0b0e', bottom: '#020203', intensity: o.envI ?? 1, blur: 0.004, panels: [
      { pos: [-18, y, 8], size: [0.6, 26], color: warm, power: 13 },
      { pos: [-11.8, y, 16], size: [0.25, 26], color: '#ffe4c4', power: 10 },
      { pos: [19.5, y, -3], size: [2.6, 26], color: cool, power: 6 },
      { pos: [2, y + 18, 3], size: [18, 7], color: warm, power: 3.5 },
      { pos: [-4.6, y + 5, -13], size: [0.7, 15], color: o.rimL || warm, power: 16 },
      { pos: [5.0, y + 5, -13], size: [0.7, 15], color: o.rimR || '#9db6de', power: 11 },
      { pos: [0, y + 11, -11], size: [7, 0.5], color: '#ffe4c4', power: 9 },
    ] });
    if (o.wall !== false) {
      const wall = K.canvasTex(1024, 512, (ctx, w, h) => { ctx.fillStyle = o.bg || '#07080b'; ctx.fillRect(0, 0, w, h); const g = ctx.createRadialGradient(w * 0.5, h * 0.7, 0, w * 0.5, h * 0.7, w * 0.28); g.addColorStop(0, o.glow || '#3d3226'); g.addColorStop(0.35, '#1c1712'); g.addColorStop(1, 'rgba(7,8,11,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(190, 95), new THREE.MeshBasicMaterial({ map: wall })); m.position.set(0, 24, -46); S.scene.add(m);
    }
    if (o.floor !== false) K.mirrorFloor(S, { y: 0, color: '#070708', roughness: 0.28, surfaceRoughness: 0.45, strength: 0.4, fresnel: true, resolution: 0.5, material: { envMap: env, envMapIntensity: 0.1 } });
    return env;
  };
  // 폰. draw(ctx, t, W, H) 가 화면(780×1688 = 390×844pt ×2)을 그린다
  HERO.phone = (S, o = {}) => {
    const { THREE } = S, g = new THREE.Group(), PW = 4.1, PH = 8.2, PD = 0.42, PR = 0.58;
    const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    const metal = new THREE.MeshStandardMaterial({ color: o.metal || '#a8a39b', roughness: 0.24, metalness: 1, envMap: o.env || null, envMapIntensity: 1 });
    const glass = new THREE.MeshPhysicalMaterial({ color: '#020203', roughness: 0.05, metalness: 0, ior: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, envMap: o.env || null });
    const backG = new THREE.MeshPhysicalMaterial({ color: o.back || '#2b2d31', roughness: 0.38, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.25, envMap: o.env || null });
    mesh(HERO.slab(THREE, PW, PH, PR, PD, 0.08, 40), metal);
    mesh(K.roundedRect(PW - 0.12, PH - 0.12, PR - 0.06, 16), glass, 0, 0, PD / 2 + 0.0008);
    const back = mesh(K.roundedRect(PW - 0.12, PH - 0.12, PR - 0.06, 16), backG, 0, 0, -PD / 2 - 0.0008); back.rotation.y = Math.PI;
    for (const [yy, h] of [[1.9, 0.9], [0.7, 0.55]]) mesh(K.roundedBox(0.07, h, 0.16, 0.03, 3), metal, PW / 2 + 0.02, yy, 0);
    const bump = mesh(K.roundedBox(1.25, 1.25, 0.12, 0.25, 4), backG, -0.95, 2.95, -PD / 2 - 0.06);
    for (const [x, y] of [[-1.22, 3.22], [-0.68, 3.22], [-1.22, 2.68]]) { const l = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 32), new THREE.MeshPhysicalMaterial({ color: '#05060a', roughness: 0.05, clearcoat: 1 }), x, y, -PD / 2 - 0.13); l.rotation.x = Math.PI / 2; }
    void bump;
    const SW = PW - 0.26, SH = PH - 0.26, SR = PR - 0.13;
    const tex = K.canvasTex(780, 1688, null); tex.anisotropy = 16;
    const scrM = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
    const scr = new THREE.Mesh(K.roundedRect(SW, SH, SR, 16), scrM); scr.position.z = PD / 2 + 0.0016; g.add(scr);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshBasicMaterial({ color: '#000' })); hole.position.set(0, SH / 2 - 0.26, PD / 2 + 0.003); g.add(hole);
    return { group: g, tex, scrM, PW, PH, PD, SW, SH, redraw(t) { if (o.draw) tex.redraw((ctx, W, H) => o.draw(ctx, t, W, H)); }, setBright(k) { scrM.color.setScalar(k); } };
  };
  // 화면 그림
  HERO.ui = {
    lock(ctx, W, H, { time = '18:00', date = '', top = '#2a3b5c', bot = '#5a4660' } = {}) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = `300 230px ${FONT}`; ctx.fillText(time, W / 2, 470);
      ctx.font = `500 46px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(date, W / 2, 230);
    },
    // 알림 카드. 반환 = 높이
    push(ctx, W, { icon, y = 620, title, body, k = 1, accent = null, app = '안부', now = '지금', scale = 1 }) {
      if (k <= 0) return 0;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.4); ctx.translate(0, (1 - K.ease.outBack(Math.min(1, k))) * -80);
      const x = 36, w = W - 72; ctx.font = `500 ${44 * scale}px ${FONT}`; const lines = ANBU.wrap(ctx, body, w - 70);
      const h = (150 + lines.length * 58) * scale;
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 44); ctx.fillStyle = 'rgba(246,244,240,0.97)'; ctx.fill(); ctx.shadowColor = 'transparent';
      if (accent) { ctx.beginPath(); ctx.roundRect(x, y, 14, h, 7); ctx.fillStyle = accent; ctx.fill(); }
      if (icon) { ctx.save(); ctx.beginPath(); ctx.roundRect(x + 34, y + 30, 52, 52, 13); ctx.clip(); ctx.drawImage(icon, x + 34, y + 30, 52, 52); ctx.restore(); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5a5e66'; ctx.font = `500 34px ${FONT}`; ctx.fillText(app, x + 104, y + 56);
      ctx.textAlign = 'right'; ctx.fillText(now, x + w - 36, y + 56);
      ctx.textAlign = 'left'; ctx.fillStyle = '#16181c'; ctx.font = `700 ${46 * scale}px ${FONT}`; ctx.fillText(title, x + 36, y + 120 * scale);
      ctx.font = `500 ${42 * scale}px ${FONT}`; ctx.fillStyle = '#2a2d33'; lines.forEach((l, i) => ctx.fillText(l, x + 36, y + (176 + i * 56) * scale));
      ctx.restore(); return h;
    },
  };
  // 날개 달린 안부 아이콘: 두께 있는 아이콘 타일 + 좌우 깃털 날개(깃털 11장). flap(0~1 펼침, 날갯짓 위상) 로 움직인다
  HERO.wingedIcon = (S, icon, o = {}) => {
    const { THREE } = S, g = new THREE.Group(), s = o.size || 1;
    const tile = new THREE.Group(); g.add(tile);
    const tex = new THREE.Texture(icon); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16; tex.needsUpdate = true;
    const side = new THREE.MeshPhysicalMaterial({ color: '#f2f2f2', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    const body = new THREE.Mesh(HERO.slab(THREE, s, s, s * 0.23, s * 0.16, s * 0.035), side); body.castShadow = true; tile.add(body);
    const face = new THREE.Mesh(K.roundedRect(s * 0.97, s * 0.97, s * 0.22, 12), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: o.glow ?? 0.25 }));
    face.position.z = s * 0.081; tile.add(face);
    const back = face.clone(); back.material = new THREE.MeshPhysicalMaterial({ color: '#e94b5a', roughness: 0.3, clearcoat: 1 }); back.position.z = -s * 0.081; back.rotation.y = Math.PI; tile.add(back);
    // 깃털 텍스처: 가운데 깃대 + 결 + 끝으로 갈수록 투명
    const fTex = K.canvasTex(128, 512, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#fbf6ee'); gr.addColorStop(1, '#efe3d0'); c.fillStyle = gr;
      c.beginPath(); c.moveTo(w / 2, 4); c.bezierCurveTo(w - 4, h * 0.15, w - 6, h * 0.7, w / 2, h - 4); c.bezierCurveTo(6, h * 0.7, 4, h * 0.15, w / 2, 4); c.fill();
      c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(160,140,120,0.35)'; c.lineWidth = 1;
      for (let i = 0; i < 70; i++) { const yy = 20 + i * 7; c.beginPath(); c.moveTo(w / 2, yy); c.lineTo(i % 2 ? w : 0, yy - 22); c.stroke(); }
      c.strokeStyle = 'rgba(150,120,95,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 10); c.lineTo(w / 2, h - 6); c.stroke();
    });
    const fMat = new THREE.MeshStandardMaterial({ map: fTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.75, emissive: '#fff4e0', emissiveIntensity: o.wingGlow ?? 0.12 });
    const wings = [-1, 1].map((sd) => {
      const root = new THREE.Group(); root.position.set(sd * s * 0.5, s * 0.08, -s * 0.02); g.add(root);
      const feathers = [];
      // 날개깃(긴 깃털 11장): 위·바깥쪽이 가장 길고 아래로 갈수록 짧다 / 덮깃(짧은 깃털 7장): 뿌리 쪽을 덮는다
      for (let i = 0; i < 11; i++) {
        const len = s * (1.45 - i * 0.085), wd = s * (0.22 - i * 0.004);
        const geo = new THREE.PlaneGeometry(wd, len); geo.translate(0, len / 2, 0);
        const f = new THREE.Mesh(geo, fMat); f.castShadow = true; root.add(f); feathers.push({ m: f, i, row: 0 });
      }
      for (let i = 0; i < 7; i++) {
        const len = s * (0.62 - i * 0.04), wd = s * 0.26;
        const geo = new THREE.PlaneGeometry(wd, len); geo.translate(0, len / 2, 0);
        const f = new THREE.Mesh(geo, fMat); f.castShadow = true; root.add(f); feathers.push({ m: f, i, row: 1 });
      }
      return { root, feathers, sd };
    });
    const api = {
      group: g, tile,
      // open: 0 접힘 → 1 펼침, phase: 날갯짓(라디안), tilt: 몸 기울기
      pose(open, phase = 0, flapAmt = 0.6) {
        for (const w of wings) {
          const beat = Math.sin(phase) * flapAmt * open;
          w.root.rotation.set(0, w.sd * (0.25 - 0.2 * beat), w.sd * (-0.35 + beat));
          for (const { m, i, row } of w.feathers) {
            // 펼침: 날개깃은 위-바깥(-0.95)에서 아래-바깥(+0.45)까지, 덮깃은 그 안쪽 좁은 범위
            const fanOpen = row === 0 ? -0.95 + i * 0.14 : -0.7 + i * 0.16, fanShut = row === 0 ? -1.5 + i * 0.02 : -1.45 + i * 0.02;
            const fan = fanOpen * open + fanShut * (1 - open);
            m.rotation.set(0.15 * Math.sin(phase + i * 0.35) * open, 0, -w.sd * (Math.PI / 2 + fan));
            m.position.set(w.sd * (row ? 0.02 : 0.05 + i * 0.012) * s, (row ? 0.04 : -i * 0.012) * s, (row ? 0.012 : -i * 0.003) * s);
            m.scale.setScalar(0.2 + 0.8 * open);
          }
        }
      },
    };
    api.pose(0);
    return api;
  };
})();
