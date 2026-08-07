# averic.co.kr — Averic Lab 사이트 (GitHub Pages)

안부(Anbu) 앱의 공식 웹사이트. **GitHub Pages**로 호스팅되며 `git push` 시 자동 배포된다.

| 항목 | 값 |
| --- | --- |
| 도메인 | `averic.co.kr` (CNAME) |
| 저장소 | `averic-lab/averic-lab.github.io` (branch `main`) |
| 배포 | `main`에 push → GitHub Pages 자동 게시 |
| 게시 엔진 | Jekyll(기본, `.nojekyll` 없음). **`_` 로 시작하는 폴더는 게시에서 제외됨** |
| 게시 제외 | `_config.yml`의 `exclude` — 현재 `CLAUDE.md` |

## 게시에서 제외하기 (`_config.yml`)

Jekyll은 front matter가 없는 `.md`도 **정적 파일로 그대로 복사**한다. 그래서 루트의 `CLAUDE.md`가 실제로 `averic.co.kr/CLAUDE.md`로 공개되고 있었고(커밋 `dd6987d`), 이를 막으려고 `_config.yml`에 `exclude`를 추가했다.

- **내부 문서를 새로 추가할 때는 두 방법 중 하나를 쓴다** — `_` 접두 폴더 안에 두거나(권장), `_config.yml`의 `exclude`에 추가한다.
- ⚠️ `exclude`를 지정하면 Jekyll **기본 제외 목록을 대체**한다. `_config.yml`에 기본값(`node_modules/`, `Gemfile` 등)을 함께 적어 둔 이유이니 지우지 말 것.
- `.nojekyll`을 추가해 Jekyll을 끄는 방법은 **쓰지 않는다** — `_` 폴더 제외 규칙까지 사라져 `_beta-test-build/`(스크린샷·빌드 스크립트)와 `_faq-build/`가 통째로 공개된다.
- ⚠️ **`_config.yml`을 고칠 때마다 배포 후 직접 확인할 것.** 이 파일이 잘못되면 문서가 아니라 사이트 전체가 깨진다. 확인 항목: `averic.co.kr/ko/` 정상 렌더 · `averic.co.kr/CLAUDE.md` 404 · `/test/`·`/preview/` 회귀 없음. (2026-08-06 커밋 `bd38607` 배포에서 전부 통과 확인)

## 사이트 구조

- `index.html` — 루트 스플래시(언어 자동 분기), `style.css`, `site.js`
- `og-image.png` — 공유 미리보기(1200×630). 20개 언어가 이 한 장을 공유하므로 **문구는 언어 중립**으로 둔다(브랜드 + 도메인). 없으면 카톡·SNS 링크가 그림 없이 나간다
- `ko/`, `en/`, `ja/` … (20개 언어 폴더) — 각 언어별 `index.html` / `privacy-policy.html` / `terms-of-service.html` / `faq.html` / `guide.html`
- `i18n/` — 다국어 랜딩 빌드 도구(`build.py`, `template.html`, `translations.json`) — **20개 언어 `index.html` 전부를 생성**한다(단일 출처)
- `_faq-build/` — FAQ·사용설명 빌드 도구 + `PRD-FAQ.md` (게시 제외). 상세는 아래 별도 절
- `CNAME` — `averic.co.kr`

## 한국어 줄바꿈 — `word-break: keep-all`

한국어·일본어·중국어는 기본적으로 **글자 단위로 아무 데서나 줄이 바뀐다.** "단계별로"가 `단계 / 별로`로, "사람,"이 `사 / 람,`으로 쪼개졌다. `h1`·`h2.section-title`·`p.section-sub`·`.hero-sub`에 `word-break: keep-all`을 걸어 단어 단위로만 끊기게 했다.

- 라틴 문자는 원래 공백에서 끊기므로 **영향 없다**. 20개 언어 × 3개 폭에서 제목 넘침 0으로 확인.
- 안전망으로 `overflow-wrap: break-word`를 같이 둔다(공백 없는 초장문 단어 대비).

