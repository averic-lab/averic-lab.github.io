#!/bin/bash
# tools/sheet.sh <장면> [폭=270] → out/<장면>_sheet.png (정지 화면을 시각 순으로 가로로 잇는다)
S=$1; W=${2:-270}; cd "$(dirname "$0")/../out/$S" || exit 1
FILES=$(ls still_*.png | sort -t_ -k2 -g)
ARGS=""; F=""; n=0; for f in $FILES; do ARGS="$ARGS -i $f"; F="$F[$n:v]scale=$W:-1[v$n];"; n=$((n+1)); done
for i in $(seq 0 $((n-1))); do F="$F[v$i]"; done
ffmpeg -loglevel error -y $ARGS -filter_complex "${F}hstack=inputs=$n" ../${S}_sheet.png && echo "../out/${S}_sheet.png ($FILES)" | tr '\n' ' '
