#!/bin/bash
# 모든 장면 영상 + 효과음 렌더(4개씩 동시). 결과: out/<장면>.mp4, out/<장면>_sfx.wav
# 장면 하나만: SEGS="drop" tools/render_all.sh
cd "$(dirname "$0")/.." || exit 1
SEGS=${SEGS:-"never drop hook burden code complex simple os steps lang sos price end"}
echo $SEGS | tr ' ' '\n' | xargs -P ${P:-4} -I{} sh -c 'node tools/render.mjs {} video 32 > out/{}.log 2>&1 && node tools/render.mjs {} sfx >> out/{}.log 2>&1; echo done {} $(tail -1 out/{}.log)'
