// 안부 3D 시험 영상 — render(ms) 결정적 렌더(벽시계·Math.random 미사용)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createScreen, setStrings, actMetrics, actPieces, actRtl, cardTop, NAV_Y, W as SW_DP, H as SH_DP, PW, DLG, seg, eio, eout, eback, clamp } from './screen.js';
import STRINGS from './strings.json';
import { wrap, drawLine } from './text.js';
import ICON_URL from './app_icon_512.png';
import { createEnding } from './ending.js';
import { createBoard } from './board.js';
const LANG = new URLSearchParams(location.search).get('lang') || 'ko';
const L = STRINGS[LANG];
setStrings(L, LANG);

const VW = 540, VH = 960;
window.DURATION = 34;
const lerp = (a, b, t) => a + (b - a) * t;
const ein = x => x * x * x;
const einBack = x => { const c1 = 1.70158, c3 = c1 + 1; return c3 * x * x * x - c1 * x * x; };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ─── 렌더러 ──────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(2); renderer.setSize(VW, VH);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, VW / VH, 0.002, 30);

// 배경 — 중앙이 아주 옅게 밝은 남색 그라데이션
{
  const c = document.createElement('canvas'); c.width = 270; c.height = 480; const g = c.getContext('2d');
  const gr = g.createRadialGradient(135, 200, 10, 135, 220, 330);
  gr.addColorStop(0, '#151a28'); gr.addColorStop(.45, '#0a0c14'); gr.addColorStop(1, '#020203');
  g.fillStyle = gr; g.fillRect(0, 0, 270, 480);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}

// 스튜디오 환경광 — 검은 방 안의 소프트박스 띠들(크롬·유리에 비치는 빛)
{
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0c0e14).multiplyScalar(1.4), side: THREE.BackSide })));
  const box = (w, h, pos, look, col, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  };
  box(7, 1.0, [0, 5.2, 0.5], [0, 0, 0], 0xffffff, 3.2);         // 천장 띠
  box(0.55, 7, [-5.2, 0.5, 1.5], [0, 0, 0], 0xffffff, 6.0);     // 왼쪽 세로 띠
  box(0.45, 6, [5.0, 0.2, -1.6], [0, 0, 0], 0xa8c0ff, 4.0);     // 오른쪽 차가운 띠
  box(5, 0.35, [0, 1.2, -5.2], [0, 0, 0], 0xffffff, 4.5);       // 뒤쪽 림
  box(6, 2.2, [0, -3.2, 4.6], [0, 0, 0], 0xffffff, 0.22);       // 앞쪽 은은한 채움(유리 백화 방지로 낮춤)
  box(0.5, 8, [-3.6, 0, -3.8], [0, 0, 0], 0xffffff, 5.0);      // 뒤 왼쪽 세로 띠(뒷면·측면용)
  box(8, 0.5, [0, -5.0, -1.0], [0, 0, 0], 0xcfd8ff, 2.5);      // 바닥 띠(아랫변 하이라이트)
  // 사방 세로 띠 — 어느 각도에서도 크롬에 줄무늬 하이라이트가 걸리게
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.35; box(0.32, 6, [Math.sin(a) * 5.4, 0.3, Math.cos(a) * 5.4], [0, 0, 0], k % 2 ? 0xdfe6ff : 0xffffff, 1.6 + (k % 3) * 0.9); }
  box(1.6, 1.6, [3.6, 3.8, -0.6], [0, 0, 0], 0xfff1dc, 3.0);     // 따뜻한 키(정면 반사 경로 밖으로)
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.0).texture;
}

// ─── 휴대폰 ──────────────────────────────────────────────────────────────
const PH_W = 0.075, PH_H = 0.160, PH_D = 0.0078, PH_R = 0.0105;
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function shapeGeo(w, h, r, segs = 24) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), segs);
  const uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}
