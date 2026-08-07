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
