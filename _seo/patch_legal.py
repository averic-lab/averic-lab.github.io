#!/usr/bin/env python3
"""개인정보처리방침 / 이용약관 40개 페이지에 canonical + hreflang 을 넣는다.

이 두 종류는 손으로 쓴 페이지라 빌더가 없다. 그래서 20개 언어가 서로를
가리키는 링크가 하나도 없었고(2026-08-07 Search Console 점검에서 발견),
내용이 언어별로 비슷해 Google 이 임의로 하나만 남기고 나머지를 버릴 수
있는 상태였다. 특히 앱이 `/{locale}/privacy-policy.html` 을 직접 열기
때문에 스토어 심사에서도 쓰이는 페이지다.

**멱등이다** — 이미 넣어둔 블록을 지우고 다시 넣으므로 몇 번을 돌려도 된다.
페이지를 새로 쓰거나 언어를 추가한 뒤 다시 실행할 것.

    python3 _seo/patch_legal.py

언어 목록과 hreflang 코드는 i18n/build.py 의 ORDER/META 가 유일한 출처다
(여기서 다시 정의하면 두 곳이 조용히 어긋난다).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "i18n"))
from build import ORDER, META  # noqa: E402

SITE = "https://averic.co.kr"
PAGES = ["privacy-policy.html", "terms-of-service.html"]
BEGIN = "  <!-- seo:begin (자동 생성 — _seo/patch_legal.py) -->"
END = "  <!-- seo:end -->"
# viewport 다음 줄에 넣는다. title 앞이라 head 최상단에 모여 읽기 쉽다.
ANCHOR = re.compile(r'^(\s*<meta name="viewport"[^>]*>)\s*$', re.M)


def block(code, page):
    lines = [BEGIN, f'  <link rel="canonical" href="{SITE}/{code}/{page}">']
    for c in ORDER:
        if not (ROOT / c / page).exists():
            continue
        lines.append(f'  <link rel="alternate" hreflang="{META[c][0]}" '
                     f'href="{SITE}/{c}/{page}">')
    lines.append(f'  <link rel="alternate" hreflang="x-default" '
                 f'href="{SITE}/en/{page}">')
    lines.append(END)
    return "\n".join(lines)


def main():
    changed = skipped = 0
    for page in PAGES:
        for code in ORDER:
            f = ROOT / code / page
            if not f.exists():
                print(f"  없음 {code}/{page}")
                skipped += 1
                continue
            html = f.read_text(encoding="utf-8")
            # 기존 블록 제거 → 멱등
            html = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END) + r"\n",
                          "", html, flags=re.S)
            m = ANCHOR.search(html)
            if not m:
                print(f"  ⚠ viewport 못 찾음 — 건너뜀: {code}/{page}")
                skipped += 1
                continue
            new = html[:m.end()] + "\n" + block(code, page) + html[m.end():]
            if new != f.read_text(encoding="utf-8"):
                f.write_text(new, encoding="utf-8")
                changed += 1
    print(f"OK — {changed}개 갱신, {skipped}개 건너뜀")
    return 1 if skipped else 0


if __name__ == "__main__":
    sys.exit(main())
