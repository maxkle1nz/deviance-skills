#!/usr/bin/env python3
"""DEViance skill banners — hermetic form system generator.
Grammar: bone/void/signal, phi rails (slope 633/391), rhythm cuts 92/57/35/22/13.
Refusals honored: no glow, no gradients, no bevel, no generic AI iconography.
"""
import sys, random
from pathlib import Path as FSPath
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from matplotlib.path import Path as MPath

random.seed(7)
DETAIL = int(sys.argv[1]) if len(sys.argv) > 1 else 0

W, H = 1200, 360
VOID, BONE, SIGNAL, STEEL, STEELD = "#0F0F11", "#F2EFE9", "#E8502F", "#6E6E73", "#2B2B30"
SEQ = [149, 92, 57, 35, 22, 13, 9]
PHI_DX, PHI_DY = 391.0, 633.0  # rail slope: rises PHI_DY per PHI_DX (a "/" rail)
GX, GY, GS = 57, 59, 242       # glyph box
TX = 391                        # text zone start

BOLD = FontProperties(family="Helvetica Neue", weight="bold")

def tp_d(s, size, x, y, prop=BOLD, tracking=0.0):
    """Text as SVG path data at baseline (x,y). Returns (d, width, cap_height)."""
    parts, cx = [], x
    for ch in s:
        if ch == " ":
            cx += size * (0.34 + tracking); continue
        p = TextPath((0, 0), ch, size=size, prop=prop)
        vs, cs = p.vertices, p.codes
        d, i = [], 0
        while i < len(cs):
            c = cs[i]
            if c == MPath.MOVETO:
                d.append(f"M{cx+vs[i][0]:.1f},{y-vs[i][1]:.1f}"); i += 1
            elif c == MPath.LINETO:
                d.append(f"L{cx+vs[i][0]:.1f},{y-vs[i][1]:.1f}"); i += 1
            elif c == MPath.CURVE3:
                d.append(f"Q{cx+vs[i][0]:.1f},{y-vs[i][1]:.1f} {cx+vs[i+1][0]:.1f},{y-vs[i+1][1]:.1f}"); i += 2
            elif c == MPath.CURVE4:
                d.append(f"C{cx+vs[i][0]:.1f},{y-vs[i][1]:.1f} {cx+vs[i+1][0]:.1f},{y-vs[i+1][1]:.1f} {cx+vs[i+2][0]:.1f},{y-vs[i+2][1]:.1f}"); i += 3
            else:
                d.append("Z"); i += 1
        parts.append("".join(d))
        ext = p.get_extents()
        cx += (ext.x1 if ext.width > 0 else size * 0.6) + size * (0.06 + tracking)
    cap = TextPath((0, 0), "H", size=size, prop=prop).get_extents().y1
    return " ".join(parts), cx - x - size * (0.06 + tracking), cap

def rail(x, y, length, w, color=SIGNAL, opacity=1.0):
    """Phi-slope rail '/' centered on (x,y): a rotated rect as polygon."""
    import math
    ang = math.atan2(PHI_DY, PHI_DX)
    dx, dy = math.cos(ang), math.sin(ang)
    nx, ny = -dy, dx
    h = length / 2.0
    pts = [(x - dx*h + nx*w/2, y + dy*h - ny*w/2), (x + dx*h + nx*w/2, y - dy*h - ny*w/2),
           (x + dx*h - nx*w/2, y - dy*h + ny*w/2), (x - dx*h - nx*w/2, y + dy*h + ny*w/2)]
    p = " ".join(f"{a:.1f},{b:.1f}" for a, b in pts)
    return f'<polygon points="{p}" fill="{color}" opacity="{opacity}"/>'

def R(x, y, w, h, fill, opacity=1.0):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" opacity="{opacity}"/>'

def RO(x, y, w, h, stroke, sw):
    return f'<rect x="{x+sw/2:.1f}" y="{y+sw/2:.1f}" width="{w-sw:.1f}" height="{h-sw:.1f}" fill="none" stroke="{stroke}" stroke-width="{sw}"/>'

# ─── glyphs: local coords 0..242, returned as list of svg strings ───
def g_c0ntra():
    e = []
    e.append(R(0, 93, 92, 149, BONE))                       # thesis block
    e.append(RO(137, 9, 92, 149, BONE, 13))                 # counter-frame, pulled closer
    e.append(rail(118, 121, 300, 13))                        # confrontation rail
    e.append(R(0, 150, 92, 9, VOID))                         # incision in thesis
    e.append(R(137, 66, 13, 9, VOID))                        # incision in frame left wall
    if DETAIL >= 2:
        e.append(R(213, 158, 16, 13, SIGNAL))                # counter's reply at frame foot
    return e

