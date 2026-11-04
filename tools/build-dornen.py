"""Build a Portuguese-capable web edition of the supplied Dornen font.

Requires fonttools. Original outlines and license remain untouched.
Only common Portuguese precomposed letters receive new angular accent outlines.
"""
from pathlib import Path
import unicodedata
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'assets/fonts/Dornen.ttf')
cmap = font.getBestCmap()
glyf = font['glyf']
glyphs = font.getGlyphSet()
order = list(font.getGlyphOrder())

def polygon(pen, points):
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()

for char in 'áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ':
    base, mark = unicodedata.normalize('NFD', char)
    name = f'uni{ord(char):04X}'
    original = cmap[ord(base)]
    bounds = glyf[original]
    center = (bounds.xMin + bounds.xMax) / 2
    top = bounds.yMax + 28
    pen = TTGlyphPen(None)
    glyphs[original].draw(pen)
    accent = TransformPen(pen, (1, 0, 0, 1, center, top))
    if mark == '\u0301':  # acute
        polygon(accent, [(-52, 10), (20, 107), (78, 107), (-5, 10)])
    elif mark == '\u0300':
        polygon(accent, [(-78, 107), (-20, 107), (52, 10), (5, 10)])
    elif mark == '\u0302':
        polygon(accent, [(-104, 8), (-24, 100), (20, 100), (100, 8), (45, 8), (-2, 57), (-48, 8)])
    elif mark == '\u0303':
        polygon(accent, [(-119, 24), (-85, 89), (-42, 98), (42, 62), (65, 67), (81, 96), (124, 96), (91, 31), (48, 23), (-35, 60), (-62, 54), (-78, 24)])
    else:  # cedilla beneath the base
        accent = TransformPen(pen, (1, 0, 0, 1, center, bounds.yMin - 8))
        polygon(accent, [(-12, 8), (38, 8), (15, -35), (53, -58), (42, -105), (0, -126), (-54, -105), (-43, -69), (-2, -83), (9, -69), (-29, -48)])
    glyf[name] = pen.glyph()
    font['hmtx'].metrics[name] = font['hmtx'].metrics[original]
    order.append(name)
    for table in font['cmap'].tables:
        if table.isUnicode():
            table.cmap[ord(char)] = name

font.setGlyphOrder(order)
font['hhea'].ascent = 960
font['hhea'].descent = -240
font['hhea'].lineGap = 0
font['OS/2'].sTypoAscender = 960
font['OS/2'].sTypoDescender = -240
font['OS/2'].sTypoLineGap = 0
font['OS/2'].usWinAscent = 960
font['OS/2'].usWinDescent = 240
for name_id, value in [(1, 'Dornen UI'), (2, 'Regular'), (4, 'Dornen UI Regular'), (6, 'DornenUI-Regular')]:
    font['name'].setName(value, name_id, 3, 1, 0x409)
font.flavor = 'woff'
font.save(root / 'assets/fonts/dornen-ui.woff')
print('Built Dornen UI with all Portuguese accents.')
