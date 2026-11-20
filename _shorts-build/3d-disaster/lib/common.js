// 이 편의 모든 장면이 공유하는 값. 바탕 화풍 = split-flap-board 의 "밤의 출발 홀".
(function () {
  const B = 60 / 122.989;            // 1박(초) — Techno Fights 실측 0.48785
  const BAR = 4 * B;                 // 1마디 1.95139초
  window.ANBU = {
    B, BAR,
    beat: (n) => n * B,              // 장면 안 시각: n박째
    // 공통 색: 거의 검은 바탕 + 따뜻한 위쪽 조명 + 옅은 차가운 보조광 + 호박색 강조
    PAL: { bg: '#07080b', steel: '#1b1e24', lamp: '#ffd6a0', cool: '#7f9cc7', amber: '#ffb02e', white: '#f4efe6', red: '#e5484d', mint: '#3fd0a6', ink: '#101216' },
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