const phone = new THREE.Group(); scene.add(phone);
const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f9, metalness: 1, roughness: 0.07, clearcoat: 0.4, clearcoatRoughness: 0.05, envMapIntensity: 1.25 });
{
  const bv = 0.0017, depth = PH_D - 2 * bv;
  const g = new THREE.ExtrudeGeometry(rrShape(PH_W - 2 * bv, PH_H - 2 * bv, PH_R - bv), {
    depth, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 10, curveSegments: 64,
  });
  g.translate(0, 0, -depth / 2);
  // 캡(앞·뒤 판)은 비운다: 앞은 화면 아래 기판이 비쳐야 하고 뒤는 뒷유리가 덮는다
  phone.add(new THREE.Mesh(g, [new THREE.MeshBasicMaterial({ visible: false }), chrome]));
}
// 앞면 검은 유리(베젤)
const frontZ = PH_D / 2;
const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x050507, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.0 });
const SCR_W0 = PH_W - 0.0018 - 2 * 0.0017;
{
  const outer = rrShape(PH_W - 0.0018, PH_H - 0.0018, PH_R - 0.0009);
  outer.holes.push(rrShape(SCR_W0, SCR_W0 * 826.5 / 375, PH_R - 0.0032));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(outer, 40), blackGlass); m.position.z = frontZ + 0.00004; phone.add(m);
}
// 화면(앱 UI 캔버스)
const SCR_W = PH_W - 0.0018 - 2 * 0.0017, SCR_H = SCR_W * SH_DP / SW_DP;
const scr = createScreen();
const scrTex = new THREE.CanvasTexture(scr.canvas); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 16;
scrTex.generateMipmaps = true; scrTex.minFilter = THREE.LinearMipmapLinearFilter;
const scrMat = new THREE.MeshBasicMaterial({ map: scrTex, color: new THREE.Color(1.03, 1.03, 1.03), transparent: true });
{ const m = new THREE.Mesh(shapeGeo(SCR_W, SCR_H, PH_R - 0.0032, 40), scrMat); m.position.z = frontZ + 0.00008; m.renderOrder = 5; phone.add(m); }
// 커버 유리 — 가산 합성: 정면에선 거의 투명, 비스듬할수록 환경 반사가 화면을 덮는다(프레넬)
const coverGlass = new THREE.ShaderMaterial({
  uniforms: { rot: { value: 0 }, strength: { value: 1 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec3 vN; varying vec3 vP;
    void main(){ vec4 wp = modelMatrix*vec4(position,1.); vP = wp.xyz; vN = normalize(mat3(modelMatrix)*normal);
      gl_Position = projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vP; uniform float rot, strength;
    vec3 env(vec3 r){ float c = cos(rot), s = sin(rot); r = vec3(c*r.x + s*r.z, r.y, -s*r.x + c*r.z);
      float az = atan(r.x, r.z);
      float stripL = exp(-pow((az + 1.25)*7., 2.)) * smoothstep(-0.7, 0.2, r.y);           // 왼쪽 세로 띠
      float stripR = exp(-pow((az - 1.9)*9., 2.)) * smoothstep(-0.6, 0.3, r.y);            // 오른쪽 차가운 띠
      float ceil  = smoothstep(0.62, 0.86, r.y) * exp(-pow(r.x*1.6, 2.));                  // 천장 띠
      return vec3(0.03) + vec3(1.0)*stripL*3.0 + vec3(0.66,0.76,1.0)*stripR*2.2 + vec3(1.0)*ceil*1.6; }
    void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vP);
      float ndv = clamp(dot(N, V), 0., 1.); float F = 0.04 + 0.96*pow(1. - ndv, 5.);
      vec3 R = reflect(-V, N); gl_FragColor = vec4(env(R)*F*strength, 1.); }`,
});
const coverMesh = new THREE.Mesh(shapeGeo(PH_W - 0.0018, PH_H - 0.0018, PH_R - 0.0009), coverGlass); coverMesh.position.z = frontZ + 0.00014; phone.add(coverMesh);
// 유리를 스치는 빛줄기
const streakMat = new THREE.ShaderMaterial({
  uniforms: { k: { value: -1 }, amp: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `varying vec2 vUv; uniform float k, amp;
    void main(){ float d = vUv.x*0.55 + vUv.y*0.9 - k; float b = exp(-d*d*320.) + 0.08*exp(-d*d*40.);
      gl_FragColor = vec4(vec3(1.0,0.98,0.95)*b*amp, 1.0); }`,
});
{ const m = new THREE.Mesh(shapeGeo(PH_W - 0.0018, PH_H - 0.0018, PH_R - 0.0009), streakMat); m.position.z = frontZ + 0.00018; phone.add(m); }
// 뒷면 — 짙은 반무광 유리
{
  const back = new THREE.MeshPhysicalMaterial({ color: 0x3a404e, metalness: 0.4, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.12 });
  const m = new THREE.Mesh(shapeGeo(PH_W - 0.0018, PH_H - 0.0018, PH_R - 0.0009), back);
  m.rotation.y = Math.PI; m.position.z = -frontZ - 0.00004; phone.add(m);
  // 카메라 모듈(브랜드 없는 일반형) — 뒷면에서 볼 때 왼쪽 위
  const mod = new THREE.Mesh(new RoundedBoxGeometry(0.027, 0.036, 0.0016, 4, 0.0065), new THREE.MeshPhysicalMaterial({ color: 0x15171d, metalness: 0.3, roughness: 0.18, clearcoat: 1 }));
  mod.position.set(PH_W / 2 - 0.0085 - 0.0135, PH_H / 2 - 0.009 - 0.018, -frontZ - 0.0008); phone.add(mod);
  const ringG = new THREE.CylinderGeometry(0.0058, 0.0058, 0.0016, 48), lensG = new THREE.CylinderGeometry(0.0046, 0.0046, 0.0018, 48);
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0x05060a, metalness: 0, roughness: 0.02, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.6 });
  for (const [dx, dy] of [[-0.0058, 0.0085], [-0.0058, -0.0068], [0.0072, 0.001]]) {
    const r = new THREE.Mesh(ringG, chrome); r.rotation.x = Math.PI / 2; r.position.set(mod.position.x + dx, mod.position.y + dy, -frontZ - 0.0019); phone.add(r);
    const l = new THREE.Mesh(lensG, lensM); l.rotation.x = Math.PI / 2; l.position.set(mod.position.x + dx, mod.position.y + dy, -frontZ - 0.0021); phone.add(l);
  }
}
// 측면 버튼
for (const [y, len] of [[0.036, 0.022], [0.006, 0.012]]) {
  const b = new THREE.Mesh(new RoundedBoxGeometry(0.0016, len, 0.0028, 3, 0.0007), chrome);
  b.position.set(PH_W / 2 + 0.00045, y, 0); phone.add(b);
}

// ─── 화면 좌표(dp) → 폰 로컬 좌표 ────────────────────────────────────────
const dp2local = (x, y) => new THREE.Vector3((x / SW_DP - .5) * SCR_W, (.5 - y / SH_DP) * SCR_H, frontZ);

// ─── 푸시 팝업(서버 실제 문구, 본문 앞 "이름 · ") ──────────────────────
// 서버 실제 문구(언어별, 본문 앞 "이름 · ") — gen_strings.py 가 messages.py 에서 만든다
const PUSHES = L.push;
const POP_T = [7.0, 7.75, 8.5, 9.25, 10.0];        // 팡 — 0.75초 간격
const POP_OUT = [12.0, 12.4, 12.8, 13.2, 13.6];    // 나온 순서대로 사라짐
const FONT = '"Apple SD Gothic Neo","Noto Sans KR","Noto Sans JP","Noto Sans SC","Noto Sans Thai","Noto Sans Devanagari","Geeza Pro",sans-serif';
const popups = [];
// 팝업 색 — 알림 페이지 카드(_NotificationCard)의 등급 배경. 주의 제목만 연노랑 위 가독성 때문에 #B58900(홈페이지와 동일)
const PUSH_COLOR = {
  normal:  { bg: 'rgba(232,245,233,0.98)', title: '#2E7D32', line: 'rgba(67,160,71,0.22)' },
  battery: { bg: 'rgba(237,231,246,0.98)', title: '#7B1FA2', line: 'rgba(123,31,162,0.20)' },
  caution: { bg: 'rgba(255,249,196,0.98)', title: '#B58900', line: 'rgba(255,193,7,0.30)' },
  urgent:  { bg: 'rgba(255,235,238,0.98)', title: '#E53935', line: 'rgba(229,57,53,0.22)' },
};
function makePushCanvas(p, img) {
  // OS 푸시 배너 — 아랍어는 시스템 화면이 RTL(아이콘 오른쪽, 글자 오른쪽 정렬)
  const S = 3, w = 330, pad = 16, rtl = !!L.rtl, iw = w - pad * 2;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const TF = `800 15px ${FONT}`, BF = `400 14px ${FONT}`;
  const tl = wrap(g, [{ t: p.title, f: TF }], iw, LANG), bl = wrap(g, [{ t: p.body, f: BF }], iw, LANG);
  const h = pad + 20 + 8 + tl.length * 21 + 4 + bl.length * 20 + pad;
  c.width = w * S; c.height = h * S; g.scale(S, S);
  const pc = PUSH_COLOR[p.lv];
  g.beginPath(); g.roundRect(0, 0, w, h, 22); g.fillStyle = pc.bg; g.fill();
  g.lineWidth = 1.5; g.strokeStyle = pc.line; g.beginPath(); g.roundRect(0.75, 0.75, w - 1.5, h - 1.5, 21.5); g.stroke();
  const ix = rtl ? w - pad - 20 : pad;
  g.save(); g.beginPath(); g.roundRect(ix, pad, 20, 20, 5); g.clip(); g.drawImage(img, ix, pad, 20, 20); g.restore();
  g.textBaseline = 'middle';
  drawLine(g, [{ t: L.app_name, f: `600 12.5px ${FONT}`, c: '#5b5e66' }, { t: ' · ' + L.now, f: `400 12.5px ${FONT}`, c: '#8a8d94' }],
    rtl ? w - pad - 28 : pad + 28, pad + 10, { align: rtl ? 'right' : 'left', rtl });
  const ax = rtl ? w - pad : pad, al = rtl ? 'right' : 'left';
  tl.forEach((ln, i) => drawLine(g, ln, ax, pad + 28 + 10.5 + i * 21, { align: al, rtl, color: pc.title }));
  const by = pad + 28 + tl.length * 21 + 4;
  bl.forEach((ln, i) => drawLine(g, ln, ax, by + 10 + i * 20, { align: al, rtl, color: '#2b2e35' }));
  return { c, aspect: h / w };
}
function shadowTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.filter = 'blur(22px)'; g.fillStyle = 'rgba(0,0,0,1)'; g.beginPath(); g.roundRect(48, 40, 160, 48, 22); g.fill();
  const t = new THREE.CanvasTexture(c); return t;
}
const popVS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
const popFS = `varying vec2 vUv; uniform sampler2D map; uniform float op, sweep;
  void main(){ vec4 c = texture2D(map, vUv); float d = (vUv.x*0.8 + vUv.y*0.5) - sweep; float b = exp(-d*d*90.);
    vec3 col = c.rgb*1.04 + vec3(1.)*b*0.55*c.a; gl_FragColor = vec4(col, c.a*op); }`;

// ─── 엔딩 문구는 ending.js(화면 고정 캔버스) ───
// 빛줄기(폰 위로 솟음)와 별빛 반짝임
function radialTex(star) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  if (star) for (const [w, h] of [[256, 6], [6, 256]]) { const l = g.createLinearGradient(0, 0, w > h ? 256 : 0, w > h ? 0 : 256); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(.5, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(128 - w / 2, 128 - h / 2, w, h); }
  return new THREE.CanvasTexture(c);
}
const beamMat = new THREE.ShaderMaterial({
  uniforms: { head: { value: 0 }, amp: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: popVS,
  fragmentShader: `varying vec2 vUv; uniform float head, amp; void main(){ float x = abs(vUv.x-0.5)*2.;
    float core = exp(-x*x*60.) + 0.25*exp(-x*x*6.); float along = smoothstep(head-0.5, head, vUv.y) * step(vUv.y, head);
    float tip = exp(-pow((vUv.y-head)*14.,2.)); gl_FragColor = vec4(vec3(0.8,0.9,1.0)*(core*along*1.6 + tip*core*4.)*amp, 1.); }`,
});
const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 0.12), beamMat); scene.add(beam);
const END = createEnding(L, LANG);
// 화면 아래 회로 기판(유리 1.6mm 아래) — 화면이 켜지기 전 잠깐 비친다
const BOARD = createBoard({ phone, w: SCR_W, h: SCR_H, r: PH_R - 0.0032, z: frontZ - 0.0016, shapeGeo, radialTex });
scene.add(camera);
const mkOverlay = (canvas, additive) => {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, color: additive ? new THREE.Color(2.6, 2.6, 2.8) : new THREE.Color(1, 1, 1) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); mesh.renderOrder = additive ? 1001 : 1000; mesh.frustumCulled = false;
  camera.add(mesh); return { mesh, t };
};
const endText = mkOverlay(END.textCanvas, false), endGlow = mkOverlay(END.glowCanvas, true);
// 30일 창 "활동량 : 활동적" — 카메라가 줌인하는 동안 화면 캔버스(해상도 부족) 대신 겹쳐 보여 줄 고해상도 글자 판
const AM = actMetrics();
const hiLabel = (() => {
  const S = 14, hDp = 20, padDp = 6;
  const mk = bold => {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    const pcs = actPieces(12, bold);
    const wDp = AM.w + padDp * 2 + 6;                      // 굵은 글자가 조금 넓어져도 들어가게
    c.width = Math.round(wDp * S); c.height = Math.round(hDp * S);
    g.scale(S, S); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, wDp, hDp);   // 다이얼로그 흰 바탕
    g.textBaseline = 'middle';
    // 화면 캔버스와 같은 규칙으로 배치(아랍어는 강조어가 왼쪽) — 왼쪽 끝을 문장 왼쪽 끝에 맞춘다
    drawLine(g, pcs, padDp, hDp / 2, { rtl: actRtl(), color: '#3F4948' });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wDp / SW_DP * SCR_W, hDp / SH_DP * SCR_H), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: new THREE.Color(1.03, 1.03, 1.03) }));
    const left = dp2local(AM.x0 - padDp, AM.cy);
    m.position.set(left.x + (wDp / SW_DP * SCR_W) / 2, left.y, frontZ + 0.00011 + (bold ? 0.00002 : 0));
    m.renderOrder = bold ? 7 : 6; m.visible = false; phone.add(m); return m;
  };
  return { reg: mk(false), bold: mk(true) };
})();
const OV_D = 0.05;   // 카메라 앞 거리 — 화면을 정확히 덮는 크기로 매 프레임 맞춘다
// 헤드라인: 줄마다 판 하나. 아래 변을 축으로 수평(누움) → 수직(섬)으로 일어선다
const headTex = new THREE.CanvasTexture(END.headCanvas); headTex.colorSpace = THREE.SRGBColorSpace; headTex.anisotropy = 16;
const headLines = END.lineRects().map((rc, i) => {
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);           // 원점 = 아래 변(축)
  const uv = geo.attributes.uv;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (rc.x + uv.getX(k) * rc.w) / 540, 1 - (rc.y + (1 - uv.getY(k)) * rc.h) / 960);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: headTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0 }));
  m.renderOrder = 1002 + i; m.frustumCulled = false; camera.add(m); return { m, rc };
});

// 떠다니는 먼지(보케) — 깊이감
const dust = (() => {
  const n = 140, pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([(rnd() - .5) * .9, (rnd() - .5) * 1.0, -0.15 - rnd() * .7], i * 3); vel.push([(rnd() - .5) * .006, .004 + rnd() * .008]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: radialTex(false), size: 0.012, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(.55, .62, .85), opacity: .35 });
  const p = new THREE.Points(g, m); scene.add(p); return { p, base: pos.slice(), vel };
})();

// ─── 후처리 ──────────────────────────────────────────────────────────────
const rt = new THREE.WebGLRenderTarget(VW * 2, VH * 2, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(2); composer.setSize(VW, VH);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(VW, VH), 0.55, 0.55, 1.3); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grain = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, seed: { value: 0 }, fade: { value: 1 } },
  vertexShader: popVS,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float seed, fade;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed)*43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv-0.5; d.x*=0.5625;
      float vig = smoothstep(0.75, 0.2, length(d)); c.rgb *= mix(0.72, 1.0, vig);
      c.rgb += (h(vUv*vec2(1080.,1920.)) - 0.5)*0.022; gl_FragColor = vec4(c.rgb*fade, 1.); }`,
});
composer.addPass(grain);

// ─── 카메라 경로 — 키프레임(시각, 위치, 바라보는 점, 화각) · Catmull-Rom ──
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// 줌인 목표: 문장 가운데. 거리는 문장 폭이 화면 가로의 약 62% 가 되게(언어마다 길이가 달라 계산)
const AWP = dp2local(AM.x0 + AM.w / 2, AM.cy);
const ZD = clamp((AM.w / SW_DP * SCR_W) / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * (VW / VH) * 0.62), 0.07, 0.16);
const KEYS = [
  { t: 0.0,  p: V(0.105, 0.075, 0.075), l: V(0.030, 0.040, 0.000), f: 26 },   // 오른쪽 위 모서리 매크로
  { t: 3.0,  p: V(0.112, -0.050, 0.060), l: V(0.032, -0.030, 0.000), f: 26 }, // 측면을 따라 미끄러져 내려감
  { t: 4.3,  p: V(0.170, 0.030, -0.170), l: V(0.000, 0.008, 0.000), f: 28 },  // 뒤쪽(카메라 모듈)으로 돎
  { t: 5.0,  p: V(0.250, 0.035, 0.040), l: V(0.000, 0.004, 0.000), f: 28 },   // 옆면을 크게 돌아
  { t: 5.8,  p: V(0.150, 0.040, 0.240), l: V(0.000, 0.000, 0.000), f: 29 },   // 앞쪽 비스듬(유리 반사)
  { t: 7.0,  p: V(-0.060, 0.012, 0.430), l: V(0.000, 0.000, 0.000), f: 30 },  // 팝업 구간
  { t: 10.6, p: V(0.065, -0.008, 0.430), l: V(0.000, 0.000, 0.000), f: 30 },
  { t: 13.7, p: V(0.000, 0.000, 0.410), l: V(0.000, -0.004, 0.000), f: 30 },
  { t: 14.7, p: V(0.012, -0.050, 0.200), l: V(0.000, -0.055, 0.000), f: 30 }, // 하단 탭으로 밀고 들어감
  { t: 15.9, p: V(-0.090, 0.030, 0.300), l: V(0.000, 0.012, 0.000), f: 30 },  // 휙 반대로
  { t: 17.6, p: V(0.050, 0.022, 0.300), l: V(0.000, 0.008, 0.000), f: 30 },
  { t: 19.4, p: V(-0.048, 0.016, 0.290), l: V(0.000, 0.008, 0.000), f: 30 },  // 카드 넘김마다 반대로 기욺
  { t: 21.2, p: V(0.040, 0.012, 0.280), l: V(0.000, 0.008, 0.000), f: 30 },
  { t: 22.5, p: V(0.032, 0.030, 0.120), l: V(0.016, 0.016, 0.000), f: 28 },   // 달력 아이콘으로 접근
  { t: 23.7, p: V(0.000, 0.002, 0.330), l: V(0.000, 0.000, 0.000), f: 30 },   // 창이 뜨며 정면
  { t: 24.55, p: V(0.006, 0.000, 0.325), l: V(0.000, 0.000, 0.000), f: 30 },
  { t: 25.1, p: V(AWP.x + 0.002, AWP.y - 0.0015, ZD), l: V(AWP.x, AWP.y, 0.0), f: 30 },   // "활동적"으로 줌인
  { t: 25.8, p: V(AWP.x + 0.0012, AWP.y - 0.001, ZD * 0.955), l: V(AWP.x, AWP.y, 0.0), f: 30 },
  { t: 26.35, p: V(0.022, -0.008, 0.315), l: V(0.000, 0.000, 0.000), f: 30 },   // 줌아웃
  { t: 27.6, p: V(0.120, 0.040, 0.420), l: V(0.000, 0.020, 0.000), f: 30 },
  { t: 29.6, p: V(0.000, 0.215, 0.600), l: V(0.000, 0.062, 0.000), f: 30 },   // 위로 솟아 3/4 위
  { t: 34.0, p: V(0.000, 0.200, 0.560), l: V(0.000, 0.060, 0.000), f: 30 },
];
// 구간 속도 곡선 — 0: 천천히 시작·끝, 1: 일정
const EASE = ['i', 'l', 'l', 'l', 'o', 'io', 'io', 'i', 'o', 'io', 'io', 'io', 'io', 'io', 'io', 'io', 'io', 'io', 'i', 'o', 'o'];
// i: 정지에서 출발해 끝에서 일정 속도로 이어짐 / o: 일정 속도로 들어와 정지 / io: 정지→정지 / l: 일정
const efn = { i: x => x * x * (2 - x), o: x => 1 - (1 - x) * (1 - x) * (1 + x), io: eio, l: x => x };
function cr(a, b, c, d, t) { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); }
function camAt(t) {
  let i = KEYS.findIndex((k, j) => j < KEYS.length - 1 && t >= k.t && t < KEYS[j + 1].t);
  if (i < 0) i = t < 0 ? 0 : KEYS.length - 2;
  const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const s = efn[EASE[i]](clamp((t - k1.t) / (k2.t - k1.t)));
  const v = key => new THREE.Vector3(cr(k0[key].x, k1[key].x, k2[key].x, k3[key].x, s), cr(k0[key].y, k1[key].y, k2[key].y, k3[key].y, s), cr(k0[key].z, k1[key].z, k2[key].z, k3[key].z, s));
  return { p: v('p'), l: v('l'), f: cr(k0.f, k1.f, k2.f, k3.f, s) };
}

