// 공통 자막(2D overlay). 모든 장면이 같은 모양을 쓴다 — 장면마다 자막 모양이 다르면 섞은 화풍이 더 어수선해 보인다.
// 사용: overlay(ctx, t, W, H) { CAP.draw(ctx, t, W, H, [ { a: 0.2, b: 3.4, tag: '여행 · 7일', lines: ['멀리 떠나 있는 동안,', '매일 안부 전화, *가능할까요?*'] } ]) }
//   *단어*  = 호박색 강조.  a/b = 보이는 구간(초).  stagger = 줄 사이 지연(기본 1박).  size = 글자 크기(px, 기본 76)
//   pos: 'top'(기본, 위 안전 영역 아래) | 'bottom'(아래 안전 영역 위)
(function () {
  const AMBER = '#ffb02e', WHITE = '#f4efe6';
  const eo = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const parse = (s) => s.split('*').map((p, i) => ({ s: p, hl: i % 2 === 1 })).filter((p) => p.s);
  function lineW(ctx, parts) { return parts.reduce((w, p) => w + ctx.measureText(p.s).width, 0); }
  window.CAP = {
    draw(ctx, t, W, H, list) {
      const B = (window.ANBU && ANBU.B) || 0.4878;
      for (const c of list) {
        if (t < c.a - 0.01 || t > c.b + 0.01) continue;
        const out = c.b - t < 0.18 ? Math.max(0, (c.b - t) / 0.18) : 1;
        const stag = c.stagger == null ? B : c.stagger, size0 = c.size || 76, maxW = 820;
        const lines = c.lines.map(parse);
        // 가장 긴 줄이 820px(좌우 130px 안쪽)에 들어가게 줄인다
        ctx.font = `900 ${size0}px "Noto Sans KR"`;
        const widest = lines.length ? Math.max(...lines.map((l) => lineW(ctx, l))) : 1;
        const size = Math.floor(size0 * Math.min(1, maxW / widest)), lh = size * 1.28;
        const ts = (typeof c.tagSize === 'function' ? c.tagSize(ctx) : c.tagSize) || 38, tagStep = Math.round(ts * 74 / 38);   // 꼬리표 크기(px). 알약 높이·간격이 같이 커진다
        const blockH = lh * lines.length + (c.tag ? tagStep : 0);
        const top = c.pos === 'bottom' ? 1536 - 40 - blockH : 154 + 46;
        // 글자 뒤 어둠(장면이 밝아도 읽히게) — 화면 위쪽에 넓고 부드럽게
        const vis = eo((t - c.a) / 0.22) * out;
        ctx.save();
        const g0 = c.pos === 'bottom' ? top - 140 : 0, g1 = c.pos === 'bottom' ? H : top + blockH + 150;
        const g = ctx.createLinearGradient(0, g0, 0, g1);
        if (c.pos === 'bottom') { g.addColorStop(0, 'rgba(4,5,8,0)'); g.addColorStop(1, 'rgba(4,5,8,0.62)'); } else { g.addColorStop(0, 'rgba(4,5,8,0.62)'); g.addColorStop(1, 'rgba(4,5,8,0)'); }
        ctx.globalAlpha = (c.shade == null ? 1 : c.shade) * vis; ctx.fillStyle = g; ctx.fillRect(0, g0, W, g1 - g0);
        ctx.restore();
        let y = top;
        if (c.tag) {
          const k = eo((t - c.a) / 0.2) * out;
          const ph = Math.round(ts * 56 / 38);
          ctx.save(); ctx.globalAlpha = k; ctx.font = `800 ${ts}px "Noto Sans KR"`;
          const tw = ctx.measureText(c.tag).width + ts * 44 / 38;
          ctx.translate(W / 2, y + ph / 2 - 2 - (1 - k) * 14);
          ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
          ctx.fillStyle = AMBER; ctx.beginPath(); ctx.roundRect(-tw / 2, -ph / 2, tw, ph, ph / 2); ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = '#101216'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.tag, 0, 2);
          ctx.restore(); y += tagStep;
        }
        lines.forEach((parts, i) => {
          const a = c.a + i * stag, k = eo((t - a) / 0.22) * out;
          if (k <= 0) return;
          const hlLine = parts.some((p) => p.hl), pop = hlLine ? 1 + 0.12 * Math.max(0, 1 - (t - a) / 0.2) : 1;
          ctx.save(); ctx.globalAlpha = k; ctx.font = `900 ${size}px "Noto Sans KR"`; ctx.textBaseline = 'middle';
          ctx.translate(W / 2, y + lh / 2 + (1 - k) * 26); ctx.scale(pop, pop);
          const w = lineW(ctx, parts); let x = -w / 2;
          ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
          for (const p of parts) { ctx.fillStyle = p.hl ? AMBER : WHITE; ctx.fillText(p.s, x, 0); x += ctx.measureText(p.s).width; }
          ctx.restore(); y += lh;
        });
      }
    },
  };
})();
