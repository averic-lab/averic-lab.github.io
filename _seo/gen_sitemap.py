#!/usr/bin/env python3
"""sitemap.xml 을 만든다.

없으면 Google 이 링크를 우연히 따라가며 발견하는 수밖에 없다. 2026-08-07
점검 시점에 발행 페이지 100개 중 71개만 발견돼 있었다.

**색인 대상만 넣는다** — noindex 페이지(루트 라우터, preview/, test/)는
제외한다. 사이트맵에 넣어놓고 noindex 로 막으면 Google 에 모순된 신호를
주게 된다.

    python3 _seo/gen_sitemap.py

lastmod 는 git 이 기록한 그 파일의 마지막 커밋 시각이다. 파일 mtime 은
clone 할 때마다 바뀌어 매번 사이트맵 전체가 갱신된 것처럼 보인다.
"""
import subprocess
import sys
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "i18n"))
from build import ORDER  # noqa: E402

SITE = "https://averic.co.kr"
# (파일명, URL 경로, 우선순위) — 홈은 디렉터리 주소를 정본으로 쓴다
PAGES = [
    ("index.html", "", "1.0"),
    ("guide.html", "guide.html", "0.8"),
    ("faq.html", "faq.html", "0.7"),
    ("privacy-policy.html", "privacy-policy.html", "0.3"),
    ("terms-of-service.html", "terms-of-service.html", "0.3"),
]


def lastmod(path):
    r = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", str(path)],
        cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip() or None


def main():
    rows, missing = [], []
    for code in ORDER:
        for fname, urlpath, prio in PAGES:
            f = ROOT / code / fname
            if not f.exists():
                missing.append(f"{code}/{fname}")
                continue
            loc = f"{SITE}/{code}/{urlpath}"
            d = lastmod(f.relative_to(ROOT))
            rows.append("  <url>\n"
                        f"    <loc>{escape(loc)}</loc>\n"
                        + (f"    <lastmod>{d}</lastmod>\n" if d else "")
                        + f"    <priority>{prio}</priority>\n"
                        "  </url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<!-- 자동 생성 — _seo/gen_sitemap.py. 직접 수정하지 말 것 -->\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"OK — sitemap.xml 에 {len(rows)}개 URL")
    if missing:
        print("  누락:", ", ".join(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
