#!/bin/bash
# 숏폼 전체(또는 지정 언어) 렌더 → media/shorts/<언어>/<id>.mp4 + .jpg(포스터, 1초 지점)
#   ./render_all.sh              shorts.json 의 모든 언어 × 모든 편
#   ./render_all.sh en ja        지정 언어만
#   VIDEOS=neighbor-friends ./render_all.sh ko     지정 편만(쉼표로 여러 편) — 새 편을 만들 때 다른 편을 다시 인코딩하지 않는다
# 필요: PLAYWRIGHT_CORE (+ 헤드리스 셸이 없으면 CHROMIUM_PATH). README.md 참조. 동시 4개.
set -euo pipefail
cd "$(dirname "$0")"
python3 gen.py >/dev/null
LANGS="${*:-$(python3 -c 'import json;print(" ".join(json.load(open("shorts.json"))["langs"]))')}"
JOBS=$(python3 - "$LANGS" <<'PY'
import json, sys
cfg = json.load(open("shorts.json"))
import os
only = [x for x in os.environ.get("VIDEOS", "").split(",") if x]
for l in sys.argv[1].split():
    for v in cfg["videos"]:
        if only and v["id"] not in only:
            continue
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
# 소리 — 모든 편(편에서 "audio": false 만 제외). 배경음악 공통 + 편마다 효과음. 영상은 다시 인코딩하지 않는다.
for id in $(python3 -c 'import json,os;o=[x for x in os.environ.get("VIDEOS","").split(",") if x];print(" ".join(v["id"] for v in json.load(open("shorts.json"))["videos"] if v.get("audio") is not False and (not o or v["id"] in o)))'); do
  python3 audio.py "$id" $LANGS
done
python3 gen.py
# 홈 해질녘 영상·영상 페이지(/{언어}/shorts.html)는 영상 파일이 있는 편을 목록으로 삼는다 — 렌더 뒤 다시 만든다
python3 ../i18n/build.py >/dev/null
