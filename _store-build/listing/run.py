import sys, importlib, re
sys.path.insert(0,'.')
from core import *
LIMIT = 3985   # 4000 한도에서 여유
for code in sys.argv[1:]:
    S = dict(importlib.import_module(code.replace('-','_')).S)
    for plat in ('a','i'):
        if plat == 'i' and S.get("langs_line_i") == "" and S.get("langs_line_a"):
            trial = dict(S); trial["langs_line_i"] = S["langs_line_a"]
            if len(assemble(trial, 'i')) <= LIMIT: S = trial     # 들어가면 iOS 도 지원 언어 줄을 둔다
        body = assemble(S, plat)
        n = write(code, plat, body)
        flag = "" if n <= 4000 else "  ⚠ 한도 초과"
        extra = "" if plat == 'a' else ("  (지원 언어 줄 포함)" if S.get("langs_line_i") else "  (지원 언어 줄 제외)")
        print(code, 'Play' if plat=='a' else 'iOS ', n, flag, extra)
