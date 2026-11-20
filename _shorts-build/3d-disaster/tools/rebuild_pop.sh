#!/bin/sh
# 팝업북 pop.mp4 다시 잇기(2차 시안 기준). 꼬리표 연도를 뺀 구간(프레임 440–944)만 pop_00440.mp4 로 다시 렌더했으므로
# 00090 은 앞 350프레임(90–439)만, 00520 은 425번째부터(945–959)만 쓴다. ⚠️ pop_list.txt 로 이으면 옛 '2026' 꼬리표가 돌아온다.
cd "$(dirname "$0")/../out" && ffmpeg -v error -y -i pop_00000.mp4 -i pop_00090.mp4 -i pop_00440.mp4 -i pop_00520.mp4 -i pop_00960.mp4 \
  -filter_complex "[1:v]trim=start_frame=0:end_frame=350,setpts=PTS-STARTPTS[b];[3:v]trim=start_frame=425,setpts=PTS-STARTPTS[d];[0:v][b][2:v][d][4:v]concat=n=5:v=1[v]" \
  -map "[v]" -c:v libx264 -crf 14 -pix_fmt yuv420p -r 30 pop.mp4 && echo "pop.mp4 다시 이음"
