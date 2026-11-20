{
  // ================================================================ 「72시간」 팝업북 — 재난 다섯 장 + 공통점 + 생존배낭
  // 화풍: paper-pop-up(바탕). 원본 엔진(_recipes/paper-pop-up.ref.js)을 그대로 쓰고 아래를 더했다:
  //   · a.lamp(col, fn)  — 그 부분이 빛난다(창문·네온·화면). part 에 lit(t) → 0..n 또는 { k, c } 를 주면 그 세기로 켜고 끈다
  //   · a.txt(str, x, y, size, col, weight) — Noto Sans KR 글자(한글·일본어 한자)
  //   · 첫 장 앞면(덮인 오른쪽 페이지)에 인트로 마지막 그림(segs/pop/intro.png)을 인쇄 → 위에서 내려다본 그 그림에서 시작
  const C = { card: '#f5ecd9', cream: '#fbf3df', navy: '#22364e', coral: '#e2604a', yellow: '#f5bd35', amber: '#cf7d22', leaf: '#74a25e', sage: '#a6c787', deep: '#2f6753', sky: '#cfe5df', pink: '#f3ab99',
    night: '#16223a', night2: '#1e2d4a', bld: '#2b3d5f', bld2: '#34496f', bld3: '#22324f', win: '#ffd27a', neon: '#62f0ff', red: '#ff4a3d',
    sea: '#2f6f9a', sea2: '#1f4f73', foam: '#f4efe2', sand: '#e8d4a6', roof: '#3f4d61', wall: '#efe6d2', wood: '#9a6b43', jgreen: '#1d8a4e', hill: '#5e8a5a',
    snow: '#f3f6f8', ice: '#bfe3ef', ice2: '#7fbfd6', rock: '#5b6170', rock2: '#474d5c', valley: '#6f9a5c', water: '#3d7fb0', water2: '#2a5f8c', rroof: '#c9563c',
    dark: '#0e1422', sil: '#070a12', sil2: '#151d2e', fire: '#ff8a3a', orange: '#e8742c', ink: '#1a1c1c' };
  const PAGE_W = 5.6, PAGE_D = 6.4;
  // 인쇄 글자 크기 맞추기: 폭(세계 단위) 안에 들어가도록 줄인다(언어마다 길이가 다르다)
  const fitTxt = (str, size, maxW, wt = 900) => { const m = document.createElement('canvas').getContext('2d'); m.font = `${wt} 100px "Noto Sans KR"`; const w = m.measureText(str).width / 100; return Math.min(size, maxW / Math.max(w, 0.01)); };
  const TURN = 1.25;
  // 장 넘김 시각: 0 = 인트로 그림 페이지가 넘어가며 ① 도시가 선다
  const TURNS = [0.9, 7.2, 13.4, 19.6, 25.6, 31.6, 38.6];
  const DUR = 49.4;
  // 4차 피드백: 마지막 장 뒤 책을 덮는다 → 뒤표지의 앱 아이콘·'안부' → 아이콘이 튀어 올라 회전하고 사라진다 → e1
  const CLOSE = { t: 45.4, icon: 47.1, spin: [47.3, 48.7], gone: [48.55, 48.95] };
  const PULL = [42.9, 43.8];
  const pulled = (t) => K.seg(t, PULL[0], PULL[1], K.ease.inOut);
  const landedAt = (s) => TURNS[s] + TURN;
  // 깜빡이다 꺼짐: t0 부터 0.5초 동안 불규칙하게 깜빡이다 0
  const outAt = (t, t0, base = 1.9) => { if (t < t0) return base; if (t > t0 + 0.5) return 0; const u = (t - t0) / 0.5; return K.hash(Math.floor(t * 30), 7) > 0.35 + 0.5 * u ? base * (1 - 0.6 * u) : 0.05; };

  // ---- 그림 도우미
  const R = (seed) => K.rng(seed);
  const tower = (a, x, w, h, col, seed, opt = {}) => {            // 창문 있는 빌딩
    a.box(col, x - w / 2, -0.1, w, h + 0.1, 0.02);
    const r = R(seed), cols = Math.max(2, Math.round(w / 0.22)), rows = Math.max(2, Math.round((h - 0.25) / 0.26));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (r() < (opt.dark || 0.28)) continue;
      const wx = x - w / 2 + (i + 0.5) * w / cols - 0.055, wy = 0.15 + j * (h - 0.3) / rows;
      a.lamp(opt.win || C.win, (c) => c.rect(wx, wy, 0.11, 0.13));
    }
    if (opt.antenna) { a.box(col, x - 0.03, h, 0.06, 0.45); a.lamp(C.red, (c) => c.ellipse(x, h + 0.47, 0.07, 0.07, 0, 0, 7)); }
  };
  const house = (a, x, w, h, wall, roof, opt = {}) => {            // 박공지붕 집
    a.box(wall, x - w / 2, -0.1, w, h + 0.1);
    a.path(roof, (c) => { c.moveTo(x - w / 2 - 0.12, h - 0.02); c.lineTo(x, h + w * 0.42); c.lineTo(x + w / 2 + 0.12, h - 0.02); });
    if (opt.win !== false) { a.lamp(opt.lit || C.win, (c) => c.rect(x - w * 0.28, h * 0.42, w * 0.2, h * 0.28)); a.lamp(opt.lit || C.win, (c) => c.rect(x + w * 0.08, h * 0.42, w * 0.2, h * 0.28)); }
    a.box(C.wood, x - 0.08, -0.1, 0.16, h * 0.38);
  };
  const jhouse = (a, x, w, h, opt = {}) => {                      // 기와지붕 일본식 집(처마가 넓고 지붕이 휘었다)
    a.box(C.wall, x - w / 2, -0.1, w, h + 0.1);
    for (let k = 0; k < 3; k++) a.box(C.wood, x - w / 2 + 0.1 + k * (w - 0.2) / 2.6, 0.05, 0.08, h * 0.9);
    a.path(C.roof, (c) => { c.moveTo(x - w / 2 - 0.28, h - 0.05); c.quadraticCurveTo(x - w * 0.25, h + 0.05, x - w * 0.18, h + w * 0.34); c.lineTo(x + w * 0.18, h + w * 0.34); c.quadraticCurveTo(x + w * 0.25, h + 0.05, x + w / 2 + 0.28, h - 0.05); });
    a.box('#2c3747', x - w / 2 - 0.2, h - 0.08, w + 0.4, 0.07);
    if (opt.noren) { a.box(C.navy, x - 0.36, h * 0.45, 0.72, 0.3); a.box(C.cream, x - 0.02, h * 0.45, 0.04, 0.3); }
  };
  const person = (a, x, s, col, opt = {}) => {                    // 종이 인형(실루엣) — 휴대폰을 들면 화면이 빛난다
    const c = a.ctx; c.save(); c.translate(x, 0); c.scale(s * (opt.face || 1), s);
    a.disc(col, 0, 1.62, 0.2); a.path(col, (p) => { p.moveTo(-0.27, 1.38); p.quadraticCurveTo(0, 1.46, 0.27, 1.38); p.lineTo(0.3, 0.72); p.lineTo(0.17, 0.72); p.lineTo(0.15, -0.1); p.lineTo(-0.15, -0.1); p.lineTo(-0.17, 0.72); p.lineTo(-0.3, 0.72); });
    if (opt.phone) { a.line(col, 0.11, (p) => { p.moveTo(0.22, 1.3); p.lineTo(0.36, 1.05); p.lineTo(0.2, 1.42); }); a.box(C.ink, 0.14, 1.36, 0.14, 0.24, 0.03); a.lamp('#bfefff', (p) => p.roundRect(0.16, 1.39, 0.1, 0.18, 0.02)); }
    c.restore();
  };
  // 종이 팔(점선 경로) — 떠 있는 조각을 받치는 띠
  const arm = (a, x0, y0, x1, y1, bend = 0.4) => { a.line(C.cream, 0.12, (c) => { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + bend, x1, y1); }); a.line(C.navy, 0.04, (c) => { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + bend, x1, y1); }, [0.09, 0.1]); };

  // ---- 생존배낭 품목(각각 홈을 지나 올라오는 작은 V 카드 — 왼쪽/오른쪽 한쪽 날개에만 그림이 있고, 접힘선까지 종이 띠로 이어진다)
  const ITEM = {
    water(a) { a.box('#9fd3ea', -0.32, 0, 0.64, 1.45, 0.16); a.box('#d8f0fa', -0.22, 0.12, 0.16, 1.1, 0.06); a.box('#2f7fb0', -0.34, 0.55, 0.68, 0.36); a.box('#2f7fb0', -0.15, 1.42, 0.3, 0.22, 0.04); },
    food(a) { a.box('#c8ccd3', -0.42, 0, 0.84, 0.62, 0.08); a.box(C.coral, -0.42, 0.16, 0.84, 0.3); a.box('#c8ccd3', -0.32, 0.66, 0.64, 0.52, 0.06); a.box(C.yellow, -0.32, 0.8, 0.64, 0.24); a.box('#9aa0aa', -0.42, 0.6, 0.84, 0.05); },
    light(a) { a.box('#3a3f4a', -0.2, 0, 0.4, 0.95, 0.06); a.path('#4c5260', (c) => { c.moveTo(-0.2, 0.95); c.lineTo(-0.36, 1.35); c.lineTo(0.36, 1.35); c.lineTo(0.2, 0.95); }); a.lamp('#fff3c4', (c) => c.ellipse(0, 1.36, 0.34, 0.08, 0, 0, 7)); a.box(C.yellow, -0.07, 0.5, 0.14, 0.2, 0.03); },
    radio(a) { a.box('#8a5a3a', -0.62, 0, 1.24, 0.82, 0.1); a.disc('#3a2b22', -0.25, 0.4, 0.26); for (let k = 0; k < 4; k++) a.disc('#5a4334', -0.25 + 0.12 * Math.cos(k * 1.57), 0.4 + 0.12 * Math.sin(k * 1.57), 0.035); a.box(C.cream, 0.12, 0.45, 0.36, 0.2, 0.03); a.lamp('#ffcf6e', (c) => c.rect(0.15, 0.48, 0.3, 0.14)); a.line('#3a3f4a', 0.05, (c) => { c.moveTo(0.4, 0.82); c.lineTo(0.62, 1.55); }); a.disc('#3a3f4a', 0.62, 1.56, 0.05); },
    meds(a) { a.box(C.cream, -0.5, 0, 1.0, 0.8, 0.08); a.box('#3aa36b', -0.09, 0.15, 0.18, 0.5); a.box('#3aa36b', -0.25, 0.31, 0.5, 0.18); a.box('#f7a33a', 0.18, 0.82, 0.3, 0.42, 0.06); a.box(C.cream, 0.15, 1.18, 0.36, 0.12, 0.03); },
    battery(a) { a.box('#2d3340', -0.3, 0, 0.6, 1.05, 0.1); for (let k = 0; k < 4; k++) a.lamp('#5dff9a', (c) => c.rect(-0.08, 0.22 + k * 0.17, 0.16, 0.1)); a.box('#9aa0aa', -0.08, 1.04, 0.16, 0.09); },
  };
  // 품목은 배낭 양옆 앞쪽 바닥에 선다: 접힘선에서 바닥을 따라 낮은 종이 띠가 나가고 그 끝에 품목
  const itemCard = (name, x, z, s, up) => ({ fold: 'v', z, alpha: 66, size: [Math.abs(x) * 2 + 1.6, 1.9], slide: (t) => -2.0 * (1 - K.ease.outBack(K.seg(t, up, up + 0.5))), lit: () => 1.4,
    art(a) {
      const side = Math.sign(x);
      a.box(C.cream, -0.12, -0.1, 0.24, 0.22);
      a.box(C.cream, Math.min(0, x), -0.1, Math.abs(x), 0.16); a.line(C.navy, 0.035, (c) => { c.moveTo(0, 0.0); c.lineTo(x, 0.0); }, [0.08, 0.09]);
      const c = a.ctx; c.save(); c.translate(x, 0.02); c.scale(s, s); c.rotate(-side * 0.05); ITEM[name](a); c.restore();
    } });

  const SPREADS = [
    { // ---------------------------------------------------------------- ① 해킹 공격 → 도시 정전
      floor(a) {
        a.box(C.night, -5.42, -3.02, 10.84, 6.04, 0.45);
        for (let i = -6; i <= 6; i++) a.box('#22324f', i * 0.9 - 0.04, -3, 0.08, 6);
        for (let j = -3; j <= 3; j++) a.box('#22324f', -5.4, j * 0.9 - 0.04, 10.8, 0.08);
        a.line('#2f6f80', 0.05, (c) => { c.moveTo(-5, -1.4); c.lineTo(-2.2, -1.4); c.lineTo(-1.6, -0.8); c.lineTo(1.6, -0.8); c.lineTo(2.2, -1.6); c.lineTo(5, -1.6); });
        a.line('#2f6f80', 0.05, (c) => { c.moveTo(-4.6, 2.2); c.lineTo(-3.0, 0.6); c.lineTo(3.0, 0.6); c.lineTo(4.6, 2.2); });
        const r = R(3); for (let i = 0; i < 40; i++) a.disc('#2f6f80', r.range(-5, 5), r.range(-2.8, 2.8), 0.05);
      },
      parts: [
        { id: 'sky1', fold: 'v', z: -1.2, alpha: 78, size: [9.4, 3.5], lit: (t) => outAt(t, 4.9), art(a) {
          a.disc('#f4e8c8', -3.5, 3.05, 0.34); a.disc(C.night2, -3.36, 3.12, 0.28);
          const r = R(11); let x = -4.6;
          while (x < 4.6) { const w = r.range(0.5, 0.95), h = r.range(1.5, 3.1); tower(a, x + w / 2, w, h, r.pick([C.bld, C.bld2, C.bld3]), r.int ? r.int(1, 99) : Math.floor(r() * 99), { antenna: h > 2.85 }); x += w + r.range(0.02, 0.12); }
        } },
        { fold: 'box', on: 'sky1', span: [-3.9, -1.7], depth: 1.4, strap: 0.7, height: 2.7, lit: (t) => outAt(t, 4.4), art(a) {
          tower(a, -3.25, 0.9, 2.5, C.bld2, 21, { antenna: true }); tower(a, -2.25, 0.75, 1.9, C.bld, 22);
        } },
        { fold: 'box', on: 'sky1', span: [1.6, 4.0], depth: 1.3, strap: 0.65, height: 2.3, lit: (t) => outAt(t, 5.3), art(a) {   // 공장(산업 시설): 톱니 지붕 + 굴뚝
          a.box('#3b4660', 1.7, -0.1, 2.2, 1.1);
          for (let k = 0; k < 4; k++) a.path('#3b4660', (c) => { const x0 = 1.7 + k * 0.55; c.moveTo(x0, 1.0); c.lineTo(x0, 1.45); c.lineTo(x0 + 0.55, 1.0); });
          [[2.0, 2.1], [2.55, 1.85]].forEach(([x, h]) => { a.box('#4a5672', x - 0.1, 0.9, 0.2, h - 0.9); a.box(C.coral, x - 0.1, h - 0.3, 0.2, 0.08); a.lamp(C.red, (c) => c.ellipse(x, h + 0.06, 0.06, 0.06, 0, 0, 7)); });
          for (let k = 0; k < 5; k++) a.lamp(C.win, (c) => c.rect(1.85 + k * 0.4, 0.35, 0.22, 0.28));
        } },
        { id: 'plant', fold: 'v', z: 0.65, alpha: 58, size: [4.6, 2.75], mono: true,
          lit: (t) => { if (t < 3.2) return { k: 2.4, c: C.neon }; if (t < 3.95) return { k: K.hash(Math.floor(t * 24), 3) > 0.45 ? 3.0 : 0.3, c: K.hash(Math.floor(t * 24), 5) > 0.3 ? C.red : C.neon }; return { k: 0, c: C.red }; },
          art(a) {   // 변전소: 철탑 + 변압기 + 네온처럼 빛나는 전력선
            a.box('#2a3550', -2.1, -0.1, 4.2, 0.35, 0.04);
            [-1.5, 1.5].forEach((x) => { a.box('#56627c', x - 0.42, 0.25, 0.84, 0.75, 0.06); for (let k = 0; k < 4; k++) a.box('#6c7894', x - 0.36 + k * 0.22, 0.32, 0.08, 0.6); a.box('#3f4a64', x - 0.1, 1.0, 0.2, 0.25); });
            a.line('#8b95ab', 0.07, (c) => { c.moveTo(-0.55, 0.25); c.lineTo(-0.12, 2.5); c.lineTo(0.12, 2.5); c.lineTo(0.55, 0.25); });
            for (let k = 0; k < 5; k++) a.line('#8b95ab', 0.04, (c) => { const y = 0.45 + k * 0.42, w = 0.5 - k * 0.075; c.moveTo(-w, y); c.lineTo(w * 0.8, y + 0.4); c.moveTo(w, y); c.lineTo(-w * 0.8, y + 0.4); });
            a.box('#8b95ab', -0.75, 2.1, 1.5, 0.07); a.box('#8b95ab', -0.55, 1.65, 1.1, 0.06);
            a.lamp(C.neon, (c) => { c.moveTo(-0.75, 2.14); c.quadraticCurveTo(-1.6, 1.7, -2.15, 1.75); c.lineTo(-2.15, 1.83); c.quadraticCurveTo(-1.6, 1.8, -0.75, 2.22); });
            a.lamp(C.neon, (c) => { c.moveTo(0.75, 2.14); c.quadraticCurveTo(1.6, 1.7, 2.15, 1.75); c.lineTo(2.15, 1.83); c.quadraticCurveTo(1.6, 1.8, 0.75, 2.22); });
            a.lamp(C.neon, (c) => { c.rect(-1.95, 0.05, 3.9, 0.06); });
            [-1.5, 1.5].forEach((x) => a.lamp(C.neon, (c) => c.rect(x - 0.3, 1.08, 0.6, 0.06)));
          } },
      ],
    },
    { // ---------------------------------------------------------------- ② 일본 해안 마을 — 강진과 쓰나미
      floor(a) {
        a.box(C.sea, -5.42, -3.02, 10.84, 6.04, 0.45);
        a.path(C.sand, (c) => { c.moveTo(-5.42, -3.02); c.lineTo(-5.42, 0.2); for (let x = -5.4; x <= 5.42; x += 0.3) c.lineTo(x, 0.2 + 0.18 * Math.sin(x * 1.7)); c.lineTo(5.42, -3.02); });
        a.box('#7f858f', -5.42, -2.4, 10.84, 1.0); for (let x = -5; x < 5.4; x += 0.8) a.box(C.cream, x, -1.93, 0.4, 0.07);
        for (let j = 0; j < 4; j++) for (let x = -5.2; x < 5.3; x += 0.7) a.line(C.foam, 0.04, (c) => { const y = 0.9 + j * 0.55; c.moveTo(x, y); c.quadraticCurveTo(x + 0.17, y + 0.12, x + 0.34, y); });
      },
      parts: [
        { id: 'hills', fold: 'v', z: -1.1, alpha: 76, size: [9.6, 3.4], art(a) {
          a.disc('#f2a65a', 2.6, 2.55, 0.62); a.disc('#f7c27a', 2.6, 2.55, 0.42);
          a.ridge('#7aa36d', -4.8, 4.8, (x) => 2.2 + 0.7 * Math.cos((x + 1.0) * 0.55) + 0.15 * Math.sin(x * 2.3));
          a.ridge(C.hill, -4.8, 4.8, (x) => 1.35 + 0.35 * Math.cos((x - 1.5) * 0.8));
          const r = R(7); for (let i = 0; i < 18; i++) { const x = r.range(-4.5, 4.5); a.disc('#3f6e48', x, r.range(0.9, 1.3), 0.18, 0.26); }
          [-3.9, -2.9, 3.3, 4.1].forEach((x, i) => jhouse(a, x, 0.8, 0.55 + 0.1 * (i % 2)));
        } },
        { fold: 'box', on: 'hills', span: [-3.3, -1.0], depth: 1.45, strap: 0.7, height: 2.2, art(a) {   // 생선 가게 — 세로 간판 「鮮魚」
          jhouse(a, -2.05, 1.7, 1.1, { noren: true });
          a.box('#f4efe2', -3.15, 0.4, 0.38, 1.25, 0.04); a.box(C.coral, -3.15, 0.4, 0.38, 0.06);
          a.txt('鮮', -2.96, 1.25, 0.3, C.ink); a.txt('魚', -2.96, 0.82, 0.3, C.ink);
        } },
        { fold: 'box', on: 'hills', span: [0.6, 2.4], depth: 1.6, strap: 0.8, height: 3.2, art(a) {   // 쓰나미 대피 장소 표지판(일본 해안의 실제 표지 모양: 초록 바탕·흰 그림·흰 글자)
          a.box('#9aa0aa', 1.44, -0.1, 0.12, 2.0);
          a.box(C.jgreen, 0.65, 1.85, 1.7, 1.25, 0.06); a.box('#f4efe2', 0.72, 1.92, 1.56, 1.11, 0.04); a.box(C.jgreen, 0.77, 1.97, 1.46, 1.01, 0.03);
          a.path('#f4efe2', (c) => { c.moveTo(0.95, 2.62); for (let k = 0; k < 3; k++) { c.lineTo(1.15 + k * 0.2, 2.62 + k * 0.12); c.lineTo(1.15 + k * 0.2, 2.74 + k * 0.12); } c.lineTo(1.75, 2.98); c.lineTo(0.95, 2.98); });
          a.disc(C.jgreen, 1.42, 2.88, 0.06); a.line(C.jgreen, 0.05, (c) => { c.moveTo(1.42, 2.83); c.lineTo(1.36, 2.72); c.lineTo(1.28, 2.66); c.moveTo(1.36, 2.72); c.lineTo(1.46, 2.68); });
          a.line('#f4efe2', 0.05, (c) => { for (let k = 0; k < 2; k++) { const y = 2.66 - k * 0.09; c.moveTo(1.85, y); c.quadraticCurveTo(1.97, y + 0.06, 2.1, y); } });
          a.txt('津波避難場所', 1.5, 2.08, 0.23, '#f4efe2');
        } },
        { fold: 'v', z: 0.82, alpha: 58, size: [6.6, 3.0], slide: (t) => -3.0 * (1 - K.ease.outQuint(K.seg(t, 9.7, 11.1))), art(a) {   // 거대한 파도(당김 없이 홈에서 솟는다)
          a.path(C.sea2, (c) => { c.moveTo(-3.2, -0.1); c.lineTo(-3.2, 1.4); c.bezierCurveTo(-2.4, 2.3, -1.0, 2.75, 0.1, 2.6); c.bezierCurveTo(1.3, 2.45, 2.0, 1.9, 2.25, 1.45); c.bezierCurveTo(1.8, 1.75, 1.3, 1.65, 1.15, 1.3); c.bezierCurveTo(1.6, 1.4, 2.6, 1.0, 3.2, 1.2); c.lineTo(3.2, -0.1); });
          a.path(C.sea, (c) => { c.moveTo(-3.2, -0.1); c.lineTo(-3.2, 0.9); c.bezierCurveTo(-2.0, 1.6, -0.6, 1.9, 0.6, 1.6); c.bezierCurveTo(1.6, 1.35, 2.4, 0.8, 3.2, 0.9); c.lineTo(3.2, -0.1); });
          const r = R(5); for (let i = 0; i < 9; i++) { const u = i / 8, x = -2.6 + u * 4.6, y = 2.2 + 0.4 * Math.sin(u * 3.1); a.path(C.foam, (c) => { c.moveTo(x, y); c.quadraticCurveTo(x + 0.18, y + 0.3, x + 0.38, y + 0.1); c.quadraticCurveTo(x + 0.22, y + 0.12, x + 0.2, y - 0.06); }); }
          for (let i = 0; i < 26; i++) a.disc(C.foam, r.range(-2.6, 2.3), r.range(2.3, 3.0), r.range(0.03, 0.08));
          for (let j = 0; j < 3; j++) a.line(C.foam, 0.06, (c) => { const y = 0.45 + j * 0.42; c.moveTo(-3.0, y); for (let x = -3.0; x < 3.0; x += 0.5) c.quadraticCurveTo(x + 0.25, y + 0.14, x + 0.5, y); });
        } },
      ],
    },
    { // ---------------------------------------------------------------- ③ 빙하 붕괴와 홍수
      floor(a) {
        a.box(C.valley, -5.42, -3.02, 10.84, 6.04, 0.45);
        a.line(C.water, 0.55, (c) => { c.moveTo(-0.3, 3.0); c.bezierCurveTo(1.6, 1.4, -1.8, 0.2, 0.4, -1.2); c.bezierCurveTo(1.6, -2.0, 0.2, -2.6, 0.6, -3.0); });
        const r = R(9); for (let i = 0; i < 30; i++) a.disc('#5b8a4c', r.range(-5, 5), r.range(-2.8, 2.8), 0.16, 0.12);
      },
      parts: [
        { id: 'peaks', fold: 'v', z: -1.15, alpha: 76, size: [9.6, 3.6], art(a) {
          const top = (x) => 2.0 + 1.1 * Math.abs(Math.sin(x * 0.72 + 0.4)) + 0.25 * Math.sin(x * 2.9);
          a.path(C.rock, (c) => { c.moveTo(-4.8, -0.1); for (let x = -4.8; x <= 4.8; x += 0.12) c.lineTo(x, top(x) + 0.3 * Math.sin(x * 5.1) * 0.5); c.lineTo(4.8, -0.1); });
          a.path(C.snow, (c) => { c.moveTo(-4.8, 2.1); for (let x = -4.8; x <= 4.8; x += 0.12) c.lineTo(x, top(x) + 0.15 * Math.sin(x * 5.1)); for (let x = 4.8; x >= -4.8; x -= 0.2) c.lineTo(x, top(x) - 0.55 - 0.2 * Math.sin(x * 3.3)); });
          a.path(C.ice, (c) => { c.moveTo(-1.0, 2.6); c.bezierCurveTo(-0.7, 1.6, -0.3, 1.1, -0.2, 0.4); c.lineTo(0.5, 0.4); c.bezierCurveTo(0.5, 1.2, 0.8, 1.8, 1.1, 2.6); });
          for (let k = 0; k < 4; k++) a.line(C.ice2, 0.05, (c) => { c.moveTo(-0.5 + k * 0.35, 2.3 - k * 0.1); c.lineTo(-0.3 + k * 0.25, 0.6); });
          a.path(C.rock2, (c) => { c.moveTo(-4.8, -0.1); c.lineTo(-4.8, 0.9); for (let x = -4.8; x <= 4.8; x += 0.3) c.lineTo(x, 0.7 + 0.25 * Math.sin(x * 1.3)); c.lineTo(4.8, -0.1); });
        } },
        { fold: 'v', z: -0.75, alpha: 72, size: [2.4, 2.4], slide: (t) => -2.6 * K.ease.in(K.seg(t, 15.0, 15.55)), art(a) {   // 무너지는 빙하 덩어리(홈 아래로 떨어진다)
          a.path(C.ice, (c) => { c.moveTo(-0.9, 1.3); c.lineTo(-0.6, 2.2); c.lineTo(0.1, 2.35); c.lineTo(0.85, 1.9); c.lineTo(1.0, 1.2); c.lineTo(0.3, 0.9); c.lineTo(-0.5, 0.95); });
          a.path(C.snow, (c) => { c.moveTo(-0.6, 2.2); c.lineTo(0.1, 2.35); c.lineTo(0.85, 1.9); c.lineTo(0.2, 1.95); });
          a.line(C.ice2, 0.05, (c) => { c.moveTo(-0.3, 1.0); c.lineTo(0.0, 1.9); c.moveTo(0.4, 1.0); c.lineTo(0.55, 1.7); });
          a.box(C.ice2, -0.1, -0.1, 0.2, 1.05);
        } },
        { id: 'vill', fold: 'v', z: 0.15, alpha: 62, size: [6.2, 1.9], lit: (t) => outAt(t, 16.6, 1.6), art(a) {
          [[-2.5, 0.75, 0.55], [-1.6, 0.6, 0.48], [-0.8, 0.7, 0.6], [0.9, 0.65, 0.5], [1.8, 0.8, 0.62], [2.6, 0.6, 0.45]].forEach(([x, w, h], i) => house(a, x, w, h, C.wall, i % 2 ? C.rroof : '#a8483a'));
          a.box('#4a5a3c', -3.0, -0.1, 6.0, 0.12);
        } },
        { fold: 'v', z: 0.8, alpha: 58, size: [6.8, 2.0], slide: (t) => -2.0 * (1 - K.ease.inOut(K.seg(t, 15.5, 17.2))), art(a) {   // 차오르는 물(여러 겹의 물결)
          a.path(C.water2, (c) => { c.moveTo(-3.3, -0.1); c.lineTo(-3.3, 1.35); for (let x = -3.3; x <= 3.3; x += 0.2) c.lineTo(x, 1.35 + 0.12 * Math.sin(x * 3.1)); c.lineTo(3.3, -0.1); });
          a.path(C.water, (c) => { c.moveTo(-3.3, -0.1); c.lineTo(-3.3, 0.95); for (let x = -3.3; x <= 3.3; x += 0.2) c.lineTo(x, 0.95 + 0.1 * Math.sin(x * 2.4 + 1)); c.lineTo(3.3, -0.1); });
          for (let j = 0; j < 3; j++) a.line('#9cc9e6', 0.05, (c) => { const y = 0.35 + j * 0.38; c.moveTo(-3.1, y); for (let x = -3.1; x < 3.1; x += 0.45) c.quadraticCurveTo(x + 0.22, y + 0.1, x + 0.45, y); });
          a.path(C.rroof, (c) => { c.moveTo(1.3, 1.25); c.lineTo(1.7, 1.55); c.lineTo(2.1, 1.25); });   // 떠내려가는 지붕
          a.box(C.wood, -2.2, 1.18, 0.8, 0.1, 0.03); a.box(C.wood, -1.7, 1.25, 0.1, 0.18);
        } },
      ],
    },
    { // ---------------------------------------------------------------- ④ 통신망 침투 — 연결된 모든 것이 멈춘다
      floor(a) {
        a.box('#121a2c', -5.42, -3.02, 10.84, 6.04, 0.45);
        for (let i = -12; i <= 12; i++) a.box('#1a2640', i * 0.45 - 0.01, -3, 0.02, 6); for (let j = -6; j <= 6; j++) a.box('#1a2640', -5.4, j * 0.45 - 0.01, 10.8, 0.02);
        const r = R(14), pts = []; for (let i = 0; i < 18; i++) pts.push([r.range(-5, 5), r.range(-2.7, 2.7)]);
        pts.forEach((p, i) => { const q = pts[(i * 7 + 3) % pts.length]; a.line('#24406a', 0.03, (c) => { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }); a.disc('#3a6aa8', p[0], p[1], 0.07); });
      },
      parts: [
        { id: 'net', fold: 'v', z: -1.1, alpha: 72, size: [9.4, 3.4], lit: (t) => outAt(t, 23.3, 1.7), art(a) {
          const r = R(31); let x = -4.6; while (x < 4.6) { const w = r.range(0.45, 0.85), h = r.range(1.1, 2.3); if (Math.abs(Math.abs(x + w / 2) - 2.3) > 0.45 && (Math.abs(x + w / 2) > 1.4 || h < 1.5)) tower(a, x + w / 2, w, h, r.pick([C.bld, C.bld3]), Math.floor(r() * 99), { win: '#9fdcff', dark: 0.4 }); x += w + 0.06; }
          [-2.3, 2.3].forEach((tx) => { a.line('#8a94a6', 0.06, (c) => { c.moveTo(tx - 0.35, 0); c.lineTo(tx - 0.06, 3.0); c.lineTo(tx + 0.06, 3.0); c.lineTo(tx + 0.35, 0); }); for (let k = 0; k < 6; k++) a.line('#8a94a6', 0.03, (c) => { const y = 0.2 + k * 0.45, w = 0.33 - k * 0.045; c.moveTo(tx - w, y); c.lineTo(tx + w * 0.85, y + 0.42); }); a.box('#8a94a6', tx - 0.18, 2.65, 0.36, 0.22, 0.04); a.lamp(C.red, (c) => c.ellipse(tx, 3.06, 0.07, 0.07, 0, 0, 7)); });
        } },
        { id: 'phone4', fold: 'v', z: 0.7, alpha: 58, size: [2.7, 3.2], lit: (t) => (t > 23.0 && t < 23.5 && K.hash(Math.floor(t * 20), 9) > 0.5 ? 0.3 : 1.25), art(a) {   // 휴대폰: 「서비스에 연결할 수 없습니다」
          a.box(C.ink, -0.95, -0.1, 1.9, 3.15, 0.22); a.box('#2a2d33', -0.88, -0.03, 1.76, 3.01, 0.18);
          a.lamp('#dfe9f5', (c) => c.roundRect(-0.8, 0.12, 1.6, 2.7, 0.1));
          a.disc('#c9d3df', 0, 2.0, 0.42); a.line('#7a8696', 0.08, (c) => { for (let k = 0; k < 4; k++) { c.moveTo(-0.24 + k * 0.16, 1.82); c.lineTo(-0.24 + k * 0.16, 1.88 + k * 0.1); } });
          a.line('#e5484d', 0.1, (c) => { c.moveTo(-0.32, 1.7); c.lineTo(0.32, 2.3); });
          a.txt(S72.phone4[0], 0, 1.12, fitTxt(S72.phone4[0], 0.23, 1.7), '#2a2f38', 900); a.txt(S72.phone4[1], 0, 0.8, fitTxt(S72.phone4[1], 0.2, 1.7), '#2a2f38', 900);
          a.box('#c9d3df', -0.45, 0.32, 0.9, 0.22, 0.11);
        } },
      ],
    },
    { // ---------------------------------------------------------------- ⑤ 전쟁 속의 겨울 — 실루엣 판이 겹겹이(shadow-box 결)
      floor(a) {
        a.box('#1a2233', -5.42, -3.02, 10.84, 6.04, 0.45);
        const r = R(17); for (let i = 0; i < 26; i++) a.disc('#5d6880', r.range(-5, 5), r.range(-2.8, 2.8), r.range(0.15, 0.4), r.range(0.06, 0.14));
        a.box('#232c40', -5.42, -2.2, 10.84, 0.5);
      },
      parts: [
        { id: 'sky5', fold: 'v', z: -1.25, alpha: 80, size: [9.6, 3.6],
          lit: (t) => { const f = (t0) => Math.max(0, 1 - Math.abs(t - t0) / 0.35) * (1 + 0.4 * Math.sin(t * 40)); return { k: 0.25 + 2.6 * Math.max(f(28.1), f(29.5) * 0.8, f(30.4) * 0.6), c: C.fire }; },
          art(a) {
            a.box('#121a2b', -4.8, -0.1, 9.6, 3.5); a.lamp(C.fire, (c) => { c.ellipse(-2.4, 1.7, 1.7, 0.8, 0, 0, 7); c.ellipse(2.3, 1.5, 1.9, 0.7, 0, 0, 7); });
            const r = R(41); let x = -4.8; while (x < 4.8) { const w = r.range(0.4, 0.9), h = r.range(0.8, 2.2); a.path(C.sil2, (c) => { c.moveTo(x, -0.1); c.lineTo(x, h); for (let k = 0; k < 4; k++) c.lineTo(x + (k + 1) * w / 4, h - r.range(0, 0.35)); c.lineTo(x + w, -0.1); }); x += w; }
          } },
        { id: 'block', fold: 'v', z: -0.25, alpha: 70, size: [6.6, 3.0], lit: (t) => 1.3 + 0.35 * Math.sin(t * 9) * Math.sin(t * 3.7), art(a) {
          a.box(C.sil, -2.9, -0.1, 2.4, 1.95); a.box(C.sil, 0.6, -0.1, 2.3, 1.6);
          for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) a.box('#1c2436', -2.75 + i * 0.37, 0.2 + j * 0.34, 0.2, 0.2);
          a.lamp('#ffb04a', (c) => c.rect(-1.64, 1.22, 0.2, 0.2));                                     // 촛불 켜진 창 하나
          a.box(C.sil, -0.45, -0.1, 0.1, 2.1); a.line(C.sil, 0.04, (c) => { c.moveTo(-0.4, 1.95); c.quadraticCurveTo(0.2, 1.4, 0.65, 1.9); c.moveTo(-0.4, 1.95); c.quadraticCurveTo(-0.8, 1.3, -0.95, 1.0); });   // 끊어져 늘어진 전선
        } },
        { fold: 'v', z: 0.8, alpha: 58, size: [2.8, 2.3], lit: (t) => ({ k: 1.6 + 0.5 * Math.sin(t * 13) * Math.sin(t * 5.3), c: '#ffb04a' }), art(a) {   // 담요를 두른 사람과 촛불
          a.path('#2b3550', (c) => { c.moveTo(-0.9, -0.1); c.quadraticCurveTo(-1.0, 1.0, -0.35, 1.45); c.quadraticCurveTo(0, 1.62, 0.35, 1.45); c.quadraticCurveTo(0.95, 1.0, 0.85, -0.1); });
          a.disc('#2b3550', 0, 1.6, 0.3); a.disc(C.sil, 0, 1.55, 0.21);
          a.box('#e8dcc4', 0.95, -0.1, 0.14, 0.5); a.lamp('#ffb04a', (c) => c.ellipse(1.02, 0.55, 0.07, 0.13, 0, 0, 7));
        } },
      ],
    },
    { // ---------------------------------------------------------------- ⑥ 모두가 당황한다 — 휴대폰을 든 사람들
      floor(a) {
        a.box('#1b2436', -5.42, -3.02, 10.84, 6.04, 0.45);
        a.clip((c) => c.roundRect(-5.42, -3.02, 10.84, 6.04, 0.45), () => { a.box(C.sea2, -5.42, 0.4, 3.6, 2.7); a.box('#3a2f2a', 1.8, 0.4, 3.6, 2.7); a.box('#24314a', -1.8, 0.4, 3.6, 2.7); });
      },
      parts: [
        { id: 'mix', fold: 'v', z: -1.1, alpha: 76, size: [9.4, 3.2], art(a) {     // 앞의 다섯 장이 한 장에: 해안 집, 산, 빌딩, 철탑, 무너진 실루엣(모두 불이 꺼진 채)
          jhouse(a, -4.0, 0.8, 0.6); jhouse(a, -3.1, 0.7, 0.5);
          a.path('#5b6170', (c) => { c.moveTo(-2.6, -0.1); c.lineTo(-1.9, 2.4); c.lineTo(-1.5, 2.0); c.lineTo(-1.0, 2.7); c.lineTo(-0.5, -0.1); });
          a.path(C.snow, (c) => { c.moveTo(-1.9, 2.4); c.lineTo(-1.7, 2.18); c.lineTo(-1.5, 2.0); c.lineTo(-1.2, 2.4); c.lineTo(-1.0, 2.7); });
          [[0.0, 0.55, 2.1], [0.6, 0.5, 2.6], [1.15, 0.6, 1.7]].forEach(([x, w, h]) => tower(a, x, w, h, C.bld3, Math.round(x * 10 + 50), { dark: 1 }));
          a.line('#6a7488', 0.05, (c) => { c.moveTo(1.8, 0); c.lineTo(2.05, 2.5); c.lineTo(2.3, 0); });
          a.path(C.sil2, (c) => { c.moveTo(2.6, -0.1); c.lineTo(2.6, 1.6); c.lineTo(3.0, 1.3); c.lineTo(3.3, 1.8); c.lineTo(3.7, 1.2); c.lineTo(4.2, 1.5); c.lineTo(4.6, -0.1); });
        } },
        { id: 'crowd', fold: 'v', z: 0.55, alpha: 60, size: [6.4, 2.3], lit: (t) => (alarmOn(t) ? { k: 3.2, c: '#ff4a3d' } : t > ALERT.a && t < ALERT.b ? { k: 1.7, c: '#ffb3a8' } : 1.5 + 0.4 * Math.sin(t * 6)), art(a) {   // 경보가 울리는 동안 모두의 휴대폰이 붉게 깜박인다
          [[-2.5, 0.92, C.coral, 1], [-1.45, 0.82, C.yellow, -1], [-0.4, 1.0, C.sage, 1], [0.65, 0.86, C.pink, -1], [1.7, 0.95, '#8fb6e0', 1], [2.7, 0.8, C.cream, -1]].forEach(([x, s, col, f]) => person(a, x, s, col, { phone: true, face: f }));
          a.box('#2a3550', -3.1, -0.1, 6.2, 0.14);
        } },
        { fold: 'float', on: 'crowd', side: -1, at: [-1.45, 1.4], gap: 0.3, sway: 1, area: [-2.3, 1.3, -0.6, 2.6], art(a) { arm(a, -1.45, 1.4, -1.45, 1.95, 0.1); a.disc(C.cream, -1.45, 2.2, 0.36, 0.3); a.path(C.cream, (c) => { c.moveTo(-1.6, 1.95); c.lineTo(-1.5, 1.82); c.lineTo(-1.35, 1.96); }); a.txt('?', -1.45, 2.06, 0.38, C.navy, 900); } },
        { fold: 'float', on: 'crowd', side: 1, at: [1.7, 1.5], gap: 0.3, sway: -1, area: [0.9, 1.4, 2.6, 2.75], art(a) { arm(a, 1.7, 1.5, 1.75, 2.05, 0.1); a.disc(C.cream, 1.75, 2.33, 0.36, 0.3); a.path(C.cream, (c) => { c.moveTo(1.6, 2.08); c.lineTo(1.68, 1.95); c.lineTo(1.85, 2.08); }); a.txt('?', 1.75, 2.19, 0.38, C.navy, 900); } },
      ],
    },
    { // ---------------------------------------------------------------- ⑦ 생존배낭 — 품목이 하나씩 솟고, 앞주머니 하나는 비어 있다
      floor(a) {
        a.box('#efe3c8', -5.42, -3.02, 10.84, 6.04, 0.45);
        for (let j = -5; j <= 5; j++) a.box('#e3d3b2', -5.4, j * 0.55, 10.8, 0.03);
        a.box(C.navy, 0.9, -2.66, 3.1, 0.075, 0.035);                                                     // 당김 탭 홈
      },
      parts: [
        { id: 'wall7', fold: 'v', z: -1.2, alpha: 76, size: [8.8, 3.2], art(a) {    // 72시간 시계
          a.disc(C.cream, 0, 2.05, 1.05); a.disc(C.navy, 0, 2.05, 0.98); a.disc(C.cream, 0, 2.05, 0.88);
          for (let k = 0; k < 12; k++) a.box(C.navy, -0.025 + 0.74 * Math.cos(k * 0.5236), 2.05 + 0.74 * Math.sin(k * 0.5236) - 0.025, 0.05, 0.05);
          a.txt('72', 0, 1.9, 0.62, C.coral, 900); a.txt('HOURS', 0, 1.55, 0.17, C.navy, 700);
          a.box(C.coral, -4.3, -0.1, 8.6, 0.25, 0.04);
        } },
        { id: 'bag', fold: 'v', z: 0.1, alpha: 60, size: [3.6, 3.3], art(a) {
          a.line('#b85a20', 0.16, (c) => { c.moveTo(-0.6, 2.75); c.quadraticCurveTo(0, 3.25, 0.6, 2.75); });
          a.box(C.orange, -1.35, -0.1, 2.7, 2.95, [0.5, 0.5, 0.25, 0.25]);
          a.box('#d0621f', -1.35, 2.15, 2.7, 0.7, [0.5, 0.5, 0, 0]); a.box('#b85a20', -1.35, 2.1, 2.7, 0.08);
          a.box('#b85a20', -1.2, 0.2, 0.12, 1.8, 0.05); a.box('#b85a20', 1.08, 0.2, 0.12, 1.8, 0.05);
          a.box('#f08a42', -0.85, 0.25, 1.7, 1.25, 0.2);                                                       // 앞주머니 — 비어 있다(점선)
          a.line(C.cream, 0.05, (c) => c.roundRect(-0.75, 0.35, 1.5, 1.05, 0.16), [0.1, 0.09]);
          a.box(C.cream, -0.32, 1.85, 0.64, 0.22, 0.05); a.txt('72H', 0, 1.9, 0.16, C.coral, 900);
        } },
        itemCard('water', -1.7, 0.6, 1.05, 40.2),
        itemCard('food', -1.95, 1.05, 1.0, 40.55),
        itemCard('meds', -1.2, 1.45, 0.85, 40.9),
        itemCard('light', 1.7, 0.6, 1.05, 41.25),
        itemCard('radio', 1.95, 1.05, 0.95, 41.6),
        itemCard('battery', 1.2, 1.45, 0.85, 41.95),
        { id: 'qtag', fold: 'v', z: 1.25, alpha: 58, size: [1.4, 1.6], slide: (t) => -1.7 * (1 - pulled(t)), art(a) {   // 빈 주머니의 「?」 꼬리표
          a.box(C.cream, -0.06, -0.1, 0.12, 0.6);
          a.path(C.cream, (c) => { c.moveTo(-0.5, 0.5); c.lineTo(0.5, 0.5); c.lineTo(0.5, 1.2); c.lineTo(0, 1.45); c.lineTo(-0.5, 1.2); });
          a.disc(C.coral, 0, 1.2, 0.07); a.txt('?', 0, 0.62, 0.5, C.coral, 900);
        } },
      ],
    },
  ];
  // 강진(쓰나미 장) — 카메라와 조각이 흔들리는 구간
  const QUAKE = [8.7, 9.9];
  const shake = (t) => { if (t < QUAKE[0] || t > QUAKE[1]) return [0, 0, 0]; const e = Math.sin(Math.PI * (t - QUAKE[0]) / (QUAKE[1] - QUAKE[0])); return [0.13 * e * Math.sin(t * 61), 0.08 * e * Math.sin(t * 47 + 1), 0.1 * e * Math.sin(t * 53 + 2)]; };

  // 자막(CAP) — 장이 놓인 뒤 나온다
  // 3차 피드백: 설명 자막은 모두 뺐다(영상만으로 이해되게). 꼬리표만 남기고 글자를 키웠다(모든 꼬리표 같은 크기 — 가장 긴 것이 820px 안에)
  const S72 = ANBU.S();   // 언어별 화면 문구(lang/<lang>.json)
  const TAGS = [
    { a: 2.45, b: 6.95, tag: S72.tags[0] },
    { a: 8.6, b: 13.15, tag: S72.tags[1] },
    { a: 14.8, b: 19.35, tag: S72.tags[2] },
    { a: 21.0, b: 25.35, tag: S72.tags[3] },
    { a: 27.0, b: 31.35, tag: S72.tags[4] },
  ];
  // 글꼴이 다 불린 뒤(첫 그리기 때) 한 번 잰다: 가장 긴 꼬리표 + 알약 여백이 820px 안에
  let tagPx = 0;
  const TAG_SIZE = (ctx) => { if (S72.lang !== 'ko') return 46; if (!tagPx) { ctx.save(); ctx.font = '800 100px "Noto Sans KR"'; const w = Math.max(...TAGS.concat([{ tag: S72.tags[5] }]).map((c) => ctx.measureText(c.tag).width)); ctx.restore(); tagPx = Math.min(64, Math.floor(100 * 800 / (w + 116))); } return tagPx; };
  const CAPS = TAGS.map((c) => ({ ...c, lines: [], tagSize: TAG_SIZE, tagWrap: S72.lang !== 'ko', shade: 0.75 }));
  // 3차 피드백 ②: 생존배낭 장에 짧은 설명 꼬리표 하나(다른 꼬리표와 같은 모양·크기)
  CAPS.push({ a: 40.45, b: 45.25, tag: S72.tags[5], lines: [], tagSize: TAG_SIZE, tagWrap: S72.lang !== 'ko', shade: 0.6, pos: 'bottom' });
  // 3차 피드백 ①: 사람들 장(⑥)에 긴급 재난 문자 — 경보음과 함께 화면 위쪽에 내려온다(특정 나라의 경보 화면을 흉내 내지 않은 일반형)
  const ALERT = {
    a: 33.55, b: 38.95, title: S72.alert.title,
  };
  // 경보음 구간(울림 0.5초 / 쉼 0.14초 × 3) — 소리와 사람들 손의 휴대폰 붉은 깜박임이 같은 시계를 쓴다
  const ALARM = Array.from({ length: 3 }, (_, i) => ALERT.a + 0.05 + i * 0.64);
  const alarmOn = (t) => ALARM.some((s) => t >= s && t < s + 0.5);
  // 재난 문자 배너(2D 위층): 위에서 내려와 머물다 올라간다. 어두운 유리판 + 붉은 경고 표시, 경보가 울리는 동안 붉게 번진다
  function drawAlert(ctx, t, W) {
    if (t < ALERT.a - 0.01 || t > ALERT.b + 0.01) return;
    const eo = (x) => 1 - Math.pow(1 - K.clamp(x), 3);
    const kin = eo((t - ALERT.a) / 0.38), kout = K.clamp((ALERT.b - t) / 0.3), vis = Math.min(kin, kout);
    const X = 130, Wd = 820, PAD = 40, R = 34, FT = 40, RTL = ANBU.RTL();
    // 본문: 머리말(낱말 단위 줄바꿈) → 멈춘 시스템(한 줄에 둘, 안 들어가면 하나씩) → 끝말. 줄이 많으면 글자를 조금 줄인다
    const A = S72.alert, MAXW = Wd - 2 * PAD;
    const build = (fb) => {
      ctx.font = `500 ${fb}px "Noto Sans KR"`;
      const out = ANBU.wrap(ctx, A.intro, MAXW), it = A.items.map((x) => '· ' + x);
      for (let i = 0; i < it.length; i += 2) { const pair = it[i + 1] ? it[i] + '  ' + it[i + 1] : it[i]; if (ctx.measureText(pair).width <= MAXW) out.push(pair); else { out.push(it[i]); if (it[i + 1]) out.push(it[i + 1]); } }
      return out.concat(ANBU.wrap(ctx, A.outro, MAXW));
    };
    ctx.save(); let FB = 38, lines = build(FB); while (lines.length > 6 && FB > 31) { FB -= 1; lines = build(FB); } ctx.restore();
    const LH = Math.round(FB * 1.42);
    const Hh = 30 + 64 + 16 + lines.length * LH + 30;
    const y = 170 - (1 - vis) * (Hh + 190);
    const ring = alarmOn(t) ? 1 : 0, pulse = ring ? 0.6 + 0.4 * Math.sin((t - ALERT.a) * 30) : 0;
    ctx.save(); ctx.globalAlpha = Math.min(1, vis * 1.4);
    // 붉은 번짐 + 그림자
    ctx.shadowColor = `rgba(255,60,48,${0.25 + 0.55 * pulse})`; ctx.shadowBlur = 40 + 50 * pulse; ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(22,22,27,0.94)'; ctx.beginPath(); ctx.roundRect(X, y, Wd, Hh, R); ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = `rgba(255,90,78,${0.5 + 0.5 * pulse})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(X + 1.5, y + 1.5, Wd - 3, Hh - 3, R - 1.5); ctx.stroke();
    // 머리: 붉은 경고 원 + '긴급 재난 문자' + '지금'
    const hy = y + 30 + 32;
    // 아랍어(오른쪽에서 왼쪽)는 머리·본문을 거울처럼 오른쪽 기준으로
    const L0 = RTL ? X + Wd - PAD : X + PAD, L1 = RTL ? X + PAD : X + Wd - PAD, dir = RTL ? -1 : 1;
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(L0 + dir * 24, hy, 24, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '900 32px "Noto Sans KR"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', L0 + dir * 24, hy + 1);
    ctx.font = `800 ${FT}px "Noto Sans KR"`; const tsz = Math.min(FT, Math.floor(FT * (Wd - 2 * PAD - 62 - 110) / Math.max(1, ctx.measureText(ALERT.title).width)));
    ctx.textAlign = RTL ? 'right' : 'left'; ctx.font = `800 ${tsz}px "Noto Sans KR"`; ctx.fillStyle = '#ff7b70'; ctx.fillText(ALERT.title, L0 + dir * 62, hy + 1);
    ctx.textAlign = RTL ? 'left' : 'right'; ctx.font = '500 30px "Noto Sans KR"'; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(S72.now, L1, hy + 1);
    // 본문
    ctx.textAlign = RTL ? 'right' : 'left'; ctx.font = `500 ${FB}px "Noto Sans KR"`; ctx.fillStyle = '#f1f1f3';
    lines.forEach((l, i) => ctx.fillText(l, L0, y + 30 + 64 + 16 + LH * (i + 0.5)));
    ctx.restore();
  }
  const KO_TEXT = CAPS.map((c) => (c.tag || '') + c.lines.join('')).join('') + ALERT.title + S72.alert.intro + S72.alert.items.join('') + S72.alert.outro + '지금!서비스에연결할수없습니다鮮魚津波避難場所72HOURS?';

  // ---------------------------------------------------------------- the book's clock (picture and sound both read it)
  // How far a leaf has turned at time t: 0 = lying on the right, PI = lying on the left. It is lifted slowly, swings
  // over, lands with some speed left and bounces once on the air and the folded paper under it.
  const flip = (t, t0) => { const u = (t - t0) / TURN; if (u <= 0) return 0; if (u < 1) return Math.PI * u * u * (2.2 - 1.2 * u); const v = t - t0 - TURN; return Math.PI - 0.034 * Math.abs(Math.sin(v * 11)) * Math.exp(-v * 6); };
  const landed = (s) => TURNS[s] + TURN;


  registerStyle({
    id: 'disaster-popup',
    name: '72시간 — 팝업북',
    family: 'Material worlds',
    look: 'paper-pop-up 바탕. 재난 다섯 장 + 공통점 + 생존배낭.',
    duration: DUR,
    koText: KO_TEXT,
    fonts: ['700 100px "Fraunces"', '900 100px "Noto Sans KR"', '800 100px "Noto Sans KR"', '700 100px "Noto Sans KR"', '500 100px "Noto Sans KR"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 0.92, saturation: 1.08, bloom: 0.22, bloomThreshold: 1.0, vignette: 0.45, grain: 0.014, fov: 40, background: '#050403' },

    async build(S) {
      const introImg = await new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'segs/pop/intro.png?v=' + Date.now(); });
      const { THREE, K, scene, camera } = S;
      S.renderer.localClippingEnabled = true;                    // sliders are cut off where they pass through the page
      const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const unit = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2])), rad = (d) => d * Math.PI / 180;

      // ------------------------------------------------------------ 1. paper
      const CARD_T = 0.03, LEAF_T = 0.045, PX = 150;             // thickness of a cut-out and of a page; print resolution in pixels per unit
      // one height map for all paper: slow cockle, felt-like clouds and single fibres
      const fibre = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const n = K.noise(3), r = K.rng(8), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 128 + 70 * n.fbm(x * 0.006, y * 0.006, 0, 2) + 34 * n.fbm(x * 0.05, y * 0.05, 3, 3) + 14 * (K.hash(x, y) - 0.5); im.data.set([v, v, v, 255], (y * w + x) * 4); }
        ctx.putImageData(im, 0, 0); ctx.lineCap = 'round';
        for (let i = 0; i < 5200; i++) { const x = r.range(0, w), y = r.range(0, h), q = r.range(0, 6.3), len = r.range(8, 34); ctx.strokeStyle = `rgba(255,255,255,${r.range(0.05, 0.3)})`; ctx.lineWidth = r.range(0.8, 1.8); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(q + 0.6) * len * 0.5, y + Math.sin(q + 0.6) * len * 0.5, x + Math.cos(q) * len, y + Math.sin(q) * len); ctx.stroke(); }
      }, { data: true });
      fibre.wrapS = fibre.wrapT = THREE.RepeatWrapping;
      const bumpFor = (w, h) => { const b = fibre.clone(); b.repeat.set(w / 3.2, h / 3.2); b.needsUpdate = true; return b; };
      // ink on uncoated card is never perfectly even: a speckle that is multiplied over every print
      const speck = document.createElement('canvas'); speck.width = speck.height = 256;
      { const x = speck.getContext('2d'), im = x.createImageData(256, 256), r = K.rng(2); for (let i = 0; i < 65536; i++) { const v = 255 - 30 * Math.pow(r(), 3) - (r.chance(0.012) ? 60 : 0); im.data.set([v, v, v * 0.985, 255], i * 4); } x.putImageData(im, 0, 0); }
      const grain = (ctx, w, h) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ctx.createPattern(speck, 'repeat'); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; };
      const paper = (map, w, h) => new THREE.MeshStandardMaterial({ map, bumpMap: bumpFor(w, h), bumpScale: 0.45, roughness: 0.93, metalness: 0 });
      const core = new THREE.MeshStandardMaterial({ color: '#fbf5e6', roughness: 0.95 });       // what a cut edge shows

      // the pen every `art` and `floor` function draws with: world units, y up
      // 꺼진 등: 인쇄는 어둡게, 켜지면 발광(emissive)으로 밝아진다
      const dimC = (h) => { const n = parseInt(h.slice(1), 16), m = (v, d) => Math.round(v * 0.32 + d * 0.68); return `rgb(${m(n >> 16 & 255, 26)},${m(n >> 8 & 255, 30)},${m(n & 255, 44)})`; };
      const pen = (ctx, back, glow) => {
        const a = {
          ctx, back,                    // back = this is the reverse of a cut-out: same picture, no words
          path(col, fn) { ctx.fillStyle = glow ? '#000000' : col; ctx.beginPath(); fn(ctx); ctx.fill(); return a; },
          disc(col, x, y, rx, ry = rx, rot = 0) { return a.path(col, (c) => c.ellipse(x, y, rx, ry, rot, 0, 7)); },
          box(col, x, y, w, h, r = 0) { return a.path(col, (c) => c.roundRect(x, y, w, h, r)); },
          line(col, w, fn, dash) { ctx.strokeStyle = glow ? '#000000' : col; ctx.lineWidth = w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.setLineDash(dash || []); ctx.beginPath(); fn(ctx); ctx.stroke(); ctx.setLineDash([]); return a; },
          ridge(col, x0, x1, top, y0 = -0.1) { return a.path(col, (c) => { c.moveTo(x0, y0); for (let x = x0; x <= x1 + 1e-6; x += 0.1) c.lineTo(x, top(x)); c.lineTo(x1, y0); }); },
          clip(fn, inside) { ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); inside(); ctx.restore(); return a; },
          text(str, x, y, size, col, align = 'center') { if (a.back) return a; ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, -size / 100); ctx.font = '700 100px "Fraunces"'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = glow ? '#000000' : col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },
          lamp(col, fn) { ctx.fillStyle = glow ? (glow === 'mono' ? '#ffffff' : col) : dimC(col); ctx.beginPath(); fn(ctx); ctx.fill(); return a; },
          txt(str, x, y, size, col, weight = 900) { if (a.back) return a; ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, -size / 100); ctx.font = `${weight} 100px "Noto Sans KR"`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = glow ? '#000000' : col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },
        };
        return a;
      };
      const ruler = document.createElement('canvas').getContext('2d'); ruler.font = '700 100px "Fraunces"';
      const widthOf = (str, size) => ruler.measureText(str).width * size / 100;

      // ------------------------------------------------------------ 2. the die-cutter
      // Outline of everything in a field of 0..1 values that is above `level`, as closed loops of [x, y] in sample
      // units (marching squares; i0..i1 limits the columns that count, which is how a card is split at its crease).
      function trace(f, w, h, level, i0, i1) {
        const at = (i, j) => (i < i0 || i > i1 || j < 0 || j >= h ? 0 : f[j * w + i]), EW = w + 3;
        const id = (i, j, upright) => ((j + 1) * EW + i + 1) * 2 + upright, next = new Map(), where = new Map();
        const SEG = [[], [3, 2], [2, 1], [3, 1], [1, 0], [3, 2, 1, 0], [2, 0], [3, 0], [0, 3], [0, 2], [0, 3, 2, 1], [0, 1], [1, 3], [1, 2], [2, 3], []];   // per corner pattern: pairs of cell edges (top, right, bottom, left), paper on the same side every time
        for (let j = -1; j < h; j++) for (let i = Math.max(-1, i0 - 1); i <= Math.min(w - 1, i1); i++) {
          const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1), seg = SEG[(a >= level ? 8 : 0) | (b >= level ? 4 : 0) | (c >= level ? 2 : 0) | (d >= level ? 1 : 0)];
          if (!seg.length) continue;
          const ids = [id(i, j, 0), id(i + 1, j, 1), id(i, j + 1, 0), id(i, j, 1)];
          const pts = [[i + (level - a) / (b - a), j], [i + 1, j + (level - b) / (c - b)], [i + (level - d) / (c - d), j + 1], [i, j + (level - a) / (d - a)]];
          for (let k = 0; k < seg.length; k += 2) { next.set(ids[seg[k]], ids[seg[k + 1]]); where.set(ids[seg[k]], pts[seg[k]]); where.set(ids[seg[k + 1]], pts[seg[k + 1]]); }
        }
        const loops = [];
        while (next.size) { const start = next.keys().next().value, loop = []; let k = start; do { loop.push(where.get(k)); const n = next.get(k); next.delete(k); k = n; } while (k !== start && k !== undefined); loops.push(loop); }
        return loops;
      }
      // drop the points a closed outline does not need (Douglas-Peucker)
      function simplify(pts, tol) {
        const n = pts.length; if (n < 8) return pts;
        let far = 0, fd = 0; for (let i = 1; i < n; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
        const keep = new Uint8Array(n + 1), P = (i) => pts[i % n], stack = [[0, far], [far, n]]; keep[0] = keep[far] = 1;
        while (stack.length) {
          const [i0, i1] = stack.pop(), a = P(i0), b = P(i1), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-9; let m = -1, md = tol;
          for (let i = i0 + 1; i < i1; i++) { const p = P(i), d = Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len; if (d > md) { md = d; m = i; } }
          if (m > 0) { keep[m] = 1; stack.push([i0, m], [m, i1]); }
        }
        return pts.filter((_, i) => keep[i]);
      }
      const areaOf = (l) => { let s = 0; for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
      const inside = (p, l) => { let c = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) if ((l[i][1] > p[1]) !== (l[j][1] > p[1]) && p[0] < (l[j][0] - l[i][0]) * (p[1] - l[i][1]) / (l[j][1] - l[i][1]) + l[i][0]) c = !c; return c; };

      // Print a piece and cut it out. `draw` paints the picture on a transparent sheet that covers x0..x0+w, y0..y0+h;
      // the cut follows the picture a little outside its edge (MARGIN), so a rim of bare card shows all round, small
      // gaps close up and corners come out rounded, as a real die would leave them. Returns the print and a function
      // that gives the outline of the whole sheet or of the part on one side of the crease (x = 0).
      const MARGIN = 0.045;
      function dieCut(x0, y0, w, h, draw, glowMode) {
        const cw = Math.ceil(w * PX / 4) * 4, ch = Math.ceil(h * PX / 2) * 2, mw = cw / 2, mh = ch / 2; w = cw / PX; h = ch / PX;
        const art = document.createElement('canvas'); art.width = cw; art.height = ch;
        const ctx = art.getContext('2d'); ctx.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(ctx));
        const soft = document.createElement('canvas'); soft.width = mw; soft.height = mh;
        const sx = soft.getContext('2d', { willReadFrequently: true }); sx.filter = `blur(${(MARGIN * PX / 2 / 0.84).toFixed(2)}px)`; sx.drawImage(art, 0, 0, mw, mh);
        const px = sx.getImageData(0, 0, mw, mh).data, f = new Float32Array(mw * mh); for (let i = 0; i < f.length; i++) f[i] = px[i * 4 + 3] / 255;
        const print = (back) => K.canvasTex(cw, ch, (c) => { c.fillStyle = C.card; c.fillRect(0, 0, cw, ch); if (back) { c.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(c, true)); } else c.drawImage(art, 0, 0); grain(c, cw, ch); });
        const tex = print(false), rear = print(true);
        const mid = Math.round(-x0 * PX / 2);                       // the first sample column right of the crease
        const outline = (side) => {
          const loops = trace(f, mw, mh, 0.2, side > 0 ? mid : 0, side < 0 ? mid - 1 : mw - 1)
            .map((l) => simplify(l.map(([i, j]) => { const x = x0 + (2 * i + 1) / PX; return [side && Math.abs(x) < 2.4 / PX ? 0 : x, y0 + h - (2 * j + 1) / PX]; }), 0.004))
            .filter((l) => l.length > 2 && Math.abs(areaOf(l)) > 0.004);
          const sign = Math.sign(areaOf(loops.reduce((a, b) => (Math.abs(areaOf(b)) > Math.abs(areaOf(a)) ? b : a), loops[0])));
          const solid = loops.filter((l) => Math.sign(areaOf(l)) === sign).map((l) => ({ l, shape: new THREE.Shape(l.map((p) => new THREE.Vector2(p[0], p[1]))) }));
          loops.filter((l) => Math.sign(areaOf(l)) !== sign).forEach((hole) => { const o = solid.find((s) => inside(hole[0], s.l)); if (o) o.shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p[0], p[1])))); });
          return solid.map((s) => s.shape);
        };
        const glow = glowMode ? K.canvasTex(cw, ch, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch); c.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(c, false, glowMode)); }) : null;
        return { tex, rear, outline, x0, y0, w, h, glow };
      }
      // a cut-out as a solid: print on both faces, bare card on the edge
      let cards = 1;
      function card(cut, side, parent) {
        const g = new THREE.ExtrudeGeometry(cut.outline(side), { depth: CARD_T, bevelEnabled: false }); g.translate(0, 0, -CARD_T / 2);
        const p = g.attributes.position, uv = g.attributes.uv, nm = g.attributes.normal, r = K.rng(cards++), bx = r.range(-0.05, 0.05), by = r.range(0.03, 0.08) * r.sign();
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = nm.getZ(i); uv.setXY(i, (x - cut.x0) / cut.w, (y - cut.y0) / cut.h);
          if (Math.abs(z) > 0.9) { const k = 1 / Math.hypot(1, bx * x, by * (y - 1)); nm.setXYZ(i, -bx * x * k * z, -by * (y - 1) * k * z, z * k); }   // card is never dead flat: the faces are shaded as if each piece had a slight curl
        }
        const all = g.groups.slice(); g.clearGroups();
        all.forEach((q) => { if (q.materialIndex) g.addGroup(q.start, q.count, 1); else { g.addGroup(q.start, q.count / 2, 2); g.addGroup(q.start + q.count / 2, q.count / 2, 0); } });   // the first half of the flat faces is the reverse side
        const m = new THREE.Mesh(g, [paper(cut.tex, cut.w, cut.h), core, paper(cut.rear, cut.w, cut.h)]); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; parent.add(m);
        if (cut.glow) { const mt = m.material[0]; mt.emissiveMap = cut.glow; mt.emissive = new THREE.Color('#ffffff'); mt.emissiveIntensity = 0; }
        return m;
      }
      // put a card in the world: X = where its +x points, Y = where its +y points, O = where its origin is
      const seat = (m, X, Y, O) => { const Z = cross(X, Y); m.matrix.set(X[0], Y[0], Z[0], O[0], X[1], Y[1], Z[1], O[1], X[2], Y[2], Z[2], O[2], 0, 0, 0, 1); m.matrixWorldNeedsUpdate = true; };

      // ------------------------------------------------------------ 3. the fold mechanisms
      // The gutter of a spread is a hinge along z. With the left page lifted by aL and the right page by aR (0 = flat
      // on the table), this gives the directions the mechanisms need: dL / dR run out across each page, nL / nR are
      // the page normals, b points between the pages and `a` is how far the spread is from flat (PI / 2 = shut).
      function hinge(aL, aR) {
        const psi = (Math.PI - aL + aR) / 2, a = Math.min((aL + aR) / 2, Math.PI / 2 - 0.004), s = Math.sin(a), c = Math.cos(a);
        const b = [Math.cos(psi), Math.sin(psi), 0], x = [Math.sin(psi), -Math.cos(psi), 0];
        return { a, b, dL: add(mul(x, -c), b, s), dR: add(mul(x, c), b, s), nL: add(mul(x, s), b, c), nR: add(mul(x, -s), b, c) };
      }
      // A V-fold on that hinge. Its two glue lines leave the gutter at angle alpha, one on each page; beta is the angle
      // on the card between glue line and crease (90 = it stands upright when the book is open). The crease is the one
      // direction that keeps both angles, which is all the "physics" a pop-up needs: c is the crease, uL / uR run
      // from the crease out along each wing. point = -1: the V points at the reader; +1: away.
      function solveV(h, alpha, beta, point) {
        const sa = Math.sin(alpha), ca = Math.cos(alpha), A = sa * Math.sin(h.a), g = Math.atan2(A, ca) + Math.acos(K.clamp(Math.cos(beta) / Math.hypot(A, ca), -1, 1));
        const c = [h.b[0] * Math.sin(g), h.b[1] * Math.sin(g), point * Math.cos(g)], out = (d) => { const gl = [d[0] * sa, d[1] * sa, point * ca]; return unit(add(gl, c, -dot(gl, c))); };
        return { c, uL: out(h.dL), uR: out(h.dR) };
      }
      const MAKE = {
        v(o, byId, group) {
          const cut = dieCut(-o.size[0] / 2, -0.1, o.size[0], o.size[1] + 0.25, o.art, o.lit ? (o.mono ? 'mono' : 'col') : null), L = card(cut, -1, group), R = card(cut, 1, group);
          const slit = o.slide ? [new THREE.Plane(), new THREE.Plane()] : null;
          if (slit) [L, R].forEach((m, i) => m.material.forEach((mt, k) => { if (k) m.material[k] = mt = mt.clone(); mt.clippingPlanes = [slit[i]]; mt.clipShadows = true; }));
          const part = { o, meshes: [L, R], pose(h, t) {
            const v = solveV(h, rad(o.alpha), rad(o.beta || 90), o.point === 'back' ? 1 : -1), up = o.slide ? o.slide(t) : 0, O = [v.c[0] * up, v.c[1] * up, o.z + v.c[2] * up];
            part.wing = { '-1': { X: mul(v.uL, -1), Y: v.c, O, n: h.nL }, 1: { X: v.uR, Y: v.c, O, n: h.nR } };
            seat(L, part.wing[-1].X, v.c, O); seat(R, v.uR, v.c, O);
            if (slit) { slit[0].normal.set(...h.nL); slit[1].normal.set(...h.nR); slit[0].constant = slit[1].constant = -LEAF_T / 2; }
          } };
          return part;
        },
        box(o, byId, group) {
          const side = o.span[0] < 0 ? -1 : 1, cut = dieCut(o.span[0], -0.1, o.span[1] - o.span[0], o.height + 0.25, o.art, o.lit ? (o.mono ? 'mono' : 'col') : null), front = card(cut, 0, group);
          const g = new THREE.BoxGeometry(0.5, o.depth, CARD_T); g.translate((o.span[0] + o.span[1]) / 2, o.depth / 2, 0);
          const strap = new THREE.Mesh(g, core); strap.castShadow = strap.receiveShadow = true; strap.matrixAutoUpdate = false; group.add(strap);
          return { o, meshes: [front, strap], pose() {
            const w = byId[o.on].wing[side], out = cross(w.X, w.n), O = add(w.O, out, o.depth);      // `out` lies on the page, square to the glue line
            seat(front, w.X, w.Y, O); seat(strap, w.X, mul(out, -1), add(O, w.Y, o.strap));
          } };
        },
        float(o, byId, group, s) {
          const [x0, y0, x1, y1] = o.area, cut = dieCut(x0, y0, x1 - x0, y1 - y0, o.art, o.lit ? (o.mono ? 'mono' : 'col') : null), m = card(cut, 0, group);
          return { o, meshes: [m], pose(h, t) {
            const w = byId[o.on].wing[o.side], lift = o.gap * Math.max(0, dot(w.Y, w.n)) + CARD_T * K.clamp((Math.PI / 2 - h.a) * 8), dt = t - landed(s);   // the tab collapses as the wing lies down, until the piece is pressed flat against it
            const q = dt > 0 ? 0.085 * (o.sway || 0) * Math.sin(dt * 21) * Math.exp(-dt * 2.4) : 0, X = add(mul(w.X, Math.cos(q)), w.Y, Math.sin(q)), Y = add(mul(w.Y, Math.cos(q)), w.X, -Math.sin(q));
            let O = add(add(w.O, w.X, o.at[0]), w.Y, o.at[1]); O = add(add(O, X, -o.at[0]), Y, -o.at[1]);       // it swings about the point where it is glued
            seat(m, X, Y, add(O, cross(w.X, w.Y), lift));
          } };
        },
      };
      // the words: a ribbon of card that stands in a shallow V near the front edge, creased between two words
      const ribbon = ([left, right]) => {
        const em = 0.76, gap = 0.2, H = 1.0, xl = -(gap + widthOf(left, em) + 0.3), xr = gap + widthOf(right, em) + 0.3, tail = 0.42;
        return { fold: 'v', z: 1.95, alpha: 78, size: [2 * (Math.max(-xl, xr) + tail) + 0.1, H], art(a) {
          a.path(C.cream, (c) => { c.moveTo(xl - tail, -0.1); c.lineTo(xl - tail + 0.26, H / 2 - 0.05); c.lineTo(xl - tail, H); c.lineTo(xr + tail, H); c.lineTo(xr + tail - 0.26, H / 2 - 0.05); c.lineTo(xr + tail, -0.1); });
          a.box(C.coral, xl - tail + 0.32, H - 0.15, xr - xl + 2 * tail - 0.64, 0.055); a.box(C.coral, xl - tail + 0.32, 0.06, xr - xl + 2 * tail - 0.64, 0.055);
          a.text(left, -gap, 0.27, em, C.navy, 'right'); a.text(right, gap, 0.27, em, C.navy, 'left');
        } };
      };
      const spreads = SPREADS.map((sp, s) => {
        const group = new THREE.Group(), byId = {}; scene.add(group);
        const parts = [...sp.parts].map((o) => { const p = MAKE[o.fold](o, byId, group, s); if (o.id) byId[o.id] = p; return p; });
        return { group, parts, byId };
      });
      // the paper engineer's check: shut every spread and see that nothing sticks out of the closed book
      const corner = new THREE.Vector3();
      spreads.forEach((sp, s) => {
        const h = hinge(0, Math.PI - 0.02); sp.parts.forEach((p) => p.pose(h, 99));
        sp.parts.forEach((p, i) => { let over = 0; p.meshes.forEach((m) => { const q = m.geometry.attributes.position; for (let k = 0; k < q.count; k += 3) { corner.fromBufferAttribute(q, k).applyMatrix4(m.matrix); over = Math.max(over, -corner.x - PAGE_W, Math.abs(corner.z) - PAGE_D / 2); } }); if (over > 0.02 && !p.o.slide) console.error(`pop-up: piece ${i} of spread ${s + 1} (${p.o.id || p.o.fold}) sticks ${over.toFixed(2)} out of the closed book`); });
      });

      // ------------------------------------------------------------ 4. the book
      // Three loose leaves turn; under them a block of pages on each side, cloth boards and a spine. Leaf j carries the
      // right page of spread j - 1 on its front and the left page of spread j on its back, so turning one leaf shuts a
      // spread and opens the next in the same movement.
      const FPX = 128, book = new THREE.Group(); scene.add(book);
      const printed = (side, draw) => K.canvasTex(Math.round(PAGE_W * FPX), Math.round(PAGE_D * FPX), (ctx, w, h) => {
        ctx.fillStyle = C.card; ctx.fillRect(0, 0, w, h); ctx.setTransform(FPX, 0, 0, -FPX, side < 0 ? PAGE_W * FPX : 0, PAGE_D / 2 * FPX); draw(pen(ctx));
        ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createLinearGradient(side < 0 ? w : 0, 0, side < 0 ? w - 60 : 60, 0); g.addColorStop(0, 'rgba(70,50,30,0.3)'); g.addColorStop(1, 'rgba(70,50,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);   // the page dips into the gutter
        grain(ctx, w, h);
      });
      const endpaper = (a) => { a.box('#0b1020', -5.7, -3.3, 11.4, 6.6); };
      const endpaperOld = (a) => { a.box(C.yellow, -5.7, -3.3, 11.4, 6.6); for (let i = -11; i <= 11; i++) for (let j = -5; j <= 5; j++) hex(a, '#f8cf63', i * 0.75, (j + (i & 1 ? 0.5 : 0)) * 0.866, 0.4); };
      const face = (side, draw, back) => { const t = printed(side, draw); if (back) { t.center.set(0.5, 0.5); t.rotation = Math.PI; } return paper(t, PAGE_W, PAGE_D); };
      const IPX = 330, introTex = K.canvasTex(Math.round(PAGE_W * IPX), Math.round(PAGE_D * IPX), (ctx, w, h) => {
        ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h);
        if (introImg) { const iw = 3.6 * IPX, ih = PAGE_D * IPX, x = (2.8 - 1.8) * IPX; ctx.filter = 'blur(28px)'; ctx.drawImage(introImg, -0.2 * w, -0.05 * h, w * 1.4, h * 1.1); ctx.filter = 'none'; ctx.fillStyle = 'rgba(8,10,20,0.45)'; ctx.fillRect(0, 0, w, h); ctx.drawImage(introImg, x, 0, iw, ih); }
        grain(ctx, w, h);
      });
      const introFace = new THREE.MeshStandardMaterial({ map: introTex, roughness: 0.9, metalness: 0, bumpMap: bumpFor(PAGE_W, PAGE_D), bumpScale: 0.12 });
      const leaves = TURNS.map((_, j) => {
        const g = new THREE.BoxGeometry(PAGE_W, LEAF_T, PAGE_D); g.translate(PAGE_W / 2, 0, 0);
        const m = new THREE.Mesh(g, [core, core, (j ? face(1, SPREADS[j - 1].floor) : introFace), face(-1, SPREADS[j].floor, true), core, core]);
        m.castShadow = m.receiveShadow = true; book.add(m); return m;
      });
      const BLOCK_H = 0.3, TABLE_Y = -BLOCK_H - 0.06;
      const edges = new THREE.MeshStandardMaterial({ roughness: 0.95, map: K.canvasTex(32, 256, (ctx, w, h) => { ctx.fillStyle = '#f4ecda'; ctx.fillRect(0, 0, w, h); for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? 'rgba(120,96,60,0.5)' : 'rgba(150,126,90,0.35)'; ctx.fillRect(0, (k + 0.5) * h / 7, w, 2.5); } }) });
      const block = (side, top) => { const g = new THREE.BoxGeometry(PAGE_W, BLOCK_H, PAGE_D); g.translate(side * PAGE_W / 2, -BLOCK_H / 2, 0); const m = new THREE.Mesh(g, [edges, edges, top, edges, edges, edges]); m.castShadow = m.receiveShadow = true; book.add(m); return m; };
      const blockL = block(-1, face(-1, endpaper)), blockR = block(1, face(1, SPREADS[SPREADS.length - 1].floor));
      const cloth = new THREE.MeshStandardMaterial({ color: '#1f4a4b', roughness: 0.82, bumpScale: 2.5, bumpMap: K.canvasTex(256, 256, (ctx) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 256, 256); for (let i = 0; i < 256; i += 4) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(i, 0, 2, 256); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, i, 256, 2); } }, { data: true, repeat: [14, 9] }) });
      for (const side of [-1, 1]) { const b = new THREE.Mesh(K.roundedBox(PAGE_W + 0.22, 0.07, PAGE_D + 0.44, 0.025, 3), cloth); b.position.set(side * (PAGE_W / 2 + 0.17), TABLE_Y + 0.035, 0); b.castShadow = b.receiveShadow = true; book.add(b); }
      const spine = new THREE.Mesh(K.roundedBox(0.5, 0.05, PAGE_D + 0.44, 0.02, 2), cloth); spine.position.set(0, TABLE_Y + 0.025, 0); spine.receiveShadow = true; book.add(spine);
      // the pull tab: a grip of card that slides along a slot printed on the last page (the strip it pulls is under the page)
      const TAB = { x: [1.4, 3.1], z: 2.62 }, grip = dieCut(-0.6, -0.32, 1.2, 0.64, (a) => { a.box(C.coral, -0.52, -0.25, 1.04, 0.5, 0.16); for (const x of [-0.24, 0.06]) a.line(C.cream, 0.09, (c) => { c.moveTo(x, 0.12); c.lineTo(x + 0.16, 0); c.lineTo(x, -0.12); }); });
      const tab = card(grip, 0, blockR); tab.rotation.x = -Math.PI / 2; tab.matrixAutoUpdate = true;

      // ------------------------------------------------------------ 5. the table and the lamp
      const wood = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const n = K.noise(12), r = K.rng(6), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) { const plank = Math.floor(y / 128), tone = 0.82 + 0.3 * K.hash(plank, 3); for (let x = 0; x < w; x++) { const v = K.clamp(0.5 + 1.25 * n.fbm(x * 0.0016 + plank * 9, y * 0.035, plank, 4) + 0.12 * n.n2(x * 0.02, y * 0.7)) * tone; im.data.set([40 + 78 * v, 23 + 46 * v, 12 + 24 * v, 255], (y * w + x) * 4); } }
        ctx.putImageData(im, 0, 0);
        for (let i = 0; i < 2200; i++) { ctx.fillStyle = `rgba(12,6,2,${r.range(0.1, 0.4)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(6, 40), 1); }
        for (let p = 0; p < 8; p++) { ctx.fillStyle = 'rgba(8,4,2,0.75)'; ctx.fillRect(0, p * 128, w, 2); }
      }, { repeat: [5, 5] });
      const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: 1.2, roughness: 0.58 }));
      table.rotation.x = -Math.PI / 2; table.position.y = TABLE_Y; table.receiveShadow = true; scene.add(table);
      // things left on the table by whoever made the book: offcuts of card, a mug
      const bits = K.rng(31), inks = [C.coral, C.yellow, C.leaf, C.cream, C.pink];
      [[-7.2, 2.6], [-6.7, 3.6], [6.9, 3.1], [7.5, 1.6], [6.6, -3.6], [-7.0, -2.9], [-3.2, 4.4], [2.2, 4.3], [-6.5, -4.6], [4.2, -4.7]].forEach(([x, z], i) => {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(bits.range(0.5, 1.3), bits.range(-0.1, 0.2)); sh.lineTo(bits.range(0.2, 0.9), bits.range(0.35, 0.8)); if (i % 2) sh.lineTo(bits.range(-0.2, 0.1), bits.range(0.4, 0.7));
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: CARD_T, bevelEnabled: false }), [new THREE.MeshStandardMaterial({ color: inks[i % inks.length], roughness: 0.93 }), core]);
        m.rotation.set(-Math.PI / 2, 0, bits.range(0, 6.3)); m.position.set(x, TABLE_Y + 0.002, z); m.castShadow = m.receiveShadow = true; scene.add(m);
      });
      const glaze = new THREE.MeshStandardMaterial({ color: '#1d3a44', roughness: 0.3 }), mug = new THREE.Group(); mug.position.set(-6.9, TABLE_Y, -6.2); scene.add(mug);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 2.0, 40), glaze); cup.position.y = 1.0; const ear = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.13, 12, 32), glaze); ear.position.set(1.05, 1.0, 0.3); ear.rotation.y = -0.3; mug.add(cup, ear); mug.traverse((m) => { m.castShadow = m.receiveShadow = true; });
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 6), new THREE.MeshStandardMaterial({ color: '#d99a1e', roughness: 0.45 })); pencil.rotation.set(Math.PI / 2, 0, 1.25); pencil.position.set(6.6, TABLE_Y + 0.1, -5.4); pencil.castShadow = pencil.receiveShadow = true; scene.add(pencil);

      K.env(S, { top: '#2a2119', horizon: '#3d3024', bottom: '#6b5740', intensity: 1.0, panels: [{ pos: [9, 11, 7], size: [7, 7], color: '#ffd9a6', power: 3 }, { pos: [-12, 6, -9], size: [6, 8], color: '#8fa8ff', power: 1.1 }] });
      K.spot(S, { pos: [4.5, 9.5, 11], target: [-0.2, 0.8, 0], color: '#ffe9d0', power: 1250, angle: 0.62, penumbra: 0.85, soft: 1.3, mapSize: 4096 });
      K.spot(S, { pos: [-8, 5.5, -10], target: [0, 1, 0], color: '#c2d0ff', power: 150, angle: 0.5, penumbra: 1, shadow: false });
      K.skyLight(S, { color: '#ffe8d2', power: 1.1, size: 9, center: [0, 0, 0] });


      // ------------------------------------------------------------ 6. 이 편에서 더한 것: 끊어지는 통신선(④), 눈(⑤), 램프 깜빡임
      // ④ 통신선: 철탑·휴대폰 사이를 잇는 빛나는 선. 끊기면 붉게 번쩍이고 두 반쪽이 양 끝에 매달려 늘어진다
      const LINKS = [
        { a: ['net', -2.3, 3.0], b: ['net', 2.3, 3.0], at: 22.0, sag: 0.9 },
        { a: ['net', -2.3, 3.0], b: ['phone4', -0.2, 3.0], at: 22.35, sag: 0.4 },
        { a: ['net', 2.3, 3.0], b: ['phone4', 0.2, 3.0], at: 22.6, sag: 0.4 },
        { a: ['net', -3.5, 1.7], b: ['net', -2.3, 2.6], at: 22.85, sag: 0.15 },
        { a: ['net', 3.5, 1.7], b: ['net', 2.3, 2.6], at: 23.05, sag: 0.15 },
      ];
      const SEGN = 22, linkMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
      const linkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 6), linkMat, LINKS.length * SEGN);
      linkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); linkMesh.frustumCulled = false; spreads[3].group.add(linkMesh);
      const byIdOf = (s) => spreads[s].byId;
      const tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), upY = new THREE.Vector3(0, 1, 0), colTmp = new THREE.Color();
      const ptOn = (s, id, x, y) => { const p = byIdOf(s)[id], m = p.o.fold === 'v' ? p.meshes[x < 0 ? 0 : 1] : p.meshes[0]; return tmpV.set(x, y, CARD_T).applyMatrix4(m.matrix).toArray(); };
      function updateLinks(t) {
        const show = spreads[3].group.visible; linkMesh.visible = show; if (!show) return;
        const fade = K.seg(t, TURNS[3] + TURN * 0.7, TURNS[3] + TURN) * (1 - K.seg(t, TURNS[4] - 0.3, TURNS[4] + 0.1));
        LINKS.forEach((L, li) => {
          const A = ptOn(3, ...L.a), B = ptOn(3, ...L.b), cut = K.seg(t, L.at + 0.12, L.at + 0.9, K.ease.outBack), flash = t > L.at && t < L.at + 0.18;
          const pts = []; for (let i = 0; i <= SEGN; i++) {
            const u = i / SEGN, taut = [K.lerp(A[0], B[0], u), K.lerp(A[1], B[1], u) - L.sag * 4 * u * (1 - u) * 0.5 + 0.35 * Math.sin(Math.PI * u), K.lerp(A[2], B[2], u)];
            const end = u < 0.5 ? A : B, d = (u < 0.5 ? u : 1 - u) * Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
            const hang = [end[0] + (u < 0.5 ? 1 : -1) * 0.08 * d, end[1] - d * 0.95, end[2] + 0.05 * d];
            pts.push(taut.map((v, k) => K.lerp(v, hang[k], cut)));
          }
          const dead = t > L.at + 0.18, k = (flash ? 4.5 : dead ? 0.25 * (1 - K.seg(t, L.at + 0.18, L.at + 1.2)) : 2.2 + 0.3 * Math.sin(t * 7 + li)) * fade;
          colTmp.set(flash || dead ? '#ff4a3d' : '#62f0ff').multiplyScalar(k);
          for (let i = 0; i < SEGN; i++) {
            const p = pts[i], q = pts[i + 1], idx = li * SEGN + i, gap = cut > 0.02 && (i === SEGN / 2 - 1 || i === SEGN / 2);
            tmpV.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const len = gap ? 0.0001 : tmpV.length(); tmpQ.setFromUnitVectors(upY, tmpV.normalize());
            tmpM.compose(new THREE.Vector3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), tmpQ, new THREE.Vector3(1, len, 1)); linkMesh.setMatrixAt(idx, tmpM); linkMesh.setColorAt(idx, colTmp);
          }
        });
        linkMesh.instanceMatrix.needsUpdate = true; if (linkMesh.instanceColor) linkMesh.instanceColor.needsUpdate = true;
      }
      // ⑤ 눈: 작은 종이 조각이 천천히 떨어진다
      const SNOW = 260, snowMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 6), new THREE.MeshStandardMaterial({ color: '#eef2f8', roughness: 0.9, side: THREE.DoubleSide }), SNOW);
      snowMesh.frustumCulled = false; spreads[4].group.add(snowMesh);
      const sr = K.rng(77), flakes = Array.from({ length: SNOW }, () => [sr.range(-5, 5), sr.range(0, 5), sr.range(-2.5, 3.5), sr.range(0.25, 0.5), sr.range(0, 6.28)]);
      function updateSnow(t) {
        if (!spreads[4].group.visible) { snowMesh.visible = false; return; } snowMesh.visible = true;
        const a = K.seg(t, TURNS[4] + 0.8, TURNS[4] + 1.6);
        flakes.forEach((f, i) => { const y = ((f[1] - t * f[3]) % 5 + 5) % 5 - 0.2; tmpM.compose(new THREE.Vector3(f[0] + 0.15 * Math.sin(t * 0.8 + f[4]), y, f[2]), tmpQ.setFromAxisAngle(upY, t + f[4]), new THREE.Vector3(a, a, a)); snowMesh.setMatrixAt(i, tmpM); });
        snowMesh.instanceMatrix.needsUpdate = true;
      }

      // ------------------------------------------------------------ 7. 카메라 — 세로 화면. 위에서 내려다본 인트로 그림 → 책 전체 → 장마다 다른 접근
      // 장마다 [위치, 바라보는 곳] — 같은 책이지만 매번 다르게 다가간다
      const V0 = [[0, 7.3, 12.6], [0, 1.25, 0.2]];
      const SHOT = [
        [[-0.6, 6.8, 11.8], [0.1, 1.3, 0.1], [0.5, 6.3, 10.6], [0.15, 1.35, 0.1]],     // ① 도시: 왼쪽에서 오른쪽으로 흐르며 다가감
        [[0.9, 5.6, 12.4], [0.3, 1.4, 0.0], [0.2, 5.0, 11.2], [0.3, 1.6, 0.1]],         // ② 해안: 낮게, 파도를 올려다봄
        [[-0.9, 8.4, 11.6], [0, 1.3, 0.0], [0.4, 7.4, 10.8], [0.1, 1.2, 0.2]],          // ③ 빙하: 높이서 내려다봄
        [[0.8, 6.0, 12.8], [0, 1.5, 0.2], [-0.5, 6.4, 11.4], [0, 1.6, 0.3]],            // ④ 통신: 오른쪽에서 왼쪽으로
        [[0, 4.6, 12.2], [0, 1.5, 0.0], [0, 4.4, 10.4], [0, 1.45, 0.2]],                // ⑤ 겨울: 정면 낮게, 천천히 밀고 들어감
        [[-0.4, 6.6, 12.4], [0, 1.2, 0.2], [0.4, 6.2, 11.6], [0, 1.25, 0.3]],           // ⑥ 사람들
        [[0, 6.2, 11.2], [0, 1.5, 0.3], [0.2, 3.9, 7.6], [0.05, 1.05, 0.7]],            // ⑦ 생존배낭: 끝에 빈 주머니로 다가감
      ];
      const FOV = 40, H0 = 3.2 / Math.tan((FOV / 2) * Math.PI / 180);                 // 위에서 내려다볼 때 페이지 높이(6.4)가 화면을 꽉 채우는 높이
      const camAt = (t) => {
        // 장 s 의 구간: 착지 직전(TURNS[s]+0.6) ~ 다음 장 넘김(TURNS[s+1]+0.6)
        let s = 0; for (let i = 0; i < TURNS.length; i++) if (t >= TURNS[i] + 0.6) s = i;
        const t0 = TURNS[s] + 0.6, t1 = s + 1 < TURNS.length ? TURNS[s + 1] + 0.6 : CLOSE.t, sh = SHOT[s], u = K.ease.inOut(K.seg(t, t0, t1));
        let pos = sh[0].map((v, k) => K.lerp(v, sh[2][k], u)), aim = sh[1].map((v, k) => K.lerp(v, sh[3][k], u));
        if (s > 0) {   // 장을 넘기는 동안 앞 장의 끝 자세에서 부드럽게 이어진다
          const p = SHOT[s - 1], b = K.ease.inOut(K.seg(t, TURNS[s] - 0.1, TURNS[s] + 1.0));
          pos = p[2].map((v, k) => K.lerp(v, pos[k], b)); aim = p[3].map((v, k) => K.lerp(v, aim[k], b));
        }
        return [pos, aim];
      };

      // 조명 손잡이(장마다 램프가 달라진다)
      const keyL = S.scene.children.filter((o) => o.isSpotLight)[0], rimL = S.scene.children.filter((o) => o.isSpotLight)[1];
      const keyBase = keyL.intensity, rimBase = rimL.intensity, warm = new THREE.Color('#ffe9d0'), cold = new THREE.Color('#bcd0ff');
      const lampAt = (t) => {
        let k = 1; const cool = K.seg(t, TURNS[4] + 0.4, TURNS[4] + 1.6) * (1 - K.seg(t, TURNS[5] + 0.2, TURNS[5] + 1.2));
        const dim1 = K.seg(t, 4.0, 5.6) * (1 - K.seg(t, TURNS[1] + 0.2, TURNS[1] + 1.0));
        k *= 1 - 0.45 * dim1; if (t > 4.0 && t < 5.6 && K.hash(Math.floor(t * 18), 13) > 0.72) k *= 0.55;          // ① 정전: 램프도 깜빡이며 어두워진다
        const dim4 = K.seg(t, 23.2, 23.8) * (1 - K.seg(t, TURNS[4] + 0.2, TURNS[4] + 1.0)); k *= 1 - 0.3 * dim4;
        k *= 1 - 0.4 * cool;                                                                                      // ⑤ 겨울: 차갑고 어둡게
        k *= 1 - 0.25 * K.seg(t, TURNS[5] + 0.4, TURNS[5] + 1.4) * (1 - K.seg(t, TURNS[6] + 0.2, TURNS[6] + 1.0));
        return { k, cool };
      };

      // ------------------------------------------------------------ 8. 책 덮기 + 뒤표지(4차 피드백)
      // 오른쪽 페이지 덩어리와 뒤표지 판이 등뼈를 축으로 왼쪽 위로 덮인다(덮개 각도 = 장 넘김과 같은 flip 곡선).
      // 덮이면 뒤표지(천)가 위를 보고, 거기 인쇄된 '안부'와 아이콘 타일이 보인다. 아이콘은 튀어 올라 동전처럼 돌다가 빛으로 사라진다.
      const closeA = (t) => flip(t, CLOSE.t);
      const YP = LEAF_T / 2 + 0.005;                                   // 덮개 회전축 높이(덮이면 오른쪽 덩어리 윗면이 왼쪽 더미 윗면에 닿는다)
      const boardR = book.children.find((m) => m.material === cloth && m.position.x > 0.5);
      const BOARD0 = boardR.position.clone();
      const CW = PAGE_W + 0.22, CD = PAGE_D + 0.44, CPX = 300;
      const iconImg = await ANBU.loadIconImage();
      const ICON = { s: 1.62, z: -0.78 };                               // 아이콘 타일 크기·자리(뒤표지 위, 화면 위쪽이 -z)
      // 뒤표지 그림: 화면에 보이는 모습 그대로 그린다(위 = 책 먼 쪽). 천 결 + 아이콘 자리(살짝 눌린 홈) + '안부'(크림색 박)
      const coverTex = K.canvasTex(Math.round(CW * CPX), Math.round(CD * CPX), (ctx, w, h) => {
        ctx.fillStyle = '#1f4a4b'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < w; i += 6) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(i, 0, 3, h); }
        for (let j = 0; j < h; j += 6) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, j, w, 3); }
        const cx = w / 2, iy = (CD / 2 + ICON.z) * CPX, s = ICON.s * CPX;
        ctx.fillStyle = 'rgba(8,24,25,0.55)'; ctx.beginPath(); ctx.roundRect(cx - s / 2 - 8, iy - s / 2 - 8, s + 16, s + 16, s * 0.24); ctx.fill();   // 아이콘 홈
        const BR = ANBU.S().brand;   // 한국어 '안부', 그 밖 'Anbu'
        ctx.font = `900 ${1.05 * CPX}px "Noto Sans KR"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText(BR, cx + 6, (CD / 2 + 1.25) * CPX + 8);
        ctx.fillStyle = '#f1e2bf'; ctx.fillText(BR, cx, (CD / 2 + 1.25) * CPX);
      });
      coverTex.center.set(0.5, 0.5); coverTex.rotation = Math.PI;   // 덮개가 등뼈를 축으로 뒤집히므로 그림을 180° 돌려 둔다
      const cover = new THREE.Group(); book.add(cover);
      const coverPlane = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.05, CD - 0.05), new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.8, bumpMap: coverTex, bumpScale: 0.6 }));
      coverPlane.rotation.x = Math.PI / 2; coverPlane.position.y = -0.0362; coverPlane.receiveShadow = true; cover.add(coverPlane);
      // 아이콘 타일(앞뒤 모두 아이콘) — 덮개 그룹 안에서 아래(-y) = 덮이면 위
      const iconTex = K.canvasTex(512, 512, (c) => c.drawImage(iconImg, 0, 0, 512, 512)); iconTex.center.set(0.5, 0.5); iconTex.rotation = Math.PI;
      const iconG = new THREE.Group(); cover.add(iconG);
      const tileBody = new THREE.Mesh(K.roundedBox(ICON.s, 0.07, ICON.s, 0.035, 4), new THREE.MeshStandardMaterial({ color: '#f6f0ee', roughness: 0.4 })); tileBody.castShadow = true; iconG.add(tileBody);
      const iconMat = new THREE.MeshStandardMaterial({ map: iconTex, roughness: 0.35, emissive: '#ffffff', emissiveMap: iconTex, emissiveIntensity: 0.15 });
      [[-1, Math.PI / 2], [1, -Math.PI / 2]].forEach(([sd, rx]) => { const m = new THREE.Mesh(K.roundedRect(ICON.s - 0.04, ICON.s - 0.04, ICON.s * 0.22, 12), iconMat); m.rotation.x = rx; m.position.y = sd * 0.0362; iconG.add(m); });
      const iconLight = new THREE.PointLight('#ffd9a8', 0, 0, 2); iconG.add(iconLight);
      // 사라질 때 흩어지는 빛 조각
      const SPK = 26, spk = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: '#ffe2b0', toneMapped: false }), SPK);
      spk.frustumCulled = false; spk.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(spk);
      const spr = K.rng(91), spkD = Array.from({ length: SPK }, () => { const a = spr.range(0, 6.283), e = spr.range(-0.4, 1.2); return [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), spr.range(1.2, 2.6)]; });
      const coverWorld = new THREE.Vector3();
      const placeClose = (obj, bx, by, a) => { const dx = bx, dy = by - YP; obj.position.set(dx * Math.cos(a) - dy * Math.sin(a), YP + dx * Math.sin(a) + dy * Math.cos(a), obj.position.z); obj.rotation.z = a; };
      function updateClose(t) {
        const a = closeA(t);
        cover.visible = a > 0.001;
        if (a > 0) { placeClose(blockR, 0, blockR.position.y, a); placeClose(boardR, BOARD0.x, BOARD0.y, a); placeClose(cover, BOARD0.x, BOARD0.y, a); }
        else { blockR.rotation.z = 0; boardR.position.copy(BOARD0); boardR.rotation.z = 0; }
        // 아이콘: 홈에 박혀 있다가 → 튀어 오르고 → 동전처럼 두 바퀴 → 빛으로 사라진다
        const up = K.ease.outBack(K.seg(t, CLOSE.icon, CLOSE.icon + 0.55), 1.4), spin = K.ease.inOut(K.seg(t, CLOSE.spin[0], CLOSE.spin[1]));
        const gone = K.seg(t, CLOSE.gone[0], CLOSE.gone[1], K.ease.in);
        iconG.position.set(0, -0.0362 - 0.035 - 2.4 * up - 0.5 * spin, ICON.z);
        iconG.rotation.set(0.25 * up * (1 - spin), 0, 4 * Math.PI * spin);
        const sc = (1 + 0.12 * up) * (1 - gone); iconG.scale.setScalar(Math.max(0.0001, sc)); iconG.visible = sc > 0.001;
        iconLight.intensity = 6 * up * (1 - gone) + 30 * Math.sin(Math.PI * gone);
        // 빛 조각
        iconG.getWorldPosition(coverWorld);
        const sp = K.seg(t, CLOSE.gone[0] + 0.05, CLOSE.gone[1] + 0.45); spk.visible = sp > 0 && sp < 1;
        spkD.forEach((d, i) => { const r = d[3] * K.ease.out(sp), s = 1.6 * Math.sin(Math.PI * sp); tmpM.compose(new THREE.Vector3(coverWorld.x + d[0] * r, coverWorld.y + d[1] * r, coverWorld.z + d[2] * r), tmpQ.setFromAxisAngle(upY, t * 6 + i), new THREE.Vector3(s, s, s)); spk.setMatrixAt(i, tmpM); });
        spk.instanceMatrix.needsUpdate = true;
      }
      // 덮을 때 카메라: 마지막 장 끝 자세에서 위로 물러나 덮인 책(왼쪽 반 자리)을 내려다본다
      const COVER_VIEW = [[-2.95, 14.6, 5.4], [-2.95, 0.35, -0.05]];
      const closeCam = (t, pos, aim) => {
        const b = K.ease.inOut(K.seg(t, CLOSE.t - 0.2, CLOSE.t + 1.7)), push = K.ease.inOut(K.seg(t, CLOSE.icon, DUR));
        const cp = [COVER_VIEW[0][0], COVER_VIEW[0][1] - 1.4 * push, COVER_VIEW[0][2] - 0.4 * push];
        return [pos.map((v, k) => K.lerp(v, cp[k], b)), aim.map((v, k) => K.lerp(v, COVER_VIEW[1][k], b)), b];
      };

      const riseOf = (j, t) => K.seg(t, TURNS[j], TURNS[j] + TURN * 0.5, K.ease.inOut), sinkOf = (j, t) => K.seg(t, TURNS[j] + TURN * 0.6, TURNS[j] + TURN, K.ease.inOut);
      return {
        update(t) {
          const phi = TURNS.map((t0) => flip(t, t0));
          let onRight = 0, onLeft = 0;
          leaves.forEach((m, j) => { let below = 0; for (let i = 0; i < j; i++) below += 1 - riseOf(i, t); for (let i = j + 1; i < leaves.length; i++) below += sinkOf(i, t); m.rotation.z = phi[j]; m.position.y = -LEAF_T * below; onRight += 1 - riseOf(j, t); onLeft += sinkOf(j, t); });
          blockR.position.y = LEAF_T / 2 - LEAF_T * onRight; blockL.position.y = LEAF_T / 2 - LEAF_T * onLeft;
          tab.position.set(K.lerp(TAB.x[0], TAB.x[1], pulled(t)), CARD_T / 2 + 0.004, TAB.z);
          const sh = shake(t);
          spreads.forEach((sp, s) => {
            const aL = Math.PI - phi[s], aR = s + 1 < phi.length ? phi[s + 1] : closeA(t);
            sp.group.visible = aL + aR < Math.PI - 0.02;
            if (sp.group.visible) { const h = hinge(aL, aR); sp.parts.forEach((p) => { p.pose(h, t); if (p.o.lit) { const v = p.o.lit(t), k = typeof v === 'number' ? v : v.k; p.meshes.forEach((m) => { const mt = m.material[0]; if (mt && mt.emissiveMap) { mt.emissiveIntensity = k; mt.emissive.set(typeof v === 'number' || !v.c ? '#ffffff' : v.c); } }); } }); }
            sp.group.position.set(s === 1 ? sh[0] * 0.25 : 0, 0, 0);
          });
          updateLinks(t); updateSnow(t); updateClose(t);
          const L = lampAt(t); keyL.intensity = keyBase * L.k; keyL.color.copy(warm).lerp(cold, L.cool); rimL.intensity = rimBase * (1 + 1.5 * L.cool);
          // 카메라: 0~0.9s 위에서 내려다본 인트로 그림(오른쪽 페이지) → 장이 넘어가며 책 전체로 물러난다
          let [pos, aim] = camAt(t), up = [0, 1, 0];
          let closeB = 0; if (t > CLOSE.t - 0.2) [pos, aim, closeB] = closeCam(t, pos, aim);
          const top = [[2.8, H0, 0.0], [2.8, 0, 0.0]], b = K.ease.inOutQuint(K.seg(t, 0.75, 2.9));
          if (b < 1) { pos = top[0].map((v, k) => K.lerp(v, pos[k], b)); aim = top[1].map((v, k) => K.lerp(v, aim[k], b)); up = [0, b, -(1 - b)]; }
          pos = pos.map((v, k) => v + sh[k]);
          camera.position.set(...pos); camera.up.set(...up).normalize(); camera.lookAt(...aim);
          if (camera.fov !== FOV) { camera.fov = FOV; camera.updateProjectionMatrix(); }
          K.focus(camera, [aim[0], aim[1] + 0.5 * closeB, aim[2] + 0.6 * (1 - closeB)], b < 1 ? 0.0 : 0.09 * (1 - 0.6 * closeB));
        },
        overlay(ctx, t, W, H) { CAP.draw(ctx, t, W, H, CAPS); drawAlert(ctx, t, W); },
      };
    },

    sound(k) {
      // ⑥ 긴급 재난 문자 경보음: 853 + 960 Hz 두 음을 겹친 울림 × 3(방송 경보 신호와 같은 원리의 일반형)
      ALARM.forEach((s) => { [853, 960].forEach((f) => k.tone(s, { f, type: 'sine', dur: 0.5, hold: 0.44, a: 0.01, gain: 0.11 })); k.tone(s, { f: 1706, type: 'sine', dur: 0.5, hold: 0.44, a: 0.01, gain: 0.025 }); });
      k.play('ding', ALERT.a + 2.05, { gain: 0.25, f: 'A5' });
      TURNS.forEach((t0, s) => {
        const hit = landedAt(s);
        k.play('paper', t0 + 0.02, { gain: 1.4, dur: 0.5, pan: 0.4 }); k.play('whoosh', t0 + 0.3, { gain: 0.7, dur: 0.8, top: 1500 }); k.play('paper', t0 + 0.5, { gain: 1.0, dur: 0.7 });
        k.withMinor(() => { for (let i = 0; i < 7; i++) k.play('tick', hit - 0.62 + i * 0.085, { gain: 0.45 + 0.06 * i, f: 1900 + i * 260, pan: -0.3 + i * 0.1 }); });
        k.play('slap', hit, { gain: 0.7, pan: -0.3 }); k.play('thud', hit, { gain: 0.6, f: 105, pan: -0.3 }); k.play('paper', hit + 0.04, { gain: 0.45, dur: 0.22 });
      });
      // ① 해킹 → 정전
      k.play('glitch', 3.2, { gain: 1.2 }); k.play('glitch', 3.5, { gain: 1.0 }); k.play('neon', 3.25, { gain: 1.2, dur: 0.7 }); k.play('glitch', 3.8, { gain: 1.3 });
      [3.95, 4.4, 4.9, 5.3].forEach((t, i) => { k.play('thud', t, { gain: 1.0 - i * 0.1, f: 70 }); k.tone(t, { f: [[0, 220], [0.5, 55]], type: 'sawtooth', dur: 0.55, gain: 0.07, filter: 'lowpass', f2: 600 }); });
      // ② 강진 → 쓰나미
      k.noise(8.7, { dur: 1.3, color: 'brown', filter: 'lowpass', f: 140, gain: 0.9, a: 0.15 }); k.play('impact', 8.75, { gain: 1.1, f: 60 });
      k.play('riser', 9.7, { gain: 0.9, dur: 1.0 }); k.noise(9.8, { dur: 2.6, color: 'pink', filter: 'lowpass', f: [[0, 600], [1.2, 2400], [2.6, 500]], gain: 0.55, a: 0.6, verb: 0.3 }); k.play('impact', 10.95, { gain: 1.0, f: 80 });
      // ③ 빙하 붕괴 → 물
      k.play('impact', 15.0, { gain: 1.0, f: 90 }); k.noise(15.05, { dur: 1.0, color: 'brown', filter: 'lowpass', f: 300, gain: 0.7, verb: 0.4 });
      k.noise(15.5, { dur: 2.2, color: 'pink', filter: 'bandpass', f: [[0, 500], [2.2, 900]], q: 0.6, gain: 0.45, a: 0.8 });
      // ④ 통신선이 하나씩 끊긴다
      k.tone(21.0, { f: 'A2', type: 'sine', dur: 2.0, gain: 0.05, a: 0.4 });
      [22.0, 22.35, 22.6, 22.85, 23.05].forEach((t) => { k.play('glitch', t, { gain: 0.9 }); k.play('click', t + 0.05, { gain: 1.2, f: 900 }); });
      k.play('error', 23.4, { gain: 1.2 });
      // ⑤ 겨울 바람과 먼 울림
      k.noise(26.9, { dur: 4.6, color: 'pink', filter: 'bandpass', f: [[0, 400], [1.5, 900], [3, 500], [4.6, 800]], q: 0.8, gain: 0.35, a: 1.0 });
      [28.1, 29.5, 30.4].forEach((t, i) => k.play('thud', t + 0.25, { gain: 0.55 - i * 0.12, f: 48 }));
      // ⑥ 연결되지 않는 전화(일반 신호음)
      [36.1, 36.8, 37.5].forEach((t) => k.tone(t, { f: 425, type: 'sine', dur: 0.32, gain: 0.05, hold: 0.25 }));   // 경보 뒤로 옮김
      // ⑦ 품목이 하나씩 솟는다 → 「?」
      [40.2, 40.55, 40.9, 41.25, 41.6, 41.95].forEach((t, i) => k.play('pop', t + 0.15, { gain: 0.9, f: 520 + i * 70, pan: i < 3 ? -0.4 : 0.4 }));
      // 책 덮기 → 아이콘이 튀어 오르고 돌다가 사라진다
      k.play('paper', CLOSE.t + 0.1, { gain: 1.2, dur: 0.9 }); k.play('whoosh', CLOSE.t + 0.35, { gain: 0.6, dur: 0.9, top: 1400 });
      k.play('slap', CLOSE.t + TURN, { gain: 1.0 }); k.play('thud', CLOSE.t + TURN, { gain: 0.9, f: 80 }); k.play('paper', CLOSE.t + TURN + 0.03, { gain: 0.5, dur: 0.25 });
      k.play('pop', CLOSE.icon + 0.02, { gain: 1.0, f: 760 }); k.play('ding', CLOSE.icon + 0.08, { gain: 0.7, f: 'E6' });
      k.play('whoosh', CLOSE.spin[0], { gain: 0.45, dur: 1.3, top: 3000 }); k.play('sparkle', CLOSE.gone[0] + 0.05, { gain: 0.8, n: 7 });
      k.play('tape', PULL[0], { gain: 1.3, dur: PULL[1] - PULL[0], pan: 0.4 }); k.play('tock', PULL[1], { gain: 0.7, f: 420 });
    },
  });
}
