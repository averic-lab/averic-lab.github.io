# -*- coding: utf-8 -*-
import base64, os

BASE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE, "img")
OUT = os.path.join(BASE, "..", "preview", "index.html")

imgs = {
    "__IMG_SETTINGS__": "settings.jpg",
    "__IMG_SAFETY__": "safety_home.jpg",
    "__IMG_DASH__": "dashboard.jpg",
    "__IMG_ADD__": "add_subject.jpg",
    "__IMG_CONN__": "connection_management.jpg",
    "__IMG_NOTI__": "notifications.jpg",
    "__IMG_NOTISET__": "notifications_settings.jpg",
}

HTML = r"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>안부(Anbu) 비공개 테스트 안내 · Averic Lab</title>
<meta name="theme-color" content="#0a0e2a">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ff8a95'/%3E%3Cstop offset='1' stop-color='%23e54b5e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23g)' d='M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z'/%3E%3C/svg%3E">
<style>
  :root{
    --bg:#0a0e2a; --bg2:#11163a; --card:rgba(255,255,255,.045); --card-bd:rgba(255,255,255,.10);
    --tx:#e9ecf6; --tx2:#a8b0cc; --tx3:#7b84a6;
    --pink:#ff8a95; --pink2:#e54b5e; --teal:#36c9b4; --indigo:#8b9cf0; --amber:#ffcf6b; --red:#ff7a7a; --green:#5dd99a;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:radial-gradient(1200px 700px at 50% -10%,#1a2150 0%,var(--bg) 55%) no-repeat,var(--bg);
    color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Helvetica Neue",Arial,sans-serif;
    -webkit-font-smoothing:antialiased;line-height:1.7;font-size:16px}
  a{color:var(--indigo);text-decoration:none}
  .wrap{max-width:860px;margin:0 auto;padding:0 20px 90px}

  /* top bar */
  .topbar{position:sticky;top:0;z-index:20;backdrop-filter:blur(12px);
    background:linear-gradient(180deg,rgba(10,14,42,.92),rgba(10,14,42,.72));
    border-bottom:1px solid var(--card-bd)}
  .topbar .inner{max-width:860px;margin:0 auto;padding:13px 20px;display:flex;align-items:center;gap:11px}
  .mark{width:24px;height:24px;flex:0 0 auto}
  .brand{font-weight:800;letter-spacing:.2px}
  .brand small{font-weight:600;color:var(--tx3);margin-left:6px;font-size:12px}
  .pill{margin-left:auto;font-size:11.5px;font-weight:700;color:#0a0e2a;
    background:linear-gradient(180deg,var(--pink),var(--pink2));padding:5px 11px;border-radius:999px}

  /* hero */
  .hero{padding:54px 0 18px;text-align:center}
  .hero h1{font-size:30px;line-height:1.28;margin:0 0 12px;font-weight:850;letter-spacing:-.3px}
  .hero h1 .hl{background:linear-gradient(180deg,var(--pink),var(--pink2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .hero p{color:var(--tx2);margin:0 auto;max-width:580px}
  .hero .intro{color:var(--tx);font-size:17px;margin-bottom:14px}
  .hero .intro b{color:var(--pink)}
  .platform{display:inline-flex;align-items:center;gap:7px;margin-top:14px;font-size:13px;font-weight:700;color:var(--teal)}

  /* key principles */
  .keys{margin:30px 0 8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
  .key{background:var(--card);border:1px solid var(--card-bd);border-radius:16px;padding:16px 15px}
  .key .n{font-size:12px;font-weight:800;color:var(--pink);letter-spacing:.5px}
  .key .t{margin-top:5px;font-weight:750;font-size:15px}
  .key .d{margin-top:3px;font-size:12.5px;color:var(--tx2);line-height:1.55}

  /* toc */
  .toc-title{margin:30px 0 0;font-size:15px;font-weight:800;color:var(--tx2);letter-spacing:.3px;
    display:flex;align-items:center;gap:9px}
  .toc-title:before{content:"";width:18px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--pink),var(--pink2))}
  .toc{margin:12px 0 8px;background:var(--card);border:1px solid var(--card-bd);border-radius:16px;padding:8px 8px}
  .toc a{display:flex;gap:11px;align-items:baseline;color:var(--tx);padding:9px 13px;border-radius:10px}
  .toc a:hover{background:rgba(255,255,255,.05)}
  .toc a .num{color:var(--pink);font-weight:800;font-size:13px;width:22px;flex:0 0 auto}
  .toc a .lb{font-weight:650}
  .toc a .lb small{color:var(--tx3);font-weight:500;margin-left:7px;font-size:12.5px}

  /* sections */
  section{margin-top:42px;scroll-margin-top:70px}
  .sec-h{display:flex;align-items:center;gap:14px;margin-bottom:6px}
  .sec-h .idx{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;
    font-weight:850;font-size:17px;color:#0a0e2a;background:linear-gradient(180deg,var(--pink),var(--pink2))}
  .sec-h h2{font-size:21px;margin:0;font-weight:800;letter-spacing:-.2px}
  .sec-sub{color:var(--tx2);margin:2px 0 0 52px;font-size:14px}
  .sec-h .hot{margin-left:auto;font-size:11.5px;font-weight:800;color:#0a0e2a;white-space:nowrap;
    background:linear-gradient(180deg,var(--amber),#ff9f43);padding:6px 12px;border-radius:999px;
    box-shadow:0 4px 14px rgba(255,159,67,.35)}
  .key-sec .idx{background:linear-gradient(180deg,var(--amber),#ff9f43)}
  .body.highlight{border-color:rgba(255,207,107,.55);
    background:linear-gradient(180deg,rgba(255,207,107,.07),rgba(255,255,255,.03));
    box-shadow:0 0 0 1px rgba(255,207,107,.28),0 16px 44px rgba(255,159,67,.14)}

  .body{margin:16px 0 0;background:var(--card);border:1px solid var(--card-bd);border-radius:18px;padding:20px 20px}
  .body p{margin:0 0 12px}
  .body p:last-child{margin-bottom:0}
  ol.steps{counter-reset:s;list-style:none;margin:4px 0;padding:0}
  ol.steps>li{position:relative;padding:3px 0 14px 40px;margin:0}
  ol.steps>li:before{counter-increment:s;content:counter(s);position:absolute;left:0;top:1px;
    width:26px;height:26px;display:grid;place-items:center;border-radius:8px;font-size:13px;font-weight:800;
    color:var(--indigo);background:rgba(139,156,240,.14);border:1px solid rgba(139,156,240,.3)}
  ul.ck{list-style:none;margin:6px 0;padding:0}
  ul.ck li{position:relative;padding:5px 0 5px 28px}
  ul.ck li:before{content:"";position:absolute;left:3px;top:12px;width:8px;height:8px;border-radius:50%;
    background:linear-gradient(180deg,var(--pink),var(--pink2))}
  b,strong{color:#fff;font-weight:750}
  .tag{display:inline-block;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:6px;vertical-align:middle;margin:0 2px}
  .tag.btn{color:#fff;background:#1f7a6b;border:1px solid #2aa18c}
  .tag.btnr{color:#fff;background:#b13b46;border:1px solid #e0606b}
  .tag.menu{color:var(--indigo);background:rgba(139,156,240,.14);border:1px solid rgba(139,156,240,.3)}

  /* callouts */
  .note{margin:14px 0 0;border-radius:14px;padding:14px 16px 14px 46px;position:relative;font-size:14.5px;line-height:1.62}
  .note:before{position:absolute;left:15px;top:13px;font-size:18px}
  .note.must{background:rgba(255,122,122,.08);border:1px solid rgba(255,122,122,.32)}
  .note.must:before{content:"⚠️"}
  .note.tip{background:rgba(54,201,180,.08);border:1px solid rgba(54,201,180,.3)}
  .note.tip:before{content:"💡"}
  .note.info{background:rgba(139,156,240,.08);border:1px solid rgba(139,156,240,.3)}
  .note.info:before{content:"ℹ️"}
  .note .h{font-weight:800;color:#fff;display:block;margin-bottom:3px}

  /* screenshots */
  .shots{display:flex;flex-wrap:wrap;gap:18px;margin:18px 0 2px;justify-content:center}
  figure.shot{margin:0;width:228px;max-width:46%}
  figure.shot img{width:100%;display:block;border-radius:18px;border:1px solid var(--card-bd);
    box-shadow:0 12px 30px rgba(0,0,0,.4)}
  figure.shot figcaption{margin-top:9px;text-align:center;font-size:12.5px;color:var(--tx2);line-height:1.5}
  figure.shot figcaption b{color:var(--pink)}

  /* 알림 구분 박스 */
  .dist{margin:16px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
  .dist-box{border-radius:16px;padding:16px 17px;border:1px solid var(--card-bd);background:rgba(255,255,255,.03)}
  .dist-box.mine{border-color:rgba(54,201,180,.5);box-shadow:0 0 0 1px rgba(54,201,180,.22);
    background:linear-gradient(180deg,rgba(54,201,180,.09),rgba(255,255,255,.02))}
  .dist-tag{font-weight:800;font-size:13.5px;margin-bottom:11px;line-height:1.4}
  .dist-box.mine .dist-tag{color:var(--teal)}
  .dist-box.others .dist-tag{color:var(--indigo)}
  .msg{background:rgba(0,0,0,.30);border:1px solid var(--card-bd);border-radius:12px;padding:12px 14px;
    font-weight:800;color:#fff;font-size:15px;line-height:1.42}
  .msg span{display:block;font-weight:500;color:var(--tx2);font-size:13px;margin-top:3px}
  .dist-d{margin:10px 0 0;font-size:13.5px;color:var(--tx2);line-height:1.62}
  .dist-d:first-of-type{margin-top:11px}

  /* pairing example */
  .pair{margin-top:14px;background:rgba(255,255,255,.03);border:1px dashed var(--card-bd);border-radius:14px;padding:14px 16px;font-size:14px;color:var(--tx2)}
  .pair code{color:var(--teal);font-weight:700;background:rgba(54,201,180,.1);padding:1px 6px;border-radius:5px;font-size:13px}

  /* footer / report */
  .report{margin-top:46px;background:linear-gradient(180deg,rgba(255,138,149,.1),rgba(229,75,94,.06));
    border:1px solid rgba(255,138,149,.3);border-radius:18px;padding:24px 22px;text-align:center}
  .report h3{margin:0 0 8px;font-size:18px}
  .report .mail{display:inline-block;margin-top:6px;font-size:18px;font-weight:800;color:#fff;
    background:rgba(255,255,255,.06);border:1px solid var(--card-bd);padding:11px 20px;border-radius:12px;letter-spacing:.3px}
  .report p{color:var(--tx2);font-size:14px;margin:10px 0 0}
  footer{margin-top:40px;text-align:center;color:var(--tx3);font-size:12.5px;line-height:1.7}

  @media(max-width:560px){
    .hero h1{font-size:25px}
    .sec-h h2{font-size:19px}
    figure.shot{width:100%;max-width:300px}
    .dist{grid-template-columns:1fr}
    .body{padding:17px 16px}
  }
</style>
</head>
<body>

<div class="topbar"><div class="inner">
  <svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a95"/><stop offset="1" stop-color="#e54b5e"/></linearGradient></defs><path fill="url(#m)" d="M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z"/></svg>
  <span class="brand">안부 <small>Anbu · Averic Lab</small></span>
  <span class="pill">비공개 테스트</span>
</div></div>

<div class="wrap">

  <div class="hero">
    <h1>안부(Anbu) <span class="hl">비공개 테스트</span> 안내</h1>
    <p class="intro"><b>안부</b>는 멀리 있는 가족이나 혼자 사는 분의 안녕을, <b>별도 조작 없이 매일 자동으로</b> 확인하는 앱입니다. 평소처럼 휴대폰을 쓰기만 하면 ‘안부 신호’가 자동으로 전송되고, <b>평소 움직임이 없거나 폰 사용 흔적이 없으면</b> 연결된 보호자에게 알림이 갑니다.</p>
    <p>이번 테스트는 한 기기에서 <b>다른 사람의 안부를 지켜보는 동시에, 내 안부도 함께 보내는</b> 방식으로 진행합니다. 아래 순서대로 설정하고, 매일 정해진 루틴만 반복해 주세요.</p>
    <div class="platform">🤖 Android 전용 · Google Play 비공개 테스트</div>
  </div>

  <!-- 핵심 5원칙 -->
  <div class="keys">
    <div class="key"><div class="n">원칙 1</div><div class="t">권한 전부 허용</div><div class="d">설치·활성화·긴급 단계마다 뜨는 팝업을 모두 허용</div></div>
    <div class="key"><div class="n">원칙 2</div><div class="t">안부 보호 켜기</div><div class="d">설치 후 ‘나도 안부 보호 받기’를 직접 활성화</div></div>
    <div class="key"><div class="n">원칙 3</div><div class="t">서로의 코드만</div><div class="d">본인 코드는 넣지 말고 다른 테스터끼리 연결</div></div>
    <div class="key"><div class="n">원칙 4</div><div class="t">안부시각 통일</div><div class="d">전 기기 같은 시각(오후 12~6시)으로 설정</div></div>
    <div class="key"><div class="n">원칙 5</div><div class="t">하루 1회 + 종료</div><div class="d">하루 한 번만 열고, 끝나면 스와이프로 완전 종료</div></div>
  </div>

  <!-- 목차 -->
  <h2 class="toc-title">테스트 목차</h2>
  <nav class="toc">
    <a href="#s0"><span class="num">0</span><span class="lb">테스트 단말 요건<small>Android 10 이상</small></span></a>
    <a href="#s1"><span class="num">1</span><span class="lb">설치 &amp; 권한 허용<small>팝업은 단계별로 뜸</small></span></a>
    <a href="#s2"><span class="num">2</span><span class="lb">안부 보호 활성화<small>‘나도 안부 보호 받기’</small></span></a>
    <a href="#s3"><span class="num">3</span><span class="lb">보호 대상자 연결<small>서로의 코드 입력</small></span></a>
    <a href="#s4"><span class="num">4</span><span class="lb">안부시각 설정<small>전원 동일 시각</small></span></a>
    <a href="#s5"><span class="num">5</span><span class="lb">안부 전송 타이밍 ★<small>이 테스트의 핵심</small></span></a>
    <a href="#s6"><span class="num">6</span><span class="lb">매일 반복 루틴<small>하루 1회 · 스와이프 종료</small></span></a>
    <a href="#s7"><span class="num">7</span><span class="lb">경고 &amp; ‘안전확인 완료’<small>홈 화면 버튼</small></span></a>
    <a href="#s8"><span class="num">8</span><span class="lb">긴급 도움 요청<small>‘도움이 필요해요’</small></span></a>
  </nav>

  <!-- 0 -->
  <section id="s0">
    <div class="sec-h"><div class="idx">0</div><h2>테스트 단말 요건</h2></div>
    <p class="sec-sub">시작 전 단말을 확인해 주세요.</p>
    <div class="body">
      <ul class="ck">
        <li><b>Android 10(API 29) 이상</b> 기기에서만 설치됩니다. 그 이하 버전은 설치가 진행되지 않습니다.</li>
      </ul>
    </div>
  </section>

  <!-- 1 -->
  <section id="s1">
    <div class="sec-h"><div class="idx">1</div><h2>설치 &amp; 권한 허용</h2></div>
    <p class="sec-sub">권한 팝업은 한 번에 다 뜨지 않습니다 — 뜰 때마다 모두 ‘허용’.</p>
    <div class="body">
      <p>안부의 권한 요청은 <b>상황에 따라 단계별</b>로 나타납니다. 어느 단계든 팝업이 뜨면 <b>모두 ‘허용’</b>을 눌러 주세요.</p>
      <div class="note must"><span class="h">하나라도 거부하면 테스트가 정상 진행되지 않습니다</span>특히 알림·걸음수 권한이 거부되면 안부 신호와 경고 알림이 동작하지 않습니다. 실수로 거부했다면 앱을 지우고 다시 설치해 처음부터 허용해 주세요.</div>
    </div>
  </section>

  <!-- 2 -->
  <section id="s2">
    <div class="sec-h"><div class="idx">2</div><h2>안부 보호 활성화</h2></div>
    <p class="sec-sub">보호자로 설치된 앱에서 ‘안부 보호’를 직접 켭니다.</p>
    <div class="body">
      <p>설치 직후에는 <b>다른 사람의 안부를 지켜보기만 하는</b> 상태입니다. 아래 순서로 <b>내 안부도 함께 보내는 기능</b>을 켜 주세요.</p>
      <ol class="steps">
        <li>하단 탭에서 <span class="tag menu">설정</span> 으로 이동합니다.</li>
        <li><span class="tag menu">나도 안부 보호 받기</span> 항목을 누릅니다.</li>
        <li>안내 다이얼로그에서 <span class="tag btn">이해했습니다, 활성화</span> 를 누릅니다.</li>
        <li><b>걸음수(신체 활동) 권한</b> 팝업이 뜨면 ‘허용’.</li>
        <li>활성화가 끝나면 자동으로 <b>내 안전 코드</b> 화면으로 이동합니다.</li>
      </ol>
      <div class="note info"><span class="h">설정 화면의 버튼은 활성화 전/후가 다릅니다</span>
        · <b>활성화 전</b> (설치 직후, 여러분이 처음 보게 될 모습) — 이 자리에 <span class="tag menu">나도 안부 보호 받기</span> 버튼이 있습니다. 이걸 눌러 시작하세요.<br>
        · <b>활성화 후</b> — 같은 자리가 <span class="tag menu">내 안전 코드 확인</span> 으로 바뀝니다. <b>아래 스크린샷이 바로 이 ‘활성화 후’ 모습</b>입니다.</div>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SETTINGS__" alt="설정 화면 (활성화 후)"><figcaption><b>설정 — 활성화 후 모습</b><br>처음엔 이 자리에 <b>나도 안부 보호 받기</b>가 보이고, 활성화하면 <b>내 안전 코드 확인</b>으로 바뀝니다</figcaption></figure>
        <figure class="shot"><img src="__IMG_SAFETY__" alt="내 안전 코드 화면"><figcaption><b>내 안전 코드</b> — 활성화 직후 이동하는 화면. 내 코드·안부시각·보고 버튼이 모두 여기 있음</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- 3 -->
  <section id="s3">
    <div class="sec-h"><div class="idx">3</div><h2>보호 대상자 연결</h2></div>
    <p class="sec-sub">본인 코드는 넣지 말고, 다른 테스터의 코드만 연결합니다.</p>
    <div class="body">
      <p>각자 <b>내 안전 코드</b> 화면에 표시된 7자리 코드(예: <code style="color:var(--teal)">H0Y-L13J</code>)를 서로 공유하고, 아래처럼 <b>상대방 코드</b>를 등록합니다.</p>
      <ol class="steps">
        <li>하단 탭 <span class="tag menu">연결</span> → <b>새로운 보호 대상자 추가</b>.</li>
        <li><b>다른 테스터</b>의 7자리 고유 코드를 입력합니다. (<b>본인 코드 금지</b> — 앱이 자동 차단합니다.)</li>
        <li>별칭(예: ‘1번 테스터’)을 입력하고 <span class="tag btn">연결하기</span>.</li>
      </ol>
      <div class="pair">
        <b style="color:var(--tx)">연결 규칙 (20명 기준)</b><br>
        · 각자 <b>최소 1명 이상</b>을 서로 상호 연결해 주세요.<br>
        · 연결 후 홈 화면으로 이동하면, 연결이 많을수록 홈 화면에서 여러 카드를 동시에 확인할 수 있습니다.
      </div>
      <div class="shots">
        <figure class="shot"><img src="__IMG_ADD__" alt="보호 대상자 연결 화면"><figcaption><b>연결 화면</b> — 상대 코드 + 별칭 입력 후 ‘연결하기’</figcaption></figure>
        <figure class="shot"><img src="__IMG_DASH__" alt="홈 화면"><figcaption><b>홈 화면</b> — 연결하면 대상자 카드가 여기에 나타납니다</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- 4 -->
  <section id="s4">
    <div class="sec-h"><div class="idx">4</div><h2>안부시각 설정</h2></div>
    <p class="sec-sub">모든 테스트 기기를 같은 시각으로 맞춥니다.</p>
    <div class="body">
      <p>기본 안부시각은 <b>오후 6:00</b>입니다. 테스트 시작 시점이 너무 늦다면 <b>오후 12:00 ~ 오후 6:00 사이</b>로 바꾸되, <b>참여자 전원이 동일한 시각</b>으로 설정해 주세요.</p>
      <ol class="steps">
        <li><b>내 안전 코드</b> 화면에서 <span class="tag menu">안부 푸시 알림 시각 변경</span> 을 누릅니다.</li>
        <li>전원이 합의한 동일 시각으로 변경합니다.</li>
      </ol>
      <div class="note tip"><span class="h">왜 낮~저녁 시간인가요?</span>안부 신호에는 그날의 걸음수가 함께 전송됩니다. 하루 활동이 어느 정도 쌓인 시간대여야 ‘정상’ 판정이 안정적입니다. <b>전원 동일 시각</b>이어야 다음 단계의 알림을 다 같이 관찰할 수 있습니다.</div>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SAFETY__" alt="내 안전 코드 화면"><figcaption><b>내 안전 코드</b> 화면 — <b>안부 푸시 알림 시각 변경</b>에서 시각을 바꿉니다</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- 5 -->
  <section id="s5" class="key-sec">
    <div class="sec-h"><div class="idx">5</div><h2>안부 전송 타이밍 이해</h2><span class="hot">★ 이 테스트의 핵심</span></div>
    <p class="sec-sub">설정 시각에 ‘정확히’ 안부 확인 신호가 가지 않을 수 있습니다.</p>
    <div class="body highlight">
      <p>안부 신호는 설정한 시각에 <b>자동</b>으로 전송되지만, 휴대폰 상태에 따라 <b>설정 시각에 정확히 가지 않을 수 있습니다.</b> 이는 오류가 아니라 정상 동작입니다. 설정 시각 이후 약 <b>2시간 뒤</b>까지 자동 전송이 안 되면, 아래 <b>‘내 알림’</b>이 한 번 옵니다.</p>

      <div class="note must"><span class="h">이 테스트에서 가장 헷갈리는 부분 — 알림은 두 종류입니다</span>이 앱은 <b>나도 안부를 보내는 사람(보호 대상자)</b>이면서 동시에 <b>남을 지켜보는 사람(보호자)</b>입니다. 그래서 한 폰에 <b>성격이 다른 두 종류의 알림</b>이 옵니다. 아래처럼 구분하세요.</div>

      <div class="dist">
        <div class="dist-box mine">
          <div class="dist-tag">📩 내 알림 — 딱 이것만 “내 알림”입니다</div>
          <div class="msg">💗 안부 확인이 필요합니다<br><span>이 메시지 알림을 한 번 터치해 주세요.</span></div>
          <p class="dist-d">전송이 실패한 경우엔 <b>📶 인터넷 연결을 확인해주세요</b> 알림이 올 수도 있는데, 이것도 <b>내 알림</b>입니다.</p>
          <p class="dist-d"><b>무슨 뜻?</b> 오늘 <b>내 안부가 아직 전달되지 않았다</b>는 신호입니다. 즉 <b>내 안부를 기다리는 보호자(=나를 보호 대상자로 등록한 다른 테스터)</b>에게 곧 경고가 갈 수 있다는 뜻입니다.</p>
          <p class="dist-d"><b>할 일:</b> 알림을 <b>탭</b>하거나 <b>앱을 열어</b> 내 안부를 보내세요. (그러면 그 보호자에게 정상 안부가 전달됩니다.)</p>
        </div>
        <div class="dist-box others">
          <div class="dist-tag">🔔 그 외 모든 알림 — 보호 대상자의 알림</div>
          <p class="dist-d">위 <b>‘내 알림’ 두 가지를 제외한</b> 나머지 알림(⚠ 주의 · ⚠ 경고 · 🚨 긴급 · 🚨 도움 요청 · 🔵 정보 · 🚶 활동 등)은 <b>전부 내가 지켜보는 보호 대상자(다른 테스터)</b>에 관한 알림입니다.</p>
          <p class="dist-d"><b>무슨 뜻?</b> 내가 연결한 대상자에게 무슨 일이 있다는 알림이지, 내가 안부를 보내라는 알림이 아닙니다.</p>
          <p class="dist-d"><b>할 일:</b> <b>홈 화면</b>에서 그 대상자 상태를 확인하고, 필요하면 7번의 <span class="tag btnr">안전확인 완료</span> 로 처리하세요.</p>
        </div>
      </div>

      <div class="note tip"><span class="h">한 줄로 외우세요</span><b>💗 또는 📶</b> 가 보이면 → <b>“내가 안부를 보내라”</b>는 알림(탭하거나 앱 열기). <b>그 외 등급 알림</b>은 → <b>“내가 지켜보는 사람”</b>의 알림(홈 화면에서 확인).</div>
      <div class="note info"><span class="h">참고</span>안부가 <b>제때 정상 전송된 날에는</b> ‘내 알림’이 <b>오지 않습니다.</b> (안 왔다면 잘 전송된 것) — 알림을 못 봤더라도 다음 단계의 ‘하루 1회 실행’ 때 앱을 열면 자동으로 처리됩니다.</div>
    </div>
  </section>

  <!-- 6 -->
  <section id="s6">
    <div class="sec-h"><div class="idx">6</div><h2>매일 반복 루틴 (가장 중요)</h2></div>
    <p class="sec-sub">여러 번 열 필요 없습니다 — 하루 한 번만 실행하고 완전히 종료하세요.</p>
    <div class="body">
      <p>이 앱의 핵심은 <b>앱을 켜 두지 않아도 매일 안부가 자동 전송되는 것</b>입니다. 그래서 <b>앱을 여러 번 실행할 필요가 없습니다.</b> 하루에 한 번만 아래대로 해 주세요.</p>
      <ol class="steps">
        <li><b>하루에 한 번만</b> 앱을 엽니다. 가급적 <b>내가 등록한 보호 대상자들의 안부가 모두 도착한 뒤</b> 여세요.</li>
        <li>하단 <span class="tag menu">알림</span> 페이지에서 <b>알림이 잘 왔는지만 확인</b>합니다. (주의·경고·긴급 알림이 와 있으면 7번 ‘안전확인 완료’로 처리)</li>
        <li>확인이 끝나면 앱을 <b>스와이프 + 완전 종료(kill)</b> 합니다.</li>
      </ol>
      <div class="note must"><span class="h">앱을 너무 자주 열지 마세요</span>예약 설정(<b>안부 푸시 알림 시각 변경</b>)한 시각 이후에 앱을 열면, <b>앱을 여는 순간 내 안부가 전송</b>됩니다. 하루에 여러 번 앱을 열면 ‘내 안부 미전송’ 같은 상황을 관찰할 수 없게 됩니다. 그래서 <b>하루 1회</b> 원칙입니다.</div>
      <div class="note info"><span class="h">왜 ‘완전 종료(스와이프 킬)’인가요?</span>앱을 백그라운드에 살려 두면 ‘앱이 켜져 있어서’ 전송되는 것인지, ‘완전히 꺼진 상태에서도’ 자동 전송되는지 구분할 수 없습니다. 실사용처럼 <b>확실히 종료</b>해야 자동 전송이 잘 되는지 검증할 수 있습니다.</div>
      <div class="note tip"><span class="h">스와이프 킬 하는 방법 (Android)</span>
        <b>①</b> 화면 맨 아래에서 <b>위로 살짝 쓸어올린 뒤 잠깐 멈추거나</b>, 하단의 <b>□(최근 사용 앱)</b> 버튼을 눌러 ‘최근 앱’ 목록을 엽니다.<br>
        <b>②</b> 목록에서 <b>‘안부’ 앱 카드</b>를 <b>위로(기종에 따라 옆으로) 쓸어 넘겨</b> 닫습니다.<br>
        <b>③</b> 목록에서 카드가 사라지면 <b>완전히 종료</b>된 것입니다. <span style="color:var(--tx3)">(삼성·샤오미 등 기종에 따라 방향이 다를 수 있어요.)</span></div>
      <div class="note tip"><span class="h">‘지금 바로 안전 보고하기’</span>즉시 안부를 보내고 싶으면 <b>내 안전 코드</b> 화면의 <span class="tag btn">지금 바로 안전 보고하기</span> 버튼을 쓸 수 있습니다. (<b>하루 1회</b>만 가능)</div>
    </div>
  </section>

  <!-- 7 -->
  <section id="s7">
    <div class="sec-h"><div class="idx">7</div><h2>경고 알림 &amp; ‘안전확인 완료’</h2></div>
    <p class="sec-sub">주의·경고·긴급 알림이 오면 홈 화면 카드에서 처리합니다.</p>
    <div class="body">
      <p>내가 보호하는 대상자에게 이상이 감지되면 <b>주의 / 경고 / 긴급</b> 알림이 옵니다. 직접 안부를 확인한 뒤 홈 화면에서 해소해 주세요.</p>
      <ol class="steps">
        <li>하단 탭 <span class="tag menu">홈</span> 으로 이동합니다.</li>
        <li>경고가 뜬 대상자 카드(좌측 색상 보더)를 찾습니다.</li>
        <li>카드의 <span class="tag btnr">안전확인 완료</span> 버튼을 눌러 경고를 해소합니다.</li>
      </ol>
      <div class="shots">
        <figure class="shot"><img src="__IMG_DASH__" alt="보호자 홈 화면"><figcaption><b>홈 화면</b> — 긴급 카드의 빨간 <b>안전확인 완료</b> 버튼</figcaption></figure>
        <figure class="shot"><img src="__IMG_NOTI__" alt="알림 목록"><figcaption><b>알림</b> 탭 — 도착한 주의·경고·긴급 알림 목록 확인</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- 8 -->
  <section id="s8">
    <div class="sec-h"><div class="idx">8</div><h2>긴급 도움 요청</h2></div>
    <p class="sec-sub">‘도움이 필요해요’로 연결된 보호자 전원에게 즉시 알립니다.</p>
    <div class="body">
      <ol class="steps">
        <li><b>내 안전 코드</b> 화면 하단 <span class="tag btnr">도움이 필요해요</span> 버튼을 누릅니다.</li>
        <li>확인 다이얼로그에서 동의하면, 나를 연결한 <b>보호자 전원</b>에게 <b>긴급 알림 + 현재 위치</b>가 즉시 전달됩니다.</li>
        <li>(위치 권한 팝업이 뜨면 ‘허용’ — 거부해도 알림 자체는 발송됩니다.)</li>
      </ol>
      <div class="note info"><span class="h">7번과 함께 테스트하세요</span>긴급 요청은 받는 쪽 홈 화면에 <b>긴급</b> 카드를 즉시 띄우므로, 7번의 <b>안전확인 완료</b> 버튼을 가장 빠르게 확인하는 방법입니다.</div>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SAFETY__" alt="긴급 도움 요청 버튼"><figcaption><b>내 안전 코드</b> 화면 하단의 <b>도움이 필요해요</b> 버튼</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- 참고: 알림 설정 -->
  <section id="s9">
    <div class="sec-h"><div class="idx">＋</div><h2>참고 화면</h2></div>
    <div class="body">
      <p>아래 화면도 자유롭게 둘러봐 주세요. 동작 이상이 있으면 함께 알려 주시면 도움이 됩니다.</p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_NOTISET__" alt="알림 설정"><figcaption><b>알림 설정</b> — 등급별 ON/OFF, 방해금지 시간대</figcaption></figure>
        <figure class="shot"><img src="__IMG_CONN__" alt="연결 관리"><figcaption><b>연결 관리</b> — 대상자 목록·연결 해제</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- 보고 -->
  <div class="report">
    <h3>🐞 문제·피드백 보고</h3>
    <p>버그나 이상 동작을 발견하면 아래 메일로 보내 주세요.</p>
    <div class="mail">l10s18bok@naver.com</div>
    <p>가능하면 <b>단말 기종 · Android 버전 · 발생 화면 스크린샷</b>을 함께 첨부해 주세요.</p>
  </div>

  <footer>
    안부(Anbu) · Averic Lab — 비공개 테스트 안내<br>
    이 페이지는 테스트 참여자 전용입니다.
  </footer>

</div>
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
