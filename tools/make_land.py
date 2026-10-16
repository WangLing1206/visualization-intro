"""Convert Natural Earth 110m TopoJSON land polygons into a compact JS dataset.

Usage: python tools/make_land.py <land-110m.json> <out.js>
Output: data/land.js  ->  window.VIZ_LAND = [[ [lon,lat], ... ], ...]
"""
import json, math, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'land110.json'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'data/land.js'
TOL = 0.42          # Douglas-Peucker tolerance in degrees
MIN_AREA = 1.6      # drop polygons smaller than this (square degrees)


def decode_arcs(topo):
    tr = topo['transform']
    sx, sy = tr['scale']
    tx, ty = tr['translate']
    out = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append([x * sx + tx, y * sy + ty])
        out.append(pts)
    return out


def ring_points(ring, arcs):
    pts = []
    for i in ring:
        arc = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(arc if not pts else arc[1:])
    return pts


def rdp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        seg = math.hypot(dx, dy)
        best, bi = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if seg == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * (px - ax) - dx * (py - ay)) / seg
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack.append((a, bi))
            stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]


def area(pts):
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


topo = json.load(open(SRC, encoding='utf-8'))
arcs = decode_arcs(topo)
obj = topo['objects']['land']
geoms = obj['geometries'] if obj['type'] == 'GeometryCollection' else [obj]
rings = []
for geom in geoms:
    polys = geom['arcs'] if geom['type'] == 'MultiPolygon' else [geom['arcs']]
    for poly in polys:
        for ring in poly[:1]:              # outer ring only, holes are negligible here
            pts = ring_points(ring, arcs)
            if len(pts) > 3:
                rings.append(pts)

rings.sort(key=area, reverse=True)
kept = []
for r in rings:
    if area(r) < MIN_AREA:
        continue
    s = rdp(r, TOL)
    if len(s) >= 4:
        kept.append(s)

body = ','.join(
    '[' + ','.join('[%g,%g]' % (round(x, 1), round(y, 1)) for x, y in r) + ']' for r in kept
)
js = '/* Natural Earth 110m land outlines, simplified (RDP 0.42deg). Public domain. */\n' \
     'window.VIZ_LAND=[' + body + '];\n'
open(OUT, 'w', encoding='utf-8').write(js)
pts = sum(len(r) for r in kept)
print('polygons=%d points=%d size=%.1fKB' % (len(kept), pts, len(js) / 1024))