// ─── 화면 상태 타임라인 ──────────────────────────────────────────────────
// 30일 창: 줌인 → 머묾 → 줌아웃 → X
const HI_ON = 24.3, ZOOM_IN = 24.55, ZOOM_HOLD = 25.1, ZOOM_OUT = 25.8, ZOOM_BACK = 26.35, HI_OFF = 26.45;
const TAP_HOME = 14.95, SW1 = 18.2, SW2 = 20.2, TAP_CAL = 22.55, DLG_IN = 22.75, TAP_X = 26.5, DLG_OUT = 26.7;
function screenState(t) {
  const st = { touches: [], bright: 1, inserted: [0, 0, 0, 0, 0], page: 0, grow: 0, dlg: 0, dlgGrow: 0 };
  if (t < BOARD.T.reveal) { st.mode = 'off'; st.xray = BOARD.xray(t); return st; }
  st.reveal = BOARD.reveal(t);
  if (t < TAP_HOME + 0.25) {
    st.mode = 'noti';
    st.inserted = POP_T.map(p => clamp((t - p - 0.05) / 0.4));
    st.touches.push({ x: SW_DP / 8, y: NAV_Y, p: (t - TAP_HOME) / 0.6 });
    return st;
  }
  st.mode = 'dash';
  const sw = (a) => eio(clamp((t - a) / 0.55));
  st.page = sw(SW1) + sw(SW2);
  st.grow = clamp((t - (SW2 + 0.35)) / 1.0);
  // 스와이프 손가락: 오른쪽 → 왼쪽
  for (const a of [SW1, SW2]) if (t > a - 0.15 && t < a + 0.75) {
    const q = clamp((t - a + 0.15) / 0.9);
    st.touches.push({ x: lerp(300, 80, eio(clamp((t - a) / 0.55))), y: cardTop() + 120, p: 0.25 + q * 0.5 });
  }
  const calX = 27 + 287.3 - 16 - 34 + 15, calY = cardTop() + 8 + 24 + 4 + 15;
  st.touches.push({ x: calX, y: calY, p: (t - TAP_CAL) / 0.6 });
  if (t < DLG_OUT) st.dlg = clamp((t - DLG_IN) / 0.3);
  else st.dlg = 1 - clamp((t - DLG_OUT) / 0.25);
  st.dlgGrow = clamp((t - DLG_IN - 0.25) / 1.3);
  st.subHide = t >= HI_ON && t < HI_OFF ? 1 : 0;   // 고해상도 판이 대신 보이는 동안 캔버스의 같은 글자는 숨긴다
  const xX = DLG.x + DLG.w - 16 - 6 - 11, xY = DLG.y + 16 + 17;
  st.touches.push({ x: xX, y: xY, p: (t - TAP_X) / 0.55 });
  st.dlg = t < DLG_IN ? 0 : st.dlg;
  // 다이얼로그 축소 시 easeInBack 느낌을 위해 간단히 선형 처리
  return st;
}
// 효과음 신호 — 소리는 렌더 뒤 audio.py 단계에서 섞는다
window.SFX = [
  { t: 0.2, file: '2_슬라이드_전환/cinematic-wind-swoosh.mp3', rel: -2 },
  { t: 3.3, file: '2_슬라이드_전환/air-woosh.mp3' },
  { t: 6.12, file: '1_푸시알림/interface-hint-notification.mp3', rel: -1 },
  ...POP_T.slice(0, 4).map(t => ({ t, file: '1_푸시알림/bubble-pop-up-alert-notification.mp3' })),
  { t: POP_T[4], file: '1_푸시알림/bell-notification.mp3', duck: true },
  { t: TAP_HOME, file: '4_탭_클릭/interface-device-click.mp3' },
  { t: SW1, file: '2_슬라이드_전환/fast-small-sweep-transition.mp3' },
  { t: SW2, file: '2_슬라이드_전환/fast-small-sweep-transition.mp3' },
  { t: TAP_CAL, file: '4_탭_클릭/interface-device-click.mp3' },
  { t: DLG_IN, file: '3_페이지_넘김/page-forward-single-chime.mp3' },
  { t: TAP_X, file: '4_탭_클릭/interface-device-click.mp3' },
  { t: 30.9, file: 'SHIMMER' },
];

