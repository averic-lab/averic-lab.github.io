# -*- coding: utf-8 -*-
import base64, os

BASE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE, "img")
OUT = os.path.join(BASE, "..", "test", "index.html")

imgs = {
    "__IMG_SETTINGS__": "settings.jpg",
    "__IMG_SAFETY__": "safety_home.jpg",
    "__IMG_DASH__": "dashboard.jpg",
    "__IMG_ADD__": "add_subject.jpg",
    "__IMG_NOTI__": "notifications.jpg",
}

HTML = r"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>안부(Anbu) 비공개 테스트 가이드 · Averic Lab</title>
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
  .wrap{max-width:760px;margin:0 auto;padding:0 20px 80px}

  .topbar{position:sticky;top:0;z-index:20;backdrop-filter:blur(12px);
    background:linear-gradient(180deg,rgba(10,14,42,.92),rgba(10,14,42,.72));border-bottom:1px solid var(--card-bd)}
  .topbar .inner{max-width:760px;margin:0 auto;padding:13px 20px;display:flex;align-items:center;gap:11px}
  .mark{width:24px;height:24px;flex:0 0 auto}
  .brand{font-weight:800}
  .brand small{font-weight:600;color:var(--tx3);margin-left:6px;font-size:12px}
  .pill{margin-left:auto;font-size:11.5px;font-weight:700;color:#0a0e2a;background:linear-gradient(180deg,var(--pink),var(--pink2));padding:5px 11px;border-radius:999px}

  .hero{padding:48px 0 8px;text-align:center}
  .hero h1{font-size:28px;line-height:1.3;margin:0 0 10px;font-weight:850;letter-spacing:-.3px}
  .hero h1 .hl{background:linear-gradient(180deg,var(--pink),var(--pink2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .hero p{color:var(--tx2);margin:0 auto;max-width:540px;font-size:15px}
  .hero .intro{color:var(--tx);font-size:16px;margin-bottom:12px}
  .hero .intro b{color:var(--pink)}
  .platform{display:inline-flex;align-items:center;gap:7px;margin-top:14px;font-size:13px;font-weight:700;color:var(--teal)}

  /* 핵심 요약 */
  .summary{margin:26px 0 4px;border-radius:18px;padding:18px 20px;
    background:linear-gradient(180deg,rgba(255,138,149,.11),rgba(255,207,107,.06));
    border:1px solid rgba(255,138,149,.4);box-shadow:0 0 0 1px rgba(255,138,149,.16),0 14px 36px rgba(229,75,94,.12)}
  .summary .s-h{font-weight:850;font-size:17px;margin-bottom:11px}
  .summary .s-h span{font-weight:600;color:var(--tx3);font-size:13px}
  .summary ol{margin:0;padding:0;list-style:none;counter-reset:sm}
  .summary ol li{position:relative;padding:7px 0 7px 34px;color:var(--tx2);font-size:14.5px;line-height:1.55}
  .summary ol li:before{counter-increment:sm;content:counter(sm);position:absolute;left:0;top:7px;
    width:23px;height:23px;display:grid;place-items:center;border-radius:7px;font-size:12.5px;font-weight:800;
    color:#0a0e2a;background:linear-gradient(180deg,var(--pink),var(--pink2))}
  .summary ol li b{color:#fff}
  .summary ol li.hi{color:var(--tx);margin:3px 0;padding:9px 12px 9px 42px;border-radius:11px;
    background:rgba(255,207,107,.1);border:1px solid rgba(255,207,107,.32)}
  .summary ol li.hi:before{left:11px;top:9px;background:linear-gradient(180deg,var(--amber),#ff9f43)}
  .summary ol li.hi b{color:var(--amber)}

  /* steps */
  .step{margin-top:18px;background:var(--card);border:1px solid var(--card-bd);border-radius:18px;padding:18px 20px;
    display:flex;gap:16px;align-items:flex-start}
  .step .n{width:34px;height:34px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;font-weight:850;font-size:16px;
    color:#0a0e2a;background:linear-gradient(180deg,var(--pink),var(--pink2))}
  .step .c{flex:1;min-width:0}
  .step h2{font-size:18px;margin:3px 0 7px;font-weight:800;letter-spacing:-.2px}
  .step p{margin:0 0 7px;color:var(--tx2);font-size:14.5px}
  .step p:last-child{margin-bottom:0}
  .step .sub-t{font-weight:800;color:var(--pink);font-size:14.5px;margin:13px 0 5px}
  .step b,.step strong{color:#fff;font-weight:750}
  ul.do{list-style:none;margin:4px 0 0;padding:0}
  ul.do li{position:relative;padding:5px 0 5px 24px;color:var(--tx2);font-size:14.5px}
  ul.do li:before{content:"";position:absolute;left:2px;top:12px;width:7px;height:7px;border-radius:50%;background:linear-gradient(180deg,var(--pink),var(--pink2))}

  .tag{display:inline-block;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:6px;vertical-align:middle;margin:0 1px;white-space:nowrap}
  .tag.menu{color:var(--indigo);background:rgba(139,156,240,.14);border:1px solid rgba(139,156,240,.3)}
  .tag.btn{color:#fff;background:#1f7a6b;border:1px solid #2aa18c}
  .tag.btnr{color:#fff;background:#b13b46;border:1px solid #e0606b}
  code{color:var(--teal);font-weight:700;background:rgba(54,201,180,.1);padding:1px 6px;border-radius:5px;font-size:13px}

  .key-step{border-color:rgba(255,207,107,.5);box-shadow:0 0 0 1px rgba(255,207,107,.25);
    background:linear-gradient(180deg,rgba(255,207,107,.06),rgba(255,255,255,.03))}
  .key-step .n{background:linear-gradient(180deg,var(--amber),#ff9f43)}
  .hot{display:inline-block;font-size:11px;font-weight:800;color:#0a0e2a;background:linear-gradient(180deg,var(--amber),#ff9f43);padding:3px 9px;border-radius:999px;margin-left:8px;vertical-align:middle}

  .mini{margin:10px 0 0;border-radius:12px;padding:11px 14px 11px 40px;position:relative;font-size:13.5px;line-height:1.55;color:var(--tx2);
    background:rgba(139,156,240,.08);border:1px solid rgba(139,156,240,.28)}
  .mini:before{content:"ℹ️";position:absolute;left:13px;top:10px;font-size:15px}
  .mini.warn{background:rgba(255,122,122,.08);border-color:rgba(255,122,122,.32)}
  .mini.warn:before{content:"⚠️"}
  .mini b{color:#fff}

  .shots{display:flex;flex-wrap:wrap;gap:14px;margin:14px 0 2px}
  figure.shot{margin:0;width:150px}
  figure.shot img{width:100%;display:block;border-radius:14px;border:1px solid var(--card-bd);box-shadow:0 10px 24px rgba(0,0,0,.4)}
  figure.shot figcaption{margin-top:7px;text-align:center;font-size:11.5px;color:var(--tx2)}
  figure.shot figcaption b{color:var(--pink)}

  .noti{margin-top:11px;display:grid;grid-template-columns:1fr 1fr;gap:11px}
  .noti .box{border-radius:12px;padding:13px 14px;border:1px solid var(--card-bd);background:rgba(255,255,255,.03);font-size:13.5px;color:var(--tx2);line-height:1.55}
  .noti .box.me{border-color:rgba(54,201,180,.5);background:linear-gradient(180deg,rgba(54,201,180,.09),rgba(255,255,255,.02))}
  .noti .box .t{font-weight:800;margin-bottom:5px}
  .noti .box.me .t{color:var(--teal)}
  .noti .box.other .t{color:var(--indigo)}
  .noti .box .m{color:#fff;font-weight:700}
  .noti .box .ref{margin-top:8px;padding-top:8px;border-top:1px solid var(--card-bd);font-size:12.5px;color:var(--tx3);line-height:1.5}
  .noti .box .ref b{color:var(--amber)}
  .noti .box .ref .imp{display:block;margin-top:7px;padding:7px 10px;border-radius:8px;font-weight:800;color:#ffd0d0;
    background:rgba(255,122,122,.12);border:1px solid rgba(255,122,122,.4)}

  .report{margin-top:34px;background:linear-gradient(180deg,rgba(255,138,149,.1),rgba(229,75,94,.06));border:1px solid rgba(255,138,149,.3);border-radius:18px;padding:22px;text-align:center}
  .report h3{margin:0 0 6px;font-size:17px}
  .report .mail{display:inline-block;margin-top:6px;font-size:17px;font-weight:800;color:#fff;background:rgba(255,255,255,.06);border:1px solid var(--card-bd);padding:10px 18px;border-radius:12px}
  .report p{color:var(--tx2);font-size:13.5px;margin:9px 0 0}
  footer{margin-top:30px;text-align:center;color:var(--tx3);font-size:12px;line-height:1.7}

  @media(max-width:560px){
    .hero h1{font-size:24px}
    .step{padding:16px 16px;gap:13px}
    .noti{grid-template-columns:1fr}
    figure.shot{width:46%}
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
    <h1>안부(Anbu) <span class="hl">비공개 테스트</span> 가이드</h1>
    <p class="intro"><b>안부앱</b>은 멀리 있는 가족이나 혼자 사는 분의 안녕을, <b>별도 조작 없이 매일 자동으로</b> 전달·확인하는 앱입니다.</p>
    <p>아래 1~7번은 처음 한 번만 설정하면 되고, <b>매일 반복할 것은 ‘5번 매일 루틴’ 하나뿐</b>입니다.</p>
    <div class="platform">🤖 Android · Google Play 비공개 테스트</div>
  </div>

  <div class="summary">
    <div class="s-h">📌 테스트 핵심 요약 <span>— 이것만 지키면 됩니다</span></div>
    <ol>
      <li>설치 후 <b>‘안부 보호’ 활성화</b> + 다른 테스터와 <b>서로 코드 연결</b></li>
      <li><b>안부시각</b>을 참여자 <b>전원 같은 시각</b>(오후 12~6시)으로 설정</li>
      <li class="hi"><b>매일 딱 1회</b>만 앱 실행 → <b>알림 확인</b> → <b>스와이프로 완전 종료(kill)</b></li>
      <li>그 외엔 <b>앱을 열지 마세요</b> — 앱을 여는 순간 내 안부가 전송됩니다</li>
    </ol>
  </div>

  <!-- 1 -->
  <div class="step">
    <div class="n">1</div>
    <div class="c">
      <h2>설치 &amp; 권한 허용</h2>
      <p>앱을 설치하고, <b>이후 뜨는 모든 권한 팝업을 ‘허용’</b> 합니다. (권한은 설치 직후·기능 활성화 시 등 <b>단계별</b>로 나뉘어 뜹니다.)</p>
      <div class="mini warn">알림·걸음수 권한을 거부하면 테스트가 정상 동작하지 않습니다. 실수로 거부했다면 앱을 지우고 다시 설치하세요.</div>
    </div>
  </div>

  <!-- 2 -->
  <div class="step">
    <div class="n">2</div>
    <div class="c">
      <h2>안부 보호 활성화</h2>
      <p>하단 <b>설정</b> 탭에서 <b>나도 안부 보호 받기</b> 버튼을 누르면 안부 보호가 켜지고, <b>내 안전 코드</b>(공유용 코드)와 안부 보고 기능이 생깁니다.</p>
      <ul class="do">
        <li>하단 <span class="tag menu">설정</span> → <span class="tag menu">나도 안부 보호 받기</span> 탭</li>
        <li>안내창에서 <span class="tag btn">이해했습니다, 활성화</span> → <b>걸음수 권한 허용</b></li>
        <li>활성화되면 <b>내 안전 코드</b> 화면으로 이동</li>
      </ul>
      <div class="mini warn"><b>스크린샷 주의</b> — 아래 설정 스크린샷은 <b>이미 활성화가 끝난 뒤</b> 모습이라 버튼이 <span class="tag menu">내 안전 코드 확인</span> 으로 보입니다. <b>여러분이 처음 보는 화면</b>에서는 같은 자리에 <span class="tag menu">나도 안부 보호 받기</span> 가 있으니, 그 버튼을 누르세요.</div>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SETTINGS__" alt="설정 (활성화 후)"><figcaption><b>설정</b> 화면 — <b>활성화 후</b> (버튼이 ‘내 안전 코드 확인’으로 바뀜)</figcaption></figure>
        <figure class="shot"><img src="__IMG_SAFETY__" alt="내 안전 코드"><figcaption><b>내 안전 코드</b> 화면</figcaption></figure>
      </div>
    </div>
  </div>

  <!-- 3 -->
  <div class="step">
    <div class="n">3</div>
    <div class="c">
      <h2>서로의 코드 연결</h2>
      <p>각자 <b>내 안전 코드</b>(예: <code>H0Y-L13J</code>)를 공유하고, <b>다른 테스터의 코드</b>를 등록합니다.</p>
      <ul class="do">
        <li>하단 <span class="tag menu">연결</span> → <b>새로운 보호 대상자 추가</b></li>
        <li>다른 테스터 코드 입력 (<b>본인 코드는 불가</b> — 앱이 차단)</li>
        <li>별칭 입력 후 <span class="tag btn">연결하기</span> · 각자 <b>최소 1명 이상</b> 상호 연결</li>
      </ul>
      <div class="shots">
        <figure class="shot"><img src="__IMG_ADD__" alt="연결 화면"><figcaption><b>연결</b> 화면</figcaption></figure>
        <figure class="shot"><img src="__IMG_DASH__" alt="홈 화면"><figcaption><b>홈 화면</b> — 연결된 카드</figcaption></figure>
      </div>
    </div>
  </div>

  <!-- 4 -->
  <div class="step">
    <div class="n">4</div>
    <div class="c">
      <h2>안부시각 설정 (전원 동일)</h2>
      <p><b>내 안전 코드</b> 화면 → <span class="tag menu">안부 푸시 알림 시각 변경</span> 에서 시각을 바꿉니다.</p>
      <ul class="do">
        <li><b>참여자 전원이 같은 시각</b>으로 설정</li>
        <li>기본 18:00 — 너무 늦으면 <b>오후 12:00 ~ 6:00 사이</b>로 통일</li>
      </ul>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SAFETY__" alt="내 안전 코드 화면"><figcaption><b>내 안전 코드</b> 화면 — <b>안부 푸시 알림 시각 변경</b></figcaption></figure>
      </div>
    </div>
  </div>

  <!-- 5 -->
  <div class="step key-step">
    <div class="n">5</div>
    <div class="c">
      <h2>매일 루틴<span class="hot">★ 핵심</span></h2>
      <p>앱을 <b>여러 번 열 필요 없습니다.</b> 하루에 <b>한 번만</b>:</p>
      <ul class="do">
        <li><b>하루 1회</b> 앱 실행 (<b>중요</b> : 가급적 내 보호 대상자들 안부가 모두 도착한 뒤)</li>
        <li>푸시 알림을 누르거나 그냥 앱을 실행하든지, 하단 <span class="tag menu">알림</span> 페이지에서 <b>알림이 잘 왔는지만 확인</b></li>
        <li>끝나면 앱을 <b>스와이프 + 완전 종료(kill)</b></li>
      </ul>
      <div class="shots">
        <figure class="shot"><img src="__IMG_NOTI__" alt="알림 페이지"><figcaption><b>알림</b> 페이지 — 알림이 잘 왔는지 확인</figcaption></figure>
      </div>
      <div class="mini warn"><b>자주 열지 마세요.</b> 예약 시각 이후 앱을 열면 그 순간 내 안부가 전송되어, ‘내 안부 미전송’ 상황을 관찰할 수 없게 됩니다.</div>
      <div class="noti">
        <div class="box me"><div class="t">💗 “내 알림”이면</div><span class="m">안부 확인이 필요합니다</span> 가 오면 → <b>즉시</b> 내가 안부를 보내라는 뜻. <b>탭하거나 앱을 열어</b> 전송.</div>
        <div class="box other"><div class="t">🔔 그 외 알림이면</div>주의·경고·긴급 등은 <b>내가 지켜보는 대상자</b>의 알림. <b>홈 화면</b>에서 확인.<div class="ref">참고 — 이 알림이 오면 <b>예약시각 +2시간 이후에 터치</b>하세요. <span class="imp">⚠️ 그전에 터치하지 마세요 — 내 ‘미전송’ 알림이 보호자에게 전달될 수 있습니다.</span></div></div>
      </div>
    </div>
  </div>

  <!-- 6 -->
  <div class="step">
    <div class="n">6</div>
    <div class="c">
      <h2>경고 처리</h2>
      <p>대상자에게 <b>주의·경고·긴급</b> 알림이 오면, <b>홈 화면</b>의 해당 카드에서 처리합니다.</p>
      <ul class="do">
        <li>하단 <span class="tag menu">홈</span> → 경고 뜬 대상자 카드</li>
        <li>카드의 <span class="tag btnr">안전확인 완료</span> 버튼으로 해소</li>
      </ul>
      <div class="shots">
        <figure class="shot"><img src="__IMG_DASH__" alt="홈 화면"><figcaption><b>홈 화면</b> — 카드의 <b>안전확인 완료</b> 버튼</figcaption></figure>
      </div>
    </div>
  </div>

  <!-- 7 -->
  <div class="step">
    <div class="n">7</div>
    <div class="c">
      <h2>긴급 도움 요청</h2>
      <p class="sub-t">① 긴급 도움 요청 (전송)</p>
      <p><b>내 안전 코드</b> 화면 하단 <span class="tag btnr">도움이 필요해요</span> → 확인하면 나를 연결한 <b>보호자 전원</b>에게 긴급 알림이 즉시 전달됩니다.</p>
      <p class="sub-t">② 긴급 도움 요청 (수신 확인)</p>
      <p>받은 보호자는 하단 <span class="tag menu">알림</span> 페이지에서 도착한 긴급 알림 카드의 <span class="tag btn">🗺️ 위치 보기</span> 버튼을 눌러 대상자의 위치를 지도로 확인합니다.</p>
      <div class="shots">
        <figure class="shot"><img src="__IMG_SAFETY__" alt="내 안전 코드 화면"><figcaption><b>① 전송</b> — 내 안전 코드 화면의 <b>도움이 필요해요</b></figcaption></figure>
        <figure class="shot"><img src="__IMG_NOTI__" alt="알림 페이지"><figcaption><b>② 수신 확인</b> — 알림 페이지의 <b>🗺️ 위치 보기</b></figcaption></figure>
      </div>
    </div>
  </div>

  <div class="report">
    <h3>🐞 문제·피드백 보고</h3>
    <p>버그나 이상 동작은 아래 메일로 보내 주세요.</p>
    <div class="mail">l10s18bok@naver.com</div>
    <p>버그 및 이해가 안 가는 부분에 대해서 <b>Android 버전 · 발생 화면 스크린샷</b>을 함께 첨부해 주시면 좋습니다.</p>
  </div>

  <footer>
    안부(Anbu) · Averic Lab — 비공개 테스트 가이드<br>
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
