// 「안부 앱 소개」 3D 판 — 모든 장면이 공유하는 값. 곡 Electro Dreams(Arulo, 120 BPM). 장면은 모두 마디 단위라 장면 첫 순간 = 마디 첫 박.
(function () {
  const B = 0.5;                     // 1박(초) — Electro Dreams 실측 120.0 BPM(1박 = 15프레임, 1마디 = 2초)
  const BAR = 4 * B;                 // 1마디 1.95139초
  window.ANBU = {
    B, BAR,
    beat: (n) => n * B,              // 장면 안 시각: n박째
    // 공통 색: 거의 검은 바탕 + 따뜻한 위쪽 조명 + 옅은 차가운 보조광 + 호박색 강조
    PAL: { bg: '#07080b', steel: '#1b1e24', lamp: '#ffd6a0', cool: '#7f9cc7', amber: '#ffb02e', white: '#f4efe6', red: '#e5484d', mint: '#3fd0a6', ink: '#101216' },
    // ---- 카메라 리그(장면마다 다른 동선을 박에 맞춰 짠다)
    // path([[t, [x,y,z], ease?], ...]) → t 의 위치. 키 사이는 시간 기준 에르미트(속도가 이어진다, 처음·끝은 멈춤).
    //   ease 'snap' = 그 구간을 outExpo 로(크래시 줌·스냅 푸시), 'in' = 가속(휘팬 직전), 'lin' = 일정 속도.
    path(keys) {
      const n = keys.length, dim = Array.isArray(keys[0][1]) ? keys[0][1].length : 1;
      const v = (i) => (dim === 1 && !Array.isArray(keys[i][1]) ? [keys[i][1]] : keys[i][1]);
      const tan = (i) => { if (i === 0 || i === n - 1) return new Array(dim).fill(0); const a = v(i - 1), b = v(i + 1), dt = keys[i + 1][0] - keys[i - 1][0]; return a.map((x, k) => (b[k] - x) / dt); };
      const E = { snap: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -9 * u)), in: (u) => u * u * u, lin: (u) => u };
      return (t) => {
        if (t <= keys[0][0]) return dim === 1 ? v(0)[0] : v(0).slice();
        for (let i = 1; i < n; i++) if (t <= keys[i][0]) {
          const t0 = keys[i - 1][0], t1 = keys[i][0], h = t1 - t0, e = E[keys[i][2]];
          let u = (t - t0) / h; if (e) u = e(u);
          const p0 = v(i - 1), p1 = v(i), m0 = e ? new Array(dim).fill(0) : tan(i - 1), m1 = e ? new Array(dim).fill(0) : tan(i);
          const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
          const out = p0.map((a, k) => h00 * a + h10 * h * m0[k] + h01 * p1[k] + h11 * h * m1[k]);
          return dim === 1 ? out[0] : out;
        }
        return dim === 1 ? v(n - 1)[0] : v(n - 1).slice();
      };
    },
    // 충격 흔들림: times 의 각 순간에서 amp 크기로 흔들리다 잦아든다 → [dx, dy, roll]
    shake(t, times, amp = 0.15, decay = 7) {
      let x = 0, y = 0, r = 0;
      for (const t0 of times) { const d = t - t0; if (d < 0 || d > 1.2) continue; const k = amp * Math.exp(-d * decay); x += k * Math.sin(d * 63); y += k * Math.sin(d * 51 + 1.3); r += 0.25 * k * Math.sin(d * 44 + 0.7); }
      return [x, y, r];
    },
    // 카메라 적용: 위치·조준·화각·흔들림을 한 번에
    shoot(camera, pos, aim, fov, sh) { const s = sh || [0, 0, 0]; K.look(camera, [pos[0] + s[0], pos[1] + s[1], pos[2]], aim, fov, s[2]); },
    // 쇼츠 안전 영역(1080×1920 픽셀): 좌우 130, 위 154, 아래 384
    SAFE: { l: 130, r: 950, t: 154, b: 1536 },
    // 실제 앱 아이콘(1024px). 다른 아이콘을 그리지 말 것
    loadIcon: () => new Promise((ok) => {
      const img = new Image(); img.onload = () => { const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true; ok(tex); }; img.src = 'lib/app-icon.png';
    }),
    loadIconImage: () => new Promise((ok) => { const img = new Image(); img.onload = () => ok(img); img.src = 'lib/app-icon.png'; }),
    // 다국어: 화면 문구(page.html 이 lang/<lang>.json 을 window.S72 로 넣는다). 한국어도 같은 경로를 쓴다
    S: () => window.S72,
    RTL: () => !!window.RTL,
    // 줄 바꾸기: 띄어쓰기 언어 = 단어, 일·중·태 = Intl.Segmenter 단어(문장부호가 줄 머리에 오지 않게)
    tokens(text) {
      const lang = window.LANG || 'ko', NO_START = /^[、。，．,.!?！？：；:;）」』】〉》”’・ー〜…%％]/;
      if (/^(ja|zh|th)/.test(lang)) { const out = []; for (const { segment } of new Intl.Segmenter(lang, { granularity: 'word' }).segment(text)) { if (out.length && NO_START.test(segment)) out[out.length - 1] += segment; else out.push(segment); } return out; }
      return text.split(' ').map((w, i) => (i ? ' ' : '') + w);
    },
    wrap(ctx, text, maxW) {
      const rows = []; let cur = '';
      for (const t of ANBU.tokens(text)) { const nx = cur + t; if (ctx.measureText(nx.trim()).width > maxW && cur.trim()) { rows.push(cur.trim()); cur = t.replace(/^ /, ''); } else cur = nx; }
      if (cur.trim()) rows.push(cur.trim());
      return rows;
    },
    // 천 단위(앱 NumberText 와 같은 표)
    num(n) { const l = window.LANG || 'ko', s = n.toLocaleString('en-US'); if (/^(de|es|it|nl|pt|tr|id|vi)/.test(l)) return s.replace(/,/g, '.'); if (/^(fr|ru|pl|sv)/.test(l)) return s.replace(/,/g, '\u00a0'); return s; },
  };
})();
