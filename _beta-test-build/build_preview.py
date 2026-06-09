# -*- coding: utf-8 -*-
# 인플루언서/마케팅용 상세 소개 페이지 — test/ 디자인을 베이스로 마케팅 톤 재구성
import base64, os

BASE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE, "img")
OUT = os.path.join(BASE, "..", "preview", "index.html")

imgs = {
    "__IMG_SETTINGS__": "settings.jpg",
    "__IMG_SAFETY__": "safety_home.jpg",
    "__IMG_DASH__": "dashboard.jpg",
    "__IMG_ADD__": "add_subject.jpg",
    "__IMG_NOTI__": "notifications.jpg",
    "__IMG_NOTISET__": "notifications_settings.jpg",
    "__IMG_CONN__": "connection_management.jpg",
}

HTML = r"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>안부(Anbu) — 매일 닿는 안부 · Averic Lab</title>
<meta name="theme-color" content="#0a0e2a">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ff8a95'/%3E%3Cstop offset='1' stop-color='%23e54b5e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23g)' d='M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z'/%3E%3C/svg%3E">
<style>
  :root{
    --bg:#0a0e2a; --card:rgba(255,255,255,.045); --card-bd:rgba(255,255,255,.10);
    --tx:#e9ecf6; --tx2:#a8b0cc; --tx3:#7b84a6;
    --pink:#ff8a95; --pink2:#e54b5e; --teal:#36c9b4; --indigo:#8b9cf0; --amber:#ffcf6b;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:radial-gradient(1200px 700px at 50% -10%,#1a2150 0%,var(--bg) 55%) no-repeat,var(--bg);
    color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Helvetica Neue",Arial,sans-serif;
    -webkit-font-smoothing:antialiased;line-height:1.65;font-size:16px}
  .wrap{max-width:780px;margin:0 auto;padding:0 20px 80px}

  .topbar{position:sticky;top:0;z-index:20;backdrop-filter:blur(12px);
    background:linear-gradient(180deg,rgba(10,14,42,.92),rgba(10,14,42,.72));border-bottom:1px solid var(--card-bd)}
  .topbar .inner{max-width:780px;margin:0 auto;padding:13px 20px;display:flex;align-items:center;gap:11px}
  .mark{width:24px;height:24px;flex:0 0 auto}
  .brand{font-weight:800}
  .brand small{font-weight:600;color:var(--tx3);margin-left:6px;font-size:12px}
  .pill{margin-left:auto;font-size:11.5px;font-weight:700;color:#0a0e2a;background:linear-gradient(180deg,var(--pink),var(--pink2));padding:5px 11px;border-radius:999px}

  .hero{padding:54px 0 10px;text-align:center}
  .hero h1{font-size:31px;line-height:1.28;margin:0 0 12px;font-weight:850;letter-spacing:-.4px}
  .hero h1 .hl{background:linear-gradient(180deg,var(--pink),var(--pink2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .hero .intro{color:var(--tx);font-size:17px;margin:0 auto 10px;max-width:580px}
  .hero .intro b{color:var(--pink)}
  .hero .lead{color:var(--tx2);margin:0 auto;max-width:540px;font-size:15px}

  /* 핵심 가치 */
  .keys{margin:30px 0 6px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
  .key{background:var(--card);border:1px solid var(--card-bd);border-radius:16px;padding:17px 16px}
  .key .e{font-size:22px}
  .key .t{margin-top:7px;font-weight:800;font-size:15px}
  .key .d{margin-top:4px;font-size:12.5px;color:var(--tx2);line-height:1.55}

  /* 두 역할 */
  .roles{margin:18px 0 6px;display:grid;grid-template-columns:1fr 1fr;gap:13px}
  .role{border-radius:16px;padding:17px 18px;border:1px solid var(--card-bd)}
  .role.subj{background:linear-gradient(180deg,rgba(54,201,180,.10),rgba(255,255,255,.02));border-color:rgba(54,201,180,.34)}
  .role.guard{background:linear-gradient(180deg,rgba(139,156,240,.10),rgba(255,255,255,.02));border-color:rgba(139,156,240,.34)}
  .role .rt{font-weight:800;font-size:15.5px}
  .role.subj .rt{color:var(--teal)}
  .role.guard .rt{color:var(--indigo)}
  .role .rd{margin-top:5px;font-size:13.5px;color:var(--tx2);line-height:1.55}

  .sec-title{margin:46px 0 2px;font-size:13px;font-weight:800;letter-spacing:.6px;color:var(--tx3);text-transform:uppercase;
    display:flex;align-items:center;gap:9px}
  .sec-title:before{content:"";width:18px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--pink),var(--pink2))}

  /* 기능 카드 */
  .feat{margin-top:16px;background:var(--card);border:1px solid var(--card-bd);border-radius:18px;padding:20px;display:flex;gap:16px;align-items:flex-start}
  .feat .ic{width:46px;height:46px;flex:0 0 auto;display:grid;place-items:center;border-radius:13px;font-size:23px;
    background:linear-gradient(180deg,rgba(255,138,149,.16),rgba(229,75,94,.08));border:1px solid rgba(255,138,149,.28)}
  .feat .c{flex:1;min-width:0}
  .feat h2{font-size:18.5px;margin:4px 0 8px;font-weight:800;letter-spacing:-.2px}
  .feat p{margin:0;color:var(--tx2);font-size:14.5px;line-height:1.62}
  .feat p b,.feat b,.feat strong{color:#fff;font-weight:750}

  .shots{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px}
  figure.shot{margin:0;width:158px}
  figure.shot img{width:100%;display:block;border-radius:14px;border:1px solid var(--card-bd);box-shadow:0 10px 24px rgba(0,0,0,.4);cursor:zoom-in;transition:transform .12s}
  figure.shot img:hover{transform:translateY(-2px)}
  figure.shot figcaption{margin-top:7px;text-align:center;font-size:11.5px;color:var(--tx2)}

  /* 이미지 라이트박스 */
  .lightbox{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;
    background:rgba(0,0,0,.9);padding:22px;cursor:zoom-out;backdrop-filter:blur(4px)}
  .lightbox.on{display:flex}
  .lightbox img{max-width:100%;max-height:92vh;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.7)}
  .lightbox .x{position:fixed;top:16px;right:20px;font-size:30px;color:#fff;opacity:.8;font-weight:300;line-height:1}
  figure.shot figcaption b{color:var(--pink)}

  .grades{margin-top:13px;display:flex;flex-wrap:wrap;gap:7px}
  .grade{font-size:12px;font-weight:800;padding:4px 11px;border-radius:999px;border:1px solid}
  .g-ok{color:#7ee0a8;border-color:rgba(93,217,154,.45);background:rgba(93,217,154,.08)}
  .g-cau{color:#ffd76b;border-color:rgba(255,207,107,.45);background:rgba(255,207,107,.08)}
  .g-warn{color:#ffb27a;border-color:rgba(255,159,67,.45);background:rgba(255,159,67,.08)}
  .g-urg{color:#ff9b9b;border-color:rgba(255,122,122,.5);background:rgba(255,122,122,.1)}
  .g-info{color:#9db0ff;border-color:rgba(139,156,240,.45);background:rgba(139,156,240,.08)}

  /* 개인정보 */
  .privacy{margin-top:46px;border-radius:18px;padding:22px 24px;
    background:linear-gradient(180deg,rgba(54,201,180,.09),rgba(255,255,255,.02));border:1px solid rgba(54,201,180,.32)}
  .privacy h3{margin:0 0 9px;font-size:18px}
  .privacy p{margin:0;color:var(--tx2);font-size:14.5px;line-height:1.65}
  .privacy b{color:#fff}

  footer{margin-top:42px;text-align:center;color:var(--tx3);font-size:12.5px;line-height:1.8}
  footer .fb{color:var(--tx2);font-weight:700}

  @media(max-width:560px){
    .hero h1{font-size:25px}
    .feat{padding:17px 16px;gap:13px}
    .feat .ic{width:40px;height:40px;font-size:20px}
    .roles{grid-template-columns:1fr}
    figure.shot{width:46%}
  }
</style>
</head>
<body>

<div class="topbar"><div class="inner">
  <svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a95"/><stop offset="1" stop-color="#e54b5e"/></linearGradient></defs><path fill="url(#m)" d="M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z"/></svg>
  <span class="brand">안부 <small>Anbu · Averic Lab</small></span>
  <span class="pill">앱 소개</span>
</div></div>

<div class="wrap">

  <div class="hero">
    <h1>말하지 않아도, <span class="hl">매일 닿는 안부</span></h1>
    <p class="intro"><b>안부앱</b>은 혼자 사는 분의 안부를 <b>매일 자동으로</b> 가족 및 지인들에게 전달하는 앱입니다.</p>
    <p class="lead">독거노인, 멀리 떨어져 혼자 사는 자식·친척·지인 등의 건강과 안녕을 궁금해하는 사람들과 공유합니다.</p>
  </div>

  <!-- 핵심 가치 -->
  <div class="keys">
    <div class="key"><div class="e">🤚</div><div class="t">제로 인터랙션</div><div class="d">별도 조작 없이 매일 자동으로 안부가 전송됩니다</div></div>
    <div class="key"><div class="e">🔋</div><div class="t">최소 배터리</div><div class="d">상시 실행 없이 하루 한 번만 잠깐 동작</div></div>
    <div class="key"><div class="e">🔒</div><div class="t">개인정보 미수집</div><div class="d">이름·전화번호 없이 코드로만 연결</div></div>
    <div class="key"><div class="e">🎯</div><div class="t">거짓 경고 최소화</div><div class="d">걸음수·활동 기반의 똑똑한 판정</div></div>
  </div>

  <!-- 두 역할 -->
  <div class="sec-title">한 앱, 두 가지 역할</div>
  <div class="roles">
    <div class="role subj"><div class="rt">💚 보호 대상자</div><div class="rd">안부를 <b>보내는</b> 사람. 평소처럼 폰을 쓰기만 하면 매일 자동으로 안부 신호가 전송됩니다.</div></div>
    <div class="role guard"><div class="rt">💙 보호자</div><div class="rd">안부를 <b>지켜보는</b> 사람. 연결된 대상자의 상태를 실시간으로 확인하고, 이상이 생기면 알림을 받습니다.</div></div>
  </div>

  <!-- 기능 -->
  <div class="sec-title">주요 기능</div>

  <div class="feat">
    <div class="ic">💗</div>
    <div class="c">
      <h2>매일 자동 안부 신호</h2>
      <p>사용자가 평소처럼 휴대폰을 쓰기만 하면, 매일 정해진 시각에 <b>“잘 지내요”</b> 신호가 자동으로 전송됩니다. 걸음수와 기기 사용 흔적으로 <b>활동까지 함께 확인</b>하고, 시각은 생활 패턴에 맞춰 바꿀 수 있습니다.</p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SAFETY__" alt="내 안전 코드 화면"><figcaption><b>안부 보내기</b> — 코드·보고·시각 설정</figcaption></figure>
      </div>
    </div>
  </div>

  <div class="feat">
    <div class="ic">🔗</div>
    <div class="c">
      <h2>안심 코드로 간편 연결</h2>
      <p>이름도 전화번호도 필요 없습니다. <b>7자리 안심 코드</b>만 공유하면 보호자와 대상자가 연결됩니다. 별칭(예: ‘아버지’)은 보호자 폰에만 저장돼 <b>개인정보가 서버에 남지 않습니다.</b></p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_ADD__" alt="연결 화면"><figcaption><b>코드 연결</b> — 코드 + 별칭 입력</figcaption></figure>
      </div>
    </div>
  </div>

  <div class="feat">
    <div class="ic">🏠</div>
    <div class="c">
      <h2>한눈에 보는 보호자 홈</h2>
      <p>연결된 대상자들의 상태를 <b>카드 한 장</b>으로 확인합니다. 마지막 안부 시각·활동량·배터리까지, <b>정상부터 긴급까지 색으로 구분</b>해 보여줍니다.</p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_DASH__" alt="보호자 홈 화면"><figcaption><b>보호자 홈</b> — 대상자 상태 카드</figcaption></figure>
      </div>
    </div>
  </div>

  <div class="feat">
    <div class="ic">🔔</div>
    <div class="c">
      <h2>단계별 이상 감지 알림</h2>
      <p>안부가 끊기거나 활동이 감지되지 않으면 <b>주의 → 경고 → 긴급</b>으로 단계가 올라가며 보호자에게 알림이 갑니다. 배터리 부족 같은 정보도 미리 안내해, <b>괜한 걱정과 거짓 경고를 줄입니다.</b></p>
      <div class="grades">
        <span class="grade g-ok">정상</span><span class="grade g-info">정보</span><span class="grade g-cau">주의</span><span class="grade g-warn">경고</span><span class="grade g-urg">긴급</span>
      </div>
      <div class="shots">
        <figure class="shot"><img src="__IMG_NOTI__" alt="알림 목록"><figcaption><b>알림</b> — 등급별 안내</figcaption></figure>
        <figure class="shot"><img src="__IMG_NOTISET__" alt="알림 설정"><figcaption><b>알림 설정</b> — 등급·방해금지</figcaption></figure>
      </div>
    </div>
  </div>

  <div class="feat">
    <div class="ic">🚨</div>
    <div class="c">
      <h2>긴급 도움 요청</h2>
      <p>대상자가 직접 <b>‘도움이 필요해요’</b> 버튼을 누르면, 연결된 <b>보호자 전원</b>에게 즉시 긴급 알림과 <b>현재 위치</b>가 전달됩니다. 보호자는 알림에서 위치를 지도로 바로 확인할 수 있습니다.</p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SAFETY__" alt="긴급 도움 요청"><figcaption><b>도움이 필요해요</b> 버튼</figcaption></figure>
      </div>
    </div>
  </div>

  <div class="feat">
    <div class="ic">👥</div>
    <div class="c">
      <h2>간편한 연결 관리</h2>
      <p>여러 대상자를 <b>한 곳에서 관리</b>합니다. 별칭으로 구분하고, 필요하면 연결을 해제할 수 있습니다.</p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_CONN__" alt="연결 관리"><figcaption><b>연결 관리</b> — 대상자 목록</figcaption></figure>
      </div>
    </div>
  </div>

  <!-- 개인정보 -->
  <div class="privacy">
    <h3>🔒 개인정보는 모으지 않습니다</h3>
    <p>서버에 <b>이름·전화번호를 일절 저장하지 않습니다.</b> 보호자-대상자 연결은 오직 <b>고유 코드</b>로만 이뤄집니다. 위치는 <b>긴급 도움 요청을 누른 경우에만</b> 동의 하에 한 번 수집해 보호자에게 전달하고, 그 외에는 수집하지 않습니다.</p>
  </div>

  <footer>
    <span class="fb">안부(Anbu)</span> · Averic Lab<br>
    멀리 있어도, 바빠도 — 매일 안부를 주고받는 따뜻한 연결.
  </footer>

</div>

<div class="lightbox" id="lb"><span class="x">&times;</span><img id="lbimg" src="" alt="확대 이미지"></div>
<script>
(function(){
  var lb=document.getElementById('lb'), im=document.getElementById('lbimg');
  document.querySelectorAll('figure.shot img').forEach(function(el){
    el.addEventListener('click',function(){ im.src=el.src; lb.classList.add('on'); document.body.style.overflow='hidden'; });
  });
  function close(){ lb.classList.remove('on'); document.body.style.overflow=''; }
  lb.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
})();
</script>
</body>
</html>
"""

for token, fname in imgs.items():
    with open(os.path.join(IMG_DIR, fname), "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    HTML = HTML.replace(token, "data:image/jpeg;base64," + b64)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(HTML)

print("written:", OUT)
print("size:", round(os.path.getsize(OUT)/1024, 1), "KB")
