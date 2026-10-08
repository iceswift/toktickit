"""Group already-rendered PDF pages for whole-document visual QA, not evidence synthesis."""
from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1] / 'output/pdf'
page_count=len(PdfReader(root/'report_lab03_67070503444.pdf').pages)
pages = sorted(root.glob('qa-current-*.png'))[:page_count]
assert pages, 'Render current PDF with Poppler first.'
for offset in range(0, len(pages), 4):
    canvas = Image.new('RGB', (1120, 1630), '#e6e9e7')
    draw = ImageDraw.Draw(canvas)
    for index, path in enumerate(pages[offset:offset+4]):
        page = Image.open(path).convert('RGB')
        page.thumbnail((535, 770))
        x = 15 + (index % 2) * 560
        y = 25 + (index // 2) * 815
        draw.text((x, y-18), path.stem, fill='#19332a')
        canvas.paste(page, (x, y))
    canvas.save(root / f'qa-sheet-{offset//4+1:02}.png')
print(f'{len(pages)} pages arranged in {(len(pages)+3)//4} sheets.')
