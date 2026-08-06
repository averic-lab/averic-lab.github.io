#!/usr/bin/env python3
"""안부 앱 번역 파일에서 두 페이지(FAQ·사용설명)에 필요한 문구만 추출해 app-strings.json으로 저장한다.

    python3 extract_strings.py
    git diff app-strings.json   # 무엇이 바뀌었는지 확인 후 커밋

앱 저장소를 빌드 시점에 읽지 않고 JSON을 중간에 두는 이유는 PRD-FAQ.md §3 참조.

⚠️ 파서가 반드시 처리해야 하는 것 (전부 실측으로 확인된 함정 — 단순화하지 말 것):
  1. 작은따옴표와 큰따옴표 양쪽 — it_it.dart만 큰따옴표를 쓴다.
     작은따옴표만 처리하면 그 한 줄을 조용히 놓쳐 빈 값이 들어간다.
  2. 키 다음 줄로 이어지는 값 — ru_ru, ko_kr 등. 한 줄 정규식으로는 못 잡는다.
  3. Dart 이스케이프(\\n \\' \\" \\\\) 해석 — permission_hibernation_message는
     \\n\\n으로 3개 문단이 나뉜다.

키가 하나라도 없으면 exit 1. 폴백으로 넘어가지 않는다 — 키 이름이 바뀌었는데
영어 폴백이 19개 언어에 조용히 나가는 것을 막는다.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# averic-lab/_faq-build → ../../kr.co.anbucheck/lib/app/core/translations
TRANS = os.path.join(
    os.path.dirname(os.path.dirname(HERE)),
    "kr.co.anbucheck", "lib", "app", "core", "translations",
)

LANGS = ["ko_kr", "en_us", "ja_jp", "zh_cn", "zh_tw", "de_de", "fr_fr", "es_es",
         "it_it", "nl_nl", "pt_br", "ru_ru", "ar_sa", "tr_tr", "pl_pl", "vi_vn",
         "th_th", "sv_se", "hi_in", "id_id"]

# 이 목록이 유일한 권위다. 문구를 추가하려면 여기에 키를 넣고 재실행한다.
KEYS = [
    # 경고 3종 + 휴면 다이얼로그 (FAQ의 주제)
    "stability_battery_warning_short",
    "gs_activity_permission_denied_warning",
    "location_permission_warning",
    "permission_hibernation_title",
    "permission_hibernation_highlight",
    "permission_hibernation_message",
    "permission_hibernation_go_to_settings",
    "common_later",
    # safety_home 화면 맥락 (경고가 어디 있는지 보여주기 위한 배경)
    "app_name",
    "subject_home_share_title",
    "subject_home_check_title_last",
    "subject_home_check_body_reported",
    "heartbeat_schedule_change",
    "heartbeat_daily_time",
    "subject_home_report_button",
    "subject_home_report_desc",
    "subject_home_emergency_button",
    "subject_home_emergency_desc",
    # 보호자가 받는 미수신 경고 (안부 예약시각 +2h) — 카피에서 @키로 인용한다
    "notifications_level_caution",
    "noti_caution_missing_body",
    # 보호자 알림 목록의 위치 보기 버튼 (긴급 알림에 위치가 있을 때만 표시)
    "notifications_view_location",
    # 경고를 탭했을 때 뜨는 다이얼로그 3종
    # 배터리는 항상, 걸음수·위치는 영구 거부일 때만 표시된다
    "stability_battery_dialog_title",
    "stability_battery_dialog_message",
    "gs_activity_permission_settings_title",
    "gs_activity_permission_settings_body",
    "gs_activity_permission_settings_go",
    "location_permission_settings_title",
    # 위치 다이얼로그 본문만 플랫폼 분기가 있다 (base_controller의 Platform.isIOS 삼항)
    # — 걸음수·배터리 다이얼로그는 분기 없음
    "location_permission_settings_body_android",
    "location_permission_settings_body_ios",
    "common_cancel",

    # ── 아래부터 사용설명 페이지(build_guide.py)가 쓰는 문구 ──
    # 보호자 설정 화면
    "settings_title",
    "gs_enable_button",
    "gs_enable_button_desc",
    "settings_subscription_service",
    "settings_current_membership",
    "settings_free_trial",
    "subscription_subscribe",
    "subscription_restore",
    "settings_notification",
    "settings_terms_section",
    "settings_privacy_policy",
    "settings_terms",
    # 안전 코드 생성 확인 다이얼로그 (Android 경로 — iOS는 주황 경고 카드가 더 붙는다)
    "gs_enable_dialog_title",
    "gs_enable_dialog_body",
    "gs_enable_confirm",
    # iOS는 확인 창에 주황 경고 카드가 더 붙고 확인 버튼 문구도 다르다
    # (_showEnableConfirmIOS). iOS에서는 G+S가 대상자 기능의 유일한 경로라
    # 이 경고를 빼면 정작 필요한 사람에게 설명이 닿지 않는다.
    "gs_enable_dialog_ios_warning_title",
    "gs_enable_dialog_ios_warning_body",
    "gs_enable_dialog_ios_confirm",
    # 코드 복사 시 뜨는 스낵바
    "subject_home_code_copied",
    # 보호 대상자 연결 화면
    "add_subject_title",
    "add_subject_button",
    "add_subject_guide_title",
    "add_subject_guide_subtitle",
    "add_subject_code_label",
    "add_subject_code_info",
    "add_subject_alias_label",
    "add_subject_alias_hint",
    "add_subject_phone_label",
    "add_subject_phone_hint",
    "add_subject_phone_info",
    "add_subject_connect",
    # 하단 네비게이션 (설정·연결 화면에 보인다)
    "nav_home",
    "nav_connection",
    "nav_notification",
    "nav_settings",
]

# 값에 '@'(앱이 trParams로 채우는 자리표시자)가 들어가도 되는 키. 여기 있는 것만
# 허용하며, 템플릿이 **직접 채워야 한다** — 예: template.html의
# `S.heartbeat_daily_time.replace('@time','18:00')`.
#
# 목록에 없는 키가 '@'를 갖고 있으면 아래 main()이 exit 1 한다. 채우는 쪽을 아무도
# 안 만들면 사용자에게 '@days'가 그대로 보이기 때문이다
# (`settings_days_until_trial_end`, `settings_app_version`이 그런 예 — 추출하지 않고
#  목업에서 그 요소를 뺐다. 앱에서도 조건부로만 보인다: 일수 배지는 days>0일 때만).
PLACEHOLDER_OK = {
    "subject_home_check_body_reported",  # @time — 템플릿이 18:00으로 채운다
    "heartbeat_daily_time",              # @time — 위와 동일
}

# 'key': 뒤 (같은 줄 또는 다음 줄) 문자열 리터럴. 양쪽 따옴표 + 이스케이프 허용.
VALUE_RE = r"""(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")"""

_ESCAPES = {"n": "\n", "t": "\t", "'": "'", '"': '"', "\\": "\\"}


def unescape(s):
    out, i = [], 0
    while i < len(s):
        if s[i] == "\\" and i + 1 < len(s):
            out.append(_ESCAPES.get(s[i + 1], s[i + 1]))
            i += 2
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


def extract(lang):
    path = os.path.join(TRANS, f"{lang}.dart")
    if not os.path.exists(path):
        sys.exit(f"오류: 번역 파일이 없습니다 — {path}\n"
                 f"앱 저장소(kr.co.anbucheck)가 averic-lab과 같은 폴더에 있어야 합니다.")
    with open(path, encoding="utf-8") as f:
        src = f.read()
    found = {}
    for key in KEYS:
        m = re.search(rf"'{re.escape(key)}'\s*:\s*{VALUE_RE}", src)
        if m:
            found[key] = unescape(m.group(1) if m.group(1) is not None else m.group(2))
    return found


def main():
    if not os.path.isdir(TRANS):
        sys.exit(f"오류: 번역 폴더가 없습니다 — {TRANS}")

    data, problems = {}, []
    for lang in LANGS:
        vals = extract(lang)
        missing = [k for k in KEYS if not vals.get(k, "").strip()]
        if missing:
            problems.append(f"{lang}: 누락 {missing}")

        # 아무도 채우지 않는 자리표시자가 페이지에 그대로 나가는 것을 막는다
        stray = [k for k, v in vals.items() if "@" in v and k not in PLACEHOLDER_OK]
        if stray:
            problems.append(
                f"{lang}: 값에 '@'가 들어갔는데 PLACEHOLDER_OK에 없는 키 {stray} — "
                f"템플릿이 직접 채우게 하고 목록에 넣거나, KEYS에서 빼고 목업에서 "
                f"해당 요소를 제거할 것.")

        # 앱의 _buildHibernationTitle이 title.indexOf(highlight)로 강조 범위를 찾고
        # 못 찾으면 강조 없이 표시한다. 목업도 같아야 하므로 여기서 확인한다.
        t = vals.get("permission_hibernation_title", "")
        h = vals.get("permission_hibernation_highlight", "")
        if t and h and t.find(h) < 0:
            problems.append(
                f"{lang}: highlight가 title의 부분 문자열이 아님 "
                f"— title={t!r} highlight={h!r}")

        data[lang] = vals

    out = os.path.join(HERE, "app-strings.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"추출 완료 — {len(data)}개 언어 × {len(KEYS)}개 키 → {os.path.basename(out)}")
    if problems:
        print("\n문제:")
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("문제 없음")


if __name__ == "__main__":
    main()
