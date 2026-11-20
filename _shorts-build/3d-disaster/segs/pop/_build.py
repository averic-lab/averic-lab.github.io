# segs/pop/style.js 를 만든다: 내 내용(_content.js) + 원본 팝업북 엔진(_recipes/paper-pop-up.ref.js, 패치) + 내 카메라·소리(_tail.js)
import re
REF = '/Users/macmini/Project/Anbu/3D_Style_Atlas/_recipes/paper-pop-up.ref.js'
L = open(REF).read().split('\n')
content = open('_content.js').read().rstrip('\n')
tail = open('_tail.js').read()
clock = '\n'.join(L[144:150])            # flip / landed
engine = '\n'.join(L[166:409])            # build(S) ~ lights
def sub(old, new, s, count=1):
    assert old in s, old[:80]
    return s.replace(old, new, count)
engine = sub("    build(S) {", "    async build(S) {\n      const introImg = await new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'segs/pop/intro.png?v=' + Date.now(); });", engine)
engine = sub("const pen = (ctx, back) => {", "// 꺼진 등: 인쇄는 어둡게, 켜지면 발광(emissive)으로 밝아진다\n      const dimC = (h) => { const n = parseInt(h.slice(1), 16), m = (v, d) => Math.round(v * 0.32 + d * 0.68); return `rgb(${m(n >> 16 & 255, 26)},${m(n >> 8 & 255, 30)},${m(n & 255, 44)})`; };\n      const pen = (ctx, back, glow) => {", engine)
engine = sub("path(col, fn) { ctx.fillStyle = col;", "path(col, fn) { ctx.fillStyle = glow ? '#000000' : col;", engine)
engine = sub("line(col, w, fn, dash) { ctx.strokeStyle = col;", "line(col, w, fn, dash) { ctx.strokeStyle = glow ? '#000000' : col;", engine)
engine = sub("ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },",
 "ctx.fillStyle = glow ? '#000000' : col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },\n"
 "          lamp(col, fn) { ctx.fillStyle = glow ? (glow === 'mono' ? '#ffffff' : col) : dimC(col); ctx.beginPath(); fn(ctx); ctx.fill(); return a; },\n"
 "          txt(str, x, y, size, col, weight = 900) { if (a.back) return a; ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, -size / 100); ctx.font = `${weight} 100px \"Noto Sans KR\"`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = glow ? '#000000' : col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },", engine)
engine = sub("function dieCut(x0, y0, w, h, draw) {", "function dieCut(x0, y0, w, h, draw, glowMode) {", engine)
engine = sub("        return { tex, rear, outline, x0, y0, w, h };",
 "        const glow = glowMode ? K.canvasTex(cw, ch, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, cw, ch); c.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(c, false, glowMode)); }) : null;\n"
 "        return { tex, rear, outline, x0, y0, w, h, glow };", engine)
engine = sub("m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; parent.add(m);\n        return m;",
 "m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; parent.add(m);\n"
 "        if (cut.glow) { const mt = m.material[0]; mt.emissiveMap = cut.glow; mt.emissive = new THREE.Color('#ffffff'); mt.emissiveIntensity = 0; }\n        return m;", engine)
gm = "o.lit ? (o.mono ? 'mono' : 'col') : null"
engine = sub("dieCut(-o.size[0] / 2, -0.1, o.size[0], o.size[1] + 0.25, o.art)", f"dieCut(-o.size[0] / 2, -0.1, o.size[0], o.size[1] + 0.25, o.art, {gm})", engine)
engine = sub("dieCut(o.span[0], -0.1, o.span[1] - o.span[0], o.height + 0.25, o.art)", f"dieCut(o.span[0], -0.1, o.span[1] - o.span[0], o.height + 0.25, o.art, {gm})", engine)
engine = sub("dieCut(x0, y0, x1 - x0, y1 - y0, o.art)", f"dieCut(x0, y0, x1 - x0, y1 - y0, o.art, {gm})", engine)
engine = sub("const parts = [...sp.parts, ribbon(sp.words)].map", "const parts = [...sp.parts].map", engine)
engine = sub("        return { group, parts };", "        return { group, parts, byId };", engine)
# 덮인 첫 페이지(오른쪽) = 인트로 마지막 그림. 위에서 내려다보면 3.6 x 6.4 가 세로 화면을 꽉 채운다
engine = sub("const endpaper = (a) => {", "const endpaper = (a) => { a.box('#0b1020', -5.7, -3.3, 11.4, 6.6); };\n      const endpaperOld = (a) => {", engine)
engine = sub("face(1, j ? SPREADS[j - 1].floor : endpaper)", "(j ? face(1, SPREADS[j - 1].floor) : introFace)", engine)
engine = sub("      const leaves = TURNS.map((_, j) => {",
 "      const IPX = 330, introTex = K.canvasTex(Math.round(PAGE_W * IPX), Math.round(PAGE_D * IPX), (ctx, w, h) => {\n"
 "        ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h);\n"
 "        if (introImg) { const iw = 3.6 * IPX, ih = PAGE_D * IPX, x = (2.8 - 1.8) * IPX; ctx.filter = 'blur(28px)'; ctx.drawImage(introImg, -0.2 * w, -0.05 * h, w * 1.4, h * 1.1); ctx.filter = 'none'; ctx.fillStyle = 'rgba(8,10,20,0.45)'; ctx.fillRect(0, 0, w, h); ctx.drawImage(introImg, x, 0, iw, ih); }\n"
 "        grain(ctx, w, h);\n"
 "      });\n"
 "      const introFace = new THREE.MeshStandardMaterial({ map: introTex, roughness: 0.9, metalness: 0, bumpMap: bumpFor(PAGE_W, PAGE_D), bumpScale: 0.12 });\n"
 "      const leaves = TURNS.map((_, j) => {", engine)
meta = """  registerStyle({
    id: 'disaster-popup',
    name: '72시간 — 팝업북',
    family: 'Material worlds',
    look: 'paper-pop-up 바탕. 재난 다섯 장 + 공통점 + 생존배낭.',
    duration: DUR,
    koText: KO_TEXT,
    fonts: ['700 100px "Fraunces"', '900 100px "Noto Sans KR"', '800 100px "Noto Sans KR"', '700 100px "Noto Sans KR"', '500 100px "Noto Sans KR"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 0.92, saturation: 1.08, bloom: 0.22, bloomThreshold: 1.0, vignette: 0.45, grain: 0.014, fov: 40, background: '#050403' },
"""
out = content + '\n\n' + clock + '\n\n' + meta + '\n' + engine + '\n\n' + tail
open('style.js', 'w').write(out)
print('ok', len(out))
