# e2(위치 줌인) 언어별 도착지 — segs/e2/land/<lang>.json
#   python3 tools/gen_land.py <world-atlas 폴더(land-50m.json, land-10m.json)>
# 한국어는 segs/e2/land.json 그대로(동아시아 50m + 한반도 10m). 다른 언어는 그 언어의 나라 큰 도시로 도착한다(사용자 승인, 2026-11-18).
# 도착 도시는 특정 주소가 아닌 그 도시의 아파트 동네 — 지명·글자는 그리지 않는다. 원본: Natural Earth(world-atlas 2.0.2, 퍼블릭 도메인).
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
# 언어 → (나라, 도시, 경도, 위도). 언어 파일의 나라(en_US·es_ES·pt_BR·ar_SA …)를 따른다
CITY = {
    'en': ('미국', '뉴욕', -73.95, 40.73), 'ja': ('일본', '도쿄', 139.70, 35.68), 'zh-CN': ('중국', '베이징', 116.40, 39.90),
    'zh-TW': ('대만', '타이베이', 121.53, 25.04), 'de': ('독일', '베를린', 13.40, 52.52), 'fr': ('프랑스', '파리', 2.35, 48.86),
    'es': ('스페인', '마드리드', -3.70, 40.42), 'it': ('이탈리아', '로마', 12.50, 41.90), 'nl': ('네덜란드', '암스테르담', 4.90, 52.37),
    'pt-BR': ('브라질', '상파울루', -46.63, -23.55), 'ru': ('러시아', '모스크바', 37.62, 55.75), 'ar': ('사우디아라비아', '리야드', 46.68, 24.71),
    'tr': ('튀르키예', '이스탄불', 28.98, 41.01), 'pl': ('폴란드', '바르샤바', 21.01, 52.23), 'vi': ('베트남', '하노이', 105.85, 21.03),
    'th': ('태국', '방콕', 100.50, 13.76), 'sv': ('스웨덴', '스톡홀름', 18.07, 59.33), 'hi': ('인도', '델리', 77.21, 28.61),
    'id': ('인도네시아', '자카르타', 106.85, -6.20),
}

def decode(path):
    t = json.load(open(path)); sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a: x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    def ring(idx):
        out = []
        for i in idx:
            pts = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(pts if not out else pts[1:])
        return out
    rings = []
    for g in t['objects']['land']['geometries']:
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        for poly in polys:
            for r in poly: rings.append(ring(r))
    return rings

def crop(rings, box, pad):
    lo0, lo1, la0, la1 = box[0] - pad, box[1] + pad, box[2] - pad, box[3] + pad
    out = []
    for r in rings:
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        if max(xs) < lo0 or min(xs) > lo1 or max(ys) < la0 or min(ys) > la1: continue
        flat = []
        for x, y in r: flat += [round(x, 3), round(y, 3)]
        out.append(flat)
    return out

R50, R10 = decode(os.path.join(SRC, 'land-50m.json')), decode(os.path.join(SRC, 'land-10m.json'))
os.makedirs(os.path.join(ROOT, 'segs', 'e2', 'land'), exist_ok=True)
for lang, (nation, city, lon, lat) in CITY.items():
    a1 = [lon - 32, lon + 33, max(-80, lat - 32.5), min(80, lat + 22.5)]
    a2 = [lon - 6, lon + 7.5, lat - 6.5, lat + 6.5]
    d = {'geo': {'nation': nation, 'city': city, 'lon': lon, 'lat': lat, 'a1': a1, 'a2': a2}, 'asia': crop(R50, a1, 2), 'korea': crop(R10, a2, 0.5)}
    f = os.path.join(ROOT, 'segs', 'e2', 'land', lang + '.json'); json.dump(d, open(f, 'w'), separators=(',', ':'))
    print(lang, city, len(d['asia']), len(d['korea']), os.path.getsize(f) // 1024, 'KB')
