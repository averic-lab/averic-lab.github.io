import re, os
B = "/Users/macmini/Documents/스토어 앱 등록 정보"
FOLDER = {"ko":"한국어","en":"영어","ja":"일본어","zh-CN":"중국어(간체)","zh-TW":"중국어(번체)","de":"독일어","fr":"프랑스어","es":"스페인어",
          "it":"이탈리아어","pt-BR":"포르투갈어(브라질)","nl":"네덜란드어","ru":"러시아어","pl":"폴란드어","sv":"스웨덴어","tr":"터키어",
          "ar":"아랍어","hi":"힌디어","vi":"베트남어","th":"태국어","id":"인도네시아어"}

def assemble(S, plat):
    """plat: 'a'(Google Play) | 'i'(App Store). 키 접미사 _a/_i 가 있으면 플랫폼별, 없으면 공통.
    형식은 사용자가 확정한 한국어 Android 구조(■ 제목, 긴 항목 사이 빈 줄, 짧은 줄은 붙임)를 그대로 따른다."""
    g = lambda k: S[k + "_" + plat] if (k + "_" + plat) in S else S[k]
    P = [S["hook1"], S["hook2"], g("hook3"), S["hook4"]]
    P += ["■ " + S["why_title"] + "\n\n" + "\n\n".join("• " + g(k) for k in ("b_install","b_keep","b_steps","b_sos","b_both","b_nosignup","b_light","b_lang"))]
    if g("langs_line"): P += [g("langs_line")]   # iOS 는 한도 초과 시 langs_line_i="" 로 뺀다(설명은 검색 색인이 아니다)
    opt = []
    if plat == "a": opt.append("- " + S["opt_batt_a"])
    opt += ["- " + g("opt_act"), "- " + S["opt_loc"]]
    P += ["■ " + S["perm_title"] + "\n\n" + S["perm_intro"] + "\n\n" + S["req_title"] + "\n\n- " + g("req_noti")
          + "\n\n" + S["opt_title"] + "\n\n" + S["opt_intro"] + "\n\n" + "\n\n".join(opt), S["footnote"]]
    P += ["■ " + S["price_title"] + "\n\n" + "\n".join("• " + g(k) for k in ("p1","p2","p3","p4"))]
    P += [S["terms1"] + "\n" + S["terms2"], "■ " + S["note_title"] + "\n" + S["note"], S["contact"]]
    return "\n\n".join(P).strip()

def write(code, plat, body):
    path = f"{B}/{'안드로이드' if plat=='a' else 'ios'}/{FOLDER[code]}.txt"
    s = open(path, encoding="utf-8").read()
    hdr = "자세한 설명" if plat == "a" else "설명"
    m = re.search(r"(\[" + hdr + r"\]  \()(\d+)(자 / 4000자 제한\)\n-+\n)(.*)$", s, re.S)
    assert m, path
    open(path, "w", encoding="utf-8").write(s[:m.start()] + m.group(1) + str(len(body)) + m.group(3) + body + "\n")
    return len(body)

def current_body(code, plat):
    path = f"{B}/{'안드로이드' if plat=='a' else 'ios'}/{FOLDER[code]}.txt"
    s = open(path, encoding="utf-8").read()
    hdr = "자세한 설명" if plat == "a" else "설명"
    return re.search(r"\[" + hdr + r"\]  \(\d+자 / 4000자 제한\)\n-+\n(.*)$", s, re.S).group(1).strip()