def g_pr00f():
    e = []
    e.append(RO(46, 46, 149, 149, BONE, 13))                 # the gate
    e.append(R(0, 108, 242, 22, SIGNAL))                     # proof passes through
    e.append(R(46, 104, 149, 4, VOID))                       # incision above
    e.append(R(84, 84, 57, 57, BONE))                        # the proven core... placed after render check
    return e

def g_pathos():
    e = []
    for i, x in enumerate([0, 92, 184]):
        e.append(RO(x, 46, 58, 149, BONE, 9))                # three sessions
    e.append(R(0, 112, 242, 9, BONE))                        # one line through all
    e.append(R(58, 112, 34, 9, SIGNAL))                      # living gap 1
    e.append(R(150, 112, 34, 9, SIGNAL))                     # living gap 2
    if DETAIL >= 2:
        e.append(R(0, 112, 9, 9, SIGNAL))                    # entry mark
        e.append(R(233, 112, 9, 9, SIGNAL))                  # exit mark
    return e

def g_m4nual():
    e = []
    ys, y = [], 30
    for hh in [13, 22, 35, 22, 13]:
        ys.append((y, hh)); y += hh + 13
    total = y - 13
    off = (242 - total) / 2
    for (yy, hh) in ys:
        e.append(R(35, yy + off + 60, 172, hh, BONE))        # spines
    e.append(R(112, 60, 13, 182, SIGNAL))                    # canonical spine rail (vertical)
    for (yy, hh) in ys:
        e.append(R(112, yy + off + 60 + hh/2 - 3, 13, 6, VOID))
    return e

def g_v1tals():
    e = []
    base = 175
    segs = [(0,35,0),(35,35,-35),(70,35,0),(105,30,-92),(135,30,0),(165,30,-22),(195,47,0)]
    x = 0
    prev = 0
    pts = []
    for (x0, wdt, lvl) in segs:
        pts.append((x0, base+prev, x0, base+lvl))
        pts.append((x0, base+lvl, x0+wdt, base+lvl))
        prev = lvl
    for (xa, ya, xb, yb) in pts:
        if xa == xb:
            y0, y1 = sorted((ya, yb))
            e.append(R(xa, y0, 9, y1-y0+9, BONE))
        else:
            e.append(R(xa, ya, xb-xa, 9, BONE))
    e.append(R(105, base-92, 9, 92+9, SIGNAL))                 # peak rise is signal
    e.append(R(105, base-92, 30, 9, SIGNAL))                   # peak plateau
    e.append(R(135, base-92, 9, 92-22+9, SIGNAL))              # peak fall to next level
    if DETAIL >= 2:
        e.append(R(0, base+44, 242, 2, STEELD))                # baseline reference
        e.append(R(105, base+44, 39, 4, SIGNAL, 0.9))          # peak footprint tick
    return e

def g_sc4le():
    e = []
    heights = [22, 35, 57, 92, 149]
    xw, gap = 35, 13
    x0 = (242 - (5*xw + 4*gap)) / 2
    for i, hh in enumerate(heights):
        e.append(R(x0 + i*(xw+gap), 242 - hh, xw, hh, BONE))
    e.append(rail(121, 100, 290, 9))                          # growth rail across tops
    return e

def g_proofgrown():
    e = []
    e.append(R((242-206)/2, 220, 206, 22, STEELD))            # bedrock, visible
    y = 220
    for wdt in [149, 92, 57, 35]:
        y -= 35
        e.append(R((242-wdt)/2, y, wdt, 35, BONE))            # seated steps, no gaps
    e.append(R((242+57)/2 + 13, 220-70-35, 35, 35, SIGNAL))   # next stone arriving at level 3
    if DETAIL >= 2:
        e.append(R((242-149)/2, 220-35, 149, 4, VOID))        # mortar seams
        e.append(R((242-92)/2, 220-70, 92, 4, VOID))
        e.append(R((242-57)/2, 220-105, 57, 4, VOID))
    return e

def g_gitpostman():
    e = []
    e.append(RO(35, 62, 172, 118, BONE, 9))                  # envelope body
    e.append(f'<polyline points="39,66 121,140 203,66" fill="none" stroke="{BONE}" stroke-width="9"/>')
    e.append(rail(222, 48, 96, 9))                            # trajectory rail, clear of flap
    e.append(R(35+172-9-31, 62+9+9, 27, 27, SIGNAL))          # stamp inside, clear of stroke
    e.append(R(35+172-40, 62, 22, 9, VOID))                   # rail incision in top stroke
    return e