// ─── 프레임 ──────────────────────────────────────────────────────────────
const _q = new THREE.Quaternion();
window.render = function (ms) {
  const t = ms / 1000;
  // 화면
  scr.draw(screenState(t)); scrTex.needsUpdate = true;
  BOARD.update(t);
  // 카메라
  const c = camAt(t);
  camera.position.copy(c.p); camera.fov = c.f; camera.updateProjectionMatrix(); camera.lookAt(c.l);
  // 환경광 회전 — 오프닝에 하이라이트가 테두리를 훑고, 전환마다 한 번씩 번쩍
  let rotY = lerp(-1.4, 0.55, eio(seg(t, 0, 3.2))) + 0.5 * eio(seg(t, 3.2, 5.8));
  rotY += 0.35 * Math.sin(Math.PI * seg(t, 14.6, 16.0)) + 0.12 * Math.sin(Math.PI * seg(t, 27, 31));
  scene.environmentRotation.set(0, rotY, 0);
  scene.environmentIntensity = lerp(0.0, 1.0, eout(seg(t, 0.1, 1.6)));
  // 유리 반사 세기 — 화면을 읽어야 하는 구간에선 낮춘다
  // 비스듬한 공개 구간은 강하게, 화면을 읽는 구간은 약하게
  coverGlass.uniforms.rot.value = rotY;
  coverGlass.uniforms.strength.value = (lerp(1.6, 0.6, seg(t, 5.8, 6.8)) + 0.5 * Math.sin(Math.PI * seg(t, 14.5, 16.0))) * lerp(1, 0.4, seg(t, 27.0, 28.0));   // 엔딩은 화면이 작아 반사를 낮춘다
  // 유리를 스치는 빛줄기(대시보드 진입·다이얼로그·엔딩)
  const sweep = (a, d) => seg(t, a, a + d);
  let sk = -1, sa = 0;
  for (const [a, d, k] of [[16.4, 1.1, 0.42], [22.8, 0.9, 0.42], [28.2, 1.2, 0.16]]) if (t > a && t < a + d) { sk = lerp(-0.3, 1.8, eio(sweep(a, d))); sa = k * Math.sin(Math.PI * sweep(a, d)); }   // 엔딩은 화면이 작아 약하게
  streakMat.uniforms.k.value = sk; streakMat.uniforms.amp.value = sa;
  // 폰 자세 — 엔딩에서 천천히 회전
  phone.rotation.set(-0.12 * eio(seg(t, 27, 30)), 0.42 * eio(seg(t, 27.2, 34)) - 0.05 * Math.sin(Math.PI * seg(t, 27.2, 30)), 0);
  // 팝업
  for (let i = 0; i < popups.length; i++) {
    const p = popups[i], tin = (t - POP_T[i]) / 0.5, tout = (t - POP_OUT[i]) / 0.38;
    const vis = tin > 0 && tout < 1;
    p.group.visible = vis; if (!vis) continue;
    const a = tout > 0 ? 1 - einBack(clamp(tout)) : eback(clamp(tin));
    const k = clamp(a, -0.2, 1.2);
    p.group.position.lerpVectors(p.from, p.to, clamp(k, 0, 1.2));
    p.group.scale.setScalar(Math.max(0.001, 0.25 + 0.75 * k));
    p.mat.uniforms.op.value = tout > 0 ? 1 - clamp(tout * 1.3) : clamp(tin * 3);
    p.mat.uniforms.sweep.value = lerp(-0.4, 1.6, clamp((t - POP_T[i] - 0.15) / 0.6));
    p.sh.material.opacity = 0.32 * p.mat.uniforms.op.value;
    // 반짝임: 도착 순간 가장자리에서
    p.spark.material.opacity = Math.max(0, Math.sin(Math.PI * clamp((t - POP_T[i] - 0.08) / 0.45))) * 0.55;
    p.spark.scale.setScalar(0.006 + 0.010 * clamp((t - POP_T[i]) / 0.4));
  }
  // 30일 창 줌인 구간 — 고해상도 글자 판으로 바꿔 보여 주고, 줌인 중에는 "활동적"을 굵게
  {
    const on = t >= HI_ON && t < HI_OFF; hiLabel.reg.visible = hiLabel.bold.visible = on;
    hiLabel.bold.material.opacity = clamp((t - ZOOM_IN) / 0.25) * (1 - clamp((t - ZOOM_OUT) / 0.3));
  }
  // 엔딩 — 곡의 반전(28.25초, 저음이 빠지고 고음으로)과 빛줄기 시작을 맞춘다
  const tEnd = t - 28.25;
  const showEnd = t > 28.2;
  endText.mesh.visible = endGlow.mesh.visible = showEnd; beam.visible = showEnd;
  for (const hl of headLines) hl.m.visible = showEnd;
  if (showEnd) {
    camera.updateMatrixWorld();
    const h = 2 * OV_D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), w = h * camera.aspect;
    for (const o of [endText, endGlow]) { o.mesh.position.set(0, 0, -OV_D); o.mesh.scale.set(w, h, 1); }
    END.draw(tEnd); endText.t.needsUpdate = true; endGlow.t.needsUpdate = true;
    // 줄별로 일어서기: -88°(누움, 윗변이 화면 안쪽) → 0°(섬), 끝에서 살짝 넘쳤다 멈춤
    headLines.forEach((hl, i) => {
      const rc = hl.rc, q = clamp((tEnd - 0.6 - i * 0.42) / 1.05);
      const ang = -THREE.MathUtils.degToRad(88) * (1 - eback(q));
      hl.m.rotation.x = ang;
      hl.m.material.opacity = clamp(q * 2.2);
      // CSS px → 카메라 앞 평면 좌표(아래 변 위치)
      hl.m.position.set((rc.x + rc.w / 2) / 540 * w - w / 2, h / 2 - (rc.y + rc.h) / 960 * h, -OV_D);
      hl.m.scale.set(rc.w / 540 * w, rc.h / 960 * h, 1);
    });
    // 빛줄기: 폰 윗변 → 첫 줄 왼쪽 끝(화면 좌표를 폰 깊이로 되돌려 3D 목표점을 구한다)
    const p0 = new THREE.Vector3(0, PH_H / 2 + 0.002, 0).applyEuler(phone.rotation);
    const ndc = new THREE.Vector3(END.anchor.x / 540 * 2 - 1, -(END.anchor.y / 960 * 2 - 1), 0.5).unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const depth = p0.clone().sub(camera.position).length();
    const p1 = camera.position.clone().add(dir.multiplyScalar(depth));
    const up = p1.clone().sub(p0), len = up.length(); up.normalize();
    const mid = p0.clone().add(p1).multiplyScalar(0.5), toCam = camera.position.clone().sub(mid).normalize();
    const right = new THREE.Vector3().crossVectors(up, toCam).normalize(), zz = new THREE.Vector3().crossVectors(right, up);
    beam.matrixAutoUpdate = false; beam.matrix.makeBasis(right, up, zz).scale(new THREE.Vector3(1, len / 0.12, 1)).setPosition(mid);
    beam.matrixWorldNeedsUpdate = true;   // matrixAutoUpdate=false 면 이 표시가 없을 때 월드 행렬이 갱신되지 않는다
    beamMat.uniforms.head.value = eout(clamp(tEnd / 0.7)) * 1.05;
    beamMat.uniforms.amp.value = clamp(tEnd / 0.2) * (1 - clamp((tEnd - 0.75) / 0.5));
  }
  // 먼지
  const a = dust.p.geometry.attributes.position;
  for (let i = 0; i < dust.vel.length; i++) a.setXYZ(i, dust.base[i * 3] + dust.vel[i][0] * t, dust.base[i * 3 + 1] + dust.vel[i][1] * t, dust.base[i * 3 + 2]);
  a.needsUpdate = true;
  grain.uniforms.seed.value = Math.floor(t * 30) * 1.37;
  grain.uniforms.fade.value = clamp(t / 0.6) * (1 - clamp((t - 33.3) / 0.7) * 0.0);
  const D = window.DBG || {};
  coverMesh.visible = !D.noGlass; bloom.enabled = !D.noBloom; scrMat.color.setScalar(D.dim || 1.03);
  composer.render();
};

