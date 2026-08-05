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
- ⚠️ 이 저장소에 `_config.yml`이 생긴 것은 이번이 처음이라, Jekyll 빌드가 "암묵적 기본값"에서 "우리 설정"으로 바뀌었다. **push 후 `averic.co.kr/ko/`가 정상 렌더되는지, `averic.co.kr/CLAUDE.md`가 404인지 반드시 확인**할 것.

## 사이트 구조

- `index.html` — 루트 스플래시(언어 자동 분기), `style.css`, `site.js`
- `ko/`, `en/`, `ja/` … (20개 언어 폴더) — 각 언어별 `index.html` / `privacy-policy.html` / `terms-of-service.html` / `faq.html`
- `i18n/` — 다국어 랜딩 빌드 도구(`build.py`, `template.html`, `translations.json`) — **`index.html`만 생성**한다
- `_faq-build/` — FAQ 빌드 도구 + `PRD-FAQ.md` (게시 제외). 상세는 아래 별도 절
- `CNAME` — `averic.co.kr`

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

## FAQ 페이지 (`_faq-build/`)

앱 사용자용 FAQ를 20개 언어로 제공한다(`{lang}/faq.html`). **상세 명세는 [`_faq-build/PRD-FAQ.md`](_faq-build/PRD-FAQ.md)** — 아래는 요약이다.

```
_faq-build/                    # 게시 제외
├── PRD-FAQ.md                 # 명세 (이 폴더의 권위)
├── extract_strings.py         # 앱 저장소 번역 → JSON
├── faq-strings.json           # 커밋됨. 손으로 고치지 말 것
├── template.html              # 페이지 골격 + 목업 마크업
└── build_faq.py               # JSON + 템플릿 → ../{lang}/faq.html × 20
```

- **스크린샷을 쓰지 않는다.** 앱 UI를 HTML/CSS로 재현하고, 문구는 앱 번역 파일에서 추출한다 — 20개 언어 번역이 공짜이고, 앱 문구가 바뀌어도 낡지 않는다(근거는 PRD §1).
- **언어 목록은 `i18n/build.py`의 `META`/`ORDER`를 임포트해 쓴다.** 복제하면 어긋난다. `build.py`의 `patch_inplace()`는 `index.html`만 갱신하므로 **faq.html의 스위처는 `build_faq.py`가 직접 만들고 링크는 `/{code}/faq.html`로** 건다(홈으로 보내지 말 것).
- `{lang}/faq.html`은 산출물 — 직접 수정 금지, 항상 재빌드.

```bash
cd _faq-build
python3 extract_strings.py   # 앱 문구가 바뀌었을 때만 (실패 시 exit 1)
python3 build_faq.py
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
