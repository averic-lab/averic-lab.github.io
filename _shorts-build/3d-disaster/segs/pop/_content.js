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
          a.txt('서비스에', 0, 1.12, 0.23, '#2a2f38', 900); a.txt('연결할 수 없습니다', 0, 0.8, 0.2, '#2a2f38', 900);
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
  const TAGS = [
    { a: 2.45, b: 6.95, tag: '에너지 시설을 노린 사이버 공격' },
    { a: 8.6, b: 13.15, tag: '강진, 그리고 쓰나미' },
    { a: 14.8, b: 19.35, tag: '무너진 빙하, 마을을 덮친 홍수' },
    { a: 21.0, b: 25.35, tag: '통신망 침투, 멈춰 버린 공공 서비스' },
    { a: 27.0, b: 31.35, tag: '끊긴 전기와 난방, 전쟁 속의 겨울' },
  ];
  // 글꼴이 다 불린 뒤(첫 그리기 때) 한 번 잰다: 가장 긴 꼬리표 + 알약 여백이 820px 안에
  let tagPx = 0;
  const TAG_SIZE = (ctx) => { if (!tagPx) { ctx.save(); ctx.font = '800 100px "Noto Sans KR"'; const w = Math.max(...TAGS.map((c) => ctx.measureText(c.tag).width)); ctx.restore(); tagPx = Math.min(64, Math.floor(100 * 800 / (w + 116))); } return tagPx; };
  const CAPS = TAGS.map((c) => ({ ...c, lines: [], tagSize: TAG_SIZE, shade: 0.75 }));
  // 3차 피드백 ②: 생존배낭 장에 짧은 설명 꼬리표 하나(다른 꼬리표와 같은 모양·크기)
  CAPS.push({ a: 40.45, b: 45.25, tag: '재난 후 72시간을 버티는 생존배낭', lines: [], tagSize: TAG_SIZE, shade: 0.6, pos: 'bottom' });
  // 3차 피드백 ①: 사람들 장(⑥)에 긴급 재난 문자 — 경보음과 함께 화면 위쪽에 내려온다(특정 나라의 경보 화면을 흉내 내지 않은 일반형)
  const ALERT = {
    a: 33.55, b: 38.95, title: '긴급 재난 문자',
    body: ['외부 해킹 공격으로 다음 공공 시스템이 중단되었습니다.', '· 정부 민원 전산망  · 119 신고 접수', '· 교통 신호 관제  · 공공 병원 전산', '추가 안내 시까지 대기하십시오.'],
  };
  // 경보음 구간(울림 0.5초 / 쉼 0.14초 × 3) — 소리와 사람들 손의 휴대폰 붉은 깜박임이 같은 시계를 쓴다
  const ALARM = Array.from({ length: 3 }, (_, i) => ALERT.a + 0.05 + i * 0.64);
  const alarmOn = (t) => ALARM.some((s) => t >= s && t < s + 0.5);
  // 재난 문자 배너(2D 위층): 위에서 내려와 머물다 올라간다. 어두운 유리판 + 붉은 경고 표시, 경보가 울리는 동안 붉게 번진다
  function drawAlert(ctx, t, W) {
    if (t < ALERT.a - 0.01 || t > ALERT.b + 0.01) return;
    const eo = (x) => 1 - Math.pow(1 - K.clamp(x), 3);
    const kin = eo((t - ALERT.a) / 0.38), kout = K.clamp((ALERT.b - t) / 0.3), vis = Math.min(kin, kout);
    const X = 130, Wd = 820, PAD = 40, R = 34, FT = 40, FB = 38, LH = 54;
    // 본문은 낱말 단위로 줄을 바꾼다
    ctx.save(); ctx.font = `500 ${FB}px "Noto Sans KR"`;
    const lines = [];
    for (const para of ALERT.body) { let cur = ''; for (const w of para.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (ctx.measureText(nx).width > Wd - 2 * PAD && cur) { lines.push(cur); cur = w; } else cur = nx; } lines.push(cur); }
    ctx.restore();
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
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(X + PAD + 24, hy, 24, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '900 32px "Noto Sans KR"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', X + PAD + 24, hy + 1);
    ctx.textAlign = 'left'; ctx.font = `800 ${FT}px "Noto Sans KR"`; ctx.fillStyle = '#ff7b70'; ctx.fillText(ALERT.title, X + PAD + 62, hy + 1);
    ctx.textAlign = 'right'; ctx.font = '500 30px "Noto Sans KR"'; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText('지금', X + Wd - PAD, hy + 1);
    // 본문
    ctx.textAlign = 'left'; ctx.font = `500 ${FB}px "Noto Sans KR"`; ctx.fillStyle = '#f1f1f3';
    lines.forEach((l, i) => ctx.fillText(l, X + PAD, y + 30 + 64 + 16 + LH * (i + 0.5)));
    ctx.restore();
  }
  const KO_TEXT = CAPS.map((c) => (c.tag || '') + c.lines.join('')).join('') + ALERT.title + ALERT.body.join('') + '지금!서비스에연결할수없습니다鮮魚津波避難場所72HOURS?';
