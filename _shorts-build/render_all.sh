#!/bin/bash
# 숏폼 전체(또는 지정 언어) 렌더 → media/shorts/<언어>/<id>.mp4 + .jpg(포스터, 1초 지점)
#   ./render_all.sh              shorts.json 의 모든 언어 × 모든 편
#   ./render_all.sh en ja        지정 언어만
# 필요: PLAYWRIGHT_CORE (+ 헤드리스 셸이 없으면 CHROMIUM_PATH). README.md 참조. 동시 4개.
set -euo pipefail
cd "$(dirname "$0")"
python3 gen.py >/dev/null
LANGS="${*:-$(python3 -c 'import json;print(" ".join(json.load(open("shorts.json"))["langs"]))')}"
JOBS=$(python3 - "$LANGS" <<'PY'
import json, sys
cfg = json.load(open("shorts.json"))
for l in sys.argv[1].split():
    for v in cfg["videos"]:
        print(l, v["page"], v["id"])
PY
)
render_one() {
  local lang=$1 page=$2 id=$3 out="../media/shorts/$1"
  mkdir -p "$out"
  node render.mjs "$page" "$out/$id.mp4" --lang "$lang" >/dev/null
  ffmpeg -y -loglevel error -ss 1 -i "$out/$id.mp4" -frames:v 1 -q:v 3 -vf scale=540:-1 "$out/$id.jpg"
  echo "완료 $lang/$id"
}
export -f render_one
echo "$JOBS" | xargs -P 4 -L 1 bash -c 'render_one "$0" "$1" "$2"'
python3 gen.py
