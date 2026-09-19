# 숏폼 영상 빌드 (게시 제외 — `_` 접두 폴더)

홈페이지 목업처럼 **앱 화면을 HTML/CSS로 그린 페이지**를 프레임 단위로 캡처해 mp4 로 만든다.
결과물은 `media/shorts/<언어>/`에 둔다. 검토 페이지 `preview/shorts/`(noindex)와 **한국어 홈 「해질녘」 섹션이 같은 파일을 쓴다** — 다시 렌더하면 홈에도 바로 반영된다.

| 파일 | 역할 |
|---|---|
| `a.html` / `b.html` | 영상 한 편 = 페이지 한 장. 540×960 CSS 캔버스(×2 = 1080×1920) |
| `shorts.css` | 캔버스·자막·공통 엔딩 + `../style.css` 앱 목업을 평평하게 펴는 덮어쓰기 |
| `engine.js` | 결정적 타임라인. `data-t="등장,퇴장"` / `data-fx="fade|up|down|pop"`, `render(ms)`, `mountEnding(초)` |
| `render.mjs` | Playwright 로 `render(ms)`를 1/30초씩 호출·캡처 → ffmpeg(libx264, yuv420p, faststart) |

## 렌더

```bash
brew install ffmpeg                      # 1회
npm i --prefix <아무 임시 폴더> playwright-core
export PLAYWRIGHT_CORE=<임시 폴더>/node_modules/playwright-core
# 헤드리스 셸이 없으면 일반 크로미움 경로를 넘긴다
export CHROMIUM_PATH="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

node render.mjs a.html --stills 0,8.5,13.5 /tmp/stills   # 정지 화면 몇 장 먼저 확인
node render.mjs a.html ../media/shorts/ko/a.mp4           # 전체(약 2분)
ffmpeg -ss 1 -i ../media/shorts/ko/a.mp4 -frames:v 1 -vf scale=540:-1 ../media/shorts/ko/a.jpg   # 포스터
```

브라우저에서 `a.html?play`로 열면 실시간 재생으로 흐름을 볼 수 있다(캡처와 같은 타임라인).

## 규칙

- **벽시계·CSS 무한 애니메이션을 쓰지 말 것.** 모든 움직임은 `render(ms)`의 함수여야 프레임이 빠지지 않고 매번 같은 영상이 나온다. `style.css`의 `.push`·`.pop .plot i` 애니메이션은 `shorts.css`에서 꺼 두었다.
- **폰 목업은 `.pw` 래퍼를 `scale()`로만 줄인다** — 안쪽 좌표는 홈페이지 실측값(352×722)이다.
- **폰 안 글씨는 영상에서 읽히지 않는다.** 보여줘야 할 알림·카드는 `.float`으로 확대해 띄운다.
- **안전 영역**: 위 8%·아래 20%·오른쪽 12%는 틱톡·릴스 UI가 덮는다. 자막과 핵심 요소를 그 안에 두지 말 것.
- **푸시 문구는 실제 서버 형식을 따른다** — 제목 `✅ 오늘 안부 확인 완료`, 본문 `별칭 · 오늘 N보를 걸으셨습니다.`(PRD-BackEnd). 별칭은 본문 앞에 붙는다.
- **공통 엔딩**(`mountEnding`)은 홈 「해질녘」 ③ 문장이다. 모든 편이 같은 문장으로 끝난다(브랜드 서명).
- 특정 메신저·OS 화면을 흉내 내지 않는다(말풍선·통화 기록은 일반형).
- 프레임 PNG·node_modules 를 이 저장소에 두지 말 것(게시 저장소다).
