// never — 장면 4(8마디). device-hero: 폰 한 대가 1.5마디마다 상태를 바꾼다.
//   절전(화면이 꺼지고 달빛) → 앱 꺼짐(앱 카드가 위로 쓸려 닫힘) → 재부팅(검은 화면에 도는 고리) → 통신 끊김(안테나 막대가 꺼짐, 붉은 빛)
//   → 망이 돌아오고(막대가 다시 참) 날개 아이콘이 날아와 안부 알림이 뜬다. ⚠ 끊긴 동안에는 알림이 오지 않는다(사실과 맞게).
// 자막: 조건 한 줄씩(1.5마디씩 머묾) → p_d5 안부는 멈추지 않아요 + p_d6 각주(전원이 완전히 꺼진 경우 제외).
(function () {
  const B = ANBU.B, D = 8 * ANBU.BAR;
  const T = [0, 6 * B, 12 * B, 18 * B, 24 * B];          // 절전·앱 꺼짐·재부팅·끊김·복구
  const BACK = 24.6 * B, PUSH = 26.5 * B;
  registerStyle({
    id: 'never', name: 'Four states, still arrives', duration: D,
    koText: '폰이 절전 상태에 들어가도, 앱이 꺼져 있어도, 폰이 재부팅되어도, 통신이 끊겨도 안부는 멈추지 않아요 폰 전원이 완전히 꺼진 경우는 제외 18:00',
    render: { samples: 32, shutter: 0.55, tone: 'filmic', exposure: 1.0, bloom: 0.5, bloomThreshold: 1.05, vignette: 0.38, grain: 0.012, fov: 30, near: 0.05, far: 200, background: '#06070d' },
    async build(S) {
      const { THREE, camera, scene } = S;
      const L = ANBU.S(), icon = await ANBU.loadIconImage();
      const env = HERO.studio(S, { glow: '#1f2a52', warm: '#d8e2ff', cool: '#8fa9d6', rimL: '#9fb6ff', rimR: '#c8d0ff' });
      const st = (t) => (t < T[1] ? 0 : t < T[2] ? 1 : t < T[3] ? 2 : t < T[4] ? 3 : 4);
      const phone = HERO.phone(S, { env, draw(ctx, t, W, H) {
        const s = st(t), p = t - T[s];
        const bg = (a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
        // 상태 막대(시각·안테나)
        const bars = (n, col) => { for (let i = 0; i < 4; i++) { ctx.fillStyle = i < n ? col : 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.roundRect(W - 190 + i * 30, 92 - i * 12 - 18, 20, 18 + i * 12, 4); ctx.fill(); } };
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (s === 0) {             // 절전: 화면이 서서히 꺼지고 달 하나
          bg('#26315a', '#4b3e66'); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `300 230px "Noto Sans KR"`; ctx.fillText('18:00', W / 2, 400); bars(4, '#fff');
          const off = K.smooth(0.3, 1.2, p); ctx.fillStyle = `rgba(0,0,0,${0.93 * off})`; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.globalAlpha = off; ctx.fillStyle = '#dfe6ff'; ctx.beginPath(); ctx.arc(W / 2, 860, 110, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(W / 2 + 55, 820, 100, 0, 7); ctx.fill(); ctx.restore();
        } else if (s === 1) {      // 앱 꺼짐: 앱 화면 카드가 작아졌다가 위로 휙 쓸려 사라진다
          bg('#1a1d2b', '#0e1018'); bars(4, '#fff');
          const shrink = K.ease.out(K.seg(p, 0.1, 0.6)), flick = K.ease.in(K.seg(p, 1.0, 1.45));
          const cw = W * (1 - 0.3 * shrink), ch = H * (1 - 0.3 * shrink), cx = W / 2, cy = H / 2 - flick * H * 1.1;
          ctx.save(); ctx.globalAlpha = 1 - flick * 0.6; ctx.beginPath(); ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 60 * shrink); ctx.clip();
          ctx.fillStyle = '#f4f1ec'; ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
          const is = 260 * (1 - 0.3 * shrink); ctx.save(); ctx.beginPath(); ctx.roundRect(cx - is / 2, cy - is * 0.9, is, is, is * 0.23); ctx.clip(); ctx.drawImage(icon, cx - is / 2, cy - is * 0.9, is, is); ctx.restore();
          ctx.fillStyle = '#2a2d33'; ctx.font = `800 ${110 * (1 - 0.3 * shrink)}px "Noto Sans KR"`; ctx.fillText(L.app, cx, cy + is * 0.45); ctx.restore();
        } else if (s === 2) {      // 재부팅: 검은 화면 + 도는 고리 + 흰 번쩍(켜지는 순간)
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
          const on = K.smooth(0.25, 0.5, p);
          ctx.save(); ctx.globalAlpha = on; ctx.translate(W / 2, H / 2); ctx.lineCap = 'round';
          for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.85 * (((i - Math.floor(p * 14)) % 12 + 12) % 12) / 12})`; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(0, 120); ctx.stroke(); }
          ctx.restore();
          const fl = Math.exp(-Math.max(0, p - 0.12) * 9) * (p > 0.12 ? 1 : 0); if (fl > 0.01) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
        } else {                   // 끊김(3) → 복구(4)
          bg('#2b2a4a', '#7a4656'); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = `300 230px "Noto Sans KR"`; ctx.fillText('18:00', W / 2, 470);
          if (s === 3) {
            const n = 4 - Math.min(4, Math.floor(p / 0.25));
            bars(n, n > 1 ? '#fff' : '#ff6b6b');
            const off = K.smooth(1.0, 1.3, p);
            ctx.save(); ctx.globalAlpha = off; ctx.translate(W / 2, 980); ctx.strokeStyle = '#ff8a8a'; ctx.lineWidth = 18; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(-60, 20, 70, Math.PI * 0.6, Math.PI * 1.75); ctx.arc(40, -10, 95, Math.PI * 1.1, Math.PI * 1.95); ctx.arc(110, 40, 55, Math.PI * 1.5, Math.PI * 0.5); ctx.lineTo(-60, 90); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-150, -110); ctx.lineTo(170, 170); ctx.stroke(); ctx.restore();
          } else {
            const n = Math.min(4, Math.floor(p / 0.12)); bars(n, n === 4 ? '#7af0b8' : '#fff');
            HERO.ui.push(ctx, W, { icon, y: 640, title: L.pushTitle, body: L.pushBody, k: K.seg(t, PUSH, PUSH + 0.5), app: L.app, now: L.now });
          }
        }
      } });
      const PY = 4.6;
      phone.group.position.set(0, PY, 0); scene.add(phone.group);
      const plinth = new THREE.Mesh(K.roundedBox(7, 0.5, 4, 0.12, 4), new THREE.MeshStandardMaterial({ color: '#121319', roughness: 0.45, metalness: 0.5, envMap: env })); plinth.position.y = 0.25; plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);
      const W2 = HERO.wingedIcon(S, icon, { size: 1.1, glow: 0.05 }); scene.add(W2.group);
      const inPath = new THREE.CatmullRomCurve3([[9, 14, -2], [5, 10, 1], [2.2, 7.5, 2.4], [0.4, PY + 1.8, 0.9]].map((p) => new THREE.Vector3(...p)));
      // 상태별 빛 — 위쪽 키 조명의 색과 세기가 바뀐다 + 옆 림 라이트
      const key = K.spot(S, { pos: [-7, 15, 12], target: [0, PY, 0], color: '#ffffff', power: 1200, angle: 0.42, penumbra: 0.85, soft: 1.0 });
      const rim = K.spot(S, { pos: [9, 8, -8], target: [0, PY, 0], color: '#9fb6ff', power: 600, angle: 0.5, penumbra: 1, shadow: false });
      const COL = [['#9fb4ff', 700, '#5f7cff'], ['#e2e2e8', 1100, '#9aa3b8'], ['#ffffff', 1300, '#d8dcff'], ['#ff9a8a', 900, '#ff3b4a'], ['#ffd9b8', 1300, '#ffb27a']];
      // 카메라: 상태마다 다른 각도 + 바뀌는 순간 크래시. 절전(높은 3/4 → 내려옴) / 앱 꺼짐(낮은 오른쪽 근접, 카드 따라 틸트 업)
      // / 재부팅(옆모습 와이드, 돌며 정면으로) / 끊김(낮은 더치 앵글) / 복구(크게 물러나 날아오는 아이콘 → 알림에 크래시 줌)
      const CYp = PY + 0.35, s = 0.3;
      const camP = ANBU.path([[0, [-7, PY + 9.5, 17]], [T[1] - 0.15, [-2.2, PY + 3.4, 17.5]], [T[1] + s, [2.6, PY + 0.4, 9.2], 'snap'], [T[2] - 0.15, [3.0, PY + 0.9, 9.8]],
        [T[2] + s, [12.5, PY + 2.6, 4.5], 'snap'], [T[3] - 0.15, [9.5, PY + 2.9, 13.5]], [T[3] + s, [-3.6, PY - 1.6, 12.5], 'snap'], [T[4] - 0.15, [-2.6, PY - 1.0, 11.2]],
        [T[4] + s, [0.5, PY + 3.6, 27], 'snap'], [PUSH - 0.05, [0.4, PY + 3.0, 24]], [PUSH + 0.35, [0.6, CYp + 1.6, 13.4], 'snap'], [D, [0.3, CYp + 1.4, 12.2]]]);
      const aimP = ANBU.path([[0, [0, PY + 2.4, 0]], [T[1] - 0.15, [0, PY + 2.8, 0]], [T[1] + s, [0, PY + 1.7, 0], 'snap'], [T[1] + 0.95, [0, PY + 1.7, 0]], [T[1] + 1.6, [0, PY + 4.8, 0]], [T[2] - 0.15, [0, PY + 2.6, 0]],
        [T[2] + s, [0, PY + 2.3, 0], 'snap'], [T[3] - 0.15, [0, PY + 2.6, 0]], [T[3] + s, [0, PY + 3.0, 0], 'snap'], [T[4] - 0.15, [0, PY + 3.0, 0]],
        [T[4] + s, [0, PY + 3.4, 0], 'snap'], [PUSH - 0.05, [0, PY + 3.0, 0]], [PUSH + 0.35, [0, CYp + 1.15, 0], 'snap'], [D, [0, CYp + 1.05, 0]]]);
      const fovP = ANBU.path([[0, 32], [T[1] + s, 32, 'snap'], [T[2] + s, 30, 'snap'], [T[3] + s, 34, 'snap'], [T[4] + s, 30, 'snap'], [D, 30]]);
      const rollP = ANBU.path([[0, 0], [T[3] - 0.1, 0], [T[3] + s, 0.22, 'snap'], [T[4] - 0.1, 0.17], [T[4] + s, 0, 'snap'], [D, 0]]);
      const items = [
        { k: 'p_d1', at: T[0], out: T[1] - 0.2, y: 400, size: 88, kind: 'slam', color: '#fff8f0' },
        { k: 'p_d2', at: T[1], out: T[2] - 0.2, y: 400, size: 92, kind: 'slam', color: '#ffd166' },
        { k: 'p_d3', at: T[2], out: T[3] - 0.2, y: 400, size: 92, kind: 'slam', color: '#fff8f0' },
        { k: 'p_d4', at: T[3], out: T[4] - 0.2, y: 400, size: 96, kind: 'slam', color: '#ff9a9a' },
        { k: 'p_d5', at: T[4], y: 380, size: 104, kind: 'slam', color: '#ffd166', glow: 'rgba(255,170,90,0.5)' },
        { k: 'p_d6', at: T[4] + B, y: 585, size: 40, kind: 'fade', color: '#c9cfe6', weight: 600, stroke: false },
      ];
      const ca = new THREE.Color(), cb = new THREE.Color();
      return {
        update(t) {
          const s = st(t), mix = K.smooth(T[s], T[s] + 0.35, t), prev = COL[Math.max(0, s - 1)], cur = COL[s];
          key.color.copy(ca.set(prev[0]).lerp(cb.set(cur[0]), s ? mix : 1)); key.intensity = K.lerp(prev[1], cur[1], s ? mix : 1);
          rim.color.copy(ca.set(prev[2]).lerp(cb.set(cur[2]), s ? mix : 1));
          // 조건마다 카메라가 한 번 밀려 들어감(펀치) + 전체는 천천히 좌우로 도는 궤도
          const sh = ANBU.shake(t, [T[2] + 0.12, T[3] + 1.0, PUSH], 0.1, 7); sh[2] += rollP(t);
          ANBU.shoot(camera, camP(t), aimP(t), fovP(t), sh); K.focus(camera, [0, PY + 0.4, 0], 0.07);
          // 재부팅 순간 폰이 살짝 떨림, 끊김 때 붉게
          phone.group.rotation.z = s === 2 ? 0.015 * Math.sin(t * 70) * Math.exp(-(t - T[2]) * 4) : 0;
          // 복구 뒤 날개 아이콘이 날아와 폰 화면으로 들어감
          const u = K.seg(t, BACK, PUSH, K.ease.inOut);
          W2.group.visible = t > BACK && t < PUSH + 0.15;
          W2.group.position.copy(inPath.getPoint(u)); W2.group.scale.setScalar(1 - 0.6 * K.seg(t, PUSH - 0.4, PUSH + 0.1));
          W2.group.rotation.set(0.2, -0.5 * (1 - u), -0.2 * (1 - u)); W2.pose(1, t * 20, 0.7);
          phone.redraw(t);
        },
        overlay: KINE.overlay(items),
      };
    },
    sound(k) {
      k.tone(0.3, { f: [[0, 'E5'], [1.0, 'E3']], dur: 1.2, gain: 0.04, a: 0.02 });               // 절전
      k.play('swish', T[1] + 1.0, { dur: 0.35, gain: 1.0 });                                         // 앱 카드 쓸림
      k.play('boot', T[2] + 0.1, { gain: 0.8 });                                                     // 재부팅
      for (let i = 0; i < 4; i++) k.play('blip', T[3] + i * 0.25, { f: ['E5', 'C5', 'A4', 'E4'][i], dur: 0.06, gain: 0.5 });   // 막대 꺼짐
      k.play('error', T[3] + 1.05, { gain: 0.5 });
      for (let i = 0; i < 4; i++) k.play('blip', T[4] + i * 0.12, { f: ['C5', 'E5', 'G5', 'C6'][i], dur: 0.05, gain: 0.5 });  // 복구
      k.play('whoosh', BACK, { dur: 0.8, top: 2800, gain: 0.8 });
      k.play('success', PUSH, { f: 'E6', gain: 0.55 });
    },
  });
})();