def g_pattern():
    e = []
    cell, gap = 57, 13
    x0 = (242 - (3*cell + 2*gap)) / 2
    for r in range(3):
        for c in range(3):
            x, y = x0 + c*(cell+gap), x0 + r*(cell+gap)
            if (r, c) == (1, 1): e.append(R(x, y, cell, cell, BONE))
            elif (r, c) == (0, 2): e.append(R(x + 18, y - 14, cell, cell, SIGNAL))
            else: e.append(RO(x, y, cell, cell, STEELD, 6))
    return e

def g_tripleflow():
    e = []
    for i, y in enumerate([70, 116, 162]):
        e.append(R(0, y, 130, 13, BONE))                     # three lanes
    e.append(RO(150, 62, 92, 118, BONE, 9))                  # director frame
    e.append(R(130, 116, 20, 13, BONE))
    e.append(R(233, 114, 30, 13, SIGNAL))                    # single output leaves the frame
    if DETAIL >= 2:
        e.append(R(130, 70, 20, 13, STEEL, 0.6))
        e.append(R(130, 162, 20, 13, STEEL, 0.6))
    return e

def g_fastlane():
    e = []
    e.append(R(0, 108, 242, 26, BONE))                       # base lane
    e.append(rail(90, 121, 300, 22))                          # twin rails of the mark
    e.append(rail(150, 121, 300, 13))
    e.append(R(44, 108, 13, 26, VOID))                        # rhythm cuts in lane
    e.append(R(185, 108, 13, 26, VOID))
    return e

GLYPHS = [
    ("c0ntra", g_c0ntra, "counterpoint before elaboration", "claude"),
    ("pr00f", g_pr00f, "prove first, design after", "claude"),
    ("pathos", g_pathos, "continuity across sessions", "claude"),
    ("m4nual", g_m4nual, "the operations book", "claude"),
    ("v1tals", g_v1tals, "repo health checkup", "claude"),
    ("sc4le", g_sc4le, "scaling grounded in real cases", "claude"),
    ("proof-grown-systems", g_proofgrown, "systems grown from proof", "codex"),
    ("git-postman", g_gitpostman, "git with a reputation", "codex"),
    ("pattern-architect", g_pattern, "patterns made structural", "codex"),
    ("universal-triple-flow", g_tripleflow, "one director, parallel lanes", "codex"),
    ("fastlane", g_fastlane, "delegation control protocol", "codex"),
]

def banner(idx, name, glyph_fn, tagline, harness):
    e = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    e.append(R(0, 0, W, H, VOID))
    # glyph
    e.append(f'<g transform="translate({GX},{GY})">')
    e += glyph_fn()
    e.append('</g>')
    # name — size adaptive to fit text zone
    size = 96
    d, wname, cap = tp_d(name, size, TX, 196)
    while wname > W - TX - 150 and size > 44:
        size -= 6
        d, wname, cap = tp_d(name, size, TX, 196)
    e.append(f'<path d="{d}" fill="{BONE}"/>')
    if "-" not in name:  # wordmark cut only where it cannot read as a hyphen
        e.append(R(TX - 22, 196 - cap * 0.45, wname * 0.60 + 22, max(5, size*0.07), VOID))
    # signature slashes after name
    sx = TX + wname + 26
    e.append(rail(sx + 10, 196 - cap/2, cap*1.1, 10))
    e.append(rail(sx + 34, 196 - cap/2, cap*1.1, 6))
    # tagline spaced caps
    dt, wt, _ = tp_d(tagline.upper(), 21, TX, 242, tracking=0.42)
    e.append(f'<path d="{dt}" fill="{STEEL}"/>')
    # footer rule + labels
    e.append(R(57, 316, W - 114, 1.5, STEELD))
    dl, wl, _ = tp_d(f"DEVIANCE INTELLIGENCE // {harness.upper()} SKILL", 12, 57, 338, tracking=0.5)
    e.append(f'<path d="{dl}" fill="{STEEL}"/>')
    di, wi, _ = tp_d(f"{idx:02d} / 11", 12, 0, 338, tracking=0.5)
    e.append(f'<path d="{di}" fill="{SIGNAL}" transform="translate({W - 57 - wi},0)"/>')
    # phi ruler ticks near index
    tx0 = W - 57 - wi - 92
    for i, t in enumerate([6, 10, 16]):
        e.append(R(tx0 + i*22, 346 - t, 2.5, t, STEEL))
    e.append('</svg>')
    return "\n".join(e)

out = FSPath(__file__).parent / "svg"
out.mkdir(exist_ok=True)
for i, (name, fn, tag, harness) in enumerate(GLYPHS, 1):
    (out / f"{name}.svg").write_text(banner(i, name, fn, tag, harness))
print(f"stage {DETAIL}: {len(GLYPHS)} banners → {out}")
