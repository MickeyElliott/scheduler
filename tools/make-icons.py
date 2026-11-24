#!/usr/bin/env python3
"""Generate home-screen icons (tracker + meals). Run: python3 tools/make-icons.py"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
FONT = '/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf'
S = 1024  # draw big, downsample

def bg(top, bot):
    im = Image.new('RGB', (S, S), top); d = ImageDraw.Draw(im)
    for y in range(S):
        t = y / S; d.line([(0, y), (S, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return im

def glow(im, xy, r, color, a=90):
    g = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ImageDraw.Draw(g).ellipse([xy[0]-r, xy[1]-r, xy[0]+r, xy[1]+r], fill=color + (a,))
    g = g.filter(ImageFilter.GaussianBlur(r * .45)); im.paste(g, (0, 0), g)

def tracker(pad=0.0):
    im = bg((20, 26, 34), (9, 11, 15)); glow(im, (S*.5, S*.42), 380, (198, 242, 78), 55); d = ImageDraw.Draw(im)
    c, R = S/2, S*(.30 - pad*.45)
    lime = (198, 242, 78)
    d.ellipse([c-R, c-R, c+R, c+R], outline=lime, width=int(S*.028))           # reticle ring
    for a, b in [((c, c-R-S*.07), (c, c-R+S*.06)), ((c, c+R-S*.06), (c, c+R+S*.07)), ((c-R-S*.07, c), (c-R+S*.06, c)), ((c+R-S*.06, c), (c+R+S*.07, c))]:
        d.line([a, b], fill=lime, width=int(S*.028))
    f = ImageFont.truetype(FONT, int(S*(.27 - pad*.4))); f.set_variation_by_axes([32, 800])
    d.text((c, c+S*.01), 'VS', font=f, fill=(235, 245, 220), anchor='mm')
    return im

def meals(pad=0.0):
    im = bg((18, 30, 26), (8, 13, 12)); glow(im, (S*.5, S*.45), 380, (74, 222, 128), 60); d = ImageDraw.Draw(im)
    c, R = S/2, S*(.235 - pad*.35); g = (74, 222, 128); w = int(S*.03)
    d.ellipse([c-R, c-R, c+R, c+R], outline=g, width=w)                          # plate
    d.ellipse([c-R*.62, c-R*.62, c+R*.62, c+R*.62], outline=(74, 222, 128), width=int(w*.6))
    fx, kx, top, bot = c - R - S*.085, c + R + S*.085, c - R*1.2, c + R*1.2       # fork + knife
    d.line([(fx, top+S*.12), (fx, bot)], fill=(225, 240, 232), width=w)
    for dx in (-S*.032, 0, S*.032): d.line([(fx+dx, top), (fx+dx, top+S*.12)], fill=(225, 240, 232), width=int(w*.6))
    d.line([(kx, top), (kx, bot)], fill=(225, 240, 232), width=w)
    d.pieslice([kx-S*.045, top, kx+S*.045, top+S*.26], 270, 90, fill=(225, 240, 232))
    return im

def save(fn, im, size): im.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, fn), optimize=True)
os.makedirs(OUT, exist_ok=True)
for name, fn in [('app', tracker), ('meals', meals)]:
    a, m = fn(), fn(pad=.16)   # maskable keeps art inside the 80% safe zone
    save(f'{name}-180.png', a, 180); save(f'{name}-192.png', a, 192); save(f'{name}-512.png', a, 512)
    save(f'{name}-maskable-512.png', m, 512); save(f'{name}-32.png', a, 32)
print('icons ->', os.path.abspath(OUT))
