#!/bin/sh
# usage: sheet.sh <dir> <out.png> t1 t2 t3 ...   (각 장면을 360x640 로 줄여 가로로 이어 붙인다)
d=$1; o=$2; shift 2; args=""; n=0; fc=""
for t in "$@"; do args="$args -i $d/$t.png"; fc="$fc[$n:v]scale=${TW:-360}:${TH:-640}[v$n];"; n=$((n+1)); done
ins=""; i=0; while [ $i -lt $n ]; do ins="$ins[v$i]"; i=$((i+1)); done
ffmpeg -y -loglevel error $args -filter_complex "${fc}${ins}hstack=inputs=$n" $o
