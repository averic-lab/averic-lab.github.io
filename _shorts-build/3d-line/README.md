# 삶의 선 쇼츠 (3d-line) — 2026-10-15, 방식 4 "새로운 방식"

한 사람의 삶을 시간 축으로 길게 이어진 **빛의 선**으로 그리고, 카메라가 물러나며 모든 선이 한 점(죽음)에서 만나는 것을 보여 준 뒤,
그 길 위에서 안부가 매일 곁의 사람에게 닿다가 어느 날 멈추면 곁의 사람에게 알림이 가는 것까지 이어 가는 138초 영상.
three.js(WebGL) + 2D 오버레이(자막·푸시·엔딩). `3d/`(anbu-3d)의 렌더러·텍스트 배치를 재사용했다.

## 지켜야 할 것 (사용자 지시)
- **외계인·상위 존재·차원을 떠올리는 말은 자막·설명 어디에도 쓰지 않는다.** 현실적인 일상의 불안을 안부로 잇는다.
- 앱을 주어로 "늦춘다/구한다/알린다(끝을)"고 쓰지 않는다. 앱이 아는 것은 "오늘 안부가 오지 않았다"뿐이다.
- 화면 자막의 "죽음"은 장면 5에서 한 번(스스로 끝낸다로 읽힐 문장 금지). 줄거리: 점 → 선 → 끝 → 수렴 → 죽음 → 안부 → 멈춤 → 알림 → 엔딩.
- 곡: Mixkit Staring at the Night Sky(Ahjay Stelino, 2:22) — 이 편 전용. 참고 영상의 M83 Outro 는 상업 음원이라 쓰지 않는다. 원본은 `media/bgm/`(커밋 금지).

## 빌드
`node_modules` 는 두지 않는다. 작업 폴더에서:
```bash
npm i three@0.186.1 esbuild@0.28.2 playwright-core@1.63.0
python3 gen_line_strings.py <서버 저장소> ../3d/manual.json      # strings.json (문구 = line_text.json + 서버 푸시 문구)
./build.sh                                                        # main.bundle.js
python3 -m http.server 8777 &                                     # ⚠️ 8765 는 다른 서버(3d 작업)가 쓸 수 있다
export C="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
node rshot.mjs stills 10,66,125 st          # 정지 화면
node probe.mjs 0 30 62 100                  # 점·끝 점의 화면 좌표(밖으로 새는지)
node rshot.mjs video out_video.mp4          # 전체(약 20분, CRF=18)
node rshot.mjs cues cues.json && python3 mix.py out_video.mp4 out.mp4
```

## 규칙·교훈
- **카메라 키는 `mk(t, 대상, 거리, 화면 세로 sy, 화각, 방향)`** — 점(D)·끝 점(E)·선 전체(M)가 화면의 sy 에 오도록 바라볼 점을 계산한다. 위치·바라보는 점을 직접 적으면 점이 화면 밖으로 샌다(16~24초에 -365px 까지 갔다).
  보간은 **단조 3차(PCHIP)** — Catmull-Rom 은 키 간격이 크면 키를 넘어 튀어 85초에 점 바로 앞(z=0.6)까지 파고들었다.
- **선은 화면 픽셀 두께의 리본(셰이더)** — 월드 두께 튜브는 가까이서 팔뚝만 해진다. 다른 사람들의 선도 먼지만으로는 끊겨 보여 가는 리본(스레드)을 함께 쓴다.
- **고리 크기는 화면 픽셀 기준** — 월드 크기로 두면 카메라가 가까운 장면에서 화면을 덮는다.
- **푸시 배너는 인과 순서**: 파동이 나가고 → 곁의 선에 닿고(+KIN_FLASH_DELAY) → 그 사람 폰에 알림. `BANNERS`·`window.SFX` 가 `PULSES` 에서 계산한다.
- 자막 뒤에 부드러운 어두운 받침을 둔다(끝 점 빛 위에서 "죽음"이 안 읽혔다). 자막은 아래 가림선(768)을 넘지 않게 줄이 늘면 위로 올린다.
- 8765 포트는 이전 작업(3d)의 서버가 남아 있을 수 있다 — 같은 포트로 서버를 띄우면 조용히 실패하고 **옛 영상이 렌더된다**. 8777 을 쓴다.
- 영상 mp4 는 저장소에 커밋하지 않는다(유튜브 공개 후 사이트 연결 — anbu-3d 와 같은 방식).

