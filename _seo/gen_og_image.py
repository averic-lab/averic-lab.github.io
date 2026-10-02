#!/usr/bin/env python3
"""_seo/og-image.html → og-image-2.png (1200×630). 로컬 Chrome 헤드리스로 캡처한다.

이미지를 바꿀 때는 **파일명을 올릴 것**(og-image-3.png …) — 카카오·메타는 이미지 주소 단위로
오래 캐시해서 같은 주소에 새 그림을 올리면 옛 그림이 계속 나간다. 바꾸면 i18n/build.py 의
OG_IMAGE 도 같이 고치고 `python3 i18n/build.py` 및 _faq-build 두 빌더를 다시 돌린다.
"""
import subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "og-image-2.png")
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--force-device-scale-factor=1", "--window-size=1200,630",
                f"--screenshot={OUT}", (ROOT / "_seo/og-image.html").as_uri()], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("OK", OUT)
