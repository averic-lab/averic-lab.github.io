#!/bin/bash
# usage: tools/make_lang.sh <lang>  — 한 언어의 「72시간」을 끝까지 만든다(글자 있는 장면 렌더 → 조립 → hq 복사 → 썸네일 → done 마커)
# 공용: out/s0.mp4·out/*_sfx.wav(언어 무관). 한 번에 Metal 렌더 하나만 — 여러 언어는 이 스크립트를 차례로 부른다(run_all.sh).
set -e
L=$1; cd "$(dirname "$0")/.."
export LANGID=$L
if [ "$L" = ko ]; then D=out; NAME=disaster-72h; else D=out/$L; NAME=disaster-72h-$L; fi
mkdir -p $D
for s in pop e1 e2 e3; do node tools/render.mjs $s video 48 > $D/$s.render.log 2>&1 || { echo "FAIL $L $s"; exit 1; }; done
python3 tools/assemble72.py 0.55 2.0 > $D/assemble.log 2>&1 || { echo "FAIL $L assemble"; exit 1; }
cp $D/disaster-72h.mp4 ../.mix/hq/$NAME.mp4
node tools/render.mjs e1 stills 7.6 96 > /dev/null 2>&1
mkdir -p "/Users/macmini/Documents/SNS Uploads/videos/$L"
ffmpeg -loglevel error -y -i $D/e1/still_7.60.png -q:v 2 "/Users/macmini/Documents/SNS Uploads/videos/$L/$NAME.jpg"
[ "$L" = ko ] || rm -f $D/pop.mp4 $D/e1.mp4 $D/e2.mp4 $D/e3.mp4 $D/_video.mp4 $D/_mix.wav
touch $D/done
echo "DONE $L"
