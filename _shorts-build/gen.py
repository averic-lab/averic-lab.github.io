"""숏폼 데이터·검토 페이지 생성기.

  python3 gen.py            data/<언어>.js 20개 + preview/shorts/ 폴더 페이지 생성

문구 출처(한 곳씩만):
  · 영상에만 나오는 문구          shorts.json langs
  · 앱 화면 문구                  앱 저장소 translations/*.dart (extract_strings.py 파서 재사용)
  · 푸시 제목                     서버 저장소 i18n/messages.py (push_auto_report_title)
  · 엄마 호칭·엔딩 문장            i18n/translations.json (nick1, dawn_q3_html)
시각·숫자·날짜 형식은 페이지가 브라우저 Intl 로 만든다(언어별 12/24시간제가 자동으로 갈린다).
"""
import html, importlib.util, json, os, re, sys
from datetime import datetime
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "i18n"))
sys.path.insert(0, os.path.join(ROOT, "_faq-build"))
import build as site                       # noqa: E402  META / ORDER / LANG_TO_STRINGS
import extract_strings as ex               # noqa: E402  TRANS / VALUE_RE / unescape

APP_KEYS = ["app_name", "app_guardian_title", "guardian_today_summary", "guardian_checking_subjects",
            "guardian_subject_list", "guardian_status_normal", "guardian_activity_prefix",
            "guardian_activity_active", "guardian_activity_very_active", "guardian_activity_needs_exercise",
            "guardian_chart_y_axis_steps", "guardian_chart_x_axis_last_7_days",
            "guardian_last_check_now", "add_subject_button", "noti_steps_body",
            "add_subject_title", "add_subject_code_label", "add_subject_alias_label", "add_subject_connect",
            "add_subject_success"]
SERVER_MESSAGES = os.path.join(os.path.dirname(ROOT), "anbucheck-server", "i18n", "messages.py")
MEDIA = os.path.join(ROOT, "media", "shorts")
PREVIEW = os.path.join(ROOT, "preview", "shorts")


def app_strings(lang_file):
    with open(os.path.join(ex.TRANS, f"{lang_file}.dart"), encoding="utf-8") as f:
        src = f.read()
    out = {}
    for k in APP_KEYS:
        m = re.search(rf"'{re.escape(k)}'\s*:\s*{ex.VALUE_RE}", src)
        if not m:
            sys.exit(f"오류: {lang_file}.dart 에 {k} 가 없습니다")
        out[k] = ex.unescape(m.group(1) if m.group(1) is not None else m.group(2))
    return out


def server_messages():
    spec = importlib.util.spec_from_file_location("srv_messages", SERVER_MESSAGES)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.MESSAGES


def utc_iso(tz, hh, mm):
    return datetime(2026, 9, 19, hh, mm, tzinfo=ZoneInfo(tz)).astimezone(ZoneInfo("UTC")).isoformat()


def load():
    with open(os.path.join(HERE, "shorts.json"), encoding="utf-8") as f:
        return json.load(f)


def lang_data(code, cfg, site_tr, msgs):
    s = dict(cfg["langs"][code])
    lf = site.LANG_TO_STRINGS[code]
    a = app_strings(lf)
    bcp, direction = site.META[code][0], site.META[code][1]
    q1, q2 = site_tr[code]["dawn_q3_html"].split("<br>", 1)
    locale = lf[:2] + "_" + lf[3:].upper()
    s.update({
        "bcp": bcp, "dir": direction,
        "mom": site_tr[code]["nick1"],
        "app_name": a["app_name"], "guardian_title": a["app_guardian_title"],
        "phead": a["guardian_checking_subjects"].replace("@count", "1").replace("\n", "<br>"),
        "psum": a["guardian_today_summary"], "plist": a["guardian_subject_list"],
        "legend": a["guardian_status_normal"] + ": 1", "pill": "✅ " + a["guardian_status_normal"],
        # 활동량 라벨 — 앱과 같이 7일 평균으로 고른다(engine.js setWeek)
        "act": a["guardian_activity_prefix"] + ": " + a["guardian_activity_active"],
        "act_very": a["guardian_activity_prefix"] + ": " + a["guardian_activity_very_active"],
        "act_need": a["guardian_activity_prefix"] + ": " + a["guardian_activity_needs_exercise"],
        "steps": a["guardian_chart_y_axis_steps"], "last7": a["guardian_chart_x_axis_last_7_days"],
        "last_now": a["guardian_last_check_now"], "add": a["add_subject_button"],
        # 보호 대상자 연결 화면(동네 친구 편) — 앱 화면 그대로
        "as_title": a["add_subject_title"], "as_code": a["add_subject_code_label"],
        "as_alias": a["add_subject_alias_label"], "as_connect": a["add_subject_connect"],
        "as_success": a["add_subject_success"],
        "steps_tpl": a["noti_steps_body"],
        "push_title": msgs[locale]["push_auto_report_title"],
        "q1": q1.strip(), "q2": q2.strip(),
        # B — 부모 쪽 밤 11:40 과 그때 자녀 쪽 시각(실제 시간대로 계산), 보낸 메시지 21:12
        "b_now": utc_iso(s["home_tz"], 23, 40), "b_sent": utc_iso(s["home_tz"], 21, 12),
    })
    return s


def rendered(code, vid):
    return os.path.exists(os.path.join(MEDIA, code, f"{vid}.mp4"))


