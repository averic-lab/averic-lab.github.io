#!/bin/bash
# 19개 언어를 차례로(이미 done 인 언어는 건너뛴다 — 끊겨도 다시 부르면 이어서)
cd "$(dirname "$0")/.."
for L in en ja zh-CN zh-TW de fr es it nl pt-BR ru ar tr pl vi th sv hi id; do
  [ -f out/$L/done ] && { echo "skip $L"; continue; }
  bash tools/make_lang.sh $L || echo "FAIL $L"
done
echo ALLDONE
