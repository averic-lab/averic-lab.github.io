#!/bin/bash
# 세로판 19개 언어: 렌더 4개 동시(빠른 PNG, 무손실) → 프레임 검산 → 소리 섞기(직렬) → hq 복사·썸네일
cd "$(dirname "$0")"
export C="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
H=/Users/macmini/Project/Anbu/averic-lab/_shorts-build/.mix/hq
LANGS="ko en ja zh-CN zh-TW de fr es it pt-BR ru nl pl tr vi th id sv hi ar"
[ -f cues.json ] || node rshot.mjs cues cues.json
rend(){ l=$1; [ -f vdone_$l ] && exit 0
  FAST=1 PRESET=medium VLANG=$l CRF=18 node rshot.mjs video out_${l}_video.mp4 >/dev/null 2>&1
  n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 out_${l}_video.mp4)
  [ "$n" = "4140" ] && { touch vrender_$l; echo "RENDERED $l $(date +%H:%M)"; } || echo "FRAMES $l $n"; }
export -f rend
echo $LANGS | tr ' ' '\n' | xargs -P 4 -I{} bash -c 'rend {}'
for l in $LANGS; do [ -f vrender_$l ] || continue; [ -f vdone_$l ] && continue
  python3 mix.py out_${l}_video.mp4 out_$l.mp4 | tail -2 | tr '\n' ' '
  N=life-line-$l; [ $l = ko ] && N=life-line
  cp out_$l.mp4 $H/$N.mp4
  ffmpeg -y -loglevel error -ss 132.5 -i out_$l.mp4 -frames:v 1 -q:v 2 $H/$N-썸네일.jpg
  touch vdone_$l; echo "LANGDONE $l $(date +%H:%M)"; done
echo ALLDONE
