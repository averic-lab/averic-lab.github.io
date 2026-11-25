// 「안부 앱 소개」 3D 판 — 자막(2D 겹침). 원판 자막 키(p_*)를 그대로 쓰고, 박자에 맞춰 들어온다.
// 읽는 시간 규칙: 줄은 한 번 나오면 장면이 끝날 때까지 남는다(out 을 주지 않으면). 장면 길이는 마지막 줄이
// 다 뜬 뒤 최소 1.5마디가 남게 잡았다 — 박자감은 장면 안(들어오는 순간의 충격·번쩍임)에서 낸다.
// 화면: 1080×1920. 가운데 x=540, 글자 폭은 좌우 130px 안쪽(130–950)에서 줄인다. 헤드라인 구역은 위 154–620px.
(function () {
  const F = '"Noto Sans KR"';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const bounce = (e) => K.ease.outBounce(clamp(e));
  const KINE = { CX: 540, MAXW: 820 };
  window.KINE = KINE;
  KINE.cap = (k) => (ANBU.S().cap || {})[k] || '';
  // 들어오는 방식 → { o, x, y, s, r }
  const IN = {
    slam: (p) => { const e = clamp(p / 0.2); return { o: clamp(p / 0.05), s: 1 + 1.25 * (1 - e) ** 2 - (p > 0.2 && p < 0.42 ? 0.06 * Math.sin((p - 0.2) / 0.22 * Math.PI) : 0), r: -5 * (1 - e) }; },
    stamp: (p) => { const e = clamp(p / 0.14); return { o: clamp(p / 0.04), s: 1 + 2.0 * (1 - e) ** 2, r: -8 * (1 - e) }; },
    drop: (p) => ({ o: clamp(p / 0.06), y: -170 * (1 - bounce(p / 0.55)) }),
    rise: (p) => ({ o: clamp(p / 0.1), y: 120 * (1 - K.spring(p, 2.2, 0.5)) }),
    sl: (p) => ({ o: clamp(p / 0.06), x: -760 * (1 - K.spring(p, 2.0, 0.55)) }),
    sr: (p) => ({ o: clamp(p / 0.06), x: 760 * (1 - K.spring(p, 2.0, 0.55)) }),
    pop: (p) => ({ o: clamp(p / 0.06), s: K.spring(p, 2.4, 0.42) }),
    fade: (p) => ({ o: clamp(p / 0.25) }),
  };
  const rowsOf = (ctx, text, size, weight, maxW, nowrap) => {
    const out = [];
    for (const part of String(text).split(/<br\s*\/?>/)) {
      ctx.font = `${weight} ${size}px ${F}`;
      if (nowrap || ctx.measureText(part).width <= maxW) out.push(part); else out.push(...ANBU.wrap(ctx, part, maxW));
    }
    return out;
  };
  // 한 줄(또는 <br> 로 나뉜 여러 줄) 그리기. it: { k|text, at, out, y, size, color, kind, weight, maxW, stroke, glow, lh }
  KINE.item = (ctx, t, it) => {
    const p = t - it.at; if (p < 0) return;
    const text = it.text != null ? it.text : KINE.cap(it.k); if (!text) return;
    const f = Object.assign({ o: 1, x: 0, y: 0, s: 1, r: 0 }, (IN[it.kind || 'slam'] || IN.slam)(p));
    if (it.out != null && t > it.out) { const q = clamp((t - it.out) / 0.18); f.o *= 1 - q; f.s *= 1 + 0.12 * q; }
    if (f.o <= 0.001) return;
    const weight = it.weight || 900, maxW = it.maxW || KINE.MAXW;
    // ✕ 같은 꼬리표는 마지막 줄 폭에 포함해 맞춘다
    const sfx = it.suffix ? ' ' + it.suffix : '';
    let size = it.size || 96, rows = rowsOf(ctx, text, size, weight, maxW, it.nowrap);
    // 한 줄에 안 들어가는 단어가 있으면 글자를 줄인다
    for (let g = 0; g < 60; g++) { ctx.font = `${weight} ${size}px ${F}`; if (rows.every((r, i) => ctx.measureText(r + (i === rows.length - 1 ? sfx : '')).width <= maxW)) break; size -= 2; rows = rowsOf(ctx, text, size, weight, maxW, it.nowrap); }
    const lh = size * (it.lh || 1.16), cx = (it.x == null ? KINE.CX : it.x) + f.x, cy = it.y + f.y;
    ctx.save(); ctx.globalAlpha = f.o; ctx.translate(cx, cy); ctx.rotate(f.r * Math.PI / 180); ctx.scale(f.s, f.s);
    ctx.font = `${weight} ${size}px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const y0 = -((rows.length - 1) * lh) / 2;
    rows.forEach((r, i) => {
      const y = y0 + i * lh;
      // 읽힘: 어두운 부드러운 그림자 + 얇은 외곽(3D 배경이 밝아도 글자가 떠 보이게)
      ctx.shadowColor = it.shadow || 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.32; ctx.shadowOffsetY = size * 0.05;
      if (it.stroke !== false) { ctx.lineWidth = Math.max(4, size * 0.085); ctx.strokeStyle = it.strokeColor || 'rgba(8,10,20,0.55)'; if (it.suffix && i === rows.length - 1) { const sw = ctx.measureText(' ' + it.suffix).width; ctx.strokeText(r + ' ' + it.suffix, 0, y); void sw; } else ctx.strokeText(r, 0, y); }
      ctx.shadowColor = 'transparent';
      if (it.glow) { ctx.shadowColor = it.glow; ctx.shadowBlur = size * 0.5; }
      if (it.suffix && i === rows.length - 1) {
        // 뒤에 붙는 표시(예: 빨간 ✕) — 한 덩어리로 가운데 정렬
        const sw = ctx.measureText(' ' + it.suffix).width, rw = ctx.measureText(r).width, x0 = -(rw + sw) / 2;
        ctx.textAlign = 'left'; ctx.fillStyle = it.color || '#fff8f0'; ctx.fillText(r, x0, y);
        ctx.fillStyle = it.suffixColor || '#d7263d'; ctx.fillText(' ' + it.suffix, x0 + rw, y); ctx.textAlign = 'center';
      } else { ctx.fillStyle = it.color || '#fff8f0'; ctx.fillText(r, 0, y); }
      ctx.shadowColor = 'transparent';
    });
    ctx.restore();
  };
  KINE.draw = (ctx, t, W, H, items) => { for (const it of items) KINE.item(ctx, t, it); };
  // 장면 첫 순간의 번쩍임(컷 전환). big = 드롭
  KINE.cut = (ctx, t, W, H, o = {}) => {
    const a = (o.big ? 0.75 : 0.42) * Math.exp(-t / (o.big ? 0.13 : 0.07));
    if (a > 0.004) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,250,240,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  };
  // 장면 끝으로 갈수록 살짝 어두워짐 없이 그대로 두고, 다음 장면 첫 번쩍임으로 넘긴다. 맨 끝 장면만 fadeOut 을 쓴다
  KINE.fadeOut = (ctx, t, W, H, a, b) => { const k = clamp((t - a) / (b - a)); if (k > 0) { ctx.fillStyle = `rgba(0,0,0,${k})`; ctx.fillRect(0, 0, W, H); } };
  // 확인용 가운데선·여백선(?guide=1)
  KINE.guides = (ctx, W, H) => {
    if (!window.GUIDE) return;
    ctx.save(); ctx.strokeStyle = 'rgba(255,0,180,0.8)'; ctx.lineWidth = 3;
    for (const x of [130, 540, 950]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,220,255,0.8)'; for (const y of [154, 620, 1536]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  };
  // 위쪽 자막 배치: 실제 줄 수로 높이를 재서 위 구역(ZONE) 안에 차례로 쌓는다(긴 언어는 줄이 늘어난다).
  // 앞 줄이 out 으로 사라진 뒤 들어오는 줄은 같은 칸을 쓴다. 넘치면 그 장면의 위쪽 자막 전체를 같은 비율로 줄인다.
  // y 가 700 보다 아래인 항목(이름표·폰 아래 라벨 등)은 고정 위치 그대로 둔다.
  KINE.ZONE = [200, 620];
  const height = (ctx, it, scale) => {
    const text = it.text != null ? it.text : KINE.cap(it.k); if (!text) return 0;
    const weight = it.weight || 900, maxW = it.maxW || KINE.MAXW, sfx = it.suffix ? ' ' + it.suffix : '';
    let size = (it.size || 96) * scale, rows = rowsOf(ctx, text, size, weight, maxW, it.nowrap);
    for (let g = 0; g < 60; g++) { ctx.font = `${weight} ${size}px ${F}`; if (rows.every((r, i) => ctx.measureText(r + (i === rows.length - 1 ? sfx : '')).width <= maxW)) break; size -= 2; rows = rowsOf(ctx, text, size, weight, maxW, it.nowrap); }
    return rows.length * size * (it.lh || 1.16);
  };
  KINE.layout = (ctx, items) => {
    const top = items.filter((it) => it.y <= 700 && !it.fixed);
    if (!top.length) return;
    const slots = [];
    for (const it of top) { let s = slots.find((sl) => sl.every((q) => q.out != null && q.out <= it.at + 1e-6)); if (!s) { s = []; slots.push(s); } s.push(it); it._base = it._base || it.size || 96; }
    const gap = 18, room = KINE.ZONE[1] - KINE.ZONE[0];
    let scale = 1, hs = [];
    for (let k = 0; k < 30; k++) { hs = slots.map((sl) => Math.max(...sl.map((it) => height(ctx, it, scale)))); const tot = hs.reduce((a, b) => a + b, 0) + gap * (slots.length - 1); if (tot <= room) break; scale *= 0.95; }
    const tot = hs.reduce((a, b) => a + b, 0) + gap * (slots.length - 1);
    let y = KINE.ZONE[0] + (room - tot) / 2;
    slots.forEach((sl, i) => { for (const it of sl) { it.size = it._base * scale; it.y = y + hs[i] / 2; } y += hs[i] + gap; });
  };
  // 장면 overlay 공통: 자막 + 컷 번쩍임 + 확인선
  KINE.overlay = (items, o = {}) => (ctx, t, W, H) => {
    if (!items._laid) { KINE.layout(ctx, items); items._laid = true; }
    if (o.extra) o.extra(ctx, t, W, H);
    KINE.draw(ctx, t, W, H, items);
    const pa = o.pulse == null ? 0.07 : o.pulse;
    if (pa > 0) { const bar = 4 * ANBU.B, dt = t % bar, a = pa * Math.exp(-dt * 9) + 0.4 * pa * Math.exp(-(t % ANBU.B) * 14); if (t > 0.2 && a > 0.003) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75); g.addColorStop(0, `rgba(255,250,240,${a * 0.4})`); g.addColorStop(1, `rgba(255,250,240,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
    KINE.cut(ctx, t, W, H, { big: o.big });
    KINE.guides(ctx, W, H);
  };
})();