## 히어로 세로 공간 — 첫 화면 안에 CTA가 들어와야 한다

제목이 「혼자 지내는 소중한 사람, 매일 걱정하고 계시나요?」로 길어지면서 두 가지를 조정했다:

- **제목 크기 상한 56px → 40px.** 56px에서는 3~4줄로 늘어 스토어 배지와 가격 문구가 첫 화면 밖으로 밀렸다.
- **히어로 단일 열 전환 분기점 880px → 1000px.** 1000px 아래에서는 두 칸을 유지하면 카피 열이 좁아져 제목이 4줄이 된다. 나머지 섹션은 880px 그대로다(히어로만 별도 블록).
- 긴 언어(러시아어·네덜란드어·베트남어 등)는 제목 문구 자체를 짧게 다듬었다. 이 자리는 **두 줄이 상한**이다.

## 「단계별 신호」 섹션 — 알림 페이지 폰 목업 (2026-08-07)

왼쪽 설명 + 오른쪽 폰. 히어로와 두 가지가 다르다:

- **폰이 정면이다**(3D 회전·perspective 없음). 히어로가 이미 기울어진 폰을 쓰므로 같은 각도를 반복하면 한 페이지에 같은 장치가 두 번 나온다.
- **알림 카드가 좌·우로 번갈아** 튀어나온다(`.np1`~`.np5`, 왼–오–왼–오–왼). 좌우 교차가 목적이므로 `left` 값을 한쪽으로 몰지 말 것.
- 떠난 자리는 히어로와 **같은 규칙**으로 반투명 유리(`.nlist .ncard::after`)가 덮는다. 5개 등급이 모두 튀어나오므로 예외는 없다.
- **아이콘은 앱 매핑 그대로** — 정상 `check_circle` · 주의 `info`(ⓘ, 느낌표 아님) · 경고 `warning_amber`(삼각형) · 긴급 `error`(원 안 !) · 걸음수 `directions_walk`. 앱은 `messageKey == 'steps'`를 등급보다 **먼저** 분기하므로 걸음수는 정보 등급이어도 종 아이콘이 아니라 걷는 사람이다.
- 카드 문구는 전부 앱 번역 파일에서 온다(`APP_NOTI_*` / `APP_LV_*`). 자리표시자 `@days`·`@steps`는 `build.py`의 `app_tokens()`가 3일·3,482보로 채운다.
- ⚠️ **가로로 508px이 필요하다**(폰 300 + 좌우 104씩). 두 칸 배치로는 1080px 아래에서 그 폭이 안 나오므로 세로로 쌓고, 더 좁아지면 `.nwrap`을 통째로 `scale()` 한다 — 카드 좌표가 고정값이라 개별로 줄이면 어긋난다(히어로 `.pwrap`과 같은 이유).

## 홈 헤더 메뉴 — 가로 스크롤

단어가 긴 언어(독일어 `Nutzungsbedingungen`, 러시아어 등)에서 좁은 화면일 때 메뉴가 넘쳐 **오른쪽 끝의 언어 버튼이 잘렸다**(2026-08-07 실기기 확인).

- **스크롤은 `.nav-links`(링크 4개)에만 걸고, `.lang-toggle`은 `flex: 0 0 auto`로 고정한다.** 줄 전체를 스크롤시키면 정작 필요한 언어 버튼이 화면 밖에 남아 문제가 그대로다 — 이 분리를 합치지 말 것.
- 스크롤 자체는 모든 폭에 걸어 두지만 **넘칠 때만 동작**한다(데스크톱은 독일어도 366/366으로 딱 맞아 스크롤이 생기지 않는다). 그래서 별도 분기가 필요 없다.
- 오른쪽 끝 페이드(`mask-image`)는 **≤720px에서만** 준다 — 넘치지 않는 폭에서 페이드를 주면 멀쩡한 마지막 글자가 흐려 보인다.
- 스크롤바는 숨긴다(`scrollbar-width:none` + `::-webkit-scrollbar`).

