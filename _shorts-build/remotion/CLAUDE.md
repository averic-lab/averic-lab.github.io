# 안부 모션 그래픽 쇼츠 — Remotion 프로젝트

React 컴포넌트로 장면을 만들고 Remotion이 프레임 단위로 렌더한다. 이 폴더는 averic-lab 공개 저장소 안에 있다.
상위 `../README.md`(문구 출처·소리 기준·화면 규칙·유튜브 게이트)가 그대로 적용된다 — 여기에는 Remotion 쪽 사용법만 적는다.

## 구조

| 경로 | 역할 |
|---|---|
| `src/index.ts` | 진입점(`registerRoot`) — 고치지 않는다 |
| `src/Root.tsx` | 컴포지션 등록부. 편마다 `<Composition>` 한 줄. `id` = `shorts.json` 의 편 id |
| `src/config/video.ts` | **규격 한 곳** — `SHORTS`(1080×1920·30fps·15초), `LANDSCAPE`, `secToFrames` |
| `src/config/layout.ts` | 안전 영역(좌우 12%·위 8%·아래 20%, 비율이라 해상도와 무관) |
| `src/lib/animation.ts` | `progress`·`pop`·`smooth`·`fadeInOut`·`stagger`·`mix` |
| `src/lib/audio.ts` | `beatToFrame`·`frameToBeat` |
| `src/lib/text.ts` | `splitText`(한·중·일 글자 / 그 외 단어, `Intl.Segmenter`)·`isRtl` |
| `src/lib/fonts.ts` | `UI_FONT` — 기존 HTML 쇼츠와 같은 시스템 글꼴 묶음(20개 언어, 네트워크 불필요) |
| `src/components/` | `AnimatedText`·`SafeFrame`(debug 선)·`GradientBackground`·`AppIcon` |
| `src/compositions/<편>/` | 편마다 폴더 하나. `Sample/` 은 동작 확인용 예시 — **연출을 본뜨지 않는다** |
| `public/` | `staticFile()` 로 읽는 에셋. `app-icon.png` = `../img/app-icon.png` 복사본 |
| `out/` | 렌더 결과(커밋 안 됨) |

## 새 편 만들기

1. `src/compositions/<편id>/` 에 컴포넌트를 만든다. props 는 zod 스키마 `videoSpecSchema.extend({ lang, …문구 })` 로 정의하고(Studio 오른쪽 패널에서 고칠 수 있다) `calculateMetadata` 로 규격을 props 에서 읽게 한다(`Sample.tsx` 의 `calculateSampleMetadata` 방식) — 그래야 해상도·fps·길이를 `--props` 나 Studio 에서 바꿀 수 있다.
2. `../shorts.json` `videos` 에 `{id, title, date, "engine": "remotion"}` 로 넣는다(`page` 없음) — `render_all.sh` 가 이 편을 건너뛴다. 그리고 `Root.tsx` 에 등록한다 — `schema` 를 넘기고 `defaultProps` 는 **객체 리터럴**로 적는다(변수·스프레드면 Studio 가 저장하지 못한다는 경고를 띄운다).
3. 장면 길이는 하드코딩한 프레임 수 대신 `durationInFrames`·`fps` 에서 계산한다(전체 길이를 바꾸면 따라오게).

## 지켜야 할 것 (렌더가 깨지는 원인)

- **모든 움직임은 `useCurrentFrame()` 의 함수**. CSS animation/transition, `Math.random()`, `Date.now()`, `setTimeout` 금지 — 프레임마다 결과가 달라지거나 깜빡인다. 난수는 `random('시드')`.
- 이미지는 `<Img>`, 소리는 `<Audio>`/`<Html5Audio>`, 영상은 `<OffthreadVideo>` 같은 Remotion 컴포넌트로 — 일반 `<img>` 는 로딩 전에 프레임이 찍힐 수 있다.
- 에셋 경로는 `staticFile('파일')`. `public/` 밖 파일은 읽지 못한다.
- `TransitionSeries`: 전체 길이 = 장면 합 − 전환 합. 전환은 이웃 장면보다 길 수 없고, 전환 두 개를 붙일 수 없다.
- 화면 배치는 `SafeFrame`(또는 `safeArea()`)으로 — 내용 가운데는 가로 50%, 좌우 12% 안쪽. `debug: true` 로 선을 켜서 확인하고 렌더 전에 끈다.
- 앱 아이콘은 `AppIcon`(실제 아이콘). 하트 도형 등으로 흉내 내지 않는다.

## 타이포그래피

- `AnimatedText` 는 `splitText()` 로 언어에 맞게 나눠 순서대로 튀어 오르게 한다. 아랍어는 `dir="rtl"` 이 자동으로 붙는다.
- 글자 크기는 `width` 비율로 잡는다(`width * 0.1` 등) — 해상도를 바꿔도 비율이 유지된다.
- 다국어는 문장이 길어진다(독일어·러시아어 2배 가까이). 한 줄 고정 대신 `textWrap: balance` + 구역 높이를 넉넉히. 문구는 `../shorts.json` `langs` 에서 가져와 props 로 넘긴다.

## 오디오

- `public/` 에 넣고 `<Audio src={staticFile('…')} />`. 음량은 `volume={(f) => …}` 로 프레임마다 지정.
- ⚠️ 상위 README 「소리」: Mixkit 원본은 커밋 금지 — `public/` 에 복사한 음원은 `.gitignore` 의 `public/*.mp3|wav|m4a` 로 제외된다. 크기 기준(-22 LUFS, True Peak -1.5)은 렌더 뒤 `ffmpeg -af loudnorm` 이나 `../audio.py` 방식으로 맞춘다.
- 박자에 맞출 때만 `beatToFrame(박, bpm, fps, 첫박초)`.

## 미리보기 · 렌더

```bash
npm run dev                                    # Studio (http://localhost:3000)
npm run list                                   # 등록된 컴포지션
npm run still -- Sample out/a.png --frame=60   # 정지 화면 한 장
npm run render -- Sample out/sample.mp4        # MP4
npm run render -- Sample out/x.mp4 --props='{"fps":60,"durationInSeconds":8}'   # 규격 바꿔 렌더 (나머지는 기본값)
npm run render -- Sample out/en.mp4 --props='{"lang":"en","title":"…"}'
npm run lint                                   # eslint + tsc — 렌더 전에 통과해야 한다
```

- 저장소용 사본은 용량을 줄여 `--crf=28`, 유튜브 원본은 `--crf=18`(커밋하지 않는다). 결과는 `../../media/shorts/<언어>/<파일명>.mp4` 규칙(상위 README)으로 옮긴다.
- 썸네일 jpg: `npm run still -- <id> <경로>.jpg --frame=<프레임> --image-format=jpeg`.
- Remotion 은 개인·3인 이하 회사 무료(remotion.dev/license).