## 자막 몇 줄만 고칠 때 — 바뀐 구간만 렌더해 이어 붙인다 (전체 35분 → 약 7분, 2026-10-16 검증)
자막·팝업처럼 **한 구간에만 닿는 수정**은 전체를 다시 그리지 않는다. 안 바꾼 구간은 스트림 복사라 **원본과 프레임이 완전히 같다(PSNR inf)**.
1. 키프레임 시각을 본다: `ffprobe -select_streams v:0 -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 out_video.mp4`
2. 바뀌는 시각을 **포함하는 키프레임 구간 [Ka, Kb]** 를 고른다(자막은 시작~끝+페이드 0.8초). 그 구간만 렌더: `T0=<Ka> T1=<Kb> CRF=18 node rshot.mjs video segN.mp4` (T0·T1 은 프레임 정수배 — 소수 10자리까지 적는다).
3. 원본을 키프레임에서 잘라 복사: `ffmpeg -ss <시작> -i orig -t <길이> -c copy -avoid_negative_ts make_zero X.mp4`
   ⚠️ **`-t` 는 B 프레임 지연(2프레임) 때문에 2프레임 더 들어온다** — 앞·가운데 조각은 길이에서 2/30초를 뺀다(마지막 조각은 `-t` 없이). 프레임 수로 반드시 검산(`-count_frames`).
4. `concat` 목록(A, 새1, B, 새2, C)으로 `ffmpeg -f concat -safe 0 -i list.txt -c copy`.
5. 검산: 전체 프레임 수(4140)·길이(138.000)·프레임 간격이 30fps 인 것(이상 0건)·안 바꾼 프레임 PSNR inf·이음매 앞뒤 프레임 눈으로. 그다음 `mix.py` 로 소리를 다시 섞는다(영상은 복사).
카메라·조명·배경처럼 **전 구간에 닿는 수정**은 이 방법을 쓰지 말고 전체를 다시 렌더한다.

## 가로판(16:9) — Google Play 소개 영상 (2026-10-16)
세로판과 **같은 소스·같은 문구**로 `?fmt=wide`(렌더러는 `FMT=wide`) 한 줄만 다르다. 옵션이 없으면 세로판은 픽셀까지 그대로다(PSNR inf 로 검증).
- 해상도 1920×1080(CSS 960×540 ×2). 카메라 `up=(-1,0,0)` 로 **삶의 선이 왼쪽→오른쪽**(시간이 오른쪽으로 흐름)으로 눕고, 끝 점(모든 선이 만나는 곳)은 오른쪽에 온다.
- 카메라 키는 `mkw(t, 대상, 거리, sx, sy, 화각, dir)` — 세로판 `mk` 의 가로 대응. `dir` 은 (오른쪽, 위, 뒤) → 월드 (-위, 오른쪽, 뒤). 점·끝 점이 화면 안에 있는지 `FMT=wide node probe.mjs 0 30 66 …` 로 잰다.
- 자막은 같고 **줄 수가 많은 것만 줄바꿈을 따로 둔다**: `line_text.json` 의 `caps_w`(c12), `ending.head_w`. 엔딩 스토어 문구는 `store_w`("Google Play에서 “Anbu” 검색") — 세로판은 "App Store · Google Play". 가로판 자막 y 는 432(c9 만 345), 아래 끝 498(플레이어 컨트롤 막대 위).
- 렌더: `FMT=wide CRF=18 node rshot.mjs video out_wide.mp4` (약 35분, 세로판과 픽셀 수가 같다) → `python3 mix.py out_wide.mp4 out.mp4`(소리는 세로판과 같은 큐).
- ⚠️ 부분 렌더·이어 붙이기(위 절)는 가로판에도 같은 방식으로 쓸 수 있다(키프레임은 가로판 mp4 에서 새로 뽑는다).

## 세로판 개정(2026-10-17) · 가로판 문구 보존
세로판은 사용자 확정 개정안(c1~c14·엔딩 다듬기, c11 "전해져야"·c15 "계속됩니다"·c16 "도착하지 않으면"은 이전 문구 유지)과 19개 언어 재번역을 `line_text.json` 에 담았다.
이미 올라간 가로판 20편의 문구는 `line_text_wide.json`(개정 전) 이다 — 가로판을 다시 만들 때는 `TEXT=line_text_wide.json python3 gen_line_strings.py …` 로 strings.json 을 만든다.
렌더는 `FAST=1`(CDP 무손실 PNG, `optimizeForSpeed`) + `PRESET=medium` + 4개 동시(`pipeline_v.sh`)로 150프레임 74초 → 약 7초(총 10배 이상).