## 언어 자동 분기 (루트 `index.html`) — 불변 규칙

루트는 클라이언트 JS로 언어를 골라 `/{code}/`로 `location.replace` 한다. 우선순위:

1. `?lang=xx` — **저장까지 갱신한다.** `averic.co.kr/?lang=ko` 링크 하나로 영구 교정할 수 있어야 하기 때문
2. 저장된 선택 (`localStorage['anbu.lang']`, **90일 만료**)
3. `navigator.languages` (사용자 선호 순서대로 첫 매치)
4. `/en/`

⚠️ **저장된 선택은 기기 언어를 덮어쓴다.** 2026-08-07 이전에는 만료도 없고 되돌릴 UI도 없어서, 홈 스위처에서 언어를 한 번 누르면 그 브라우저에서는 **영원히** 그 언어로 열렸다 — 한국어 폰인데 일본어로 뜨는 현상의 원인이었다(기기 언어 감지 자체는 정상이었다). 고친 것 셋:

- `?lang=`이 저장값도 갱신 → 교정 가능
- 90일 만료
- 예전 형식(코드 문자열만, 시각 없음)은 읽는 즉시 폐기 → **이미 갇힌 사용자도 다음 방문에 자동 복구**

**저장 형식은 `index.html`과 `site.js` 두 곳이 맞춰야 한다** — `{"code":"ko","t":1786…}`. `site.js`가 예전처럼 문자열만 넣으면 만료 판정이 안 돼 같은 고착이 재발한다.

> 참고: `faq.html`·`guide.html`은 `site.js`를 싣지 않으므로 **그쪽 스위처는 언어를 저장하지 않는다.** 저장은 홈 스위처에서만 일어난다.
>
> 앱은 개인정보·이용약관을 `/{기기언어}/…`로 직접 열어 이 라우터를 타지 않는다. 설정 하단 `www.averic.co.kr`만 루트로 오며 `averic.co.kr`로 301된다(같은 오리진이라 저장값이 갈리지 않는다).

## 홈 히어로 — 폰 목업 (2026-08-07)

히어로 오른쪽의 3D 폰 목업은 **앱 화면을 HTML/CSS로 재현**한 것이다. 스크린샷을 쓰지 않는 이유는 FAQ·사용설명과 같다(`_faq-build/PRD-FAQ.md` §1).

**폰 안의 문구는 전부 앱 번역 파일에서 추출한 값이다.** `i18n/build.py`가 `_faq-build/app-strings.json`을 읽어 `APP_*` 토큰으로 넣는다 — 20개 언어가 공짜이고, 앱 문구가 바뀌면 `extract_strings.py` 재실행 한 번으로 따라온다.

```
앱 저장소 translations/*.dart
   → _faq-build/extract_strings.py → app-strings.json
       ├→ build_faq.py / build_guide.py   (FAQ·사용설명)
       └→ i18n/build.py                    (홈 히어로 목업)   ← 2026-08-07 추가
```

- `LANG_TO_STRINGS`(사이트 코드 → 앱 파일 코드)의 **단일 출처는 `i18n/build.py`**다. `_faq-build/common.py`가 `build.py`를 임포트하므로 반대 방향은 순환이 된다 — 옮기지 말 것.
- 자리표시자(`@count`, `@hours`)는 `build.py`의 `app_tokens()`가 직접 채운다(2명 / 2시간). 채우지 않으면 사용자에게 `@count`가 그대로 보인다.
- ⚠️ **목업 좌표는 실측값이다.** 떠오른 카드(`.pop` / `.pop2` / `.codecard`)의 `left`/`top`은 폰 **352×722** 기준으로 원래 자리(`.slot`/`.slot2`)를 측정해 박아 둔 값이다. 폰 크기를 직접 바꾸면 카드가 제자리를 벗어난다 — 좁은 화면에서는 **`.pwrap`을 통째로 `scale()`** 하고 남는 세로 공간을 음수 margin으로 회수한다(반응형 블록 참조).
- 떠오른 카드가 남긴 자리는 **같은 내용 + 반투명 유리(`.glass`)**로 덮는다. "어디서 나왔는지"를 보여주는 장치이므로 유리를 지우지 말 것.
- `.push`(푸시 알림)는 고정 헤더(`z-index:100`, 높이 64px)를 가리지 않도록 `top:78px`로 내려 두었다. 위로 올리면 20개 언어 전부에서 헤더 메뉴를 덮는다.
- 폰 목업은 `aria-hidden="true"`다 — 스크린리더에는 장식이다.
### 안전 코드 카드의 복사·공유 버튼 + 점선 설명

