#!/bin/bash
# tools/st.sh <장면> <시각들 쉼표> [폭=300] — 정지 화면 렌더 + 가로로 이어 붙임 → out/<장면>_sheet.png
S=$1; T=$2; W=${3:-300}; cd "$(dirname "$0")/.." || exit 1
rm -rf out/$S; node tools/render.mjs $S stills $T 16 2>&1 | grep -v "^still\|404"
cd out/$S; ARGS=""; F=""; n=0; for t in ${T//,/ }; do f=$(printf "still_%.2f.png" $t); ARGS="$ARGS -i $f"; F="$F[$n:v]scale=$W:-1[v$n];"; n=$((n+1)); done
for i in $(seq 0 $((n-1))); do F="$F[v$i]"; done
if [ $n -eq 1 ]; then ffmpeg -loglevel error -y $ARGS -vf scale=$W:-1 ../${S}_sheet.png; else ffmpeg -loglevel error -y $ARGS -filter_complex "${F}hstack=inputs=$n" ../${S}_sheet.png; fi && echo ok
