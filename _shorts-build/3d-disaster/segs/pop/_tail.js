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