- ⚠️ **`.co`는 반드시 `width: 0`이어야 한다.** 폭을 가지면 `inset-inline-end`가 점선이 아니라 **상자의 끝**을 잡아서, 점선이 **라벨 폭의 절반만큼 왼쪽으로 밀린다** — 라벨 길이가 언어마다 달라 어긋남도 언어마다 달라진다(2026-08-07 실제 발생). 점선은 버튼 중심에 정확히 서야 한다.
- 좌우 기준은 `right`가 아니라 **논리 속성 `inset-inline-end`** — 아랍어에서 카드·버튼이 반대편으로 넘어갈 때 점선도 따라가야 한다. 값(복사 72px / 공유 32px)은 카드 padding 16 + 버튼 32 + 간격 8에서 나온 **버튼 중심까지의 거리**다. 버튼 크기·여백을 바꾸면 같이 고쳐야 한다.
- 두 점선의 **길이를 크게 어긋내 둔 것은 의도**다(복사 104px / 공유 56px). 버튼 간격이 36px뿐이라 라벨을 같은 높이에 두면 언어에 따라 겹친다. 맞추지 말 것.
- **아랍어(RTL)는 꺾은선**이다 — 위로 올라간 뒤 오른쪽으로 꺾어(`ㄱ`의 좌우 반전) 라벨을 폰 **바깥**으로 뺀다. RTL에서는 카드가 화면 왼쪽으로 가면서 라벨이 폰 화면을 덮기 때문이다. 꺾이는 방향은 **화면 기준**이라 이 블록에서만 물리 속성(`left`)을 쓴다.
- RTL에서 `.cohead`에 **`direction: ltr`**를 주는 이유: RTL 컨테이너에서는 flex `row`도 오른쪽→왼쪽이라 라벨이 다시 폰 위로 되뻗는다. 상자 순서만 물리적으로 고정하고 아랍어 본문 방향은 `.cotext`에서 `direction: rtl`로 되돌린다.
- **`.pwrap`의 `margin-right`(262px)는 라벨이 오른쪽으로 뻗을 자리**다. 줄이면 긴 언어(포르투갈어·스페인어)에서 라벨이 화면 밖으로 잘린다.
- **라벨은 화면폭에 따라 길이가 바뀐다.** 긴 것(`code_*_label`: "안전 코드 복사")과 짧은 것(`code_*_short`: "복사")을 **둘 다 출력**해 두고 `≤640px`에서 CSS로 교체한다(`.lg`/`.sm`). 좁은 화면에서는 긴 라벨이 화면 밖으로 나가기 때문이다. 짧은 쪽은 한 단어로 유지할 것 — 포르투갈어 `Compartilhar`가 가장 길어 여기서 폭이 결정된다.
- ⚠️ **좁은 화면에서 `.pwrap`을 왼쪽으로 미는 것은 `margin`이 아니라 `transform: translateX()`다.** `margin-right`를 늘려도 480px 이하에서는 컨테이너 정렬에 걸려 **더 이상 움직이지 않는다**(실측 확인). 라벨이 오른쪽으로 넘칠 때는 translateX 값을 조정한다 — 단 너무 밀면 반대로 폰 왼쪽이 화면 밖으로 나간다(360px에서 아랍어가 그 한계다).
- ⚠️ **점선은 `border: dashed`가 아니라 배경 패턴(`repeating-linear-gradient`)으로 그린다.** 좁은 화면에서 `.pwrap`이 0.55배로 줄면 `1.5px` 테두리가 **0.8px 미만**이 되어 Safari가 아예 그리지 않는다(iOS 실기기 확인, 2026-08-07). 배경 패턴은 축소돼도 살아남는다. `border-left`/`border-top` 방식으로 되돌리지 말 것.
- 점선이 카드 밖으로 뻗어야 하므로 `.codecard`는 `overflow: visible`이고, 원형 액센트만 안쪽 `.cbg`에서 자른다. `overflow:hidden`을 되돌리면 점선이 잘린다.

