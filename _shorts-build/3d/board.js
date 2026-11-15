// 화면이 켜지기 전 — 유리가 투명해지며 폰 전체 면적의 회로 기판이 비치고,
// 빛 펄스가 사방에서 가운데 칩으로 모인 뒤 칩이 번쩍이며 앱이 켜진다.
// 결정적: 시드 고정 난수만 쓴다.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createBoard({ phone, w, h, r, z, shapeGeo, radialTex }) {
  let seed = 4242; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const TW = 1024, TH = Math.round(TW * h / w);
  const px = x => (x / w + 0.5) * TW, py = y => (0.5 - y / h) * TH;        // 로컬 m → 텍스처 px
  const CX = TW / 2, CY = TH / 2, CHIP = 0.016, CPX = CHIP / w * TW;        // 칩: 정중앙 16mm

  // ── 기판 바탕(정적) ─────────────────────────────────────────────
  const base = document.createElement('canvas'); base.width = TW; base.height = TH;
  const g = base.getContext('2d');
  const bg = g.createRadialGradient(CX, CY, 40, CX, CY, TH * 0.7);
  bg.addColorStop(0, '#0c1a24'); bg.addColorStop(1, '#05090f');
  g.fillStyle = bg; g.fillRect(0, 0, TW, TH);
  // 미세한 섬유 결
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(120,160,200,${0.015 + rnd() * 0.02})`; g.fillRect(rnd() * TW, rnd() * TH, 1, 1); }

  // 회로 경로: 칩의 각 변 핀에서 바깥으로 나가 45° 꺾여 가장자리·부품까지
  const traces = [];
  const PINS = 9, pitch = CPX / (PINS + 1);
  const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]];     // 위·아래·왼쪽·오른쪽
  for (const [dx, dy] of sides) for (let k = 0; k < PINS; k++) {
    const o = (k + 1) * pitch - CPX / 2;
    const pin = dx === 0 ? [CX + o, CY + dy * CPX / 2] : [CX + dx * CPX / 2, CY + o];
    const p1 = [pin[0] + dx * (14 + rnd() * 10), pin[1] + dy * (14 + rnd() * 10)];
    const spread = (k - (PINS - 1) / 2) / ((PINS - 1) / 2);              // -1..1 부채꼴로 퍼짐
    const diag = 30 + rnd() * 120;
    const p2 = dx === 0 ? [p1[0] + spread * diag, p1[1] + dy * diag] : [p1[0] + dx * diag, p1[1] + spread * diag];
    const far = dx === 0 ? (dy < 0 ? 18 + rnd() * 60 : TH - 18 - rnd() * 60) : (dx < 0 ? 14 + rnd() * 40 : TW - 14 - rnd() * 40);
    const p3 = dx === 0 ? [p2[0], far] : [far, p2[1]];
    // 일부는 한 번 더 꺾인다
    const pts = [pin, p1, p2, p3];
    if (rnd() < 0.45) { const t = 40 + rnd() * 90, s = rnd() < .5 ? -1 : 1;
      pts.push(dx === 0 ? [p3[0] + s * t, p3[1] + dy * t] : [p3[0] + dx * t, p3[1] + s * t]); }
    traces.push(pts.map(([x, y]) => [Math.min(TW - 8, Math.max(8, x)), Math.min(TH - 8, Math.max(8, y))]));
  }
  // 장식용 짧은 회로(펄스 없음) — 밀도를 채운다
  const deco = [];
  for (let i = 0; i < 260; i++) {
    let x = rnd() * TW, y = rnd() * TH;
    if (Math.abs(x - CX) < CPX * 0.9 && Math.abs(y - CY) < CPX * 0.9) continue;
    const pts = [[x, y]]; let dir = Math.floor(rnd() * 8);
    for (let s = 0; s < 2 + Math.floor(rnd() * 3); s++) {
      const L = 20 + rnd() * 70, a = dir * Math.PI / 4; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]);
      dir = (dir + (rnd() < .5 ? 1 : -1) + 8) % 8;
    }
    deco.push(pts);
  }
  const path = (c, pts) => { c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(95,150,195,0.36)'; g.lineWidth = 1.6; for (const d of deco) { path(g, d); g.stroke(); }
  g.strokeStyle = 'rgba(125,185,230,0.62)'; g.lineWidth = 2.4; for (const t of traces) { path(g, t); g.stroke(); }
  // 끝점 비아·패드
  const via = (x, y, rr) => { g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fillStyle = 'rgba(205,170,95,0.85)'; g.fill(); g.beginPath(); g.arc(x, y, rr * 0.45, 0, Math.PI * 2); g.fillStyle = '#04070b'; g.fill(); };
  for (const t of traces) { const e = t[t.length - 1]; via(e[0], e[1], 4.2); }
  for (const d of deco) { const e = d[d.length - 1]; if (rnd() < .6) via(e[0], e[1], 2.6); }
  // 실크 인쇄(부품 번호) — 흐리게
  g.font = '600 13px "Menlo", monospace'; g.fillStyle = 'rgba(210,225,235,0.28)';
  const LBL = ['C12', 'R4', 'U7', 'L2', 'C38', 'R19', 'Q3', 'TP1', 'C5', 'U12', 'R27', 'D1', 'C44', 'L9', 'J2', 'R8'];
  for (let i = 0; i < 46; i++) g.fillText(LBL[i % LBL.length], rnd() * (TW - 60) + 10, rnd() * (TH - 20) + 16);
  // 칩 주변 핀 패드
  for (const t of traces) { g.fillStyle = 'rgba(210,180,110,0.9)'; g.fillRect(t[0][0] - 2.5, t[0][1] - 2.5, 5, 5); }
  // 기준점(피두셜)
  for (const [x, y] of [[40, 40], [TW - 40, 40], [40, TH - 40], [TW - 40, TH - 40]]) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fillStyle = 'rgba(215,180,100,0.8)'; g.fill(); }
  const baseTex = new THREE.CanvasTexture(base); baseTex.colorSpace = THREE.SRGBColorSpace; baseTex.anisotropy = 16;

  // ── 빛 펄스 레이어(가산 · HDR) ───────────────────────────────────
  const glowC = document.createElement('canvas'); glowC.width = TW; glowC.height = TH;
  const gg = glowC.getContext('2d'); gg.lineCap = 'round'; gg.lineJoin = 'round';
  const glowTex = new THREE.CanvasTexture(glowC); glowTex.colorSpace = THREE.SRGBColorSpace;
  // 각 회로: 바깥 끝 → 칩 쪽으로 흐르도록 뒤집고 누적 길이 계산
  const runs = traces.map(t => {
    const pts = t.slice().reverse(), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, L: cum[cum.length - 1], delay: rnd() * 0.32, dur: 0.42 + rnd() * 0.18 };
  });
  const at = (run, s) => {
    s = Math.max(0, Math.min(run.L, s));
    let i = 1; while (i < run.cum.length - 1 && run.cum[i] < s) i++;
    const a = run.pts[i - 1], b = run.pts[i], f = (s - run.cum[i - 1]) / (run.cum[i] - run.cum[i - 1] || 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
  function sub(run, s0, s1) {          // s0~s1 구간 부분 경로
    const pts = [at(run, s0)];
    for (let i = 1; i < run.cum.length; i++) if (run.cum[i] > s0 && run.cum[i] < s1) pts.push(run.pts[i]);
    pts.push(at(run, s1)); return pts;
  }

  // ── 3D: 기판 판 + 칩 + 작은 부품들 ──────────────────────────────
  const grp = new THREE.Group(); grp.position.z = z; phone.add(grp);
  // 반사가 강하면 기판이 회색으로 떠 보인다 — 환경 반사를 낮게
  const boardMat = new THREE.MeshPhysicalMaterial({ map: baseTex, roughness: 0.6, metalness: 0.0, clearcoat: 0.12, clearcoatRoughness: 0.3, envMapIntensity: 0.3, transparent: true, opacity: 0 });
  const board = new THREE.Mesh(shapeGeo(w, h, r, 40), boardMat); grp.add(board);
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(3.2, 3.4, 3.8), opacity: 1 });
  const glow = new THREE.Mesh(shapeGeo(w, h, r, 40), glowMat); glow.position.z = 0.00003; grp.add(glow);
  // 칩: 금속 테두리 + 짙은 다이
  const chip = new THREE.Mesh(new RoundedBoxGeometry(CHIP, CHIP, 0.0011, 3, 0.0008),
    new THREE.MeshPhysicalMaterial({ color: 0x9aa3b0, metalness: 1, roughness: 0.28, transparent: true, opacity: 0 }));
  chip.position.z = 0.00055; grp.add(chip);
  const dieMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0e14, metalness: 0.2, roughness: 0.22, clearcoat: 1, emissive: new THREE.Color(0.35, 0.65, 1.0), emissiveIntensity: 0, transparent: true, opacity: 0 });
  const die = new THREE.Mesh(new RoundedBoxGeometry(CHIP * 0.72, CHIP * 0.72, 0.0004, 2, 0.0004), dieMat);
  die.position.z = 0.00112; grp.add(die);
  // 작은 부품(저항·콘덴서) — 인스턴스
  const N = 170, smd = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhysicalMaterial({ color: 0x8c96a6, metalness: 0.85, roughness: 0.35, envMapIntensity: 0.6, transparent: true, opacity: 0 }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    let x, y; do { x = (rnd() - .5) * w * 0.92; y = (rnd() - .5) * h * 0.95; } while (Math.abs(x) < CHIP * 0.85 && Math.abs(y) < CHIP * 0.85);
    const big = rnd() < 0.08;
    sc.set(big ? 0.0022 : 0.0008 + rnd() * 0.0005, big ? 0.0016 : 0.0004 + rnd() * 0.0002, big ? 0.0006 : 0.0003);
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rnd() < .5 ? 0 : Math.PI / 2);
    ps.set(x, y, sc.z / 2 + 0.00003); m4.compose(ps, q, sc); smd.setMatrixAt(i, m4);
  }
  grp.add(smd);
  // 칩 번쩍임
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(false), color: new THREE.Color(2.4, 2.8, 3.4), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  flash.position.z = 0.0016; grp.add(flash);

  // 타임라인(초) — 본편 기준
  const T = { in0: 4.85, in1: 5.45, pulse: 5.25, flash: 6.02, reveal: 6.12, out: 6.9 };
  T.revealDur = 0.6;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ein = x => x * x;

  return {
    T,
    // 화면이 투명해지는 정도(0=검은 화면, 1=완전히 비침)
    xray: t => clamp((t - T.in0) / (T.in1 - T.in0)),
    // 앱이 칩에서 퍼지는 반지름 진행(0..1)
    reveal: t => clamp((t - T.reveal) / T.revealDur),
    update(t) {
      const vis = t > T.in0 - 0.05 && t < T.out + 0.2;
      grp.visible = vis; if (!vis) return;
      const fade = clamp((t - T.in0) / 0.5) * (1 - clamp((t - T.out) / 0.2));
      for (const mm of [boardMat, chip.material, dieMat, smd.material]) mm.opacity = fade;
      // 펄스
      gg.clearRect(0, 0, TW, TH);
      let arrived = 0;
      for (const run of runs) {
        const p = (t - T.pulse - run.delay) / run.dur;
        if (p < 0) continue;
        if (p >= 1) { arrived++; continue; }
        const e = ein(p), head = e * run.L, tail = Math.max(0, head - 120);
        // 꼬리를 여러 조각으로 — 앞쪽이 밝다
        for (let k = 0; k < 6; k++) {
          const s0 = tail + (head - tail) * k / 6, s1 = tail + (head - tail) * (k + 1) / 6;
          const a = (k + 1) / 6;
          path(gg, sub(run, s0, s1));
          gg.strokeStyle = `rgba(120,190,255,${0.22 * a})`; gg.lineWidth = 9; gg.stroke();
          gg.strokeStyle = `rgba(225,242,255,${0.95 * a})`; gg.lineWidth = 2.6; gg.stroke();
        }
        const hd = at(run, head); const rg = gg.createRadialGradient(hd[0], hd[1], 0, hd[0], hd[1], 14);
        rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(1, 'rgba(150,200,255,0)'); gg.fillStyle = rg; gg.fillRect(hd[0] - 14, hd[1] - 14, 28, 28);
      }
      // 도착한 만큼 칩 테두리가 차오른다
      const charge = arrived / runs.length;
      if (charge > 0) {
        gg.strokeStyle = `rgba(170,215,255,${0.25 + 0.6 * charge})`; gg.lineWidth = 3;
        gg.strokeRect(CX - CPX / 2 - 6, CY - CPX / 2 - 6, CPX + 12, CPX + 12);
      }
      // 앱이 퍼지는 테두리 링(기판 위, 화면 바깥쪽 가장자리)
      const rv = clamp((t - T.reveal) / T.revealDur);
      if (rv > 0 && rv < 1) {
        const R = 40 + rv * TH * 0.75;
        gg.beginPath(); gg.arc(CX, CY, R, 0, Math.PI * 2); gg.strokeStyle = `rgba(200,230,255,${0.8 * (1 - rv)})`; gg.lineWidth = 10; gg.stroke();
      }
      glowTex.needsUpdate = true;
      glowMat.opacity = fade;
      dieMat.emissiveIntensity = 0.4 * charge + 2.2 * Math.max(0, Math.sin(Math.PI * clamp((t - T.flash) / 0.35)));
      const fq = clamp((t - T.flash) / 0.45);
      flash.material.opacity = Math.sin(Math.PI * fq);
      flash.scale.setScalar(0.01 + 0.07 * fq);
    },
    // 앱이 퍼지는 중심(화면 dp 좌표용 비율)
    center: { u: 0.5, v: 0.5 },
  };
}
