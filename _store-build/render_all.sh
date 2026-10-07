#!/bin/bash
# 20개 언어 × (Play, App Store) 전체 렌더 — 사용: ./render_all.sh [언어코드 ...]
cd "$(dirname "$0")"
LANGS=${@:-ko en ja zh-CN zh-TW de fr es it pt-BR nl ru pl sv tr ar hi vi th id}
for l in $LANGS; do
  node render.mjs --lang $l --store google >/dev/null && node render.mjs --lang $l --store apple >/dev/null && echo "$l OK"
done