// ─── 초기화(이미지·폰트 준비 후 READY) ────────────────────────────────────
const img = new Image(); img.src = ICON_URL;
img.onload = async () => {
  await document.fonts.ready;
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const shT = shadowTex(), sparkM = () => new THREE.SpriteMaterial({ map: radialTex(true), color: new THREE.Color(1.6, 1.6, 1.75), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 });
  const PW_W = 0.080, ys = [0.072, 0.036, 0.000, -0.036, -0.072];
  PUSHES.forEach((p, i) => {
    const { c, aspect } = makePushCanvas(p, img);
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex(c) }, op: { value: 0 }, sweep: { value: -1 } }, transparent: true, depthWrite: false, vertexShader: popVS, fragmentShader: popFS });
    const h = PW_W * aspect;
    const group = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PW_W, h), mat); group.add(m);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(PW_W * 1.36, h * 1.9), new THREE.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false, opacity: 0, color: 0x000000 }));
    sh.position.set(0.002, -0.004, -0.004); group.add(sh); group.renderOrder = 10 + i; m.renderOrder = 11 + i;
    const spark = new THREE.Sprite(sparkM()); const side = i % 2 === 0 ? -1 : 1;
    spark.position.set(side * PW_W * 0.47, h * 0.42, 0.001); group.add(spark);
    const to = new THREE.Vector3(side * 0.017, ys[i], 0.020 + i * 0.003), from = new THREE.Vector3(side * 0.004, ys[i] * 0.7, frontZ + 0.001);
    group.rotation.y = -side * 0.10;
    phone.add(group); group.visible = false;
    popups.push({ group, mat, sh, spark, from, to });
  });
  window.render(0);
  window.ENDINFO = END.info();
  window.READY = true;
};