PAGE_HEAD = """<!doctype html>
<html lang="{lang}"{dir}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>{title} · Averic Lab</title>
<style>
  :root {{ --bg:#0a0e2a; --tx:#e9ecf6; --tx2:#a8b0cc; --bd:rgba(255,255,255,.10); }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--tx); line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }}
  .wrap {{ max-width: 960px; margin: 0 auto; padding: 28px 16px 64px; }}
  h1 {{ font-size: 22px; margin: 0 0 6px; }}
  .note {{ color: var(--tx2); font-size: 14px; margin: 0 0 24px; word-break: keep-all; }}
  a {{ color: #8b9cf0; }}
  .back {{ display: inline-block; margin-bottom: 14px; font-size: 14px; text-decoration: none; }}
  .folders {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }}
  .folder {{ display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px;
    background: rgba(255,255,255,.05); border: 1px solid var(--bd); color: var(--tx); text-decoration: none; }}
  .folder:hover {{ background: rgba(255,255,255,.09); }}
  .folder svg {{ width: 30px; height: 30px; flex: none; fill: #ffcf6b; }}
  .folder b {{ display: block; font-size: 15px; }}
  .folder span {{ font-size: 12.5px; color: var(--tx2); }}
  .folder.empty {{ opacity: .45; pointer-events: none; }}
  .folder.empty svg {{ fill: #7b84a6; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 28px; }}
  figure {{ margin: 0; }}
  video {{ display: block; width: 100%; max-width: 340px; aspect-ratio: 9 / 16; margin: 0 auto;
    border-radius: 18px; background: #000; border: 1px solid var(--bd); }}
  figcaption {{ max-width: 340px; margin: 12px auto 0; font-size: 14px; color: var(--tx2); word-break: keep-all; }}
  figcaption b {{ display: block; color: var(--tx); font-size: 16px; }}
  .dl {{ display: inline-block; margin-top: 6px; padding: 6px 14px; border-radius: 16px;
    background: rgba(139,156,240,.16); text-decoration: none; font-weight: 600; }}
</style>
</head>
<body>
<div class="wrap">
"""
FOLDER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4.2l2 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def gen_preview(cfg):
    ko = cfg["langs"]["ko"]
    items = []
    for code in site.ORDER:
        n = sum(rendered(code, v["id"]) for v in cfg["videos"])
        label = site.META[code][4]
        cls = "folder" + ("" if n else " empty")
        items.append(f'    <a class="{cls}" href="{code}/">{FOLDER_SVG}<div><b>{html.escape(label)}</b>'
                     f'<span>{code} · {"영상 " + str(n) + "편" if n else "준비 중"}</span></div></a>')
    root = PAGE_HEAD.format(lang="ko", dir="", title="숏폼 영상 보관함") + f"""  <h1>숏폼 영상 보관함</h1>
  <p class="note">검색에 노출되지 않는 내부 페이지입니다. 언어 폴더를 누르면 그 언어의 영상을 보고 내려받을 수 있습니다. 배경음악·효과음이 들어 있는 영상은 재생하면 소리가 납니다(소리가 없는 영상은 업로드할 때 각 플랫폼에서 음악을 붙입니다).</p>
  <div class="folders">
{chr(10).join(items)}
  </div>
</div>
</body>
</html>
"""
    write(os.path.join(PREVIEW, "index.html"), root)

    for code in site.ORDER:
        L = cfg["langs"][code]
        figs = []
        for v in sorted(cfg["videos"], key=lambda v: v["date"], reverse=True):
            if not rendered(code, v["id"]):
                continue
            src = f"../../../media/shorts/{code}/{v['id']}"
            local = html.escape(L[v["title"]])
            kor = html.escape(ko[v["title"]])
            sub = "" if code == "ko" else f"<span>{kor}</span> · "
            figs.append(f'    <figure><video src="{src}.mp4" poster="{src}.jpg" controls playsinline preload="metadata"></video>'
                        f'<figcaption><b dir="auto">{local}</b>{sub}{v["date"]} · {v["id"]}.mp4<br>'
                        f'<a class="dl" href="{src}.mp4" download="anbu-{code}-{v["id"]}.mp4">내려받기</a></figcaption></figure>')
        body = "\n".join(figs) if figs else '    <p class="note">아직 영상이 없습니다.</p>'
        label = site.META[code][4]
        page = PAGE_HEAD.format(lang="ko", dir="", title=f"숏폼 · {label}") + f"""  <a class="back" href="../">← 전체 언어</a>
  <h1>{html.escape(label)} <span style="color:var(--tx2);font-weight:400">({code})</span></h1>
  <p class="note">최신 영상이 위에 옵니다. [내려받기]로 원본(1080×1920 mp4)을 받을 수 있습니다.</p>
  <div class="grid">
{body}
  </div>
</div>
</body>
</html>
"""
        write(os.path.join(PREVIEW, code, "index.html"), page)


def main():
    cfg = load()
    with open(os.path.join(ROOT, "i18n", "translations.json"), encoding="utf-8") as f:
        site_tr = json.load(f)
    msgs = server_messages()
    for code in site.ORDER:
        d = lang_data(code, cfg, site_tr, msgs)
        write(os.path.join(HERE, "data", f"{code}.js"),
              "window.L = " + json.dumps(d, ensure_ascii=False, indent=1) + ";\n")
    gen_preview(cfg)
    print(f"data/*.js {len(site.ORDER)}개 + preview/shorts/ 생성")


if __name__ == "__main__":
    main()
