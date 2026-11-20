# 「72시간」 재난 대비 3D 쇼츠 — 인수인계 (첫 시안 2026-11-18, 2차 11-19, 3차 11-20)

편 id `disaster-72h`, 91.3초(끝 장면 마지막 프레임 1초 연장 포함), 한국어 3차 시안.
**3차 원칙(사용자): 자막 최소화 — 장면만으로 이해되게, 앱 설명도 최소.** 설명 자막은 s0·pop·e2 모두 삭제, pop 꼬리표만 남기고 크게(`lib/caption.js` `tagSize`).
3차 추가(11-20): pop ⑥ 사람들 장에 **긴급 재난 문자 배너**(`_content.js` `ALERT`·`drawAlert`, 33.55–38.95초) + 경보음 853/960Hz ×3(`ALARM`, `_tail.js` sound) + 그 동안 사람들 휴대폰이 붉게 깜박임. 생존배낭 장에 아래쪽 꼬리표 '재난 후 72시간을 버티는 생존배낭'. 연결 안 되는 전화 신호음은 36.1초 뒤로 옮김. 사용자가 시안을 보고 디테일을 고칠 예정(스토리보드 단계는 사용자 지시로 건너뜀).
명세·자막 확정본은 `SPEC.md`(단 s0 는 9초, 로켓 착륙·비행 스포츠카 장면 추가 — 회사 이름·로고 금지).

## 장면과 파일
| 장면 | 파일 | 길이 | 비고 |
|---|---|---|---|
| s0 인트로(painted) | `segs/s0/style.js` | 9.0s | 마지막 프레임 `out/s0_last.png` → `segs/pop/intro.png`(팝업북 첫 페이지 인쇄) |
| pop 팝업북(바탕) | `segs/pop/style.js` ← **직접 고치지 말고** `_content.js`(장면)·`_tail.js`(카메라·통신선·눈·조명·소리) 고친 뒤 `python3 _build.py` | 46.6s | 원본 엔진 `_recipes/paper-pop-up.ref.js` 를 패치(lamp/txt/발광). 3차에서 자막이 전 구간에서 바뀌어 **한 번에 통째로 렌더**(`video 48`, 약 8분)했다 — `rebuild_pop.sh`·`pop_000*.mp4` 조각은 2차판(옛 자막)이라 쓰지 말 것. 2차판 `out/pop_v2.mp4` |
| e1 폰에서 튀어나오는 알림(device-hero + layer-stack) — **영상의 핵심 장면** | `segs/e1/style.js` ← **직접 고치지 말고** `_phone.js` 고친 뒤 `python3 _build.py` | 12.8s | 책장 넘김(`page.png` = 새 pop 마지막 프레임 — pop 을 다시 렌더하면 반드시 다시 뽑는다) → 어두운 스튜디오의 폰(화면 = 홈페이지 목업과 같은 보호자 대시보드) → 안부 알림·걸음수·주의·안전 코드 카드가 앱에서 하나씩 떠올라 층층이 자리 → 🚨 긴급 도움 요청 → 탭 → '🗺️ 위치 보기' → 탭 → 흰 화면. 렌더 로그에 카드별 화면 픽셀 범위가 찍힌다. 옛 장난감 블록판 `out/e1_v2_toyblocks_*.bak`, 네온판 `out/e1_v1_style.js.bak` |
| e2 위치 줌인 | `segs/e2/style.js` + `land.json`(Natural Earth 육지 윤곽 1.7MB) | 9s | 우주→한반도→동네 → 앱 「긴급 위치」 화면 (3차: 자막 삭제) |
| e3 엔딩(embossed) | `segs/e3/style.js` | 11.7s | 첫 카드: 가족들은 늘 / “난 괜찮아”라고 말합니다. / 하지만 / 정말 괜찮은(구리 박) / 걸까요? (아이콘은 `CARD1_BRAND=false` 로 첫 카드에서 뺐다). 마지막 카드: 아이콘·안부 / 스토어에서 안부 ‘Anbu’ 검색 / https://averic.co.kr. 2차판 `out/e3_v2_style.js.bak` |

