"""anbu-3d 유튜브 전달 — 공유 드라이브에 영상·썸네일 복사 + upload.json 항목 추가(2026-10-03 규칙)

    python3 deliver.py [언어코드 …]      # 생략하면 렌더된 언어 전부

- 파일명: ko 는 anbu-3d.mp4/.jpg, 그 외는 anbu-3d-<언어>.mp4/.jpg (드라이브·저장소 같은 규칙)
- 드라이브 썸네일은 1080×1920 원본, 저장소 jpg 는 다른 편과 같은 가로 540px 로 줄인다(사이트 포스터)
- upload.json: description 은 내용 설명만, tags [], youtube_id·links·uploaded_at null. 이미 있는 키는 건드리지 않는다
"""
import json, os, shutil, subprocess, sys, datetime

ID = 'anbu-3d'
HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.normpath(os.path.join(HERE, '..', '..', 'media', 'shorts'))
# 2026-10-11: 드라이브 데스크톱 삭제 — '안부 쇼츠' 는 ~/Documents/SNS Uploads 로 이동했다.
# ⚠️ 업로드 문구 규칙도 바뀌었다: 아래 upload.json 항목(설명=내용만, tags=[])은 예전 형식이다.
#    새 규칙(최종 제목·설명·해시태그·태그·클립 설명을 제작 쪽이 쓰고 metadata_final 승인)은 앱 저장소 .claude/skills/aside-publish/copy-rules.md.
DRIVE = os.path.expanduser('~/Documents/SNS Uploads')   # upload.json·publish.json·1080 썸네일 jpg(videos/<언어>/) 가 있는 폴더 (변수 이름은 옛 드라이브 때 그대로)
# 2026-10-11 구조 변경: 고화질 원본 mp4 는 SNS Uploads 가 아니라 이 저장소의 _shorts-build/.mix/hq/ (커밋 안 되는 로컬 폴더)에 둔다.
HQ = os.path.normpath(os.path.join(HERE, '..', '.mix', 'hq'))
ORDER = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'de', 'fr', 'es', 'it', 'pt-BR', 'ru', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'sv', 'hi', 'ar']
name = lambda c: ID if c == 'ko' else f'{ID}-{c}'
titles = json.load(open(os.path.join(HERE, 'manual.json'), encoding='utf-8'))
descs = json.load(open(os.path.join(HERE, 'upload_desc.json'), encoding='utf-8'))
today = datetime.date.today().isoformat()

langs = sys.argv[1:] or [c for c in ORDER if os.path.exists(os.path.join(MEDIA, c, name(c) + '.mp4'))]
up_path = os.path.join(DRIVE, 'upload.json')
up = json.load(open(up_path, encoding='utf-8'))
added = []
for c in langs:
    src_mp4, src_jpg = os.path.join(MEDIA, c, name(c) + '.mp4'), os.path.join(MEDIA, c, name(c) + '.jpg')
    if not os.path.exists(src_mp4):
        print(f'  {c}: 영상 없음 — 건너뜀'); continue
    dst = os.path.join(DRIVE, 'videos', c); os.makedirs(dst, exist_ok=True)   # 썸네일 jpg 만 여기에 둔다
    os.makedirs(HQ, exist_ok=True)
    shutil.copy2(src_mp4, os.path.join(HQ, name(c) + '.mp4'))   # ⚠️ 저장소 사본(저화질)을 쓰므로 고화질이 필요하면 CRF=18 로 따로 렌더해 HQ 에 덮어쓴다
    # 썸네일: 드라이브엔 1080 원본(엔딩 33.5초 프레임), 저장소엔 540 폭
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '33.5', '-i', src_mp4, '-frames:v', '1', '-q:v', '2',
                    os.path.join(dst, name(c) + '.jpg')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '33.5', '-i', src_mp4, '-frames:v', '1', '-vf', 'scale=540:-2', '-q:v', '3',
                    src_jpg], check=True)
    key = f'{ID}/{c}'
    if key in up['videos']:
        print(f'  {c}: upload.json 에 이미 있음 — 항목은 그대로'); continue
    up['videos'][key] = {
        'id': ID, 'lang': c,
        'file': f'_shorts-build/.mix/hq/{name(c)}.mp4', 'thumbnail': f'videos/{c}/{name(c)}.jpg',
        'title': titles[c]['title'], 'description': descs[c],
        'tags': [], 'category': '22', 'category_name': '인물 및 블로그', 'made_for_kids': False,
        'default_language': c, 'rendered_at': today,
        'youtube_id': None, 'links': None, 'uploaded_at': None,
    }
    added.append(c)
if added:
    up['updated_at'] = today
    tmp = up_path + '.tmp'
    json.dump(up, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    os.replace(tmp, up_path)
print('복사:', ' '.join(langs)); print('upload.json 추가:', ' '.join(added) or '없음')
