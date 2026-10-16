#!/bin/bash
cd "$(dirname "$0")"
export C="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
H=/Users/macmini/Project/Anbu/averic-lab/_shorts-build/.mix/hq; K=/Users/macmini/Project/Anbu/averic-lab/media/shorts/ko
one(){ # ORIG NEW K1 K2 OUT PFX
  d=$(python3 -c "print(round($3-0.0666666667,10))")
  ffmpeg -y -loglevel error -ss 0 -i $1 -t $d -c copy -avoid_negative_ts make_zero ${6}A.mp4
  ffmpeg -y -loglevel error -ss $4 -i $1 -c copy -avoid_negative_ts make_zero ${6}C.mp4
  printf "file ${6}A.mp4\nfile $2\nfile ${6}C.mp4\n" > ${6}l.txt
  ffmpeg -y -loglevel error -f concat -safe 0 -i ${6}l.txt -c copy $5
  ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $5; }
if [ ! -f ko7_done ]; then
  T0=100.9 T1=117.5666666667 CRF=18 node rshot.mjs video s7.mp4
  FMT=wide T0=100.1666666667 T1=116.8333333333 CRF=18 node rshot.mjs video w7.mp4
  one out_ko_video6.mp4 s7.mp4 100.9 117.566667 out_ko_video7.mp4 v7
  one out_wide_ko_video6.mp4 w7.mp4 100.166667 116.833333 out_wide_ko_video7.mp4 w7x
  python3 mix.py out_ko_video7.mp4 out_ko7.mp4 | tail -2; python3 mix.py out_wide_ko_video7.mp4 out_wide_ko7.mp4 | tail -2
  cp $H/life-line.mp4 $H/life-line-6차-3일간.mp4; cp $H/life-line-wide.mp4 $H/life-line-wide-6차-3일간.mp4
  for d in $H $K; do cp out_ko7.mp4 $d/life-line.mp4; cp out_wide_ko7.mp4 $d/life-line-wide.mp4; done
  touch ko7_done; echo KO7DONE
fi
for l in en ja zh-CN zh-TW de fr es it pt-BR ru nl pl tr vi th id sv hi ar; do
  [ -f done_$l ] && continue
  VLANG=$l FMT=wide CRF=18 node rshot.mjs video out_wide_${l}_video.mp4
  n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 out_wide_${l}_video.mp4)
  [ "$n" = "4140" ] || { echo "FRAMES $l $n"; continue; }
  python3 mix.py out_wide_${l}_video.mp4 out_wide_$l.mp4 | tail -2 | tr '\n' ' '
  cp out_wide_$l.mp4 $H/life-line-wide-$l.mp4
  ffmpeg -y -loglevel error -ss 132.5 -i out_wide_$l.mp4 -frames:v 1 -q:v 2 $H/life-line-wide-$l-썸네일.jpg
  touch done_$l; echo "LANGDONE $l $(date +%H:%M)"
done
echo ALLDONE
