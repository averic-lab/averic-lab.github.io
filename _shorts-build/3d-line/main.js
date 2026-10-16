// 삶의 선 — render(ms) 결정적 렌더(벽시계·Math.random 미사용). 3D(three.js) + 2D 오버레이(자막·푸시·엔딩)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import STRINGS from './strings.json';
import ICON_URL from './app_icon_512.png';
import { wrap, drawLine } from './text.js';

const LANG = new URLSearchParams(location.search).get('lang') || 'ko';
const L = STRINGS[LANG];
const WIDE = new URLSearchParams(location.search).get('fmt') === 'wide';   // 16:9 가로판(Google Play 소개 영상) — 옵션이 없으면 세로판 그대로
const VW = WIDE ? 960 : 540, VH = WIDE ? 540 : 960, PR = 2;
window.DURATION = 138;

// ─── 도구 ───────────────────────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ─── 렌더러·합성 ─────────────────────────────────────────────────────────
const wrapEl = document.getElementById('wrap'); wrapEl.style.width = VW + 'px'; wrapEl.style.height = VH + 'px';
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR); renderer.setSize(VW, VH);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
wrapEl.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, VW / VH, 0.01, 600);
if (WIDE) camera.up.set(-1, 0, 0);   // 가로판: 월드 +y(삶이 흐르는 방향)가 화면 오른쪽 — 시간이 왼쪽에서 오른쪽으로 흐른다
{
  const c = document.createElement('canvas'); c.width = WIDE ? 480 : 270; c.height = WIDE ? 270 : 480; const g = c.getContext('2d');
  const gr = WIDE ? g.createRadialGradient(240, 115, 10, 240, 130, 300) : g.createRadialGradient(135, 200, 10, 135, 230, 340);
  gr.addColorStop(0, '#0e1530'); gr.addColorStop(.5, '#070b1c'); gr.addColorStop(1, '#010208');
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
const rt = new THREE.WebGLRenderTarget(VW * PR, VH * PR, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(PR); composer.setSize(VW, VH);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(VW, VH), 0.85, 0.75, 0.2); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grain = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, seed: { value: 0 }, fade: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float seed, fade;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed)*43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv-0.5; d.x*=${WIDE ? '0.9' : '0.5625'};
      float vig = smoothstep(0.78, 0.18, length(d)); c.rgb *= mix(0.62, 1.0, vig);
      c.rgb += (h(vUv*vec2(1080.,1920.)) - 0.5)*0.016; gl_FragColor = vec4(c.rgb*fade, 1.); }`,
});
composer.addPass(grain);

// ─── 삶의 선(주인공) ──────────────────────────────────────────────────────
const HERO = new THREE.CatmullRomCurve3([
  V3(-1.6, -13, 1.6), V3(1.3, -9.6, -1.3), V3(-2.1, -5.6, 2.1), V3(1.7, -2.2, -1.1), V3(-1.2, 1.4, 1.9),
  V3(1.9, 5.0, -1.7), V3(-0.9, 8.6, 1.2), V3(1.0, 11.3, -0.6), V3(0.2, 13.2, 0),
], false, 'centripetal');
HERO.arcLengthDivisions = 3000;
const heroAt = u => HERO.getPointAt(clamp(u));
const heroTan = u => HERO.getTangentAt(clamp(u));
const E = heroAt(1);
const U0 = 0.40;                 // 지금의 나
const D = heroAt(U0);

// ─── 점 구름(먼지) 공통 셰이더 ───────────────────────────────────────────
const dustVS = `
attribute float aU, aSeed, aSize, aT0, aDur, aKin; attribute vec3 aCol;
uniform float uTime, uPx, uMinPx, uMaxPx, uGain, uSway, uEnd, uFl0, uFl1, uFl2, uKU0, uKU1, uKU2, uRevOn, uWin, uLo, uHi;
uniform vec3 uTint;
varying vec3 vCol; varying float vA;
void main(){
  float rev = uRevOn > .5 ? clamp((uTime - aT0)/aDur, 0., 1.) : 1.;
  float vis = rev >= 1. ? 1. : 1. - smoothstep(rev - .05, rev, aU);
  if (uWin > .5) vis *= smoothstep(uLo - .01, uLo + .01, aU)*(1. - smoothstep(uHi - .01, uHi + .01, aU));
  float head = (rev > .001 && rev < .999) ? exp(-pow((aU - rev)/.03, 2.)) : 0.;
  vec3 p = position + uSway*vec3(sin(uTime*.6+aSeed*20.), cos(uTime*.5+aSeed*31.), sin(uTime*.7+aSeed*13.))*(.3+aU);
  vec4 mv = modelViewMatrix*vec4(p,1.);
  float tw = .62 + .38*sin(uTime*2. + aSeed*60.);
  float fl = 0.;
  if (aKin > -.5 && aKin < .5) fl = uFl0*exp(-pow((aU-uKU0)/.14, 2.));
  else if (aKin > .5 && aKin < 1.5) fl = uFl1*exp(-pow((aU-uKU1)/.14, 2.));
  else if (aKin > 1.5) fl = uFl2*exp(-pow((aU-uKU2)/.14, 2.));
  float endB = 1. + uEnd*smoothstep(.78, 1., aU)*1.2;
  vA = (vis*tw + head*1.6)*uGain*endB*(1. + fl*2.6);
  vCol = aCol*uTint*(1. + fl*.9);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = clamp(aSize*uPx/max(-mv.z, .01), uMinPx, uMaxPx);
}`;
const dustFS = `varying vec3 vCol; varying float vA;
void main(){ vec2 q = gl_PointCoord - .5; float d = length(q)*2.; if (d > 1.) discard; float a = exp(-d*d*4.); gl_FragColor = vec4(vCol, vA*a); }`;
const PX = { value: 1 };    // 월드 1유닛(거리 1)의 화면 픽셀 — 카메라 화각에서 매 프레임 갱신
function dustUniforms(o = {}) {
  return {
    uTime: { value: 0 }, uPx: PX, uMinPx: { value: o.minPx ?? 1.5 }, uMaxPx: { value: o.maxPx ?? 14 }, uGain: { value: o.gain ?? 1 }, uSway: { value: o.sway ?? .08 },
    uEnd: { value: 0 }, uFl0: { value: 0 }, uFl1: { value: 0 }, uFl2: { value: 0 }, uKU0: { value: 0 }, uKU1: { value: 0 }, uKU2: { value: 0 },
    uRevOn: { value: o.rev ? 1 : 0 }, uWin: { value: o.win ? 1 : 0 }, uLo: { value: 0 }, uHi: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) },
  };
}
function makeDust(list, o = {}) {
  const n = list.length, pos = new Float32Array(n * 3), aU = new Float32Array(n), aSeed = new Float32Array(n), aSize = new Float32Array(n),
    aT0 = new Float32Array(n), aDur = new Float32Array(n), aKin = new Float32Array(n).fill(-1), aCol = new Float32Array(n * 3);
  list.forEach((p, i) => {
    pos.set(p.pos, i * 3); aU[i] = p.u ?? 0; aSeed[i] = p.seed ?? 0; aSize[i] = p.size ?? .06; aT0[i] = p.t0 ?? 0; aDur[i] = p.dur ?? 1;
    aKin[i] = p.kin ?? -1; aCol.set(p.col ?? [1, 1, 1], i * 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  for (const [k, a, s] of [['aU', aU, 1], ['aSeed', aSeed, 1], ['aSize', aSize, 1], ['aT0', aT0, 1], ['aDur', aDur, 1], ['aKin', aKin, 1], ['aCol', aCol, 3]]) g.setAttribute(k, new THREE.BufferAttribute(a, s));
  const m = new THREE.ShaderMaterial({ uniforms: dustUniforms(o), vertexShader: dustVS, fragmentShader: dustFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts); return pts;
}

// ─── 배경: 먼 별 + 가까운 먼지(시차) ────────────────────────────────────
{
  const r = mulberry32(11), a = [];
  for (let i = 0; i < 2400; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), R = 180 + r() * 120;
    a.push({ pos: [R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th)], seed: r(), size: .25 + r() * .9, col: r() < .25 ? [1, .85, .7] : [.7, .8, 1] });
  }
  const s = makeDust(a, { gain: .55, sway: 0, minPx: 1.2, maxPx: 3.2 });
}
const NEAR = (() => {
  const r = mulberry32(23), a = [];
  for (let i = 0; i < 2600; i++) a.push({ pos: [(r() - .5) * 40, (r() - .5) * 34, (r() - .5) * 26], seed: r(), size: .03 + r() * .08, col: [.55, .65, .95] });
  return makeDust(a, { gain: .2, sway: .35, minPx: 1, maxPx: 5 });
})();

// ─── 삶의 선: 카메라를 보는 리본(화면 픽셀 두께) ─────────────────────────
const heroMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }, uPx: PX, uRes: { value: new THREE.Vector2(VW * PR, VH * PR) }, uWorldW: { value: .05 }, uMinPx: { value: 2.2 }, uMaxPx: { value: 9 },
    uLo: { value: U0 }, uHi: { value: U0 }, uDotU: { value: U0 }, uDotGain: { value: 1 }, uDim: { value: 1 }, uEndG: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) },
  },
  vertexShader: `attribute vec3 aNext; attribute float aU, aSide; uniform vec2 uRes; uniform float uPx, uWorldW, uMinPx, uMaxPx;
    varying float vU, vSide;
    void main(){
      vec4 c0 = projectionMatrix*modelViewMatrix*vec4(position,1.), c1 = projectionMatrix*modelViewMatrix*vec4(aNext,1.);
      vec2 s0 = c0.xy/c0.w*uRes*.5, s1 = c1.xy/c1.w*uRes*.5; vec2 d = s1 - s0; float l = length(d); vec2 dir = l > 1e-4 ? d/l : vec2(0.,1.);
      vec2 nrm = vec2(-dir.y, dir.x);
      float tp = (.38 + .62*smoothstep(0.,.1,aU))*(1. - .93*smoothstep(.5,1.,aU));
      float w = clamp(uWorldW*tp*uPx/max(c0.w,.01), uMinPx*max(tp,.3), uMaxPx*tp);
      vec2 s = s0 + nrm*aSide*w;
      gl_Position = vec4(s/(uRes*.5)*c0.w, c0.z, c0.w); vU = aU; vSide = aSide; }`,
  fragmentShader: `varying float vU, vSide; uniform float uLo, uHi, uDotU, uDotGain, uDim, uEndG; uniform vec3 uTint;
    void main(){
      float win = smoothstep(uLo-.006, uLo+.006, vU)*(1. - smoothstep(uHi-.006, uHi+.006, vU));
      float edge = exp(-pow((vU-uLo)/.012, 2.)) + exp(-pow((vU-uHi)/.012, 2.));
      vec3 cw = vec3(1., .70, .40), cm = vec3(.96, .93, .90), cc = vec3(.42, .58, 1.);
      vec3 col = mix(cw, cm, smoothstep(0., .35, vU)); col = mix(col, cc, smoothstep(.45, .95, vU));
      float prof = exp(-vSide*vSide*3.4);
      float dg = exp(-pow((vU-uDotU)/.035, 2.))*uDotGain;
      float tail = 1. - .86*smoothstep(.5, .98, vU)*(1. - uEndG);
      float tick = .82 + .18*smoothstep(.6, 1., sin(vU*1400.));
      float b = (.62 + dg*2.4 + edge*1.6)*tail*uDim*tick;
      gl_FragColor = vec4(col*uTint*b, win*prof); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
function ribbonMesh(curve, M, material) {
  const pos = [], nxt = [], aU = [], side = [], idx = [];
  for (let i = 0; i <= M; i++) {
    const u = i / M, P = curve.getPointAt(u), Q = i < M ? curve.getPointAt((i + 1) / M) : P.clone().add(curve.getTangentAt(1).multiplyScalar(.02));
    for (const s of [-1, 1]) { pos.push(P.x, P.y, P.z); nxt.push(Q.x, Q.y, Q.z); aU.push(u); side.push(s); }
    if (i < M) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aNext', new THREE.Float32BufferAttribute(nxt, 3));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1)); g.setIndex(idx);
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; scene.add(m); return m;
}
ribbonMesh(HERO, 1800, heroMat);

// 하루하루의 알갱이(선 둘레에 흩어진 먼지) — 풍경이 '지나온 날들'로 보이게
const DAYS = (() => {
  const r = mulberry32(5), a = [];
  for (let i = 0; i < 1900; i++) {
    const u = Math.pow(r(), .92), P = heroAt(u), th = r() * Math.PI * 2, rad = (.05 + Math.pow(r(), 2) * .5) * (1 - .6 * sstep(.5, 1, u));
    const T = heroTan(u), N = new THREE.Vector3().crossVectors(T, V3(0, 0, 1)).normalize(), B = new THREE.Vector3().crossVectors(T, N).normalize();
    const o = N.multiplyScalar(Math.cos(th) * rad).add(B.multiplyScalar(Math.sin(th) * rad));
    const warm = 1 - sstep(.2, .85, u);
    a.push({ pos: [P.x + o.x, P.y + o.y, P.z + o.z], u, seed: r(), size: .018 + r() * .05, t0: 0, dur: 1, col: [lerp(.55, 1, warm), lerp(.7, .78, warm), lerp(1, .5, warm)] });
  }
  return makeDust(a, { gain: .9, sway: .05, minPx: 1.3, maxPx: 5, win: true });
})();

// ─── 다른 사람들의 선(수렴하는 은하) + 가까운 사람들의 선(kin) ─────────────
function lineCurve(r, start, mids) { return new THREE.CatmullRomCurve3([start, ...mids, E.clone()], false, 'centripetal'); }
function dustAlong(curve, n, r, o) {
  const out = [], T0 = o.t0, dur = o.dur;
  for (let j = 0; j < n; j++) {
    const u = (j + r() * .9) / n, P = curve.getPointAt(clamp(u)), spread = o.spread * (.25 + .75 * (1 - sstep(.6, 1, u)) + .1);
    out.push({ pos: [P.x + (r() - .5) * spread, P.y + (r() - .5) * spread, P.z + (r() - .5) * spread], u, seed: r(), size: o.size * (.6 + r() * .8), t0: T0, dur, kin: o.kin ?? -1, col: o.col(u) });
  }
  return out;
}
const OTH_ITEMS = [], KIN_ITEMS = [];
const OTH = (() => {
  const r = mulberry32(77), all = [], N = 104;
  OTH_ITEMS.length = 0;
  for (let i = 0; i < N; i++) {
    const y0 = -14 + r() * 17, k = (y0 + 14) / 31;
    const start = V3((r() - .5) * 26 * (1 - .3 * k), y0, (r() - .5) * 18);
    const mids = [];
    for (let m = 1; m <= 3; m++) { const f = m / 4, y = lerp(y0, 13, f); mids.push(V3((r() - .5) * 22 * (1 - f * .85), y + (r() - .5) * 2, (r() - .5) * 14 * (1 - f * .8))); }
    const c = lineCurve(r, start, mids), hue = r(), n = 600;
    const t0 = 42 + r() * 7 + (1 - k) * 1.5, dur = 7 + r() * 5;
    const colf = u => (hue < .22 ? [1, .8 + .1 * u, .62] : [.55 + .15 * hue, .68 + .1 * hue, 1]);
    OTH_ITEMS.push({ curve: c, t0, dur, kin: -1, col: colf });
    all.push(...dustAlong(c, n, r, { t0, dur, spread: .3, size: .04, col: colf }));
  }
  return makeDust(all, { gain: .62, sway: .14, rev: true, minPx: 1.2, maxPx: 5 });
})();
const KIN = [], KIN_PTS = [];
{
  const r = mulberry32(131);
  const offs = [V3(1.5, -1.3, 1.0), V3(-1.7, -0.6, -0.9), V3(0.8, 1.5, -1.6)];
  offs.forEach((o, i) => {
    const start = V3((i - 1) * 6 + (r() - .5) * 3, -14, (r() - .5) * 8);
    const c = new THREE.CatmullRomCurve3([start, V3(start.x * .5 + D.x * .5, lerp(-14, D.y, .55), (start.z + D.z) / 2), D.clone().add(o), D.clone().add(o.clone().multiplyScalar(1.5)).add(V3(0, 3.4, 0)),
      V3(lerp(D.x, E.x, .55) + (i - 1) * 2, lerp(D.y, 13, .62), (i - 1) * -1.5), E.clone()], false, 'centripetal');
    KIN.push(c);
    const S = []; for (let j = 0; j <= 400; j++) S.push(c.getPointAt(j / 400)); KIN_PTS.push(S);
    KIN_PTS[i].uNear = (() => { let b = 0, bd = 1e9; S.forEach((p, j) => { const d = p.distanceTo(D); if (d < bd) { bd = d; b = j; } }); return b / 400; })();
  });
}
const KINMESH = (() => {
  const r = mulberry32(333), all = [];
  KIN.forEach((c, i) => { KIN_ITEMS.push({ curve: c, t0: 3, dur: 14, kin: i, col: u => [.95, .78 + .1 * u, .9] }); all.push(...dustAlong(c, 900, r, { t0: 3, dur: 14, spread: .2, size: .04, kin: i, col: u => [.95, .78 + .1 * u, .9] })); });
  return makeDust(all, { gain: .55, sway: .06, rev: false, minPx: 1.3, maxPx: 7 });
})();
// ─── 실(스레드): 모든 선을 화면 픽셀 두께의 가는 리본으로 — 가까이서도 끊기지 않는다 ───
const threadMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPx: PX, uRes: { value: new THREE.Vector2(VW * PR, VH * PR) }, uWorldW: { value: .012 }, uMinPx: { value: 1.0 }, uMaxPx: { value: 3.0 },
    uOth: { value: 0 }, uKin: { value: 0 }, uEnd: { value: 0 }, uFl0: { value: 0 }, uFl1: { value: 0 }, uFl2: { value: 0 }, uKU0: { value: 0 }, uKU1: { value: 0 }, uKU2: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: `attribute vec3 aNext, aCol; attribute float aU, aSide, aT0, aDur, aKin;
    uniform vec2 uRes; uniform float uTime, uPx, uWorldW, uMinPx, uMaxPx, uOth, uKin, uEnd, uFl0, uFl1, uFl2, uKU0, uKU1, uKU2; uniform vec3 uTint;
    varying vec3 vCol; varying float vA, vSide;
    void main(){
      float rev = clamp((uTime - aT0)/aDur, 0., 1.);
      float vis = rev >= 1. ? 1. : 1. - smoothstep(rev - .04, rev, aU);
      float head = (rev > .001 && rev < .999) ? exp(-pow((aU - rev)/.02, 2.)) : 0.;
      vec4 c0 = projectionMatrix*modelViewMatrix*vec4(position,1.), c1 = projectionMatrix*modelViewMatrix*vec4(aNext,1.);
      vec2 s0 = c0.xy/c0.w*uRes*.5, s1 = c1.xy/c1.w*uRes*.5; vec2 d = s1 - s0; float l = length(d); vec2 dir = l > 1e-4 ? d/l : vec2(0.,1.);
      float w = clamp(uWorldW*uPx/max(c0.w,.01), uMinPx, uMaxPx);
      vec2 s = s0 + vec2(-dir.y, dir.x)*aSide*w;
      gl_Position = vec4(s/(uRes*.5)*c0.w, c0.z, c0.w); vSide = aSide;
      float fl = 0.;
      if (aKin > -.5 && aKin < .5) fl = uFl0*exp(-pow((aU-uKU0)/.14, 2.));
      else if (aKin > .5 && aKin < 1.5) fl = uFl1*exp(-pow((aU-uKU1)/.14, 2.));
      else if (aKin > 1.5) fl = uFl2*exp(-pow((aU-uKU2)/.14, 2.));
      float g = aKin < -.5 ? uOth : uKin;
      vA = (vis + head*1.8)*g*(1. + uEnd*smoothstep(.8, 1., aU)*.8)*(1. + fl*2.8);
      vCol = aCol*uTint*(1. + fl*.8); }`,
  fragmentShader: `varying vec3 vCol; varying float vA, vSide; void main(){ gl_FragColor = vec4(vCol, vA*exp(-vSide*vSide*3.)); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
function buildThreads(items, M) {
  const pos = [], nxt = [], aU = [], side = [], t0 = [], dur = [], kin = [], col = [], idx = []; let base = 0;
  for (const it of items) {
    for (let i = 0; i <= M; i++) {
      const u = i / M, P = it.curve.getPointAt(u), Q = i < M ? it.curve.getPointAt((i + 1) / M) : P.clone().add(it.curve.getTangentAt(1).multiplyScalar(.02)), c = it.col(u);
      for (const sd of [-1, 1]) { pos.push(P.x, P.y, P.z); nxt.push(Q.x, Q.y, Q.z); aU.push(u); side.push(sd); t0.push(it.t0); dur.push(it.dur); kin.push(it.kin); col.push(c[0], c[1], c[2]); }
      if (i < M) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    base += (M + 1) * 2;
  }
  const g = new THREE.BufferGeometry();
  const F = (a, n) => new THREE.Float32BufferAttribute(a, n);
  g.setAttribute('position', F(pos, 3)); g.setAttribute('aNext', F(nxt, 3)); g.setAttribute('aU', F(aU, 1)); g.setAttribute('aSide', F(side, 1));
  g.setAttribute('aT0', F(t0, 1)); g.setAttribute('aDur', F(dur, 1)); g.setAttribute('aKin', F(kin, 1)); g.setAttribute('aCol', F(col, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, threadMat); m.frustumCulled = false; scene.add(m); return m;
}
buildThreads([...OTH_ITEMS, ...KIN_ITEMS], 700);
// kin 선은 처음엔 보이지 않다가(모든 선이 드러나는 42초 무렵) 서서히 켜진다 — 밝기는 uGain 으로
// ─── 빛 알갱이(스파크) ───────────────────────────────────────────────────
const sparkVS = 'uniform float uSize; void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize = uSize; }';
const sparkFS = `uniform vec3 uColor; uniform float uAlpha, uStar;
  void main(){ vec2 q = gl_PointCoord - .5; float d = length(q)*2.;
    float core = exp(-d*d*9.), halo = exp(-d*d*2.4)*.32;
    float cr = (exp(-pow(q.x*38., 2.))*exp(-abs(q.y)*5.5) + exp(-pow(q.y*38., 2.))*exp(-abs(q.x)*5.5))*uStar;
    float a = (core + halo + cr)*step(max(abs(q.x),abs(q.y)), .5); gl_FragColor = vec4(uColor, a*uAlpha); }`;
function makeSpark(color, star = 0) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  const m = new THREE.ShaderMaterial({ uniforms: { uSize: { value: 10 }, uColor: { value: new THREE.Color(...color) }, uAlpha: { value: 1 }, uStar: { value: star } },
    vertexShader: sparkVS, fragmentShader: sparkFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
  return { p, set(pos, size, alpha) { p.visible = alpha > 0.002 && size > 0.5; if (!p.visible) return; p.position.copy(pos); m.uniforms.uSize.value = size; m.uniforms.uAlpha.value = alpha; } };
}
const PINK = [1.0, .62, .80], GOLD = [1.0, .86, .62];
const dotCore = makeSpark([1, .94, .82], 1), dotHalo = makeSpark(GOLD, 0);
const eCore = makeSpark([.85, .92, 1], 1), eHalo = makeSpark([.55, .7, 1], 0);
const packets = []; for (let i = 0; i < 12; i++) packets.push(makeSpark(PINK, 0));
// 파동 고리 풀
const rings = []; for (let i = 0; i < 22; i++) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.972, 1, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(...PINK).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.visible = false; m.frustumCulled = false; scene.add(m); rings.push(m);
}
// 내 점과 가까운 사람의 선을 잇는 가는 실
const FIL = KIN.map(() => {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(30 * 3), 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(...PINK).multiplyScalar(1.1), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  l.frustumCulled = false; scene.add(l);
  const pm = new THREE.ShaderMaterial({ uniforms: { uSize: { value: 8 }, uColor: { value: new THREE.Color(...PINK) }, uAlpha: { value: 0 }, uStar: { value: 0 } }, vertexShader: sparkVS, fragmentShader: sparkFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pp = new THREE.Points(g, pm); pp.frustumCulled = false; scene.add(pp); l._pts = pm; return l;
});

// ─── 시간표 ─────────────────────────────────────────────────────────────
// 안부 파동(하루 한 번) — 75초부터 하루씩, 94초부터 계절이 빨리 흐름, 107초 마지막
const PULSES = [];
for (let t = 82.6; t < 94; t += 1.9) PULSES.push(t);
for (let t = 94.4, dt = 0.55; t < 107.6; t += dt, dt = Math.max(0.18, dt * 0.93)) PULSES.push(t);
const LAST_PULSE = PULSES[PULSES.length - 1];
// 나의 위치(선 위): 하루마다 한 걸음, 계절이 흐르는 동안 쭉 나아가다 멈춘다
function uMe(t) {
  let u = U0;
  for (const p of PULSES) { if (p >= 94) break; u += .0032 * eio(clamp((t - p) / .9)); }
  u += .165 * eio(sstep(94, 108.4, t));
  return u;
}
const dotPos = t => heroAt(uMe(t));
const KIN_FLASH_DELAY = .95;

// ─── 카메라 ─────────────────────────────────────────────────────────────
// 키프레임은 "무엇(F)을 거리 d 에서 화면의 세로 sy(CSS px, 위=0)에 놓을지"로 정한다 — 점·끝 점이 화면 밖으로 새지 않게
const FOC = { D, E, M: V3(0, .4, 0) };
function mk(t, f, d, sy, fov, dir = [.22, .06, .975]) {
  const F = FOC[f], pxu = VH / (2 * d * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  const w = (VH / 2 - sy) / pxu, Lk = F.clone().add(V3(0, -w, 0)), dn = V3(...dir).normalize();
  return { t, p: Lk.clone().add(dn.multiplyScalar(d)), l: Lk, fov, vy: 0 };
}
const KEYS_P = [
  mk(0, 'D', 2.8, 400, 30), mk(8, 'D', 3.6, 380, 30), mk(16, 'D', 13, 300, 31), mk(24, 'D', 30, 250, 33),
  mk(33, 'M', 46, 440, 34, [.28, .08, .96]), mk(42, 'M', 56, 450, 34, [.22, .07, .97]), mk(52, 'M', 48, 430, 34, [-.5, .1, .86]),
  mk(58, 'E', 17, 330, 32, [-.3, -.35, .88]), mk(63, 'E', 7, 290, 30, [.25, -.3, .92]), mk(66, 'E', 5.6, 285, 30, [.2, -.25, .95]),
  mk(72, 'E', 4.6, 300, 30, [.15, -.2, .97]), mk(74, 'E', 4.6, 300, 30, [.15, -.2, .97]),
  mk(78, 'M', 32, 430, 32, [.35, .1, .93]), mk(82, 'D', 3.6, 400, 30), mk(94, 'D', 4.6, 420, 30), mk(100, 'D', 5.4, 420, 30),
  mk(108, 'D', 7.4, 430, 31), mk(116, 'D', 10, 440, 32), mk(122, 'D', 12, 300, 32), mk(138, 'D', 10.5, 300, 32),
];
// 가로판 키프레임 — "대상 F 를 거리 d 에서 화면 (sx, sy)(CSS px, 왼쪽 위=0)에 놓는다". 세로판의 dir(오른쪽·위·뒤)은 월드로 (-위, 오른쪽, 뒤).
function mkw(t, f, d, sx, sy, fov, dir = [.22, .06, .975]) {
  const F = FOC[f], pxu = VH / (2 * d * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  const dxw = -(VH / 2 - sy) / pxu, dyw = (sx - VW / 2) / pxu;
  const Lk = F.clone().sub(V3(dxw, dyw, 0)), dn = V3(-dir[1], dir[0], dir[2]).normalize();
  return { t, p: Lk.clone().add(dn.multiplyScalar(d)), l: Lk, fov, vy: 0 };
}
const KEYS_W = [
  mkw(0, 'D', 2.8, 480, 225, 30), mkw(8, 'D', 3.6, 500, 225, 30), mkw(16, 'D', 13, 600, 230, 31), mkw(24, 'D', 30, 700, 235, 33),
  mkw(33, 'M', 32, 480, 250, 34, [.28, .08, .96]), mkw(42, 'M', 36, 480, 255, 34, [.22, .07, .97]), mkw(52, 'M', 34, 470, 250, 34, [-.5, .1, .86]),
  mkw(58, 'E', 17, 560, 230, 32, [-.3, -.35, .88]), mkw(63, 'E', 7, 600, 225, 30, [.25, -.3, .92]), mkw(66, 'E', 5.6, 610, 220, 30, [.2, -.25, .95]),
  mkw(72, 'E', 4.6, 620, 225, 30, [.15, -.2, .97]), mkw(74, 'E', 4.6, 620, 225, 30, [.15, -.2, .97]),
  mkw(78, 'M', 34, 480, 250, 32, [.35, .1, .93]), mkw(82, 'D', 3.6, 480, 225, 30), mkw(94, 'D', 4.6, 480, 235, 30), mkw(100, 'D', 5.4, 480, 235, 30),
  mkw(108, 'D', 7.4, 480, 240, 31), mkw(116, 'D', 10, 480, 245, 32), mkw(122, 'D', 12, 480, 150, 32), mkw(138, 'D', 10.5, 480, 150, 32),
];
const KEYS = WIDE ? KEYS_W : KEYS_P;
// 단조 3차 보간(PCHIP) — 키 사이를 부드럽게 잇되 키 값을 넘어 튀지(과도 보간) 않는다
function pchip(ys, t) {
  const n = KEYS.length, ts = KEYS.map(k => k.t), h = [], d = [];
  for (let i = 0; i < n - 1; i++) { h[i] = ts[i + 1] - ts[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
  const m = new Array(n);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  let i = 0; while (i < n - 2 && t >= ts[i + 1]) i++;
  const s = clamp((t - ts[i]) / h[i]), s2 = s * s, s3 = s2 * s;
  return ys[i] * (2 * s3 - 3 * s2 + 1) + ys[i + 1] * (-2 * s3 + 3 * s2) + m[i] * h[i] * (s3 - 2 * s2 + s) + m[i + 1] * h[i] * (s3 - s2);
}
function hermite(get, t) {
  const first = get(KEYS[0]);
  if (first.isVector3) return V3(pchip(KEYS.map(k => get(k).x), t), pchip(KEYS.map(k => get(k).y), t), pchip(KEYS.map(k => get(k).z), t));
  return pchip(KEYS.map(k => get(k)), t);
}

// ─── 2D 오버레이(자막·푸시·엔딩) ─────────────────────────────────────────
const ov = document.createElement('canvas'); ov.width = VW * PR; ov.height = VH * PR;
ov.style.cssText = `width:${VW}px;height:${VH}px;pointer-events:none`; wrapEl.appendChild(ov);
const og = ov.getContext('2d');
const FONT = '"Apple SD Gothic Neo","Noto Sans KR","Noto Sans JP","Noto Sans SC","Noto Sans Thai","Noto Sans Devanagari","Geeza Pro",sans-serif';
const COL = { text: '#F2F5FF', anbu: '#FF9EC4', death: '#FFFFFF', site: '#FFE27A' };
const CAP_X = VW / 2, CAP_W = WIDE ? 640 : 410;
const SAFE_B = WIDE ? 498 : 756;                         // 자막 아래 끝(세로판은 쇼츠 UI 가림선 768, 가로판은 플레이어 컨트롤 막대 위)
function capText(id) { return (WIDE && L.caps_w && L.caps_w[id]) || L.caps[id]; }   // 가로판은 줄 수가 많은 자막만 줄바꿈을 따로 둔다(문구는 같다)
// 자막 시간표(초) — [id, 시작, 끝, y(중심), 크기]
const CAPS = [
  ['c1', .8, 4.4, 700, 25], ['c2', 4.7, 7.9, 700, 25],
  ['c3', 8.7, 15.6, 700, 25], ['c4', 16.2, 23.4, 700, 25],
  ['c5', 24.8, 32.8, 700, 25], ['c6', 33.4, 41.4, 700, 25],
  ['c7', 42.8, 51.4, 700, 25], ['c8', 52.4, 61.2, 700, 25],
  ['c9', 63.0, 68.6, 640, 30], ['c10', 69.2, 73.7, 700, 25],
  ['c11', 77.0, 83.2, 700, 25], ['c12', 85.5, 89.0, 700, 25], ['c13', 91.1, 94.2, 700, 25],
  ['c14', 94.6, 100.4, 700, 27], ['c15', 101.2, 107.6, 700, 25],
  ['c16', 108.6, 114.6, 700, 25], ['c17', 117.6, 121.8, 700, 25],
];
function runsOf(s, base) {   // "[a]안부[/a]" "[d]죽음[/d]" 표시를 조각으로
  const out = []; const re = /\[(a|d)\](.*?)\[\/\1\]/gs; let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: s.slice(i, m.index), k: null });
    out.push({ t: m[2], k: m[1] }); i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ t: s.slice(i), k: null }); return out;
}
function fitCaption(g, text, size, maxW, maxLines) {
  // 정해진 줄 수 안에서 22px 까지 줄여 보고, 그래도 안 들어가는 긴 언어는 줄을 하나 더 허용한다(20px 까지) —
  // 17px 로 쪼그라드는 것보다 한 줄 늘리는 쪽이 읽힌다. 줄이 늘면 drawCaption 이 블록을 위로 올려 아래 가림선(768)을 지킨다.
  const at = (fs, lim) => {
    const pieces = runsOf(text).map(r => ({ t: r.t, f: `${r.k === 'd' ? 800 : 700} ${r.k === 'd' ? Math.round(fs * 1.9) : fs}px ${FONT}`, c: r.k === 'a' ? COL.anbu : COL.text }));
    const lines = wrap(g, pieces, maxW, LANG); return lines.length <= lim ? { fs, lines } : null;
  };
  for (let fs = size; fs >= 22; fs--) { const r = at(fs, maxLines); if (r) return r; }
  for (let fs = size; fs >= 20; fs--) { const r = at(fs, maxLines + 1); if (r) return r; }
  const pieces = runsOf(text).map(r => ({ t: r.t, f: `700 18px ${FONT}`, c: COL.text }));
  return { fs: 18, lines: wrap(g, pieces, maxW, LANG) };
}
const capLayout = {};
function layoutCaps() {
  og.setTransform(PR, 0, 0, PR, 0, 0);
  for (const [id, , , , size] of CAPS) {
    const hasDeath = capText(id).includes('[d]');
    const f = fitCaption(og, capText(id), size, CAP_W, hasDeath ? 3 : 2);
    capLayout[id] = f;
  }
}
function drawCaption(g, id, y, a, rise, size) {
  const f = capLayout[id], lh = Math.round(f.fs * 1.5), isD = capText(id).includes('[d]');
  const lines = f.lines, bigLh = isD ? Math.round(f.fs * 2.2) : lh;
  const heights = lines.map(ln => (ln.some(p => /800/.test(p.f)) ? bigLh : lh));
  const total = heights.reduce((s, h) => s + h, 0); let cy = Math.min(y, SAFE_B - total / 2) - total / 2 + rise;
  { const cx = CAP_X, cyy = Math.min(y, SAFE_B - total / 2) + rise, rw = 250, rh = total / 2 + 46;
    g.save(); g.globalAlpha = a * (isD ? .8 : .55); g.translate(cx, cyy); g.scale(1, rh / rw);
    const bg = g.createRadialGradient(0, 0, 0, 0, 0, rw); bg.addColorStop(0, 'rgba(2,4,14,.62)'); bg.addColorStop(.6, 'rgba(2,4,14,.34)'); bg.addColorStop(1, 'rgba(2,4,14,0)');
    g.fillStyle = bg; g.beginPath(); g.arc(0, 0, rw, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.save(); g.globalAlpha = a; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,12,.85)'; g.shadowBlur = 14;
  lines.forEach((ln, i) => {
    const h = heights[i]; const big = ln.some(p => /800/.test(p.f));
    if (big) {   // '죽음' 은 은은한 빛 번짐과 함께
      g.shadowColor = 'rgba(190,210,255,.9)'; g.shadowBlur = 26;
    } else { g.shadowColor = 'rgba(0,0,12,.85)'; g.shadowBlur = 14; }
    drawLine(g, ln.map(p => ({ ...p, c: p.c === COL.text && /800/.test(p.f) ? COL.death : p.c })), CAP_X, cy + h / 2, { align: 'center', rtl: !!L.rtl });
    cy += h;
  });
  g.restore();
}
// 푸시 배너(앱 알림) — 3D 와 같은 모양(제목+본문, 등급 색)
const PUSH_COLOR = { normal: { title: '#8FE6A2' }, caution: { title: '#FFD25E' }, urgent: { title: '#FF8A80' } };   // 배경색 없이 제목 글자색으로 등급을 구분, 테두리는 흰색
function makePushCanvas(p, img) {
  // 배경 채움 없음 — 흰색 테두리(반투명)와 글자만. 테두리 안팎에 가장자리 없는 아주 옅은 어둠만 깔아 밝은 선 위에서도 읽히게 한다.
  const S = 3, w = 330, pad = 16, M = 44, rtl = !!L.rtl, iw = w - pad * 2;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const TF = `800 15px ${FONT}`, BF = `400 14px ${FONT}`;
  const tl = wrap(g, [{ t: p.title, f: TF }], iw, LANG), bl = wrap(g, [{ t: p.body, f: BF }], iw, LANG);
  const h = pad + 20 + 8 + tl.length * 21 + 4 + bl.length * 20 + pad;
  const cw = w + 2 * M, ch = h + 2 * M;
  c.width = cw * S; c.height = ch * S; g.scale(S, S);
  g.save(); g.translate(cw / 2, ch / 2); g.scale(1, (h / 2 + M) / (w / 2 + M));
  const bg = g.createRadialGradient(0, 0, 0, 0, 0, w / 2 + M); bg.addColorStop(0, 'rgba(3,6,18,.26)'); bg.addColorStop(.62, 'rgba(3,6,18,.16)'); bg.addColorStop(1, 'rgba(3,6,18,0)');
  g.fillStyle = bg; g.beginPath(); g.arc(0, 0, w / 2 + M, 0, Math.PI * 2); g.fill(); g.restore();
  g.translate(M, M);
  const pc = PUSH_COLOR[p.lv];
  // 흰색 테두리(둥근 사각형, 채움 없음)
  g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.roundRect(.8, .8, w - 1.6, h - 1.6, 22); g.stroke();
  const ix = rtl ? w - pad - 20 : pad;
  g.save(); g.beginPath(); g.roundRect(ix, pad, 20, 20, 5); g.clip(); g.drawImage(img, ix, pad, 20, 20); g.restore();
  g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,12,.85)'; g.shadowBlur = 6;
  drawLine(g, [{ t: L.app_name, f: `600 12.5px ${FONT}`, c: '#D5DAE6' }, { t: ' · ' + L.now, f: `400 12.5px ${FONT}`, c: '#AEB5C6' }], rtl ? w - pad - 28 : pad + 28, pad + 10, { align: rtl ? 'right' : 'left', rtl });
  const ax = rtl ? w - pad : pad, al = rtl ? 'right' : 'left';
  tl.forEach((ln, i) => drawLine(g, ln, ax, pad + 28 + 10.5 + i * 21, { align: al, rtl, color: pc.title }));
  const by = pad + 28 + tl.length * 21 + 4;
  bl.forEach((ln, i) => drawLine(g, ln, ax, by + 10 + i * 20, { align: al, rtl, color: 'rgba(244,247,255,.94)' }));
  return { c, w: cw, h: ch, m: M, ch: h };
}
const BANNERS = [   // [push 번호, 등장, 퇴장] — 파동이 곁의 선에 닿는 순간에 그 사람 폰에 알림이 뜬다
  [0, PULSES[0] + KIN_FLASH_DELAY, PULSES[0] + KIN_FLASH_DELAY + 4.9], [1, PULSES[3] + KIN_FLASH_DELAY, PULSES[3] + KIN_FLASH_DELAY + 4.9], [2, 115.6, 121.7],
];
const BANNER_IN = 1.7;   // 서서히 선명해지는 시간 — 자막은 이 시간이 끝난 뒤에 나온다(같은 시간대에 동시에 나오지 않게)
let bannerCv = [], iconImg = null;
function drawBanner(g, i, t) {
  const [pi, t0, t1] = BANNERS[i], b = bannerCv[i]; if (t < t0 - 0.01 || t > t1 + 1.0) return;
  const inn = clamp((t - t0) / BANNER_IN), out = clamp((t - t1) / .9);
  const e = inn * inn * (3 - 2 * inn), a = e * .95 * (1 - out), sc = .965 + .035 * e;      // 서서히 반투명 → 선명, 사라질 때도 서서히
  const top = (WIDE ? 34 : 112) - b.m + (1 - e) * 7;
  g.save(); g.globalAlpha = a; g.translate(CAP_X, top + b.h / 2); g.scale(sc, sc);
  g.drawImage(b.c, -b.w / 2, -b.h / 2, b.w, b.h); g.restore();
}
// 엔딩: 점이 안부 앱 아이콘이 된다
function drawIcon(g, cx, cy, size, a, glow) {
  if (a <= 0.002 || !iconImg) return;
  g.save(); g.globalAlpha = a;
  const r = size / 2;
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(cx, cy, r * .6, cx, cy, r * (2.1 + glow));
  gr.addColorStop(0, 'rgba(255,150,196,' + (.38 + .2 * glow) + ')'); gr.addColorStop(1, 'rgba(255,150,196,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r * (2.1 + glow), 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'source-over';
  g.shadowColor = 'rgba(255,140,190,.55)'; g.shadowBlur = 24;
  g.beginPath(); g.roundRect(cx - r, cy - r, size, size, size * .225); g.clip();
  g.drawImage(iconImg, cx - r, cy - r, size, size); g.restore();
}
function drawRuns(g, runs, fs, y, a, rise) {
  const pieces = runs.map(([t, k]) => ({ t, f: `${k ? 700 : 500} ${fs}px ${FONT}`, c: k === 'site' ? COL.site : k === 'anbu' ? COL.anbu : 'rgba(236,240,248,.86)' }));
  g.save(); g.globalAlpha = a; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,12,.8)'; g.shadowBlur = 8;
  drawLine(g, pieces, CAP_X, y + rise, { align: 'center', rtl: !!L.rtl }); g.restore();
}
const ANBU_RE = /(«\s?Anbu\s?»|“Anbu”|„Anbu“|„Anbu”|「Anbu」|”Anbu“|”Anbu”|‘Anbu’|"Anbu"|Anbu)/;
let endLayout = null;
function layoutEnding() {
  og.setTransform(PR, 0, 0, PR, 0, 0);
  endLayout = { head: fitCaption(og, (WIDE && L.ending.head_w) || L.ending.head, 28, CAP_W, 3) };
  const m = ((WIDE && L.store_w) || L.store).split(ANBU_RE).filter(s => s !== '');   // 가로판(Google Play 소개 영상)은 스토어 이름을 Google Play 만 적는다
  endLayout.cta1 = [[L.dl + '  ', null], ['averic.co.kr', 'site']];
  endLayout.cta2 = m.map(s => [s, ANBU_RE.test(s) ? 'anbu' : null]);
}
const ICON_PT = { x: 270, y: 300 };

// ─── 효과음 신호(소리는 렌더 뒤 mix.py 에서) ─────────────────────────────
window.SFX = [
  { t: BANNERS[0][1], file: 'TING' },
  { t: BANNERS[1][1], file: 'TING' },
  { t: BANNERS[2][1], file: 'TING' },
  { t: 124.2, file: 'SHIMMER' },
];

// ─── 프레임 ─────────────────────────────────────────────────────────────
const _look = new THREE.Vector3(), _q = new THREE.Quaternion();
function update(t) {
  // 카메라
  const dd = dotPos(t).sub(D).multiplyScalar(sstep(77, 82, t));
  const pos = hermite(k => k.p, t).add(dd), look = hermite(k => k.l, t).add(dd);
  camera.fov = hermite(k => k.fov, t); camera.position.copy(pos); camera.lookAt(look);
  camera.setViewOffset(VW, VH, 0, hermite(k => k.vy, t), VW, VH); camera.updateProjectionMatrix();
  PX.value = (VH * PR) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  // 시각 값
  const me = uMe(t), mp = heroAt(me);
  const lo = U0 - .4 * eio(sstep(7, 25, t)) - .0015 * sstep(3, 8, t);
  const hi = U0 + .6 * eio(sstep(26, 41, t)) + .0015 * sstep(3, 8, t);
  const fadeDown = sstep(107.0, 120.5, t), dimK = 1 - fadeDown;                    // 마지막 파동 뒤 점이 서서히 어두워진다
  const calm = 1 - .72 * fadeDown + .38 * sstep(121.5, 126, t);       // 선도 함께 잦아듦, 엔딩에서 다시 살아남
  const season = sstep(94, 96, t) * (1 - sstep(106.5, 108.8, t));
  const ph = (t - 94) / 13.5 * 3 * Math.PI * 2, seas = new THREE.Color(1 + .22 * Math.sin(ph), 1 + .12 * Math.sin(ph + 2.1), 1 + .26 * Math.sin(ph + 4.2));
  const tint = new THREE.Color(1, 1, 1).lerp(seas, season);
  heroMat.uniforms.uTime.value = t; heroMat.uniforms.uLo.value = lo; heroMat.uniforms.uHi.value = hi; heroMat.uniforms.uDotU.value = me;
  heroMat.uniforms.uDim.value = calm; heroMat.uniforms.uEndG.value = sstep(44, 60, t) * .75; heroMat.uniforms.uTint.value.copy(tint);
  heroMat.uniforms.uDotGain.value = sstep(2, 6, t) * Math.pow(dimK, 1.5);
  // 먼지
  const setDust = (m, o) => { const u = m.material.uniforms; u.uTime.value = t; Object.entries(o).forEach(([k, v]) => { if (u[k]) { if (v && v.isColor) u[k].value.copy(v); else u[k].value = v; } }); };
  const daysShow = sstep(8, 22, t) * (1 - 0);
  setDust(DAYS, { uGain: .95 * daysShow * calm + .04, uTint: tint, uEnd: 0, uLo: lo, uHi: hi });
  setDust(NEAR, { uGain: .2 * sstep(1, 6, t) });
  const recede = 1 - .78 * sstep(76, 82, t) + .25 * sstep(108.5, 119, t);   // 안부 장면에서는 다른 선들이 물러나 내 점이 보이게
  setDust(OTH, { uGain: .45 * sstep(42, 50, t) * recede, uEnd: sstep(46, 62, t), uTint: tint });
  // kin 선: 42초 이후 보이기 시작, 안부가 오가면 밝아진다
  const kinBase = .1 * sstep(42, 52, t) + .5 * sstep(78, 84, t) + .75 * sstep(108, 118, t);
  // 파동·꾸러미 (아래에서 계산한 flash 사용)
  const fl = [0, 0, 0];
  for (const p of PULSES) {
    const ta = p + KIN_FLASH_DELAY;
    KIN.forEach((_, i) => { const d = t - (ta + i * .12); if (d > 0) fl[i] = Math.max(fl[i], Math.exp(-d * 2.6)); });
  }
  const gather = sstep(108.5, 118, t);   // 멈춘 뒤 곁의 선들이 일제히 빛난다
  KIN.forEach((_, i) => { fl[i] = Math.max(fl[i], gather * (.55 + .25 * Math.sin(t * 2.4 + i))); });
  const TU = threadMat.uniforms; TU.uTime.value = t; TU.uOth.value = .30 * sstep(42, 50, t) * recede * (1 - .5 * sstep(55, 64, t)); TU.uKin.value = (.12 * sstep(42, 52, t) + .5 * sstep(78, 84, t) + .7 * sstep(108, 118, t)) * .8;
  TU.uEnd.value = sstep(46, 62, t); TU.uTint.value.copy(tint); TU.uFl0.value = fl[0]; TU.uFl1.value = fl[1]; TU.uFl2.value = fl[2]; TU.uKU0.value = KIN_PTS[0].uNear; TU.uKU1.value = KIN_PTS[1].uNear; TU.uKU2.value = KIN_PTS[2].uNear;
  setDust(KINMESH, { uGain: kinBase * .7, uFl0: fl[0], uFl1: fl[1], uFl2: fl[2], uKU0: KIN_PTS[0].uNear, uKU1: KIN_PTS[1].uNear, uKU2: KIN_PTS[2].uNear, uTint: tint, uEnd: sstep(46, 62, t) });
  // 점(나)
  const breathe = 1 + .16 * Math.sin(t * 2 * Math.PI / 3.2) * (1 - sstep(80, 84, t) * .6);
  const dotA = sstep(0, 1.2, t) * (.05 + .95 * Math.pow(dimK, 1.4) + .3 * sstep(121.2, 124, t));
  const dotBig = (22 + 18 * sstep(2, 10, t)) * breathe * (.45 + .55 * Math.pow(dimK, 1.2));
  dotCore.set(mp, dotBig * 1.15, dotA); dotHalo.set(mp, dotBig * 3.6, dotA * .75);
  // 끝 점(E): 모든 선이 만나는 곳
  const eg = sstep(44, 62, t) * (1 - 0.0), ep = 1 + .07 * Math.sin(t * 1.8);
  eCore.set(E, (30 + 110 * eg) * ep, eg * .8); eHalo.set(E, (80 + 240 * eg) * ep, eg * .55);
  // 파동 고리 + 가까운 사람 실 + 꾸러미
  rings.forEach(r => { r.visible = false; });
  let ri = 0;
  const pulseAll = [...PULSES]; if (t > 122) for (let x = 123.0; x < 138; x += 2.4) pulseAll.push(x);   // 엔딩 동안 안부가 계속 이어진다
  for (const p of pulseAll) {
    const d = t - p; if (d < 0 || d > 2.2 || ri >= rings.length) continue;
    const e = 1 - Math.pow(1 - clamp(d / 2.1), 2.2), rm = rings[ri++];
    const rp = p > 122 ? heroAt(uMe(138)) : dotPos(p + d), pxu = VH / (2 * camera.position.distanceTo(rp) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))), base = (p > 122 ? 120 : p >= 94 ? 125 : 165) / pxu;
    rm.visible = true; rm.position.copy(rp); rm.quaternion.copy(camera.quaternion); rm.scale.setScalar(.02 + base * e);
    rm.material.opacity = (p >= 94 && p < 122 ? .5 : .75) * (1 - e) * (1 - e * .3) * (p > 122 ? sstep(121, 124, t) : 1);
  }
  // 실(필라멘트)
  const filA = (sstep(82, 85, t) * .5 + sstep(108.5, 118, t) * .6);
  KIN.forEach((c, i) => {
    let best = 0, bd = 1e9; KIN_PTS[i].forEach((q, j) => { const d = q.distanceToSquared(mp); if (d < bd) { bd = d; best = j; } });
    const K = KIN_PTS[i][best], mid = mp.clone().lerp(K, .5).add(V3(0, .5 + .25 * i, 0));
    const arr = FIL[i].geometry.attributes.position.array;
    for (let j = 0; j < 30; j++) { const s = j / 29, a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c2 = s * s; arr[j * 3] = a * mp.x + b * mid.x + c2 * K.x; arr[j * 3 + 1] = a * mp.y + b * mid.y + c2 * K.y; arr[j * 3 + 2] = a * mp.z + b * mid.z + c2 * K.z; }
    FIL[i].geometry.attributes.position.needsUpdate = true;
    let flick = 0; for (const p of PULSES) { const d = t - p; if (d > 0) flick = Math.max(flick, Math.exp(-d * 3.2)); }
    const fo = clamp(filA * (.6 + .6 * flick + .35 * gather)); FIL[i].material.opacity = fo; FIL[i]._pts.uniforms.uAlpha.value = fo * .85;
    FIL[i]._K = K; FIL[i]._mid = mid;
  });
  // 꾸러미: 내 점 → 가까운 사람 (멈춘 뒤에는 곁의 선들에서 내 쪽으로 모여든다)
  packets.forEach(s => s.set(mp, 0, 0));
  KIN.forEach((c, i) => {
    const F = FIL[i]; if (!F._K) return;
    const Q = (s) => { const a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c2 = s * s; return V3(a * mp.x + b * F._mid.x + c2 * F._K.x, a * mp.y + b * F._mid.y + c2 * F._K.y, a * mp.z + b * F._mid.z + c2 * F._K.z); };
    for (const p of PULSES) { const d = (t - p - i * .12) / .95; if (d > 0 && d < 1 && packets.length) { const s = eio(d); const k = i * 4; const slot = packets[k + (PULSES.indexOf(p) % 3)]; slot.set(Q(s), 30 * (1 - Math.abs(d - .5) * .5), Math.sin(Math.PI * d)); } }
    if (gather > 0) for (let j = 0; j < 1; j++) { const s = 1 - ((t * .42 + i / 3) % 1); packets[i * 4 + 3].set(Q(s), 30, gather * Math.sin(Math.PI * (1 - s)) * .95); }
  });
  grain.uniforms.seed.value = Math.floor(t * 30) * 1.37;
  grain.uniforms.fade.value = clamp(t / .7) * (1 - sstep(137.2, 138, t));
}
function overlay(t) {
  og.setTransform(PR, 0, 0, PR, 0, 0); og.clearRect(0, 0, VW, VH);
  const GB = WIDE ? 310 : 560;
  const gr = og.createLinearGradient(0, GB, 0, VH); gr.addColorStop(0, 'rgba(2,3,10,0)'); gr.addColorStop(.5, 'rgba(2,3,10,.4)'); gr.addColorStop(1, 'rgba(2,3,10,.4)');
  og.fillStyle = gr; og.fillRect(0, GB, VW, VH - GB);
  for (const [id, t0, t1, y, size] of CAPS) {
    if (t < t0 - .01 || t > t1 + .8) continue;
    const a = clamp((t - t0) / .9) * (1 - clamp((t - t1) / .7)), rise = (1 - clamp((t - t0) / 1.1)) * 7;
    drawCaption(og, id, WIDE ? (id === 'c9' ? 345 : 432) : y, a, rise, size);
  }
  BANNERS.forEach((_, i) => drawBanner(og, i, t));
  // 엔딩
  if (t > 120.5) {
    const mp = heroAt(uMe(138)), v = mp.clone().project(camera);
    const ix = (v.x * .5 + .5) * VW, iy = (1 - (v.y * .5 + .5)) * VH;
    const ia = sstep(121.2, 124.2, t), glow = .3 * (.5 + .5 * Math.sin((t - 124) * 2.4));
    drawIcon(og, ix, iy, WIDE ? 84 : 92, ia, glow);
    og.save(); og.globalAlpha = ia * sstep(123.4, 125, t); og.textBaseline = 'middle'; og.shadowColor = 'rgba(0,0,12,.8)'; og.shadowBlur = 8;
    drawLine(og, [{ t: L.app_name, f: `800 21px ${FONT}`, c: COL.anbu }], CAP_X, iy + 66, { align: 'center' }); og.restore();
    const hx = capLayout.__e; const f = endLayout.head, lh = Math.round(f.fs * 1.5);
    const topY = iy + 112, a2 = sstep(124.4, 127, t), rise = (1 - a2) * 8;
    og.save(); og.globalAlpha = a2; og.textBaseline = 'middle'; og.shadowColor = 'rgba(0,0,12,.85)'; og.shadowBlur = 14;
    f.lines.forEach((ln, i) => drawLine(og, ln, CAP_X, topY + i * lh + lh / 2 + rise, { align: 'center', rtl: !!L.rtl }));
    og.restore();
    const cy = topY + f.lines.length * lh + 30;
    const a3 = sstep(129, 131, t), a4 = sstep(129.4, 131.4, t);
    drawRuns(og, endLayout.cta1, 19, cy, a3, (1 - a3) * 8); drawRuns(og, endLayout.cta2, 16, cy + 30, a4, (1 - a4) * 8);
  }  const fo = sstep(137.2, 138, t); if (fo > 0) { og.fillStyle = `rgba(0,0,0,${fo})`; og.fillRect(0, 0, VW, VH); }
}
window.render = function (ms) {
  const t = ms / 1000;
  update(t);
  composer.render();
  overlay(t);
};

// ─── 초기화 ─────────────────────────────────────────────────────────────
const img = new Image(); img.src = ICON_URL;
img.onload = async () => {
  await document.fonts.ready; iconImg = img;
  layoutCaps(); layoutEnding();
  bannerCv = BANNERS.map(([pi]) => makePushCanvas(L.push[pi], img));
  window.render(0); window.READY = true;
};

// 점검용: 시각 t 의 내 점·끝 점의 화면 좌표(CSS px)
window.PROBE = ms => {
  const t = ms / 1000; update(t); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  const f = v => { const p = v.clone().project(camera); return [Math.round((p.x * .5 + .5) * VW), Math.round((1 - (p.y * .5 + .5)) * VH)]; };
  return { t, dot: f(dotPos(t)), E: f(E), cam: camera.position.toArray().map(x => +x.toFixed(1)) };
};
