import re, sys, os
sys.path.insert(0,'.'); sys.path.insert(0,"/Users/macmini/Project/Anbu/averic-lab/_faq-build"); sys.path.insert(0,"/Users/macmini/Project/Anbu/averic-lab/i18n")
from core import *
import extract_strings as ex, build as site
BK = B + "/_백업_20261008"
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-⛿✀-➿]")   # ★(U+2605)는 기호라 제외하려 아래에서 따로 처리
HANGUL = re.compile("[가-힣]")
def dart(code):
    lf = site.LANG_TO_STRINGS[code]; return open(ex.TRANS + f"/{lf}.dart", encoding="utf-8").read()
def val(src, k):
    m = re.search(rf"'{re.escape(k)}'\s*:\s*{ex.VALUE_RE}", src)
    return ex.unescape(m.group(1) if m.group(1) is not None else m.group(2))
bad = 0
def err(msg):
    global bad; bad += 1; print("  ✗", msg)
for code in FOLDER:
    for plat in ('a','i'):
        p = f"{B}/{'안드로이드' if plat=='a' else 'ios'}/{FOLDER[code]}.txt"; bp = p.replace(B, BK)
        s = open(p, encoding="utf-8").read(); b0 = open(bp, encoding="utf-8").read()
        hdr = "자세한 설명" if plat == 'a' else "설명"
        m = re.search(r"\[" + hdr + r"\]  \((\d+)자 / 4000자 제한\)\n-+\n(.*)$", s, re.S)
        mb = re.search(r"\[" + hdr + r"\]  \((\d+)자 / 4000자 제한\)\n-+\n(.*)$", b0, re.S)
        body = m.group(2).strip(); tag = f"{code:6}{'Play' if plat=='a' else 'iOS '}"
        if int(m.group(1)) != len(body): err(f"{tag} 헤더 {m.group(1)} ≠ 실제 {len(body)}")
        if len(body) > 4000: err(f"{tag} 4000자 초과 {len(body)}")
        if s[:m.start()] != b0[:mb.start()]: err(f"{tag} 설명 이외의 필드가 바뀜")
        if code != 'ko' and HANGUL.search(body): err(f"{tag} 한글 잔존: {HANGUL.findall(body)[:5]}")
        # 이모티콘: iOS 는 금지, Android 는 등급 이모티콘 3개(🟡🟠🔴)만
        em = [c for c in body if EMOJI.match(c) and c != '★']
        if plat == 'i' and em: err(f"{tag} iOS 에 이모티콘 {em}")
        if plat == 'a' and sorted(em) != sorted(['🟡','🟠','🔴']): err(f"{tag} Play 이모티콘 이상 {em}")
        if plat == 'i' and re.search(r"Android|안드로이드|Google Play|Google-Play|أندرويد|安卓|アンドロイド|Androidem", body): err(f"{tag} iOS 에 Android/Google Play 언급")
        if plat == 'a' and re.search(r"App Store", body): err(f"{tag} Play 에 App Store 언급")
        if plat == 'a' and "Google Play" not in body and "Google-Play" not in body: err(f"{tag} Play 해지 안내 없음")
        if plat == 'i' and "App Store" not in body: err(f"{tag} iOS 구독 안내 없음")
        # ★ 중요 표시: Play 는 알림 제외 배터리 1개(필수 알림은 평문), iOS 는 알림 1개
        stars = body.count('★')
        if (plat == 'a' and stars != 1) or (plat == 'i' and stars != 1): err(f"{tag} ★ 개수 {stars}")
        # URL 언어 코드
        urls = re.findall(r"averic\.co\.kr/([^/]+)/", body)
        if len(urls) != 2 or set(urls) != {code}: err(f"{tag} URL 언어코드 {urls}")
        # [버튼] 이름은 앱 번역 값과 같아야 한다
        if code != 'ko':
            src = dart(code); labels = {val(src,'subject_home_emergency_button'), val(src,'gs_enable_button')}
            for lab in re.findall(r"[\[［]([^\]］]+)[\]］]", body):
                if lab not in labels: err(f"{tag} 버튼 이름 불일치 [{lab}] ≠ {labels}")
            if plat == 'i' and f"[{val(src,'gs_enable_button')}]" not in body.replace("［","[").replace("］","]"): err(f"{tag} gs_enable_button 없음")
            if plat == 'a' and f"[{val(src,'gs_enable_button')}]" in body.replace("［","[").replace("］","]"): err(f"{tag} Play 에 gs_enable_button 이 있음")
        # ── 앱이 검증해 둔 OS 설정 이름·등급명과 일치하는지 ──
        if code != 'ko':
            src = dart(code); norm = lambda t: t.replace("\u00a0", " ")
            nb = norm(body)
            QU = re.compile(r'[«“„”"「]([^»”“"」]+)[»”“"」]')
            if plat == 'a':
                terms = [norm(x).strip() for x in QU.findall(val(src, 'stability_battery_dialog_message'))][:2]
                for t in terms:
                    if t not in nb: err(f"{tag} 배터리 용어 '{t}' 가 앱 문구와 다름")
            act = val(src, 'gs_activity_permission_settings_body')
            mm = re.search(r"[(（]([^)）]+)[)）]", act); ios_name = norm(mm.group(1)).strip()
            before = act[:mm.start()].rstrip(" \u00a0“”\"»」")
            parts = re.split(r'[«“„”"「]', before)
            and_name = norm(parts[-1]).strip() if len(parts) > 1 else " ".join(before.split()[-2:])
            if plat == 'a' and and_name not in nb: err(f"{tag} 신체 활동 권한 이름 '{and_name}' 불일치")
            if plat == 'i' and ios_name not in nb: err(f"{tag} 모션 및 피트니스 이름 '{ios_name}' 불일치")
            for k in ('guardian_status_caution','notifications_level_warning','notifications_level_urgent'):
                if norm(val(src,k)) not in nb: err(f"{tag} 등급명 {k}='{val(src,k)}' 불일치")
print("총 오류:", bad)