## 비공개 테스트 안내 페이지 (이 저장소에서 관리)

Google Play 비공개 테스트 / 마케팅용으로 만든 **자기완결형 단일 HTML** 2종. 둘 다 CSS·JS 인라인 + **스크린샷을 base64로 내장**해 의존성이 없다. `<meta name="robots" content="noindex,nofollow">`로 검색 비노출(unlisted) 처리 — 인증 기반 비공개는 GitHub Pages 한계로 불가, **URL을 아는 사람만 접근**.

| 페이지 | URL | 용도 | 성격 |
| --- | --- | --- | --- |
| `test/index.html` | **averic.co.kr/test/** | **비공개 테스터(전문 외주 업체)** | 절차 중심 단순 가이드. 메커니즘 설명 제외, "무엇을 누르는지"만 |
| `preview/index.html` | **averic.co.kr/preview/** | **마케팅 / 인플루언서** | 앱 동작·핵심기능까지 상세 설명 |

> ⚠️ `test/`·`preview/`의 `index.html`은 **직접 수정하지 말 것.** 아래 빌드 스크립트로 생성되는 산출물이다.

### 빌드 (소스 = `_beta-test-build/`)

`_` 접두 폴더라 **웹에 게시되지 않는다**. 편집·재생성은 여기서 한다.

```
_beta-test-build/
├── build_test.py        # → ../test/index.html    (테스터용 단순 버전)
├── build_preview.py     # → ../preview/index.html  (마케팅 상세 버전)
└── img/                 # 웹용으로 축소한 스크린샷(JPEG, 폭 560) — base64 소스
    ├── settings.jpg  safety_home.jpg  dashboard.jpg  add_subject.jpg
    └── connection_management.jpg  notifications.jpg  notifications_settings.jpg
```

```bash
cd _beta-test-build
python3 build_test.py      # test/index.html 재생성
python3 build_preview.py   # preview/index.html 재생성
```

- HTML 본문·CSS는 각 스크립트의 `HTML = r"""..."""` 문자열에 들어 있다. **문구/디자인 수정은 이 문자열을 고치고 재빌드**한다.
- 이미지는 `__IMG_SETTINGS__` 같은 토큰을 `img/`의 파일에서 읽어 `data:image/jpeg;base64,...`로 치환한다.
- 스크린샷 원본(고해상도)은 앱 저장소 쪽 `~/Desktop/안부 언어별 스크린샷/한국어/`의 PNG. 교체 시 `sips -Z 560 원본.png --out img/이름.jpg -s format jpeg -s formatOptions 82`로 축소해 `img/`에 넣고 재빌드.

### 두 페이지의 내용 범위

공통 전제: **G+S(보호자가 대상자 겸함) 방식**으로 테스트하되, "G+S" 같은 내부 약어는 노출하지 않고 앱의 실제 버튼 문구("내 안전 코드 생성")나 일반어("안부 보호 활성화")로 표현한다. Android 전용. 버그 보고 메일: **l10s18bok@naver.com**.

**`test/` (테스터용) 7단계:** ①설치&권한 허용 ②안부 보호 활성화 ③서로의 코드 연결(본인 코드 금지) ④안부시각 전원 동일(오후 12~6시) ⑤매일 루틴(★핵심: 하루 1회 실행→알림 확인→스와이프 종료) ⑥경고 시 '안전확인 완료' ⑦긴급 도움 요청(선택). 5번에 **알림 2종 구분**(💗 "안부 확인이 필요합니다"=내 안부 즉시 전송 / 그 외 주의·경고·긴급=내가 지켜보는 대상자 알림, 예약시각+2h 이후 터치) 포함.

**`preview/` (마케팅):** 위 흐름 + heartbeat 자동 전송 원리, +2시간 안전망, 스와이프 종료 이유, 권한 단계, 참고 화면(알림설정·연결관리) 등 상세.

### 핵심 UI 라벨 (앱 실제 문구 — 변경 시 두 페이지 동기화)

- 안부 보호 활성화 버튼: **내 안전 코드 생성** (활성화 후 같은 자리 → **내 안전 코드 확인**)
- 안부시각 변경: **안부 푸시 알림 시각 변경**
- 경고 해소 버튼: **안전확인 완료**
- 수동 보고: **지금 바로 안전 보고하기** / 긴급: **도움이 필요해요**
- ⚠️ 제공된 설정 스크린샷은 **활성화 후** 상태("내 안전 코드 확인")라, 테스터가 처음 보는 "내 안전 코드 생성"과 다르다 — 두 페이지 모두 이 차이를 명시하고 있으니 유지할 것.

## FAQ · 사용설명 페이지 (`_faq-build/`)

앱 사용자용 페이지 **두 종**을 만든다 — `{lang}/faq.html`(문제 해결)과 `{lang}/guide.html`(안전 코드로 가족과 연결하는 방법, 애니메이션). **상세 명세는 [`_faq-build/PRD-FAQ.md`](_faq-build/PRD-FAQ.md)** — 아래는 요약이다.

> ⚠️ 폴더 이름이 `_faq-build`지만 **두 페이지를 함께 만든다.** 나누지 않은 이유는 앱 문구 추출(`app-strings.json`)·언어 목록·앱 화면 복제 CSS(`mockup.css`)를 공유하기 때문이다 — 폴더를 나누면 그 셋이 두 벌이 되어 어긋나고, 그건 FAQ가 스크린샷을 버린 이유와 같은 문제다.

```
_faq-build/                    # 게시 제외
├── PRD-FAQ.md                 # 명세 (이 폴더의 권위)
├── extract_strings.py         # 앱 저장소 번역 → JSON
├── app-strings.json           # 앱 화면 문구. 손으로 고치지 말 것
├── common.py                  # 두 빌더 공용 (언어 메타·@키 치환·CSS 로딩)
├── base.css / footer.css      # 사이트 공통 (팔레트·헤더·푸터)
├── mockup.css                 # 앱 화면 복제 — 두 페이지 공용. 값은 앱 소스와 동일
├── guide-mockup.css           # 사용설명 전용 복제 (설정·연결 화면, 하단네비, 스낵바)
├── copy/{lang}.json           # FAQ 질문·답변        + copy/README.md
├── guide-copy/{lang}.json     # 사용설명 단계 설명
├── template.html              # FAQ 골격 + 목업
├── guide-template.html        # 사용설명 골격 + 목업 3종 + 애니메이션 JS
├── build_faq.py               # → ../{lang}/faq.html
└── build_guide.py             # → ../{lang}/guide.html
```

- **CSS를 나눠 둔 이유**: 앱 화면 복제 값(기기 폭 373, `#00685E`, 코드 42px 등)이 두 템플릿에 복붙되면 한쪽만 고쳐져 어긋난다. 각 템플릿은 자기 **본문 마크업**만 갖고 CSS는 같은 파일을 인라인한다.
- **`mockup.css`를 고칠 때는 FAQ도 함께 재빌드해 확인할 것** — 두 페이지가 공유한다.
- **사용설명 단계 수는 `guide-template.html`의 `STEPS`(JS)가 정한다.** `guide-copy`의 `steps` 배열 길이가 다르면 `build_guide.py`가 exit 1 한다(번호와 화면이 따로 놀기 때문).

- **스크린샷을 쓰지 않는다.** 앱 UI를 HTML/CSS로 재현하고, 앱 화면 문구는 앱 번역 파일에서 추출한다 — 20개 언어가 공짜이고, 앱 문구가 바뀌어도 낡지 않는다(근거는 PRD §1).
- **문장이 두 종류다.** 앱 화면 문구는 `app-strings.json`(추출), 질문·답변과 단계 설명은 `copy/`·`guide-copy/{lang}.json`(직접 작성). 카피에서 앱 문구를 인용할 때는 **`@키`**를 쓰며 **번역하지 않는다** — 번역하면 앱 화면과 어긋난다.
- **언어 목록은 `i18n/build.py`의 `META`/`ORDER`를 임포트해 쓴다.** 복제하면 어긋난다. **faq.html·guide.html의 스위처는 `build_faq.py`/`build_guide.py`가 직접 만들고 링크는 `/{code}/faq.html`로** 건다(홈으로 보내지 말 것). (`build.py`의 `patch_inplace()`는 홈 단일화 이후 미사용이다.)
- **언어 추가는 `copy/`·`guide-copy/`에 파일을 넣는 것으로 끝난다** — 빌더는 폴더에 있는 언어만 생성하며 스크립트를 고칠 필요가 없다. 스위처·`hreflang`도 같은 기준이라 없는 언어를 링크해 404를 내지 않는다.
- **홈 본문은 이제 한 곳만 고친다** — `i18n/template.html`(마크업) + `i18n/translations.json`(문구) → `python3 i18n/build.py`. 예전에는 ko/en이 손으로 쓴 페이지라 세 곳을 따로 고쳐야 했고, 그래서 조용히 어긋났다(예: `nav_guide` 링크). 2026-08-07에 ko/en 카피를 `translations.json`으로 옮겨 20개 언어를 모두 템플릿에서 생성하도록 통합했다 — 이주 직후 en은 손으로 쓴 원본과 **바이트 단위로 동일**했고 18개 언어도 무변화였다. ⚠️ **`{lang}/index.html`은 산출물이다 — 직접 수정 금지.** ⚠️ `translations.json`은 `{언어: {키: 값}}` 구조에 `indent=1`이라, 스크립트로 키를 추가할 때 형식을 유지하지 않으면 diff가 2600줄로 부푼다.
- ⚠️ **헤더 링크는 그 언어의 페이지가 실제로 있을 때만 넣는다.** 20개 언어 헤더에 먼저 링크를 걸면 아직 카피가 없는 언어가 404가 된다. FAQ·사용설명 모두 현재 20개 언어가 다 있다.
- `{lang}/faq.html`·`{lang}/guide.html`은 산출물 — 직접 수정 금지, 항상 재빌드.

```bash
cd _faq-build
python3 extract_strings.py   # 앱 문구가 바뀌었을 때만 (실패 시 exit 1)
python3 build_faq.py
python3 build_guide.py
```

## 배포 (git push)

GitHub Pages라 `main`에 push하면 자동 게시된다. **배포는 사용자가 요청할 때만** 수행한다.

```bash
cd /Users/macmini/Project/Anbu/averic-lab
git add -A
git commit -m "..."
git push        # → averic.co.kr 자동 반영
```

`test/`·`preview/`·`_beta-test-build/`는 커밋 `dd6987d`로 이미 배포되어 있다. `_` 접두 폴더는 저장소에만 보존되고 웹에는 노출되지 않는다.

## 규칙

- 응답·주석·커밋 메시지는 **한글**.
- `test/`·`preview/`는 산출물 — 항상 `_beta-test-build/`의 스크립트를 고쳐 재빌드.
- 배포는 사용자가 요청할 때만 `git push`.