## 조립
`python3 tools/assemble72.py 0.55 2.0` → `out/disaster-72h.mp4` (교차 전환, 음악 1곡, -22 LUFS). 고화질 사본 `../.mix/hq/disaster-72h.mp4`.
음악: Mixkit "No Turning Back"(`media/shorts/ko/bgm-후보/ai2/118_no-turning-back.mp3`, 22초 지점부터) **한 곡이 처음부터 끝까지**(2차 피드백: 알림 장면에서 곡이 바뀌면 흐름이 끊긴다).
⚠️ A 곡을 채택하면 `media/bgm/` 로 옮기고 `LICENSE-증빙.md` 에 한 행 추가(아직 안 함).

## 남은 일
- 사용자 시안 피드백 반영 → 한국어 확정 → (요청 시) 다국어. 3D 글자(津波避難場所 제외 한국어 화면 글자: 휴대폰 문구·알림 카드·앱 화면·엔딩)는 언어별 렌더 필요.
- e2 줌인 도착지는 언어별로 그 나라(사용자 승인된 제안) — 다국어 때 구현.
- 꼬리표의 연도는 모두 뺐다(2차 피드백). 팝업북은 바뀐 구간(프레임 440–945)만 다시 렌더해 `pop_00440.mp4` 로 끼워 넣었다 — 이전 판은 `out/pop_v1.mp4`.
- 커밋 안 함(소스만 커밋 가능, mp4·음원·.mix 금지). `land.json` 커밋 여부 미정.

## 4차(2026-11-20)
- pop 끝(`CLOSE` 45.4초~, pop 49.4초): 오른쪽 페이지 덩어리·뒤표지가 등뼈를 축으로 덮인다(`_tail.js` 8절 `updateClose`) → 뒤표지(천)에 '안부' + 아이콘 홈 → 아이콘 타일이 튀어 올라 동전처럼 두 바퀴 돌고 빛 조각으로 사라짐. 그림은 화면에 보이는 대로 그리고 텍스처를 180° 돌려 둔다(덮개가 뒤집히므로).
- e1 painted: s0 의 BRUSH·SURFACE 필터를 복사(붓 반경 `BRUSH_R=5` — 글자 가독성 때문에 s0 의 8보다 작게), 배경을 새벽 남보라·호박빛으로. 책장 넘김(page.png)은 뺐다. 매끈한 스튜디오판은 `out/e1_v3a_phone.js.bak`·`out/e1_v3b_studio.mp4`.
- 조립: pop→e1 교차 0.45초.

## 다국어·업로드 — 완료 (2026-11-20)
한국어 3차+4차 승인("좋다") → 19개 언어 렌더 → 20편 업로드·공개 → 홈페이지 반영까지 끝났다.
- 다국어 장치: `page.html?lang=` → `lang/<lang>.json`(`tools/gen_strings.py` 가 앱 dart·서버 messages.py·`../data/<lang>.js` + 새 문구 `lang/new.json` 으로 만든다). 글꼴 setter 를 고쳐 JP/SC/TC/Thai/Devanagari/Arabic 을 KR 앞에 둔다. 아랍어는 `ctx.direction='rtl'` + 배치 반전.
- e2 도착지: `tools/gen_land.py <world-atlas 폴더>` → `segs/e2/land/<lang>.json`(28MB, **커밋 안 함** — 다시 만들 수 있다). 도시 표는 그 파일 `CITY`.
- 렌더: `tools/run_all.sh`(언어별 done 마커, Metal 1개씩) → `tools/make_lang.sh <lang>` 가 pop·e1·e2·e3 → 조립 → `../.mix/hq/disaster-72h-<lang>.mp4` + 썸네일(`SNS Uploads/videos/<lang>/`). s0·효과음은 공용. 20편 모두 91.25초, -22.0 LUFS.
- 업로드(유튜브 20편 공개 + 네이버 클립 한국어): ID 는 `SNS Uploads/publish.json` 의 `disaster-72h/<lang>`. 한국어 `uxJt1OQqO1M`.
- 인스타 릴스 `Df8tDIrsbME`·스레드 `Df81480iQYG`(한국어, 해시태그만).
- 홈페이지: averic-lab `c4bafb7`(20개 언어 shorts.html + 포스터).
- ⚠️ 튀르키예어 유튜브 태그 칸에서 `ı` 가 `I` 로 바뀌어 들어갔다(`yalnIz yaşamak` 등). 제목·설명은 정상. 고치려면 Aside 로 태그만 다시 입력.
